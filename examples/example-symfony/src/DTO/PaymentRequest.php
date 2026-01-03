<?php

declare(strict_types=1);

namespace App\DTO;

/**
 * Data transfer object for payment processing requests.
 */
final readonly class PaymentRequest
{
    public function __construct(
        public string $orderId,
        public float $amount,
        public string $currency,
        public string $cardToken,
        public string $customerEmail,
    ) {}
}
