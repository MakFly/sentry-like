<?php

declare(strict_types=1);

namespace App\Exception\ECommerce;

use App\Exception\DomainException;

/**
 * Thrown when order validation fails.
 */
final class OrderValidationException extends DomainException
{
    public function __construct(
        string $orderId,
        string $reason,
        array $violations = [],
        ?\Throwable $previous = null
    ) {
        parent::__construct(
            "Order validation failed for {orderId}: {reason}",
            [
                'orderId' => $orderId,
                'reason' => $reason,
                'violations' => implode(', ', $violations),
            ],
            0,
            $previous
        );
    }
}
