<?php

declare(strict_types=1);

namespace App\Service\ECommerce;

use App\DTO\PaymentRequest;
use App\Exception\ECommerce\PaymentFailedException;
use App\Gateway\Payment\PaymentGatewayInterface;
use App\Repository\OrderRepository;

/**
 * Service for payment processing operations.
 * Orchestrates payment gateway calls and order updates.
 */
final class PaymentService
{
    public function __construct(
        private readonly PaymentGatewayInterface $paymentGateway,
        private readonly OrderRepository $orderRepository,
    ) {}

    /**
     * Process payment for an order.
     *
     * @throws PaymentFailedException
     * @throws \InvalidArgumentException
     */
    public function processPayment(PaymentRequest $request): string
    {
        // Step 1: Validate order exists and is payable
        $this->validateOrderForPayment($request->orderId);

        // Step 2: Attempt to charge customer (may throw PaymentFailedException)
        $transactionId = $this->chargeCustomer($request);

        // Step 3: Update order with payment info
        $this->recordPaymentSuccess($request->orderId, $transactionId);

        return $transactionId;
    }

    /**
     * Process refund for a transaction.
     */
    public function processRefund(string $orderId, string $transactionId, float $amount): bool
    {
        $this->validateOrderForRefund($orderId);

        $result = $this->paymentGateway->refund($transactionId, $amount);

        if ($result) {
            $this->orderRepository->updatePaymentStatus($orderId, 'refunded', $transactionId);
        }

        return $result;
    }

    private function validateOrderForPayment(string $orderId): void
    {
        $order = $this->orderRepository->findById($orderId);

        if ($order === null) {
            throw new \InvalidArgumentException("Order {$orderId} not found");
        }

        if (isset($order['payment_status']) && $order['payment_status'] === 'paid') {
            throw new \LogicException("Order {$orderId} has already been paid");
        }

        if (isset($order['status']) && $order['status'] === 'cancelled') {
            throw new \LogicException("Cannot pay for cancelled order {$orderId}");
        }
    }

    private function validateOrderForRefund(string $orderId): void
    {
        $order = $this->orderRepository->findById($orderId);

        if ($order === null) {
            throw new \InvalidArgumentException("Order {$orderId} not found for refund");
        }
    }

    /**
     * Charge customer through payment gateway.
     * This method adds depth to the stack trace.
     *
     * @throws PaymentFailedException
     */
    private function chargeCustomer(PaymentRequest $request): string
    {
        // Call gateway - this adds another frame to stack trace
        return $this->paymentGateway->charge($request);
    }

    private function recordPaymentSuccess(string $orderId, string $transactionId): void
    {
        $this->orderRepository->updatePaymentStatus($orderId, 'paid', $transactionId);
    }
}
