<?php

namespace Makfly\ErrorWatch\Tests\Functional;

use PHPUnit\Framework\TestCase;
use Symfony\Component\EventDispatcher\EventDispatcher;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\HttpKernel\KernelEvents;
use Makfly\ErrorWatch\EventSubscriber\ExceptionSubscriber;
use Makfly\ErrorWatch\Service\ErrorSenderInterface;

final class ExceptionSubscriberTest extends TestCase
{
    public function testCapturesExceptionAndSendsToServer(): void
    {
        $mockSender = $this->createMock(ErrorSenderInterface::class);

        $mockSender->expects($this->once())
            ->method('send')
            ->with(
                $this->isInstanceOf(\Throwable::class),
                $this->stringContains('/test'),
                $this->isNull(),
                $this->isNull()
            );

        $subscriber = new ExceptionSubscriber($mockSender);
        $dispatcher = new EventDispatcher();
        $dispatcher->addSubscriber($subscriber);

        $request = Request::create('/test/endpoint');
        $mockKernel = $this->createMock(HttpKernelInterface::class);

        $event = new ExceptionEvent(
            $mockKernel,
            $request,
            HttpKernelInterface::MAIN_REQUEST,
            new \RuntimeException('Test exception')
        );

        $dispatcher->dispatch($event, KernelEvents::EXCEPTION);
    }

    public function testRegistersCorrectEvent(): void
    {
        $mockSender = $this->createMock(ErrorSenderInterface::class);
        $subscriber = new ExceptionSubscriber($mockSender);

        $subscribedEvents = $subscriber->getSubscribedEvents();

        $this->assertArrayHasKey(KernelEvents::EXCEPTION, $subscribedEvents);
        $this->assertSame('onException', $subscribedEvents[KernelEvents::EXCEPTION]);
    }
}
