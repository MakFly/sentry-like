<?php

namespace Makfly\ErrorWatch\Http;

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
        return $this->client->request('POST', $this->endpoint . '/api/v1/event', [
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
            $this->sendEvent($payload);
        } catch (\Throwable $e) {
            // Silently fail to avoid breaking the application
        }
    }
}
