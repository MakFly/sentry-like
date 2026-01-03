<?php

declare(strict_types=1);

namespace App\DTO;

/**
 * Data transfer object for order creation requests.
 */
final readonly class OrderRequest
{
    /**
     * @param array<array{sku: string, quantity: int, price: float}> $items
     */
    public function __construct(
        public string $userId,
        public array $items,
        public string $shippingAddress,
        public ?string $couponCode = null,
    ) {}
}
