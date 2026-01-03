<?php

declare(strict_types=1);

namespace App\Tests\Unit\Repository;

use App\Exception\Database\ConnectionTimeoutException;
use App\Exception\Database\DeadlockException;
use App\Exception\Database\QueryTimeoutException;
use App\Repository\Mock\DatabaseConnection;
use PHPUnit\Framework\TestCase;

final class DatabaseConnectionTest extends TestCase
{
    public function testConnectSuccessfully(): void
    {
        $connection = new DatabaseConnection();

        // Should not throw
        $connection->connect();

        $this->assertTrue($connection->isConnected());
    }

    public function testConnectThrowsTimeoutException(): void
    {
        $connection = new DatabaseConnection();
        $connection->simulateFailure('connection_timeout');

        $this->expectException(ConnectionTimeoutException::class);
        $this->expectExceptionMessage('timeout');

        $connection->connect();
    }

    public function testExecuteQuerySuccessfully(): void
    {
        $connection = new DatabaseConnection();
        $connection->connect();

        $result = $connection->executeQuery('SELECT * FROM users', 'users');

        $this->assertIsArray($result);
    }

    public function testExecuteQueryThrowsDeadlock(): void
    {
        $connection = new DatabaseConnection();
        $connection->connect();
        $connection->simulateFailure('deadlock');

        $this->expectException(DeadlockException::class);
        $this->expectExceptionMessage('Deadlock');

        $connection->executeQuery('UPDATE orders SET status = ?', 'orders');
    }

    public function testExecuteQueryThrowsTimeout(): void
    {
        $connection = new DatabaseConnection();
        $connection->connect();
        $connection->simulateFailure('query_timeout');

        $this->expectException(QueryTimeoutException::class);
        $this->expectExceptionMessage('exceeded');

        $connection->executeQuery('SELECT * FROM large_table', 'large_table');
    }
}
