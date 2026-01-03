<?php

declare(strict_types=1);

namespace App\Exception\Database;

use App\Exception\DomainException;

/**
 * Thrown when a database deadlock is detected.
 */
final class DeadlockException extends DomainException
{
    public function __construct(
        string $table,
        string $operation,
        int $retryCount = 0,
        ?\Throwable $previous = null
    ) {
        parent::__construct(
            "Deadlock detected on table '{table}' during {operation}. Retries: {retries}",
            [
                'table' => $table,
                'operation' => $operation,
                'retries' => $retryCount,
            ],
            0,
            $previous
        );
    }
}
