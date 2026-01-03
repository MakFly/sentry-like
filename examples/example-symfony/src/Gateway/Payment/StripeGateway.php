<?php

declare(strict_types=1);

namespace App\Gateway\Payment;

use App\DTO\PaymentRequest;
use App\Exception\ECommerce\PaymentFailedException;

/**
 * Mock Stripe payment gateway for testing.
 * Simulates various payment scenarios based on card token.
 */
final class StripeGateway implements PaymentGatewayInterface
{
    private string $apiKey;
    private string $apiVersion = '2023-10-16';

    public function __construct(string $apiKey = 'sk_test_default')
    {
        $this->apiKey = $apiKey;
    }

    public function charge(PaymentRequest $request): string
    {
        // Step 1: Validate API key
        $this->validateApiKey();

        // Step 2: Prepare request data
        $requestData = $this->prepareChargeRequest($request);

        // Step 3: Simulate API call
        $this->simulateNetworkLatency();

        // Step 4: Process charge (may throw)
        return $this->executeCharge($request, $requestData);
    }

    public function refund(string $transactionId, float $amount): bool
    {
        $this->validateApiKey();
        $this->simulateNetworkLatency();

        // Always succeed for mock
        return true;
    }

    private function validateApiKey(): void
    {
        if (str_starts_with($this->apiKey, 'sk_invalid')) {
            throw new \RuntimeException('Invalid Stripe API key configuration');
        }
    }

    private function prepareChargeRequest(PaymentRequest $request): array
    {
        return [
            'amount' => (int) ($request->amount * 100), // Stripe uses cents
            'currency' => strtolower($request->currency),
            'source' => $request->cardToken,
            'receipt_email' => $request->customerEmail,
            'metadata' => [
                'order_id' => $request->orderId,
            ],
        ];
    }

    private function simulateNetworkLatency(): void
    {
        // Simulate ~10-50ms network latency
        usleep(random_int(10000, 50000));
    }

    private function executeCharge(PaymentRequest $request, array $requestData): string
    {
        $transactionId = $this->generateTransactionId();
        $token = $request->cardToken;

        // Simulate various failure scenarios based on token
        if (str_contains($token, 'insufficient_funds') || str_contains($token, 'insufficient')) {
            $this->throwPaymentError('INSUFFICIENT_FUNDS', $transactionId, $request);
        }

        if (str_contains($token, 'card_declined') || str_contains($token, 'declined')) {
            $this->throwPaymentError('CARD_DECLINED', $transactionId, $request);
        }

        if (str_contains($token, 'expired_card') || str_contains($token, 'expired')) {
            $this->throwPaymentError('EXPIRED_CARD', $transactionId, $request);
        }

        if (str_contains($token, 'invalid_cvv') || str_contains($token, 'cvv')) {
            $this->throwPaymentError('INVALID_CVV', $transactionId, $request);
        }

        if (str_contains($token, 'processing_error')) {
            $this->throwPaymentError('PROCESSING_ERROR', $transactionId, $request);
        }

        if (str_contains($token, 'fraud')) {
            $this->throwPaymentError('FRAUD_SUSPECTED', $transactionId, $request);
        }

        // Success case
        return $transactionId;
    }

    private function throwPaymentError(
        string $reason,
        string $transactionId,
        PaymentRequest $request
    ): never {
        throw new PaymentFailedException(
            $reason,
            $transactionId,
            $request->amount,
            $request->currency
        );
    }

    private function generateTransactionId(): string
    {
        return 'txn_' . bin2hex(random_bytes(12));
    }
}
