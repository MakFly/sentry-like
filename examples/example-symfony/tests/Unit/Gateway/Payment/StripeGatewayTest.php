<?php

declare(strict_types=1);

namespace App\Tests\Unit\Gateway\Payment;

use App\DTO\PaymentRequest;
use App\Exception\ECommerce\PaymentFailedException;
use App\Gateway\Payment\StripeGateway;
use PHPUnit\Framework\TestCase;

final class StripeGatewayTest extends TestCase
{
    private StripeGateway $gateway;

    protected function setUp(): void
    {
        $this->gateway = new StripeGateway('sk_test_valid');
    }

    public function testChargeSuccessReturnsTransactionId(): void
    {
        $request = new PaymentRequest(
            orderId: 'ord_123',
            amount: 99.99,
            currency: 'USD',
            cardToken: 'tok_valid_card',
            customerEmail: 'customer@example.com'
        );

        $transactionId = $this->gateway->charge($request);

        $this->assertStringStartsWith('txn_', $transactionId);
    }

    public function testChargeInsufficientFundsThrowsException(): void
    {
        $request = new PaymentRequest(
            orderId: 'ord_123',
            amount: 9999.99,
            currency: 'USD',
            cardToken: 'tok_insufficient_funds',
            customerEmail: 'customer@example.com'
        );

        $this->expectException(PaymentFailedException::class);
        $this->expectExceptionMessage('INSUFFICIENT_FUNDS');

        $this->gateway->charge($request);
    }

    public function testChargeCardDeclinedThrowsException(): void
    {
        $request = new PaymentRequest(
            orderId: 'ord_123',
            amount: 50.00,
            currency: 'USD',
            cardToken: 'tok_card_declined',
            customerEmail: 'customer@example.com'
        );

        $this->expectException(PaymentFailedException::class);
        $this->expectExceptionMessage('CARD_DECLINED');

        $this->gateway->charge($request);
    }

    public function testChargeExpiredCardThrowsException(): void
    {
        $request = new PaymentRequest(
            orderId: 'ord_123',
            amount: 25.00,
            currency: 'USD',
            cardToken: 'tok_expired_card',
            customerEmail: 'customer@example.com'
        );

        $this->expectException(PaymentFailedException::class);
        $this->expectExceptionMessage('EXPIRED_CARD');

        $this->gateway->charge($request);
    }

    public function testChargeInvalidCvvThrowsException(): void
    {
        $request = new PaymentRequest(
            orderId: 'ord_123',
            amount: 25.00,
            currency: 'USD',
            cardToken: 'tok_invalid_cvv',
            customerEmail: 'customer@example.com'
        );

        $this->expectException(PaymentFailedException::class);
        $this->expectExceptionMessage('INVALID_CVV');

        $this->gateway->charge($request);
    }

    public function testRefundReturnsTrue(): void
    {
        $result = $this->gateway->refund('txn_abc123', 50.00);

        $this->assertTrue($result);
    }
}
