<?php

declare(strict_types=1);

namespace App\Exception\Auth;

use App\Exception\DomainException;

/**
 * Thrown when JWT token signature is invalid.
 */
final class InvalidTokenException extends DomainException
{
    public function __construct(
        string $reason,
        ?\Throwable $previous = null
    ) {
        parent::__construct(
            "Invalid token: {reason}",
            [
                'reason' => $reason,
            ],
            0,
            $previous
        );
    }
}
