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
use Makfly\ErrorWatch\Service\BreadcrumbService;
use Makfly\ErrorWatch\Service\UserContextService;
use Makfly\ErrorWatch\Model\Breadcrumb;
use Symfony\Component\Security\Core\Security;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\HttpFoundation\RequestStack;

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
                $this->isNull(),
                $this->isType('array')
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

    public function testSendsWithBreadcrumbs(): void
    {
        $breadcrumbService = new BreadcrumbService(100);
        $breadcrumbService->add(Breadcrumb::http('GET', '/api/users'));
        $breadcrumbService->add(Breadcrumb::user('click', 'Submit button clicked'));

        $mockSender = $this->createMock(ErrorSenderInterface::class);
        $mockSender->expects($this->once())
            ->method('send')
            ->with(
                $this->isInstanceOf(\Throwable::class),
                $this->anything(),
                $this->isNull(),
                $this->isNull(),
                $this->callback(function (array $context) {
                    return isset($context['breadcrumbs'])
                        && count($context['breadcrumbs']) === 2
                        && $context['breadcrumbs'][0]['category'] === 'http';
                })
            );

        $subscriber = new ExceptionSubscriber(
            $mockSender,
            $breadcrumbService,
            null,
            true,
            false
        );

        $dispatcher = new EventDispatcher();
        $dispatcher->addSubscriber($subscriber);

        $request = Request::create('/test');
        $mockKernel = $this->createMock(HttpKernelInterface::class);
        $event = new ExceptionEvent(
            $mockKernel,
            $request,
            HttpKernelInterface::MAIN_REQUEST,
            new \RuntimeException('Test')
        );

        $dispatcher->dispatch($event, KernelEvents::EXCEPTION);
    }

    public function testSendsWithUserContext(): void
    {
        $user = new class implements UserInterface {
            public function getRoles(): array
            {
                return [];
            }
            public function eraseCredentials(): void {}
            public function getUserIdentifier(): string
            {
                return 'user123';
            }
            public function getEmail(): string
            {
                return 'test@example.com';
            }
        };

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($user);

        $requestStack = new RequestStack();
        $request = Request::create('/test', 'GET', [], [], [], ['REMOTE_ADDR' => '192.168.1.1']);
        $requestStack->push($request);

        $userContextService = new UserContextService($security, $requestStack, true);

        $mockSender = $this->createMock(ErrorSenderInterface::class);
        $mockSender->expects($this->once())
            ->method('send')
            ->with(
                $this->isInstanceOf(\Throwable::class),
                $this->anything(),
                $this->isNull(),
                $this->isNull(),
                $this->callback(function (array $context) {
                    return isset($context['user'])
                        && $context['user']['id'] === 'user123'
                        && $context['user']['email'] === 'test@example.com'
                        && $context['user']['ip_address'] === '192.168.1.1';
                })
            );

        $subscriber = new ExceptionSubscriber(
            $mockSender,
            null,
            $userContextService,
            false,
            true
        );

        $dispatcher = new EventDispatcher();
        $dispatcher->addSubscriber($subscriber);

        $mockKernel = $this->createMock(HttpKernelInterface::class);
        $event = new ExceptionEvent(
            $mockKernel,
            $request,
            HttpKernelInterface::MAIN_REQUEST,
            new \RuntimeException('Test')
        );

        $dispatcher->dispatch($event, KernelEvents::EXCEPTION);
    }

    public function testSendsWithFullContext(): void
    {
        // Setup breadcrumbs
        $breadcrumbService = new BreadcrumbService(100);
        $breadcrumbService->add(Breadcrumb::navigation('/home', '/about'));

        // Setup user context
        $user = new class implements UserInterface {
            public function getRoles(): array
            {
                return [];
            }
            public function eraseCredentials(): void {}
            public function getUserIdentifier(): string
            {
                return 'user456';
            }
        };
        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($user);

        $requestStack = new RequestStack();
        $request = Request::create('/about');
        $requestStack->push($request);

        $userContextService = new UserContextService($security, $requestStack, false);

        $mockSender = $this->createMock(ErrorSenderInterface::class);
        $mockSender->expects($this->once())
            ->method('send')
            ->with(
                $this->isInstanceOf(\Throwable::class),
                $this->anything(),
                $this->isNull(),
                $this->isNull(),
                $this->callback(function (array $context) {
                    return isset($context['breadcrumbs'])
                        && isset($context['user'])
                        && $context['user']['id'] === 'user456'
                        && count($context['breadcrumbs']) === 1;
                })
            );

        $subscriber = new ExceptionSubscriber(
            $mockSender,
            $breadcrumbService,
            $userContextService,
            true,
            true
        );

        $dispatcher = new EventDispatcher();
        $dispatcher->addSubscriber($subscriber);

        $mockKernel = $this->createMock(HttpKernelInterface::class);
        $event = new ExceptionEvent(
            $mockKernel,
            $request,
            HttpKernelInterface::MAIN_REQUEST,
            new \RuntimeException('Full context test')
        );

        $dispatcher->dispatch($event, KernelEvents::EXCEPTION);
    }

    public function testDisablesBreadcrumbsWhenConfigured(): void
    {
        $breadcrumbService = new BreadcrumbService(100);
        $breadcrumbService->add(Breadcrumb::user('click', 'Test'));

        $mockSender = $this->createMock(ErrorSenderInterface::class);
        $mockSender->expects($this->once())
            ->method('send')
            ->with(
                $this->isInstanceOf(\Throwable::class),
                $this->anything(),
                $this->isNull(),
                $this->isNull(),
                $this->callback(function (array $context) {
                    // Breadcrumbs should NOT be included
                    return !isset($context['breadcrumbs']);
                })
            );

        // breadcrumbsEnabled = false
        $subscriber = new ExceptionSubscriber(
            $mockSender,
            $breadcrumbService,
            null,
            false,
            false
        );

        $dispatcher = new EventDispatcher();
        $dispatcher->addSubscriber($subscriber);

        $request = Request::create('/test');
        $mockKernel = $this->createMock(HttpKernelInterface::class);
        $event = new ExceptionEvent(
            $mockKernel,
            $request,
            HttpKernelInterface::MAIN_REQUEST,
            new \RuntimeException('Test')
        );

        $dispatcher->dispatch($event, KernelEvents::EXCEPTION);
    }
}
