<?php

declare(strict_types=1);

namespace App\Exception;

/**
 * Base exception for all domain-specific exceptions.
 * Provides rich context for error monitoring.
 */
abstract class DomainException extends \RuntimeException
{
    protected array $context = [];

    public function __construct(
        string $message,
        array $context = [],
        int $code = 0,
        ?\Throwable $previous = null
    ) {
        $this->context = $context;
        parent::__construct($this->formatMessage($message, $context), $code, $previous);
    }

    public function getContext(): array
    {
        return $this->context;
    }

    protected function formatMessage(string $message, array $context): string
    {
        foreach ($context as $key => $value) {
            $message = str_replace("{{$key}}", (string) $value, $message);
        }
        return $message;
    }
}
