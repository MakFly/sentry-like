<?php

namespace ErrorWatch\Symfony\Http;

use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Contracts\HttpClient\ResponseInterface;

class MonitoringClient implements MonitoringClientInterface
{
    private string $endpoint;
    private string $apiKey;
    private HttpClientInterface $client;

    public function __construct(string $endpoint, string $apiKey, ?HttpClientInterface $client = null)
    {
        $this->endpoint = $endpoint;
        $this->apiKey = $apiKey;
        $this->client = $client ?? \Symfony\Component\HttpClient\HttpClient::create();
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function sendEvent(array $payload): ResponseInterface
    {
        return $this->client->request('POST', $this->endpoint.'/api/v1/event', [
            'headers' => [
                'Content-Type' => 'application/json',
                'X-API-Key' => $this->apiKey,
            ],
            'body' => json_encode($payload),
            'timeout' => 1,
        ]);
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function sendEventAsync(array $payload): void
    {
        try {
            $response = $this->sendEvent($payload);
            // Force the request to be sent (Symfony HttpClient is lazy)
            $response->getStatusCode();
        } catch (\Throwable $e) {
            // Silently fail to avoid breaking the application
        }
    }

    public function sendTransaction(array $payload): void
    {
        try {
            $response = $this->client->request('POST', $this->endpoint.'/api/v1/performance/transaction', [
                'headers' => [
                    'Content-Type' => 'application/json',
                    'X-API-Key' => $this->apiKey,
                ],
                'body' => json_encode($payload),
                'timeout' => 2,
            ]);
            $response->getStatusCode();
        } catch (\Throwable) {
        }
    }

    public function sendMetrics(array $payload): void
    {
        try {
            $response = $this->client->request('POST', $this->endpoint.'/api/v1/performance/metrics', [
                'headers' => [
                    'Content-Type' => 'application/json',
                    'X-API-Key' => $this->apiKey,
                ],
                'body' => json_encode($payload),
                'timeout' => 2,
            ]);
            $response->getStatusCode();
        } catch (\Throwable) {
        }
    }
}
