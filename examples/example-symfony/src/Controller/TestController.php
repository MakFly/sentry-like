<?php

declare(strict_types=1);

namespace App\Controller;

use App\DTO\OrderRequest;
use App\Repository\Mock\DatabaseConnection;
use App\Repository\ProductRepository;
use App\Repository\UserRepository;
use App\Service\Api\ExternalApiClient;
use App\Service\Auth\AuthenticationService;
use App\Service\Database\DatabaseService;
use App\Service\ECommerce\OrderService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Error Testing Controller with Deep Stack Traces
 *
 * Routes delegate to service layer for realistic error scenarios.
 * Stack trace example: Controller → OrderService → PaymentService → StripeGateway → Exception
 */
class TestController extends AbstractController
{
    public function __construct(
        private readonly OrderService $orderService,
        private readonly DatabaseService $databaseService,
        private readonly ExternalApiClient $apiClient,
        private readonly AuthenticationService $authService,
        private readonly ProductRepository $productRepository,
        private readonly UserRepository $userRepository,
        private readonly DatabaseConnection $dbConnection,
    ) {}

    // ===================================================================
    // HOME & DASHBOARD
    // ===================================================================

    #[Route('/', name: 'app_home')]
    public function home(): Response
    {
        return $this->render('test/dashboard.html.twig');
    }

    #[Route('/dashboard', name: 'app_analytics')]
    public function analytics(): Response
    {
        return $this->render('analytics/dashboard.html.twig');
    }

    #[Route('/tests', name: 'app_tests')]
    public function tests(): Response
    {
        return $this->render('tests/index.html.twig');
    }

    #[Route('/api/scenarios', name: 'app_scenarios', methods: ['GET'])]
    public function getScenarios(): JsonResponse
    {
        return new JsonResponse([
            'categories' => [
                [
                    'name' => 'Basic Exceptions',
                    'icon' => '🐛',
                    'scenarios' => [
                        ['path' => '/test/runtime', 'name' => 'RuntimeException', 'severity' => 'error'],
                        ['path' => '/test/logic', 'name' => 'LogicException', 'severity' => 'error'],
                        ['path' => '/test/invalid-arg', 'name' => 'InvalidArgumentException', 'severity' => 'warning'],
                        ['path' => '/test/type-error', 'name' => 'TypeError', 'severity' => 'error'],
                        ['path' => '/test/division', 'name' => 'DivisionByZeroError', 'severity' => 'fatal'],
                    ],
                ],
                [
                    'name' => 'HTTP Errors',
                    'icon' => '🌐',
                    'scenarios' => [
                        ['path' => '/test/http/400', 'name' => '400 Bad Request', 'severity' => 'warning'],
                        ['path' => '/test/http/401', 'name' => '401 Unauthorized', 'severity' => 'warning'],
                        ['path' => '/test/http/403', 'name' => '403 Forbidden', 'severity' => 'warning'],
                        ['path' => '/test/http/404', 'name' => '404 Not Found', 'severity' => 'info'],
                        ['path' => '/test/http/500', 'name' => '500 Internal Server', 'severity' => 'error'],
                        ['path' => '/test/http/503', 'name' => '503 Service Unavailable', 'severity' => 'fatal'],
                    ],
                ],
                [
                    'name' => 'E-Commerce (Deep Stack)',
                    'icon' => '🛒',
                    'scenarios' => [
                        ['path' => '/test/ecommerce/payment-failed', 'name' => 'Payment Failed (6 frames)', 'severity' => 'error'],
                        ['path' => '/test/ecommerce/out-of-stock', 'name' => 'Out of Stock (5 frames)', 'severity' => 'warning'],
                        ['path' => '/test/ecommerce/invalid-coupon', 'name' => 'Coupon Expired', 'severity' => 'info'],
                        ['path' => '/test/ecommerce/shipping-error', 'name' => 'Shipping Error (4 frames)', 'severity' => 'error'],
                    ],
                ],
                [
                    'name' => 'Database (Deep Stack)',
                    'icon' => '🗄️',
                    'scenarios' => [
                        ['path' => '/test/db/connection', 'name' => 'Connection Timeout (4 frames)', 'severity' => 'fatal'],
                        ['path' => '/test/db/timeout', 'name' => 'Query Timeout (4 frames)', 'severity' => 'error'],
                        ['path' => '/test/db/deadlock', 'name' => 'Deadlock (5 frames)', 'severity' => 'error'],
                        ['path' => '/test/db/constraint', 'name' => 'Constraint Violation', 'severity' => 'warning'],
                    ],
                ],
                [
                    'name' => 'API Integration',
                    'icon' => '🔌',
                    'scenarios' => [
                        ['path' => '/test/api/timeout', 'name' => 'API Timeout (4 frames)', 'severity' => 'error'],
                        ['path' => '/test/api/rate-limit', 'name' => 'Rate Limited', 'severity' => 'warning'],
                        ['path' => '/test/api/invalid-response', 'name' => 'Invalid Response', 'severity' => 'error'],
                    ],
                ],
                [
                    'name' => 'Authentication (Deep Stack)',
                    'icon' => '🔐',
                    'scenarios' => [
                        ['path' => '/test/auth/invalid-token', 'name' => 'Invalid JWT (5 frames)', 'severity' => 'warning'],
                        ['path' => '/test/auth/expired-token', 'name' => 'Expired Token (5 frames)', 'severity' => 'info'],
                        ['path' => '/test/auth/account-locked', 'name' => 'Account Locked', 'severity' => 'warning'],
                        ['path' => '/test/auth/session-hijack', 'name' => 'Session Hijack (4 frames)', 'severity' => 'fatal'],
                    ],
                ],
                [
                    'name' => 'Session Replay',
                    'icon' => '🎬',
                    'scenarios' => [
                        ['path' => '/test/replay/demo', 'name' => 'Replay Demo Page', 'severity' => 'info'],
                        ['path' => '/test/replay/error', 'name' => 'Error with Replay', 'severity' => 'error'],
                    ],
                ],
            ],
        ]);
    }

    // ===================================================================
    // BASIC EXCEPTIONS
    // ===================================================================

    #[Route('/test/runtime', name: 'test_runtime')]
    public function testRuntime(): Response
    {
        throw new \RuntimeException('Unexpected runtime error occurred during request processing');
    }

    #[Route('/test/logic', name: 'test_logic')]
    public function testLogic(): Response
    {
        throw new \LogicException('Invalid application state: cannot proceed with current configuration');
    }

    #[Route('/test/invalid-arg', name: 'test_invalid_arg')]
    public function testInvalidArg(): Response
    {
        throw new \InvalidArgumentException('Parameter "user_id" must be a positive integer, got: -1');
    }

    #[Route('/test/type-error', name: 'test_type_error')]
    public function testTypeError(): Response
    {
        $fn = fn(array $items): int => count($items);
        $fn('not an array');
        return new Response('unreachable');
    }

    #[Route('/test/division', name: 'test_division')]
    public function testDivision(): Response
    {
        $divisor = 0;
        $result = 100 / $divisor;
        return new Response((string)$result);
    }

    // ===================================================================
    // HTTP ERRORS
    // ===================================================================

    #[Route('/test/http/400', name: 'test_http_400')]
    public function testHttp400(): Response
    {
        throw new BadRequestHttpException('Malformed JSON in request body: unexpected token at position 42');
    }

    #[Route('/test/http/401', name: 'test_http_401')]
    public function testHttp401(): Response
    {
        throw new UnauthorizedHttpException('Bearer', 'Authentication required: missing or invalid Bearer token');
    }

    #[Route('/test/http/403', name: 'test_http_403')]
    public function testHttp403(): Response
    {
        throw new AccessDeniedHttpException('Insufficient permissions: requires admin role to access /api/users');
    }

    #[Route('/test/http/404', name: 'test_http_404')]
    public function testHttp404(): Response
    {
        throw new NotFoundHttpException('Resource not found: User with ID 99999 does not exist');
    }

    #[Route('/test/http/500', name: 'test_http_500')]
    public function testHttp500(): Response
    {
        throw new \RuntimeException('Internal server error: unhandled exception in UserService::processPayment()');
    }

    #[Route('/test/http/503', name: 'test_http_503')]
    public function testHttp503(): Response
    {
        throw new ServiceUnavailableHttpException(300, 'Service temporarily unavailable: database maintenance in progress');
    }

    // ===================================================================
    // E-COMMERCE SCENARIOS (Deep Stack Traces)
    // Controller → OrderService → PaymentService → StripeGateway → Exception
    // ===================================================================

    #[Route('/test/ecommerce/payment-failed', name: 'test_payment_failed')]
    public function testPaymentFailed(): Response
    {
        // Stack: Controller → OrderService → PaymentService → StripeGateway → PaymentFailedException
        $orderRequest = new OrderRequest(
            userId: 'usr_' . uniqid(),
            items: [
                ['sku' => 'SKU-1234', 'quantity' => 2, 'price' => 49.99],
            ],
            shippingAddress: '123 Main St, New York, NY 10001',
        );

        // This triggers deep call stack ending in PaymentFailedException
        $this->orderService->checkout($orderRequest, 'tok_insufficient_funds');

        return new Response('unreachable');
    }

    #[Route('/test/ecommerce/out-of-stock', name: 'test_out_of_stock')]
    public function testOutOfStock(): Response
    {
        // Stack: Controller → OrderService → InventoryService → ProductRepository → InsufficientStockException
        $this->productRepository->setMockStock('SKU-EMPTY', 0);

        $orderRequest = new OrderRequest(
            userId: 'usr_' . uniqid(),
            items: [
                ['sku' => 'SKU-EMPTY', 'quantity' => 100, 'price' => 29.99],
            ],
            shippingAddress: '456 Oak Ave, Los Angeles, CA 90001',
        );

        $this->orderService->checkout($orderRequest, 'tok_valid');

        return new Response('unreachable');
    }

    #[Route('/test/ecommerce/invalid-coupon', name: 'test_invalid_coupon')]
    public function testInvalidCoupon(): Response
    {
        // Stack: Controller → OrderService → CouponExpiredException
        $orderRequest = new OrderRequest(
            userId: 'usr_' . uniqid(),
            items: [
                ['sku' => 'SKU-1234', 'quantity' => 1, 'price' => 49.99],
            ],
            shippingAddress: '789 Pine Rd, Chicago, IL 60601',
            couponCode: 'EXPIRED_SUMMER2024',
        );

        $this->orderService->checkout($orderRequest, 'tok_valid');

        return new Response('unreachable');
    }

    #[Route('/test/ecommerce/shipping-error', name: 'test_shipping_error')]
    public function testShippingError(): Response
    {
        // Stack: Controller → OrderService → ShippingService → ShippingCalculationException
        $orderRequest = new OrderRequest(
            userId: 'usr_' . uniqid(),
            items: [
                ['sku' => 'SKU-1234', 'quantity' => 1, 'price' => 49.99],
            ],
            shippingAddress: 'Research Station, Antarctica',
        );

        $this->orderService->checkout($orderRequest, 'tok_valid');

        return new Response('unreachable');
    }

    // ===================================================================
    // DATABASE SCENARIOS (Deep Stack Traces)
    // Controller → DatabaseService → Repository → DatabaseConnection → Exception
    // ===================================================================

    #[Route('/test/db/connection', name: 'test_db_connection')]
    public function testDbConnection(): Response
    {
        // Stack: Controller → DatabaseService → UserRepository → DatabaseConnection → ConnectionTimeoutException
        $this->databaseService->fetchUserWithOrders(99999, simulateTimeout: true);

        return new Response('unreachable');
    }

    #[Route('/test/db/timeout', name: 'test_db_timeout')]
    public function testDbTimeout(): Response
    {
        // Stack: Controller → DatabaseService → DatabaseConnection → QueryTimeoutException
        $this->databaseService->executeHeavyQuery(
            'SELECT * FROM analytics_events WHERE date >= DATE_SUB(NOW(), INTERVAL 365 DAY)',
            simulateTimeout: true
        );

        return new Response('unreachable');
    }

    #[Route('/test/db/deadlock', name: 'test_db_deadlock')]
    public function testDbDeadlock(): Response
    {
        // Stack: Controller → DatabaseService → OrderRepository → DatabaseConnection → DeadlockException
        $this->databaseService->processParallelUpdates(
            orderId: 'ord_' . uniqid(),
            simulateDeadlock: true
        );

        return new Response('unreachable');
    }

    #[Route('/test/db/constraint', name: 'test_db_constraint')]
    public function testDbConstraint(): Response
    {
        // Stack: Controller → UserRepository → DatabaseConnection → ConstraintViolationException
        $this->userRepository->checkEmailUniqueness('existing_user@example.com');

        return new Response('unreachable');
    }

    // ===================================================================
    // API INTEGRATION SCENARIOS
    // Controller → ExternalApiClient → Exception
    // ===================================================================

    #[Route('/test/api/timeout', name: 'test_api_timeout')]
    public function testApiTimeout(): Response
    {
        // Stack: Controller → ExternalApiClient → ApiTimeoutException
        $this->apiClient->fetchExternalData('https://api.slow-service.com/timeout/data');

        return new Response('unreachable');
    }

    #[Route('/test/api/rate-limit', name: 'test_api_rate_limit')]
    public function testApiRateLimit(): Response
    {
        // Stack: Controller → ExternalApiClient → RateLimitException
        $this->apiClient->fetchExternalData('https://api.github.com/rate-limited/endpoint');

        return new Response('unreachable');
    }

    #[Route('/test/api/invalid-response', name: 'test_api_invalid_response')]
    public function testApiInvalidResponse(): Response
    {
        // Stack: Controller → ExternalApiClient → InvalidResponseException
        $this->apiClient->fetchExternalData('https://api.twilio.com/invalid/malformed');

        return new Response('unreachable');
    }

    // ===================================================================
    // AUTHENTICATION SCENARIOS (Deep Stack Traces)
    // Controller → AuthenticationService → JwtService → Exception
    // ===================================================================

    #[Route('/test/auth/invalid-token', name: 'test_auth_invalid_token')]
    public function testAuthInvalidToken(): Response
    {
        // Stack: Controller → AuthenticationService → JwtService → InvalidTokenException
        $this->authService->validateAndRefresh('invalid.tampered.token');

        return new Response('unreachable');
    }

    #[Route('/test/auth/expired-token', name: 'test_auth_expired_token')]
    public function testAuthExpiredToken(): Response
    {
        // Stack: Controller → AuthenticationService → JwtService → TokenExpiredException
        $this->authService->validateAndRefresh('mock.expired.token');

        return new Response('unreachable');
    }

    #[Route('/test/auth/account-locked', name: 'test_auth_account_locked')]
    public function testAuthAccountLocked(): Response
    {
        // Simulate failed attempts to lock account
        for ($i = 0; $i < 5; $i++) {
            try {
                $this->authService->authenticate('locked@example.com', 'wrong_password', '192.168.1.1');
            } catch (\InvalidArgumentException) {
                // Expected
            }
        }

        // This should throw AccountLockedException
        $this->authService->authenticate('locked@example.com', 'any_password', '192.168.1.1');

        return new Response('unreachable');
    }

    #[Route('/test/auth/session-hijack', name: 'test_auth_session_hijack')]
    public function testAuthSessionHijack(): Response
    {
        // Stack: Controller → AuthenticationService → SessionHijackException
        $this->authService->validateSession(
            sessionId: bin2hex(random_bytes(16)),
            originalIp: '192.168.1.100',
            currentIp: '45.33.32.156'
        );

        return new Response('unreachable');
    }

    // ===================================================================
    // SESSION REPLAY SCENARIOS
    // ===================================================================

    #[Route('/test/replay/demo', name: 'test_replay_demo')]
    public function testReplayDemo(): Response
    {
        return $this->render('test/replay_demo.html.twig');
    }

    #[Route('/test/replay/error', name: 'test_replay_error')]
    public function testReplayError(): Response
    {
        throw new \RuntimeException('Error captured with session replay context - check dashboard for replay link');
    }

    // ===================================================================
    // BANKING DEMO (SecureBank)
    // ===================================================================

    #[Route('/banking', name: 'app_banking')]
    public function banking(): Response
    {
        return $this->render('banking/dashboard.html.twig');
    }

    #[Route('/banking/api/transfer', name: 'banking_api_transfer', methods: ['POST'])]
    public function bankingApiTransfer(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $amount = $data['amount'] ?? 0;
        $currentBalance = 12487.50;

        if ($amount > $currentBalance) {
            // Uses the new layered architecture
            $orderRequest = new OrderRequest(
                userId: 'bank_user_123',
                items: [['sku' => 'TRANSFER', 'quantity' => 1, 'price' => $amount]],
                shippingAddress: 'N/A',
            );

            $this->orderService->checkout($orderRequest, 'tok_insufficient_funds');
        }

        return new JsonResponse(['success' => true, 'message' => 'Transfer initiated']);
    }
}
