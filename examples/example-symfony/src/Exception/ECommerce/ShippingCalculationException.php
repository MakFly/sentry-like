<?php

declare(strict_types=1);

namespace App\Exception\ECommerce;

use App\Exception\DomainException;

/**
 * Thrown when shipping cost cannot be calculated.
 */
final class ShippingCalculationException extends DomainException
{
    public function __construct(
        string $destination,
        string $reason,
        ?\Throwable $previous = null
    ) {
        parent::__construct(
            "Cannot calculate shipping to {destination}: {reason}",
            [
                'destination' => $destination,
                'reason' => $reason,
            ],
            0,
            $previous
        );
    }
}
