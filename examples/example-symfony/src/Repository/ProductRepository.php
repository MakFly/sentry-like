<?php

declare(strict_types=1);

namespace App\Repository;

use App\Exception\ECommerce\InsufficientStockException;
use App\Repository\Mock\DatabaseConnection;

/**
 * Repository for product data access.
 * Uses mock data for testing - simulates database operations.
 */
final class ProductRepository
{
    private DatabaseConnection $connection;

    /** @var array<string, array{sku: string, name: string, price: float, stock: int}> */
    private array $mockProducts = [
        'SKU-1234' => ['sku' => 'SKU-1234', 'name' => 'Premium Widget', 'price' => 49.99, 'stock' => 10],
        'SKU-5678' => ['sku' => 'SKU-5678', 'name' => 'Deluxe Gadget', 'price' => 99.99, 'stock' => 5],
        'SKU-9012' => ['sku' => 'SKU-9012', 'name' => 'Basic Item', 'price' => 19.99, 'stock' => 100],
    ];

    /** @var array<string, int> */
    private array $stockOverrides = [];

    public function __construct(DatabaseConnection $connection)
    {
        $this->connection = $connection;
    }

    public function findBySku(string $sku): ?array
    {
        // Simulate database query
        $this->connection->executeQuery(
            "SELECT * FROM products WHERE sku = '{$sku}'",
            'products'
        );

        $product = $this->mockProducts[$sku] ?? null;

        if ($product && isset($this->stockOverrides[$sku])) {
            $product['stock'] = $this->stockOverrides[$sku];
        }

        return $product;
    }

    public function getStockLevel(string $sku): int
    {
        if (isset($this->stockOverrides[$sku])) {
            return $this->stockOverrides[$sku];
        }

        $product = $this->findBySku($sku);
        return $product['stock'] ?? 0;
    }

    /**
     * Check if sufficient stock is available.
     *
     * @throws InsufficientStockException
     */
    public function checkStock(string $sku, int $requiredQuantity): void
    {
        $available = $this->getStockLevel($sku);

        if ($available < $requiredQuantity) {
            throw new InsufficientStockException($sku, $requiredQuantity, $available);
        }
    }

    /**
     * Update stock level (positive or negative delta).
     */
    public function updateStock(string $sku, int $delta): void
    {
        $currentStock = $this->getStockLevel($sku);
        $this->stockOverrides[$sku] = max(0, $currentStock + $delta);

        // Simulate database update
        $this->connection->executeQuery(
            "UPDATE products SET stock = stock + {$delta} WHERE sku = '{$sku}'",
            'products'
        );
    }

    /**
     * Set mock stock level for testing.
     */
    public function setMockStock(string $sku, int $stock): void
    {
        $this->stockOverrides[$sku] = $stock;

        // Ensure product exists in mock data
        if (!isset($this->mockProducts[$sku])) {
            $this->mockProducts[$sku] = [
                'sku' => $sku,
                'name' => "Mock Product {$sku}",
                'price' => 0.00,
                'stock' => $stock,
            ];
        }
    }
}
