<?php

declare(strict_types=1);

namespace App\Service\ECommerce;

use App\Exception\ECommerce\ShippingCalculationException;

/**
 * Service for shipping calculations.
 */
final class ShippingService
{
    private const UNSUPPORTED_DESTINATIONS = [
        'Antarctica',
        'North Korea',
        'Mars',
    ];

    private const RATES_BY_ZONE = [
        'domestic' => 5.99,
        'international' => 19.99,
        'express' => 29.99,
    ];

    /**
     * Calculate shipping cost for items to destination.
     *
     * @param array<array{sku: string, quantity: int, price: float}> $items
     * @throws ShippingCalculationException
     */
    public function calculateShipping(array $items, string $destination): float
    {
        $this->validateDestination($destination);

        $zone = $this->determineShippingZone($destination);
        $baseRate = $this->getBaseRate($zone);
        $itemCount = $this->calculateItemCount($items);

        return $this->computeFinalRate($baseRate, $itemCount);
    }

    private function validateDestination(string $destination): void
    {
        foreach (self::UNSUPPORTED_DESTINATIONS as $unsupported) {
            if (str_contains(strtolower($destination), strtolower($unsupported))) {
                throw new ShippingCalculationException(
                    $destination,
                    "Shipping to {$unsupported} is not supported"
                );
            }
        }

        // Validate address format
        if (strlen($destination) < 10) {
            throw new ShippingCalculationException(
                $destination,
                'Invalid address format - too short'
            );
        }
    }

    private function determineShippingZone(string $destination): string
    {
        $destination = strtolower($destination);

        if (str_contains($destination, 'express') || str_contains($destination, 'urgent')) {
            return 'express';
        }

        if (str_contains($destination, 'usa') || str_contains($destination, 'united states')) {
            return 'domestic';
        }

        return 'international';
    }

    private function getBaseRate(string $zone): float
    {
        return self::RATES_BY_ZONE[$zone] ?? self::RATES_BY_ZONE['international'];
    }

    private function calculateItemCount(array $items): int
    {
        return array_sum(array_column($items, 'quantity'));
    }

    private function computeFinalRate(float $baseRate, int $itemCount): float
    {
        // Add $1 per additional item after the first
        $additionalItemFee = max(0, $itemCount - 1) * 1.00;

        return round($baseRate + $additionalItemFee, 2);
    }
}
