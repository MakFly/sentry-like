<?php

namespace Makfly\ErrorWatch\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\TerminateEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Makfly\ErrorWatch\Service\TransactionCollector;
use Makfly\ErrorWatch\Service\TransactionSender;

final class RequestSubscriber implements EventSubscriberInterface
{
    /**
     * @param string[] $excludedRoutes
     */
    public function __construct(
        private readonly TransactionCollector $collector,
        private readonly TransactionSender $sender,
        private readonly bool $enabled,
        private readonly array $excludedRoutes = [],
    ) {}

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST   => ['onRequest', 4096],
            KernelEvents::TERMINATE => ['onTerminate', -4096],
        ];
    }

    public function onRequest(RequestEvent $event): void
    {
        if (!$this->enabled || !$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $route = $request->attributes->get('_route', '');

        if (in_array($route, $this->excludedRoutes, true)) {
            return;
        }

        $name = $request->getMethod() . ' ' . ($route ?: $request->getPathInfo());
        $txn = $this->collector->startTransaction($name, 'http.server');
        $txn->setTag('http.method', $request->getMethod());
        $txn->setData('http.url', $request->getPathInfo());
    }

    public function onTerminate(TerminateEvent $event): void
    {
        if (!$this->collector->hasTransaction()) {
            return;
        }

        $response = $event->getResponse();
        $statusCode = $response->getStatusCode();

        $status = $statusCode >= 500 ? 'error' : 'ok';
        $txn = $this->collector->finishTransaction($status);

        if ($txn === null) {
            return;
        }

        $txn->setTag('http.status_code', (string) $statusCode);
        $this->sender->send($txn);
    }
}
