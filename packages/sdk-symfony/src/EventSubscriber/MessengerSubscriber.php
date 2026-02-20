<?php

namespace ErrorWatch\Symfony\EventSubscriber;

use ErrorWatch\Symfony\Service\ErrorSenderInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\Messenger\Event\WorkerMessageFailedEvent;

final class MessengerSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly ErrorSenderInterface $errorSender,
        private readonly bool $captureRetries = false,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            WorkerMessageFailedEvent::class => 'onMessageFailed',
        ];
    }

    public function onMessageFailed(WorkerMessageFailedEvent $event): void
    {
        if (!$this->captureRetries && $event->willRetry()) {
            return;
        }

        $envelope = $event->getEnvelope();
        $throwable = $event->getThrowable();
        $messageClass = get_class($envelope->getMessage());
        $url = sprintf('messenger://%s', $messageClass);
        $level = $event->willRetry() ? 'warning' : 'error';

        $this->errorSender->send($throwable, $url, $level);
    }
}
