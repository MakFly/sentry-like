<?php

declare(strict_types=1);

namespace App\Repository;

use App\Exception\Database\ConstraintViolationException;
use App\Repository\Mock\DatabaseConnection;

/**
 * Repository for user data access.
 */
final class UserRepository
{
    private DatabaseConnection $connection;

    /** @var array<int, array> */
    private array $mockUsers = [
        1 => ['id' => 1, 'email' => 'john@example.com', 'name' => 'John Doe', 'locked' => false],
        2 => ['id' => 2, 'email' => 'jane@example.com', 'name' => 'Jane Smith', 'locked' => false],
    ];

    /** @var array<string, int> */
    private array $failedAttempts = [];

    public function __construct(DatabaseConnection $connection)
    {
        $this->connection = $connection;
    }

    public function findById(int $userId): ?array
    {
        $this->connection->executeQuery(
            "SELECT * FROM users WHERE id = {$userId}",
            'users'
        );

        return $this->mockUsers[$userId] ?? null;
    }

    public function findByEmail(string $email): ?array
    {
        $this->connection->executeQuery(
            "SELECT * FROM users WHERE email = '{$email}'",
            'users'
        );

        foreach ($this->mockUsers as $user) {
            if ($user['email'] === $email) {
                return $user;
            }
        }

        return null;
    }

    /**
     * Check email uniqueness before registration.
     *
     * @throws ConstraintViolationException
     */
    public function checkEmailUniqueness(string $email): void
    {
        $this->connection->executeQuery(
            "SELECT COUNT(*) FROM users WHERE email = '{$email}'",
            'users'
        );

        // Simulate existing email check
        if (str_contains($email, 'existing') || $this->findByEmail($email) !== null) {
            throw new ConstraintViolationException('users', 'email_unique', $email);
        }
    }

    public function incrementFailedAttempts(string $email): int
    {
        if (!isset($this->failedAttempts[$email])) {
            $this->failedAttempts[$email] = 0;
        }

        return ++$this->failedAttempts[$email];
    }

    public function getFailedAttempts(string $email): int
    {
        return $this->failedAttempts[$email] ?? 0;
    }

    public function lockAccount(string $email): void
    {
        foreach ($this->mockUsers as &$user) {
            if ($user['email'] === $email) {
                $user['locked'] = true;
                break;
            }
        }
    }

    public function isAccountLocked(string $email): bool
    {
        $user = $this->findByEmail($email);
        return $user['locked'] ?? false;
    }
}
