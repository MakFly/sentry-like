<?php

declare(strict_types=1);

namespace App\Exception\Api;

use App\Exception\DomainException;

/**
 * Thrown when an external API request times out.
 */
final class ApiTimeoutException extends DomainException
{
    public function __construct(
        string $endpoint,
        int $timeoutMs,
        ?\Throwable $previous = null
    ) {
        parent::__construct(
            "API request to {endpoint} timed out after {timeout}ms",
            [
                'endpoint' => $endpoint,
                'timeout' => $timeoutMs,
            ],
            0,
            $previous
        );
    }
}
