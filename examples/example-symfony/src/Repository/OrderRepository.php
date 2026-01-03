<?php

declare(strict_types=1);

namespace App\Repository;

use App\Repository\Mock\DatabaseConnection;

/**
 * Repository for order data access.
 */
final class OrderRepository
{
    private DatabaseConnection $connection;

    /** @var array<string, array> */
    private array $mockOrders = [];

    public function __construct(DatabaseConnection $connection)
    {
        $this->connection = $connection;
    }

    public function findById(string $orderId): ?array
    {
        $this->connection->executeQuery(
            "SELECT * FROM orders WHERE id = '{$orderId}'",
            'orders'
        );

        return $this->mockOrders[$orderId] ?? null;
    }

    public function create(array $orderData): string
    {
        $orderId = 'ord_' . bin2hex(random_bytes(8));

        $this->mockOrders[$orderId] = array_merge($orderData, [
            'id' => $orderId,
            'created_at' => new \DateTimeImmutable(),
        ]);

        $this->connection->executeQuery(
            "INSERT INTO orders (id, user_id, status) VALUES ('{$orderId}', ...)",
            'orders'
        );

        return $orderId;
    }

    public function updateStatus(string $orderId, string $status): void
    {
        if (isset($this->mockOrders[$orderId])) {
            $this->mockOrders[$orderId]['status'] = $status;
        }

        $this->connection->executeQuery(
            "UPDATE orders SET status = '{$status}' WHERE id = '{$orderId}'",
            'orders'
        );
    }

    public function updatePaymentStatus(string $orderId, string $status, string $transactionId): void
    {
        if (isset($this->mockOrders[$orderId])) {
            $this->mockOrders[$orderId]['payment_status'] = $status;
            $this->mockOrders[$orderId]['transaction_id'] = $transactionId;
        }

        $this->connection->executeQuery(
            "UPDATE orders SET payment_status = '{$status}', transaction_id = '{$transactionId}' WHERE id = '{$orderId}'",
            'orders'
        );
    }

    /**
     * Pre-populate mock order for testing.
     */
    public function setMockOrder(string $orderId, array $data): void
    {
        $this->mockOrders[$orderId] = array_merge(['id' => $orderId], $data);
    }
}
