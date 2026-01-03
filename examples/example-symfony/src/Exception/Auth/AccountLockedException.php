<?php

declare(strict_types=1);

namespace App\Exception\Auth;

use App\Exception\DomainException;

/**
 * Thrown when account is locked due to too many failed attempts.
 */
final class AccountLockedException extends DomainException
{
    public function __construct(
        string $email,
        int $failedAttempts,
        \DateTimeInterface $unlockAt,
        ?\Throwable $previous = null
    ) {
        parent::__construct(
            "Account {email} locked after {attempts} failed attempts. Unlock at: {unlockAt}",
            [
                'email' => $email,
                'attempts' => $failedAttempts,
                'unlockAt' => $unlockAt->format('Y-m-d H:i:s'),
            ],
            0,
            $previous
        );
    }
}
