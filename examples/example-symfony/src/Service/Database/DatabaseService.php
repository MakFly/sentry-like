<?php

declare(strict_types=1);

namespace App\Service\Database;

use App\Exception\Database\ConnectionTimeoutException;
use App\Exception\Database\DeadlockException;
use App\Exception\Database\QueryTimeoutException;
use App\Repository\Mock\DatabaseConnection;
use App\Repository\OrderRepository;
use App\Repository\UserRepository;

/**
 * Service for database operations.
 * Demonstrates deep stack traces through repository layer.
 */
final class DatabaseService
{
    public function __construct(
        private readonly DatabaseConnection $connection,
        private readonly UserRepository $userRepository,
        private readonly OrderRepository $orderRepository,
    ) {}

    /**
     * Fetch user with their orders.
     *
     * @throws ConnectionTimeoutException
     */
    public function fetchUserWithOrders(int $userId, bool $simulateTimeout = false): array
    {
        if ($simulateTimeout) {
            $this->connection->simulateFailure('connection_timeout');
        }

        $user = $this->loadUser($userId);
        $orders = $this->loadUserOrders($userId);

        return [
            'user' => $user,
            'orders' => $orders,
        ];
    }

    /**
     * Process parallel updates (simulates deadlock scenario).
     *
     * @throws DeadlockException
     */
    public function processParallelUpdates(string $orderId, bool $simulateDeadlock = false): void
    {
        if ($simulateDeadlock) {
            $this->connection->simulateFailure('deadlock');
        }

        $this->updateOrderWithRetry($orderId);
    }

    /**
     * Execute heavy query (simulates timeout).
     *
     * @throws QueryTimeoutException
     */
    public function executeHeavyQuery(string $query, bool $simulateTimeout = false): array
    {
        if ($simulateTimeout) {
            $this->connection->simulateFailure('query_timeout');
        }

        return $this->runComplexQuery($query);
    }

    private function loadUser(int $userId): ?array
    {
        return $this->userRepository->findById($userId);
    }

    private function loadUserOrders(int $userId): array
    {
        // Simulate query
        $this->connection->executeQuery(
            "SELECT * FROM orders WHERE user_id = {$userId}",
            'orders'
        );

        return [];
    }

    private function updateOrderWithRetry(string $orderId): void
    {
        $this->orderRepository->updateStatus($orderId, 'processing');
    }

    private function runComplexQuery(string $query): array
    {
        return $this->connection->executeQuery($query, 'analytics');
    }
}
