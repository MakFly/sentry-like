<?php

declare(strict_types=1);

namespace App\Exception\Api;

use App\Exception\DomainException;

/**
 * Thrown when API rate limit is exceeded.
 */
final class RateLimitException extends DomainException
{
    public function __construct(
        string $api,
        int $limit,
        int $retryAfterSeconds,
        ?\Throwable $previous = null
    ) {
        parent::__construct(
            "{api} rate limit exceeded ({limit}/hour). Retry after {retryAfter}s",
            [
                'api' => $api,
                'limit' => $limit,
                'retryAfter' => $retryAfterSeconds,
            ],
            0,
            $previous
        );
    }
}
