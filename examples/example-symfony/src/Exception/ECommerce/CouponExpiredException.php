<?php

declare(strict_types=1);

namespace App\Exception\ECommerce;

use App\Exception\DomainException;

/**
 * Thrown when a coupon code has expired.
 */
final class CouponExpiredException extends DomainException
{
    public function __construct(
        string $couponCode,
        \DateTimeInterface $expiredAt,
        ?\Throwable $previous = null
    ) {
        parent::__construct(
            "Coupon '{code}' expired on {expiredAt}",
            [
                'code' => $couponCode,
                'expiredAt' => $expiredAt->format('Y-m-d H:i:s'),
            ],
            0,
            $previous
        );
    }
}
