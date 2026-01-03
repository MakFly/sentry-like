<?php

declare(strict_types=1);

namespace App\Service\Api;

use App\Exception\Api\ApiTimeoutException;
use App\Exception\Api\InvalidResponseException;
use App\Exception\Api\RateLimitException;

/**
 * Mock external API client for testing.
 * Simulates various API failure scenarios.
 */
final class ExternalApiClient
{
    private const DEFAULT_TIMEOUT_MS = 30000;
    private const RATE_LIMIT = 100;

    private int $requestCount = 0;

    /**
     * Fetch data from external API.
     *
     * @throws ApiTimeoutException
     * @throws RateLimitException
     * @throws InvalidResponseException
     */
    public function fetchExternalData(string $endpoint): array
    {
        $this->incrementRequestCount();
        $this->checkRateLimit($endpoint);

        return $this->executeRequest($endpoint);
    }

    /**
     * Send data to external API.
     *
     * @throws ApiTimeoutException
     */
    public function sendData(string $endpoint, array $data): bool
    {
        $this->incrementRequestCount();

        return $this->executePostRequest($endpoint, $data);
    }

    public function resetRequestCount(): void
    {
        $this->requestCount = 0;
    }

    private function incrementRequestCount(): void
    {
        $this->requestCount++;
    }

    private function checkRateLimit(string $endpoint): void
    {
        // Simulate rate limiting based on endpoint or count
        if (str_contains($endpoint, 'rate-limited') || $this->requestCount > self::RATE_LIMIT) {
            throw new RateLimitException(
                $this->extractApiName($endpoint),
                self::RATE_LIMIT,
                3600
            );
        }
    }

    private function executeRequest(string $endpoint): array
    {
        // Simulate network latency
        $this->simulateLatency();

        // Check for timeout simulation
        if (str_contains($endpoint, 'slow') || str_contains($endpoint, 'timeout')) {
            $this->simulateTimeout($endpoint);
        }

        // Check for invalid response simulation
        if (str_contains($endpoint, 'invalid') || str_contains($endpoint, 'malformed')) {
            $this->simulateInvalidResponse($endpoint);
        }

        // Success case
        return $this->getMockResponse($endpoint);
    }

    private function executePostRequest(string $endpoint, array $data): bool
    {
        $this->simulateLatency();

        if (str_contains($endpoint, 'timeout')) {
            $this->simulateTimeout($endpoint);
        }

        return true;
    }

    private function simulateLatency(): void
    {
        usleep(random_int(5000, 20000)); // 5-20ms
    }

    private function simulateTimeout(string $endpoint): never
    {
        throw new ApiTimeoutException($endpoint, self::DEFAULT_TIMEOUT_MS);
    }

    private function simulateInvalidResponse(string $endpoint): never
    {
        throw new InvalidResponseException(
            $this->extractApiName($endpoint),
            'JSON',
            'HTML (502 Bad Gateway)'
        );
    }

    private function extractApiName(string $endpoint): string
    {
        // Extract API name from URL
        $parsed = parse_url($endpoint);
        $host = $parsed['host'] ?? 'unknown';

        return match (true) {
            str_contains($host, 'stripe') => 'Stripe API',
            str_contains($host, 'github') => 'GitHub API',
            str_contains($host, 'twilio') => 'Twilio API',
            str_contains($host, 'aws') => 'AWS S3',
            default => $host,
        };
    }

    private function getMockResponse(string $endpoint): array
    {
        return [
            'status' => 'success',
            'endpoint' => $endpoint,
            'timestamp' => time(),
            'data' => ['mock' => true],
        ];
    }
}
