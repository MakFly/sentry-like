<?php

declare(strict_types=1);

namespace App\Service\Auth;

use App\Exception\Auth\InvalidTokenException;
use App\Exception\Auth\TokenExpiredException;

/**
 * JWT token validation service.
 * Simulates token verification scenarios.
 */
final class JwtService
{
    private const TOKEN_LIFETIME_SECONDS = 3600;

    /**
     * Validate a JWT token.
     *
     * @throws InvalidTokenException
     * @throws TokenExpiredException
     */
    public function validateToken(string $token): array
    {
        $this->checkTokenFormat($token);
        $payload = $this->decodeToken($token);
        $this->verifySignature($token, $payload);
        $this->checkExpiration($payload);

        return $payload;
    }

    /**
     * Decode token payload.
     *
     * @throws InvalidTokenException
     */
    public function decodeToken(string $token): array
    {
        // Simulate decoding
        if (str_contains($token, 'malformed')) {
            throw new InvalidTokenException('Token payload is malformed');
        }

        // Mock payload
        return [
            'sub' => 'user_123',
            'email' => 'user@example.com',
            'iat' => time() - 1800,
            'exp' => $this->extractExpiration($token),
        ];
    }

    private function checkTokenFormat(string $token): void
    {
        // JWT should have 3 parts separated by dots
        $parts = explode('.', $token);

        if (count($parts) !== 3 && !str_contains($token, 'mock')) {
            throw new InvalidTokenException('Invalid token format - expected 3 parts');
        }
    }

    private function verifySignature(string $token, array $payload): void
    {
        if (str_contains($token, 'invalid') || str_contains($token, 'tampered')) {
            throw new InvalidTokenException('Token signature verification failed - possible tampering');
        }
    }

    private function checkExpiration(array $payload): void
    {
        $expiration = $payload['exp'] ?? 0;

        if ($expiration < time()) {
            throw new TokenExpiredException(
                new \DateTimeImmutable('@' . $expiration)
            );
        }
    }

    private function extractExpiration(string $token): int
    {
        // Simulate expired token
        if (str_contains($token, 'expired')) {
            return time() - 3600; // Expired 1 hour ago
        }

        return time() + self::TOKEN_LIFETIME_SECONDS;
    }
}
