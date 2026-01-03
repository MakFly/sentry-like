<?php

declare(strict_types=1);

namespace App\Service\ECommerce;

use App\Exception\ECommerce\InsufficientStockException;
use App\Repository\ProductRepository;

/**
 * Service for inventory management operations.
 * Handles stock checking and reservation.
 */
final class InventoryService
{
    public function __construct(
        private readonly ProductRepository $productRepository,
    ) {}

    /**
     * Check if all items have sufficient stock.
     *
     * @param array<array{sku: string, quantity: int}> $items
     * @throws InsufficientStockException
     */
    public function checkAvailability(array $items): void
    {
        foreach ($items as $item) {
            $this->validateItemStock($item['sku'], $item['quantity']);
        }
    }

    /**
     * Reserve stock for order items.
     *
     * @param array<array{sku: string, quantity: int}> $items
     */
    public function reserveStock(array $items): void
    {
        foreach ($items as $item) {
            $this->decrementStock($item['sku'], $item['quantity']);
        }
    }

    /**
     * Release reserved stock (for order cancellation).
     *
     * @param array<array{sku: string, quantity: int}> $items
     */
    public function releaseStock(array $items): void
    {
        foreach ($items as $item) {
            $this->incrementStock($item['sku'], $item['quantity']);
        }
    }

    private function validateItemStock(string $sku, int $quantity): void
    {
        // This call adds depth to stack trace
        $this->productRepository->checkStock($sku, $quantity);
    }

    private function decrementStock(string $sku, int $quantity): void
    {
        $this->productRepository->updateStock($sku, -$quantity);
    }

    private function incrementStock(string $sku, int $quantity): void
    {
        $this->productRepository->updateStock($sku, $quantity);
    }
}
