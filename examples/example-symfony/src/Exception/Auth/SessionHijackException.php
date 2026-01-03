<?php

declare(strict_types=1);

namespace App\Exception\Auth;

use App\Exception\DomainException;

/**
 * Thrown when potential session hijacking is detected.
 */
final class SessionHijackException extends DomainException
{
    public function __construct(
        string $sessionId,
        string $originalIp,
        string $currentIp,
        ?\Throwable $previous = null
    ) {
        parent::__construct(
            "Potential session hijacking detected for session {sessionId}: IP changed from {originalIp} to {currentIp}",
            [
                'sessionId' => substr($sessionId, 0, 8) . '...',
                'originalIp' => $originalIp,
                'currentIp' => $currentIp,
            ],
            0,
            $previous
        );
    }
}
