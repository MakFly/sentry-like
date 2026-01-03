<?php

declare(strict_types=1);

namespace App\Exception\Auth;

use App\Exception\DomainException;

/**
 * Thrown when JWT token has expired.
 */
final class TokenExpiredException extends DomainException
{
    public function __construct(
        \DateTimeInterface $expiredAt,
        ?\Throwable $previous = null
    ) {
        parent::__construct(
            "Token expired at {expiredAt}",
            [
                'expiredAt' => $expiredAt->format('Y-m-d H:i:s'),
            ],
            0,
            $previous
        );
    }
}
