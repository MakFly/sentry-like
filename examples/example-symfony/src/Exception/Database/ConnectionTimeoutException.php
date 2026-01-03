<?php

declare(strict_types=1);

namespace App\Exception\Database;

use App\Exception\DomainException;

/**
 * Thrown when database connection times out.
 */
final class ConnectionTimeoutException extends DomainException
{
    public function __construct(
        string $host,
        int $port,
        int $timeoutMs,
        ?\Throwable $previous = null
    ) {
        parent::__construct(
            "Database connection timeout after {timeout}ms to {host}:{port}",
            [
                'host' => $host,
                'port' => $port,
                'timeout' => $timeoutMs,
            ],
            0,
            $previous
        );
    }
}
