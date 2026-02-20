<?php

namespace ErrorWatch\Symfony\EventSubscriber;

use ErrorWatch\Symfony\Service\BreadcrumbService;
use ErrorWatch\Symfony\Service\ErrorSenderInterface;
use ErrorWatch\Symfony\Service\UserContextService;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\KernelEvents;

final class ExceptionSubscriber implements EventSubscriberInterface
{
    private ErrorSenderInterface $errorSender;
    private ?BreadcrumbService $breadcrumbService;
    private ?UserContextService $userContextService;
    private bool $breadcrumbsEnabled;
    private bool $userContextEnabled;

    /**
     * URL patterns to ALWAYS ignore (for ALL exception types)
     * These are browser/tool noise that should never be reported.
     */
    private const ALWAYS_IGNORED_PATTERNS = [
        // Chrome DevTools
        '#/\.well-known/appspecific/com\.chrome\.devtools\.json#',
        '#/\.well-known/#',
    ];

    /**
     * URL patterns to ignore only for 404 errors
     * These are common missing resources, not real application errors.
     */
    private const IGNORED_404_PATTERNS = [
        // Common browser requests
        '#/favicon\.ico$#',
        '#/apple-touch-icon#',
        '#/robots\.txt$#',
        '#/sitemap\.xml$#',
        // Source maps (should not be public anyway)
        '#\.map$#',
        // WordPress probes (common attack vectors)
        '#/wp-admin#',
        '#/wp-login\.php#',
        '#/wp-content#',
        '#/xmlrpc\.php#',
        // PHP probes
        '#/phpinfo\.php#',
        '#/phpmyadmin#',
        '#/adminer#',
    ];

    public function __construct(
        ErrorSenderInterface $errorSender,
        ?BreadcrumbService $breadcrumbService = null,
        ?UserContextService $userContextService = null,
        bool $breadcrumbsEnabled = true,
        bool $userContextEnabled = true,
    ) {
        $this->errorSender = $errorSender;
        $this->breadcrumbService = $breadcrumbService;
        $this->userContextService = $userContextService;
        $this->breadcrumbsEnabled = $breadcrumbsEnabled;
        $this->userContextEnabled = $userContextEnabled;
    }

    public static function getSubscribedEvents(): array
    {
        return [KernelEvents::EXCEPTION => 'onException'];
    }

    public function onException(ExceptionEvent $event): void
    {
        $throwable = $event->getThrowable();
        $request = $event->getRequest();
        $url = $request->getUri();
        $path = $request->getPathInfo();

        // Always skip these patterns (any exception type)
        foreach (self::ALWAYS_IGNORED_PATTERNS as $pattern) {
            if (preg_match($pattern, $path)) {
                return;
            }
        }

        // Skip 404s for noise patterns
        if ($throwable instanceof NotFoundHttpException) {
            foreach (self::IGNORED_404_PATTERNS as $pattern) {
                if (preg_match($pattern, $path)) {
                    return;
                }
            }
        }

        // Get session ID for replay linking (if available)
        // Priority: 1. X-Session-ID header (from JS fetch interceptor)
        //           2. Request attributes (from SessionReplayManager on page load)
        $sessionId = $request->headers->get('X-Session-ID')
            ?: $request->attributes->get('error_watch_session_id');

        // Build context with breadcrumbs and user
        $context = $this->buildContext();

        $this->errorSender->send($throwable, $url, null, $sessionId, $context);
    }

    /**
     * Build context array with breadcrumbs and user information.
     *
     * @return array<string, mixed>
     */
    private function buildContext(): array
    {
        $context = [];

        // Add breadcrumbs if enabled and service available
        if ($this->breadcrumbsEnabled && null !== $this->breadcrumbService) {
            $breadcrumbs = $this->breadcrumbService->all();
            if (!empty($breadcrumbs)) {
                $context['breadcrumbs'] = $breadcrumbs;
            }
        }

        // Add user context if enabled and service available
        if ($this->userContextEnabled && null !== $this->userContextService) {
            $userContext = $this->userContextService->getContext();
            if (null !== $userContext) {
                $context['user'] = $userContext;
            }
        }

        return $context;
    }
}
