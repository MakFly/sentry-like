<?php

declare(strict_types=1);

namespace App\Repository\Mock;

use App\Exception\Database\ConnectionTimeoutException;
use App\Exception\Database\DeadlockException;
use App\Exception\Database\QueryTimeoutException;

/**
 * Mock database connection for testing error scenarios.
 * Simulates various database failures without a real database.
 */
final class DatabaseConnection
{
    private bool $connected = false;
    private array $simulatedFailures = [];

    private const DEFAULT_HOST = 'db.internal';
    private const DEFAULT_PORT = 3306;
    private const DEFAULT_TIMEOUT_MS = 30000;

    public function connect(
        string $host = self::DEFAULT_HOST,
        int $port = self::DEFAULT_PORT
    ): void {
        if ($this->shouldSimulate('connection_timeout')) {
            throw new ConnectionTimeoutException($host, $port, self::DEFAULT_TIMEOUT_MS);
        }

        $this->connected = true;
    }

    public function isConnected(): bool
    {
        return $this->connected;
    }

    public function executeQuery(string $sql, string $table): array
    {
        $this->ensureConnected();

        if ($this->shouldSimulate('deadlock')) {
            throw new DeadlockException($table, $this->extractOperation($sql), 3);
        }

        if ($this->shouldSimulate('query_timeout')) {
            throw new QueryTimeoutException($sql, 30);
        }

        // Return mock data based on table
        return $this->getMockData($table);
    }

    public function simulateFailure(string $type): self
    {
        $this->simulatedFailures[$type] = true;
        return $this;
    }

    public function clearSimulatedFailures(): self
    {
        $this->simulatedFailures = [];
        return $this;
    }

    private function shouldSimulate(string $type): bool
    {
        return isset($this->simulatedFailures[$type]);
    }

    private function ensureConnected(): void
    {
        if (!$this->connected) {
            throw new \RuntimeException('Not connected to database');
        }
    }

    private function extractOperation(string $sql): string
    {
        $sql = strtoupper(trim($sql));

        if (str_starts_with($sql, 'SELECT')) {
            return 'SELECT';
        }
        if (str_starts_with($sql, 'UPDATE')) {
            return 'UPDATE';
        }
        if (str_starts_with($sql, 'INSERT')) {
            return 'INSERT';
        }
        if (str_starts_with($sql, 'DELETE')) {
            return 'DELETE';
        }

        return 'UNKNOWN';
    }

    private function getMockData(string $table): array
    {
        return match ($table) {
            'users' => [
                ['id' => 1, 'email' => 'user@example.com', 'name' => 'John Doe'],
            ],
            'orders' => [
                ['id' => 'ord_123', 'user_id' => 1, 'status' => 'pending', 'total' => 99.99],
            ],
            'products' => [
                ['sku' => 'SKU-1234', 'name' => 'Test Product', 'price' => 49.99, 'stock' => 10],
            ],
            default => [],
        };
    }
}
