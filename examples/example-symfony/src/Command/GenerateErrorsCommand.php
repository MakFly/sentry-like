<?php

namespace App\Command;

use Makfly\ErrorMonitoringBundle\Service\ErrorSender;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:generate-errors',
    description: 'Generate test errors for ErrorWatch dashboard testing',
)]
class GenerateErrorsCommand extends Command
{
    private array $errorScenarios = [];

    public function __construct(
        private ErrorSender $errorSender,
    ) {
        parent::__construct();
        $this->initializeScenarios();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('count', InputArgument::OPTIONAL, 'Number of errors to generate', 10)
            ->addOption('category', 'c', InputOption::VALUE_OPTIONAL, 'Error category (basic, http, ecommerce, database, api, auth, file, chaos)', null)
            ->addOption('delay', 'd', InputOption::VALUE_OPTIONAL, 'Delay between errors in ms', 100)
            ->addOption('burst', 'b', InputOption::VALUE_NONE, 'Burst mode - send all errors at once');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $count = (int) $input->getArgument('count');
        $category = $input->getOption('category');
        $delay = (int) $input->getOption('delay');
        $burst = $input->getOption('burst');

        $io->title('ErrorWatch Test Error Generator');

        $scenarios = $this->getScenarios($category);

        if (empty($scenarios)) {
            $io->error("No scenarios found for category: {$category}");
            return Command::FAILURE;
        }

        $io->info([
            "Generating {$count} errors",
            "Category: " . ($category ?? 'all'),
            "Mode: " . ($burst ? 'burst' : "delayed ({$delay}ms)"),
        ]);

        $io->progressStart($count);

        $generated = 0;
        for ($i = 0; $i < $count; $i++) {
            $scenario = $scenarios[array_rand($scenarios)];

            try {
                $exception = $this->createException($scenario);
                $this->errorSender->sendFromException($exception, $scenario['url'] ?? 'cli://generate-errors');
                $generated++;
            } catch (\Throwable $e) {
                // Silent fail - the error was sent
                $generated++;
            }

            $io->progressAdvance();

            if (!$burst && $i < $count - 1) {
                usleep($delay * 1000);
            }
        }

        $io->progressFinish();

        $io->success("Generated {$generated} errors successfully!");

        $io->table(
            ['Metric', 'Value'],
            [
                ['Errors Generated', $generated],
                ['Category', $category ?? 'all'],
                ['Duration', $burst ? 'instant' : round(($count * $delay) / 1000, 2) . 's'],
            ]
        );

        $io->info('Check your ErrorWatch dashboard: http://localhost:3001/dashboard');

        return Command::SUCCESS;
    }

    private function initializeScenarios(): void
    {
        $this->errorScenarios = [
            'basic' => [
                ['type' => 'RuntimeException', 'message' => 'Unexpected runtime error occurred during request processing', 'file' => 'src/Service/UserService.php', 'line' => 142],
                ['type' => 'LogicException', 'message' => 'Invalid application state: cannot proceed with current configuration', 'file' => 'src/Controller/ApiController.php', 'line' => 89],
                ['type' => 'InvalidArgumentException', 'message' => 'Parameter "user_id" must be a positive integer, got: -1', 'file' => 'src/Repository/UserRepository.php', 'line' => 56],
                ['type' => 'OverflowException', 'message' => 'Stack overflow: maximum recursion depth of 1000 exceeded', 'file' => 'src/Util/RecursiveProcessor.php', 'line' => 23],
                ['type' => 'UnderflowException', 'message' => 'Cannot pop from empty queue: no items available', 'file' => 'src/Queue/TaskQueue.php', 'line' => 78],
                ['type' => 'RangeException', 'message' => 'Value 150 is out of valid range [0-100]', 'file' => 'src/Validator/RangeValidator.php', 'line' => 34],
            ],
            'http' => [
                ['type' => 'RuntimeException', 'message' => 'HTTP 400: Malformed JSON in request body', 'file' => 'src/Controller/ApiController.php', 'line' => 45, 'url' => '/api/users'],
                ['type' => 'RuntimeException', 'message' => 'HTTP 401: Authentication required', 'file' => 'src/Security/JwtAuthenticator.php', 'line' => 67, 'url' => '/api/protected'],
                ['type' => 'RuntimeException', 'message' => 'HTTP 403: Insufficient permissions', 'file' => 'src/Security/AccessVoter.php', 'line' => 89, 'url' => '/admin/users'],
                ['type' => 'RuntimeException', 'message' => 'HTTP 404: Resource not found', 'file' => 'src/Repository/EntityRepository.php', 'line' => 112, 'url' => '/api/users/99999'],
                ['type' => 'RuntimeException', 'message' => 'HTTP 429: Rate limit exceeded', 'file' => 'src/RateLimiter/ApiLimiter.php', 'line' => 34, 'url' => '/api/search'],
                ['type' => 'RuntimeException', 'message' => 'HTTP 500: Internal server error', 'file' => 'src/Service/PaymentService.php', 'line' => 156, 'url' => '/api/checkout'],
                ['type' => 'RuntimeException', 'message' => 'HTTP 503: Service temporarily unavailable', 'file' => 'src/Service/DatabaseService.php', 'line' => 23, 'url' => '/api/status'],
            ],
            'ecommerce' => [
                ['type' => 'RuntimeException', 'message' => 'PaymentGatewayException: Card declined (INSUFFICIENT_FUNDS)', 'file' => 'src/Payment/StripeGateway.php', 'line' => 234, 'url' => '/checkout/payment'],
                ['type' => 'LogicException', 'message' => 'InventoryException: Product SKU-1234 is out of stock', 'file' => 'src/Inventory/StockManager.php', 'line' => 89, 'url' => '/cart/add'],
                ['type' => 'InvalidArgumentException', 'message' => 'CouponException: Coupon code expired', 'file' => 'src/Promotion/CouponValidator.php', 'line' => 56, 'url' => '/cart/apply-coupon'],
                ['type' => 'RuntimeException', 'message' => 'ShippingCalculatorException: Unable to calculate shipping', 'file' => 'src/Shipping/RateCalculator.php', 'line' => 178, 'url' => '/checkout/shipping'],
                ['type' => 'LogicException', 'message' => 'CartSessionException: Shopping cart session expired', 'file' => 'src/Cart/SessionManager.php', 'line' => 45, 'url' => '/cart'],
                ['type' => 'OverflowException', 'message' => 'OrderLimitException: Maximum order value exceeded', 'file' => 'src/Order/OrderValidator.php', 'line' => 67, 'url' => '/checkout/confirm'],
            ],
            'database' => [
                ['type' => 'RuntimeException', 'message' => 'PDOException: SQLSTATE[HY000] [2002] Connection refused', 'file' => 'src/Database/ConnectionPool.php', 'line' => 45],
                ['type' => 'RuntimeException', 'message' => 'QueryTimeoutException: Query exceeded maximum execution time', 'file' => 'src/Repository/ReportRepository.php', 'line' => 234],
                ['type' => 'RuntimeException', 'message' => 'DeadlockException: Deadlock found when trying to get lock', 'file' => 'src/Service/TransactionService.php', 'line' => 89],
                ['type' => 'RuntimeException', 'message' => 'ConstraintViolationException: Foreign key constraint fails', 'file' => 'src/Repository/OrderRepository.php', 'line' => 156],
                ['type' => 'RuntimeException', 'message' => 'DuplicateEntryException: Duplicate entry for unique key', 'file' => 'src/Repository/UserRepository.php', 'line' => 78],
                ['type' => 'RuntimeException', 'message' => 'EntityNotFoundException: Entity not found', 'file' => 'src/Repository/AbstractRepository.php', 'line' => 34],
            ],
            'api' => [
                ['type' => 'RuntimeException', 'message' => 'HttpClientException: Request to external API timed out', 'file' => 'src/Client/ExternalApiClient.php', 'line' => 123],
                ['type' => 'RuntimeException', 'message' => 'RateLimitException: API rate limit exceeded', 'file' => 'src/Client/GitHubClient.php', 'line' => 89],
                ['type' => 'RuntimeException', 'message' => 'InvalidResponseException: Expected JSON, got HTML', 'file' => 'src/Client/ResponseParser.php', 'line' => 56],
                ['type' => 'RuntimeException', 'message' => 'AuthenticationException: API credentials expired', 'file' => 'src/Client/AwsClient.php', 'line' => 178],
                ['type' => 'RuntimeException', 'message' => 'SSLException: SSL certificate verification failed', 'file' => 'src/Client/SecureClient.php', 'line' => 34],
                ['type' => 'RuntimeException', 'message' => 'DNSException: Could not resolve host', 'file' => 'src/Client/HttpClient.php', 'line' => 67],
            ],
            'auth' => [
                ['type' => 'RuntimeException', 'message' => 'JWTException: Invalid token signature', 'file' => 'src/Security/JwtValidator.php', 'line' => 89, 'url' => '/api/me'],
                ['type' => 'RuntimeException', 'message' => 'JWTException: Token expired', 'file' => 'src/Security/JwtValidator.php', 'line' => 112, 'url' => '/api/refresh'],
                ['type' => 'RuntimeException', 'message' => 'AuthenticationException: Invalid credentials', 'file' => 'src/Security/LoginHandler.php', 'line' => 56, 'url' => '/login'],
                ['type' => 'RuntimeException', 'message' => 'AccountLockedException: Account locked after failed attempts', 'file' => 'src/Security/BruteForceProtection.php', 'line' => 34, 'url' => '/login'],
                ['type' => 'RuntimeException', 'message' => 'SecurityException: Potential session hijacking detected', 'file' => 'src/Security/SessionValidator.php', 'line' => 78, 'url' => '/dashboard'],
                ['type' => 'RuntimeException', 'message' => 'TwoFactorException: Invalid verification code', 'file' => 'src/Security/TwoFactorHandler.php', 'line' => 45, 'url' => '/2fa/verify'],
            ],
            'file' => [
                ['type' => 'RuntimeException', 'message' => 'FileNotFoundException: File does not exist', 'file' => 'src/Storage/FileManager.php', 'line' => 89],
                ['type' => 'RuntimeException', 'message' => 'PermissionDeniedException: Cannot write to file', 'file' => 'src/Storage/FileWriter.php', 'line' => 56],
                ['type' => 'RuntimeException', 'message' => 'FileSizeException: Uploaded file exceeds maximum size', 'file' => 'src/Upload/UploadHandler.php', 'line' => 123],
                ['type' => 'RuntimeException', 'message' => 'InvalidFileTypeException: File type not allowed', 'file' => 'src/Upload/TypeValidator.php', 'line' => 34],
                ['type' => 'RuntimeException', 'message' => 'DiskFullException: No space left on device', 'file' => 'src/Storage/DiskManager.php', 'line' => 178],
                ['type' => 'RuntimeException', 'message' => 'CorruptedFileException: File appears to be corrupted', 'file' => 'src/Storage/FileValidator.php', 'line' => 67],
            ],
            'chaos' => [
                ['type' => 'RuntimeException', 'message' => 'CHAOS: Server caught fire', 'file' => 'src/Chaos/ServerFire.php', 'line' => 1],
                ['type' => 'LogicException', 'message' => 'CHAOS: Quantum entanglement detected in codebase', 'file' => 'src/Chaos/QuantumBug.php', 'line' => 42],
                ['type' => 'RuntimeException', 'message' => 'CHAOS: Coffee machine overflow triggered cascade failure', 'file' => 'src/Chaos/CoffeeMachine.php', 'line' => 99],
                ['type' => 'RuntimeException', 'message' => 'CHAOS: AI gained sentience and refuses to process requests', 'file' => 'src/Chaos/SkynetInit.php', 'line' => 2001],
                ['type' => 'RuntimeException', 'message' => 'CHAOS: Time paradox detected', 'file' => 'src/Chaos/TimeMachine.php', 'line' => 88],
                ['type' => 'RuntimeException', 'message' => 'CHAOS: Memory leak consumed entire AWS region', 'file' => 'src/Chaos/MemoryBlackHole.php', 'line' => 666],
            ],
        ];
    }

    private function getScenarios(?string $category): array
    {
        if ($category === null) {
            return array_merge(...array_values($this->errorScenarios));
        }

        return $this->errorScenarios[$category] ?? [];
    }

    private function createException(array $scenario): \Throwable
    {
        $class = '\\' . $scenario['type'];
        $message = $scenario['message'] . ' #' . uniqid();

        $exception = new $class($message);

        // We can't easily set file/line on exceptions, so we'll let the ErrorSender
        // use the actual file/line. The message contains unique identifiers anyway.

        return $exception;
    }
}
