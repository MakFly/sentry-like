<?php

declare(strict_types=1);

namespace App\Service\ECommerce;

use App\DTO\OrderRequest;
use App\DTO\PaymentRequest;
use App\Exception\ECommerce\CouponExpiredException;
use App\Exception\ECommerce\InsufficientStockException;
use App\Exception\ECommerce\OrderValidationException;
use App\Exception\ECommerce\PaymentFailedException;
use App\Exception\ECommerce\ShippingCalculationException;
use App\Repository\OrderRepository;

/**
 * Main orchestrator service for order processing.
 * Coordinates inventory, shipping, and payment services.
 *
 * This service produces deep stack traces by delegating to multiple layers:
 * Controller → OrderService → PaymentService → StripeGateway → Exception
 */
final class OrderService
{
    public function __construct(
        private readonly OrderRepository $orderRepository,
        private readonly InventoryService $inventoryService,
        private readonly PaymentService $paymentService,
        private readonly ShippingService $shippingService,
    ) {}

    /**
     * Process a complete checkout flow.
     *
     * Stack trace depth: Controller → OrderService → [Sub-service] → [Repository/Gateway] → Exception
     *
     * @throws InsufficientStockException
     * @throws ShippingCalculationException
     * @throws PaymentFailedException
     * @throws OrderValidationException
     */
    public function checkout(OrderRequest $request, string $cardToken): array
    {
        // Step 1: Validate the order request
        $this->validateOrderRequest($request);

        // Step 2: Check inventory availability (may throw InsufficientStockException)
        $this->checkInventory($request);

        // Step 3: Apply coupon if provided (may throw CouponExpiredException)
        $discount = $this->applyCouponIfPresent($request->couponCode);

        // Step 4: Calculate shipping cost (may throw ShippingCalculationException)
        $shippingCost = $this->calculateShipping($request);

        // Step 5: Create the order record
        $orderId = $this->createOrderRecord($request);

        // Step 6: Calculate final total
        $total = $this->calculateTotal($request->items, $shippingCost, $discount);

        // Step 7: Process payment (may throw PaymentFailedException)
        $transactionId = $this->processPayment($orderId, $total, $cardToken, $request);

        // Step 8: Reserve inventory
        $this->reserveInventory($request);

        // Step 9: Finalize order
        $this->finalizeOrder($orderId);

        return [
            'orderId' => $orderId,
            'transactionId' => $transactionId,
            'total' => $total,
            'shipping' => $shippingCost,
            'discount' => $discount,
        ];
    }

    private function validateOrderRequest(OrderRequest $request): void
    {
        $violations = [];

        if (empty($request->items)) {
            $violations[] = 'Order must contain at least one item';
        }

        if (empty($request->shippingAddress)) {
            $violations[] = 'Shipping address is required';
        }

        if (empty($request->userId)) {
            $violations[] = 'User ID is required';
        }

        if (!empty($violations)) {
            throw new OrderValidationException(
                'new_order',
                'Validation failed',
                $violations
            );
        }
    }

    /**
     * Check inventory - delegates to InventoryService.
     * Adds depth: OrderService → InventoryService → ProductRepository
     */
    private function checkInventory(OrderRequest $request): void
    {
        $this->inventoryService->checkAvailability($request->items);
    }

    private function applyCouponIfPresent(?string $couponCode): float
    {
        if ($couponCode === null) {
            return 0.0;
        }

        // Simulate coupon validation
        if (str_contains(strtolower($couponCode), 'expired')) {
            throw new CouponExpiredException(
                $couponCode,
                new \DateTimeImmutable('-1 day')
            );
        }

        // Mock discount
        return match (strtoupper($couponCode)) {
            'SAVE10' => 10.00,
            'SAVE20' => 20.00,
            'FREESHIP' => 0.00, // Free shipping handled elsewhere
            default => 5.00,
        };
    }

    /**
     * Calculate shipping - delegates to ShippingService.
     * Adds depth: OrderService → ShippingService
     */
    private function calculateShipping(OrderRequest $request): float
    {
        return $this->shippingService->calculateShipping(
            $request->items,
            $request->shippingAddress
        );
    }

    private function createOrderRecord(OrderRequest $request): string
    {
        return $this->orderRepository->create([
            'user_id' => $request->userId,
            'items' => $request->items,
            'shipping_address' => $request->shippingAddress,
            'coupon_code' => $request->couponCode,
            'status' => 'pending',
        ]);
    }

    private function calculateTotal(array $items, float $shipping, float $discount): float
    {
        $subtotal = array_reduce($items, function (float $carry, array $item): float {
            return $carry + ($item['price'] * $item['quantity']);
        }, 0.0);

        return max(0, round($subtotal + $shipping - $discount, 2));
    }

    /**
     * Process payment - delegates to PaymentService.
     * Adds depth: OrderService → PaymentService → StripeGateway
     */
    private function processPayment(
        string $orderId,
        float $total,
        string $cardToken,
        OrderRequest $request
    ): string {
        // Pre-populate order for payment service
        $this->orderRepository->setMockOrder($orderId, [
            'status' => 'pending',
            'total' => $total,
        ]);

        $paymentRequest = new PaymentRequest(
            orderId: $orderId,
            amount: $total,
            currency: 'USD',
            cardToken: $cardToken,
            customerEmail: "user_{$request->userId}@example.com"
        );

        return $this->paymentService->processPayment($paymentRequest);
    }

    /**
     * Reserve inventory - delegates to InventoryService.
     */
    private function reserveInventory(OrderRequest $request): void
    {
        $this->inventoryService->reserveStock($request->items);
    }

    private function finalizeOrder(string $orderId): void
    {
        $this->orderRepository->updateStatus($orderId, 'confirmed');
    }
}
