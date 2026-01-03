<?php

declare(strict_types=1);

namespace App\Exception\Database;

use App\Exception\DomainException;

/**
 * Thrown when a database query exceeds maximum execution time.
 */
final class QueryTimeoutException extends DomainException
{
    public function __construct(
        string $query,
        int $timeoutSeconds,
        ?\Throwable $previous = null
    ) {
        parent::__construct(
            "Query exceeded maximum execution time of {timeout}s",
            [
                'query' => substr($query, 0, 100) . (strlen($query) > 100 ? '...' : ''),
                'timeout' => $timeoutSeconds,
            ],
            0,
            $previous
        );
    }
}
