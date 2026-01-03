<?php

declare(strict_types=1);

namespace App\Gateway\Payment;

use App\DTO\PaymentRequest;

/**
 * Interface for payment gateway implementations.
 */
interface PaymentGatewayInterface
{
    /**
     * Process a payment charge.
     *
     * @return string Transaction ID on success
     * @throws \App\Exception\ECommerce\PaymentFailedException on failure
     */
    public function charge(PaymentRequest $request): string;

    /**
     * Refund a previous transaction.
     *
     * @return bool True if refund was successful
     */
    public function refund(string $transactionId, float $amount): bool;
}
