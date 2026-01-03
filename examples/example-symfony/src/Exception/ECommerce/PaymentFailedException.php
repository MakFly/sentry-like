<?php

declare(strict_types=1);

namespace App\Exception\ECommerce;

use App\Exception\DomainException;

/**
 * Thrown when a payment transaction fails.
 */
final class PaymentFailedException extends DomainException
{
    public function __construct(
        string $reason,
        string $transactionId,
        float $amount,
        string $currency = 'USD',
        ?\Throwable $previous = null
    ) {
        parent::__construct(
            "Payment failed: {reason} | Transaction: {transactionId} | Amount: {amount} {currency}",
            [
                'reason' => $reason,
                'transactionId' => $transactionId,
                'amount' => number_format($amount, 2),
                'currency' => $currency,
            ],
            0,
            $previous
        );
    }
}
