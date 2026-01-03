<?php

declare(strict_types=1);

namespace App\Tests\Unit\Repository;

use App\Exception\ECommerce\InsufficientStockException;
use App\Repository\Mock\DatabaseConnection;
use App\Repository\ProductRepository;
use PHPUnit\Framework\TestCase;

final class ProductRepositoryTest extends TestCase
{
    private DatabaseConnection $connection;
    private ProductRepository $repository;

    protected function setUp(): void
    {
        $this->connection = new DatabaseConnection();
        $this->connection->connect();
        $this->repository = new ProductRepository($this->connection);
    }

    public function testFindBySkuReturnsProduct(): void
    {
        $product = $this->repository->findBySku('SKU-1234');

        $this->assertIsArray($product);
        $this->assertArrayHasKey('sku', $product);
        $this->assertArrayHasKey('stock', $product);
    }

    public function testFindBySkuReturnsNullForUnknown(): void
    {
        $product = $this->repository->findBySku('SKU-UNKNOWN');

        $this->assertNull($product);
    }

    public function testGetStockLevelReturnsInteger(): void
    {
        $stock = $this->repository->getStockLevel('SKU-1234');

        $this->assertIsInt($stock);
        $this->assertGreaterThanOrEqual(0, $stock);
    }

    public function testCheckStockThrowsInsufficientStockException(): void
    {
        // Simulate out of stock product
        $this->repository->setMockStock('SKU-OUT', 0);

        $this->expectException(InsufficientStockException::class);
        $this->expectExceptionMessage('Insufficient stock');

        $this->repository->checkStock('SKU-OUT', 10);
    }

    public function testCheckStockPassesWhenSufficient(): void
    {
        $this->repository->setMockStock('SKU-AVAILABLE', 100);

        // Should not throw
        $this->repository->checkStock('SKU-AVAILABLE', 10);

        $this->assertTrue(true); // Explicit assertion
    }

    public function testUpdateStockDecrementsCorrectly(): void
    {
        $this->repository->setMockStock('SKU-DEC', 50);

        $this->repository->updateStock('SKU-DEC', -10);

        $this->assertEquals(40, $this->repository->getStockLevel('SKU-DEC'));
    }
}
