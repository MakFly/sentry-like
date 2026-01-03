<?php

declare(strict_types=1);

namespace App\Exception\ECommerce;

use App\Exception\DomainException;

/**
 * Thrown when requested quantity exceeds available stock.
 */
final class InsufficientStockException extends DomainException
{
    public function __construct(
        string $productSku,
        int $requested,
        int $available,
        ?\Throwable $previous = null
    ) {
        parent::__construct(
            "Insufficient stock for {sku}: requested {requested}, available {available}",
            [
                'sku' => $productSku,
                'requested' => $requested,
                'available' => $available,
            ],
            0,
            $previous
        );
    }
}
