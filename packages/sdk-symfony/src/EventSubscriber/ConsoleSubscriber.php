<?php

namespace ErrorWatch\Symfony\EventSubscriber;

use ErrorWatch\Symfony\Model\Breadcrumb;
use ErrorWatch\Symfony\Service\BreadcrumbService;
use ErrorWatch\Symfony\Service\ErrorSenderInterface;
use Symfony\Component\Console\ConsoleEvents;
use Symfony\Component\Console\Event\ConsoleCommandEvent;
use Symfony\Component\Console\Event\ConsoleErrorEvent;
use Symfony\Component\Console\Event\ConsoleTerminateEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

final class ConsoleSubscriber implements EventSubscriberInterface
{
    private bool $errorAlreadySent = false;

    public function __construct(
        private readonly ErrorSenderInterface $errorSender,
        private readonly ?BreadcrumbService $breadcrumbService = null,
        private readonly bool $captureExitCodes = true,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            ConsoleEvents::COMMAND => 'onCommand',
            ConsoleEvents::ERROR => 'onError',
            ConsoleEvents::TERMINATE => 'onTerminate',
        ];
    }

    public function onCommand(ConsoleCommandEvent $event): void
    {
        $this->errorAlreadySent = false;

        $commandName = $event->getCommand()?->getName() ?? 'unknown';
        $this->breadcrumbService?->add(Breadcrumb::console(
            sprintf('Command started: %s', $commandName),
            ['command' => $commandName],
        ));
    }

    public function onError(ConsoleErrorEvent $event): void
    {
        $commandName = $event->getCommand()?->getName() ?? 'unknown';
        $url = sprintf('cli://%s', $commandName);

        $this->errorSender->send($event->getError(), $url, 'error');
        $this->errorAlreadySent = true;
    }

    public function onTerminate(ConsoleTerminateEvent $event): void
    {
        if (!$this->captureExitCodes) {
            return;
        }

        $exitCode = $event->getExitCode();

        if (0 === $exitCode || $this->errorAlreadySent) {
            return;
        }

        $commandName = $event->getCommand()?->getName() ?? 'unknown';
        $url = sprintf('cli://%s', $commandName);

        $exception = new \RuntimeException(
            sprintf('Command "%s" exited with code %d', $commandName, $exitCode),
        );

        $this->errorSender->send($exception, $url, 'warning');
    }
}
