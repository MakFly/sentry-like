<?php

namespace ErrorWatch\Symfony\Tests\Unit\EventSubscriber;

use ErrorWatch\Symfony\EventSubscriber\MessengerSubscriber;
use ErrorWatch\Symfony\Service\ErrorSenderInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Messenger\Envelope;
use Symfony\Component\Messenger\Event\WorkerMessageFailedEvent;

final class MessengerSubscriberTest extends TestCase
{
    public function testOnMessageFailedSendsErrorForFinalFailure(): void
    {
        $errorSender = $this->createMock(ErrorSenderInterface::class);
        $subscriber = new MessengerSubscriber($errorSender);

        $message = new \stdClass();
        $throwable = new \RuntimeException('Job failed');
        $envelope = new Envelope($message);

        $event = new WorkerMessageFailedEvent($envelope, 'async', $throwable);

        $errorSender->expects($this->once())
            ->method('send')
            ->with(
                $throwable,
                'messenger://stdClass',
                'error',
            );

        $subscriber->onMessageFailed($event);
    }

    public function testOnMessageFailedSkipsRetryWhenNotCapturing(): void
    {
        $errorSender = $this->createMock(ErrorSenderInterface::class);
        $subscriber = new MessengerSubscriber($errorSender, captureRetries: false);

        $message = new \stdClass();
        $throwable = new \RuntimeException('Job failed');
        $envelope = new Envelope($message);

        $event = new WorkerMessageFailedEvent($envelope, 'async', $throwable);
        $event->setForRetry();

        $errorSender->expects($this->never())->method('send');

        $subscriber->onMessageFailed($event);
    }

    public function testOnMessageFailedSendsWarningForRetryWhenCapturing(): void
    {
        $errorSender = $this->createMock(ErrorSenderInterface::class);
        $subscriber = new MessengerSubscriber($errorSender, captureRetries: true);

        $message = new \stdClass();
        $throwable = new \RuntimeException('Job failed, will retry');
        $envelope = new Envelope($message);

        $event = new WorkerMessageFailedEvent($envelope, 'async', $throwable);
        $event->setForRetry();

        $errorSender->expects($this->once())
            ->method('send')
            ->with(
                $throwable,
                'messenger://stdClass',
                'warning',
            );

        $subscriber->onMessageFailed($event);
    }

    public function testGetSubscribedEventsReturnsCorrectEvents(): void
    {
        $events = MessengerSubscriber::getSubscribedEvents();

        $this->assertArrayHasKey(WorkerMessageFailedEvent::class, $events);
        $this->assertSame('onMessageFailed', $events[WorkerMessageFailedEvent::class]);
    }
}
