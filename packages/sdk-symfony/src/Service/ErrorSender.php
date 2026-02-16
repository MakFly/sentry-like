<?php

namespace Makfly\ErrorWatch\Service;

use Throwable;
use Makfly\ErrorWatch\Http\MonitoringClientInterface;

class ErrorSender implements ErrorSenderInterface
{
    private bool $enabled;
    private string $environment;
    private ?string $release;
    private MonitoringClientInterface $client;
    private LevelMapper $levelMapper;

    public function __construct(
        bool $enabled,
        string $environment,
        ?string $release,
        MonitoringClientInterface $client,
        LevelMapper $levelMapper
    ) {
        $this->enabled = $enabled;
        $this->environment = $environment;
        $this->release = $release;
        $this->client = $client;
        $this->levelMapper = $levelMapper;
    }

    public function send(
        Throwable $throwable,
        ?string $url = null,
        ?string $level = null,
        ?string $sessionId = null
    ): void {
        if (!$this->enabled) {
            return;
        }

        $payload = $this->buildPayload($throwable, $url, $level, $sessionId);
        $this->client->sendEventAsync($payload);
    }

    /**
     * @return array<string, mixed>
     */
    private function buildPayload(
        Throwable $throwable,
        ?string $url,
        ?string $level,
        ?string $sessionId
    ): array {
        $trace = $throwable->getTraceAsString();
        $file = $throwable->getFile();
        $line = $throwable->getLine();

        // Auto-detect level from exception if not provided
        $resolvedLevel = $level;
        if ($resolvedLevel === null || !LevelMapper::isValidLevel($resolvedLevel)) {
            $resolvedLevel = $this->levelMapper->mapException($throwable);
        }

        $payload = [
            'message' => $throwable->getMessage(),
            'file' => $file,
            'line' => $line,
            'stack' => $trace,
            'env' => $this->environment,
            'url' => $url,
            'level' => $resolvedLevel,
            'release' => $this->release,
            'created_at' => time(),
        ];

        // Only include status_code if it's an HTTP exception
        if ($throwable instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface) {
            $payload['status_code'] = $throwable->getStatusCode();
        }

        // Include session_id for replay linking (only for critical errors)
        $criticalLevels = [LevelMapper::LEVEL_FATAL, LevelMapper::LEVEL_ERROR];
        if ($sessionId !== null && in_array($resolvedLevel, $criticalLevels, true)) {
            $payload['session_id'] = $sessionId;
        }

        return $payload;
    }
}
