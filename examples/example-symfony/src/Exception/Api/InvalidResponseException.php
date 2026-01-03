<?php

declare(strict_types=1);

namespace App\Exception\Api;

use App\Exception\DomainException;

/**
 * Thrown when API returns an invalid or unexpected response.
 */
final class InvalidResponseException extends DomainException
{
    public function __construct(
        string $api,
        string $expected,
        string $actual,
        ?\Throwable $previous = null
    ) {
        parent::__construct(
            "Invalid response from {api}: expected {expected}, got {actual}",
            [
                'api' => $api,
                'expected' => $expected,
                'actual' => $actual,
            ],
            0,
            $previous
        );
    }
}
