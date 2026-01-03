<?php

declare(strict_types=1);

namespace App\Service\Auth;

use App\Exception\Auth\AccountLockedException;
use App\Exception\Auth\InvalidTokenException;
use App\Exception\Auth\SessionHijackException;
use App\Exception\Auth\TokenExpiredException;
use App\Repository\UserRepository;

/**
 * Main authentication service.
 * Orchestrates JWT validation and user verification.
 */
final class AuthenticationService
{
    private const MAX_FAILED_ATTEMPTS = 5;
    private const LOCKOUT_DURATION_MINUTES = 30;

    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly JwtService $jwtService,
    ) {}

    /**
     * Validate token and return authenticated user.
     *
     * @throws InvalidTokenException
     * @throws TokenExpiredException
     */
    public function validateAndRefresh(string $token): array
    {
        // Step 1: Validate JWT
        $payload = $this->validateJwt($token);

        // Step 2: Load user from database
        $user = $this->loadUserFromPayload($payload);

        // Step 3: Check account status
        $this->checkAccountStatus($user);

        return [
            'user' => $user,
            'payload' => $payload,
        ];
    }

    /**
     * Authenticate user with credentials.
     *
     * @throws AccountLockedException
     */
    public function authenticate(string $email, string $password, string $clientIp): array
    {
        // Check if account is locked
        $this->checkAccountLock($email);

        // Simulate authentication
        if (!$this->verifyCredentials($email, $password)) {
            $this->recordFailedAttempt($email);
            throw new \InvalidArgumentException('Invalid credentials');
        }

        return $this->createSession($email, $clientIp);
    }

    /**
     * Validate session integrity.
     *
     * @throws SessionHijackException
     */
    public function validateSession(string $sessionId, string $originalIp, string $currentIp): void
    {
        if ($originalIp !== $currentIp) {
            $this->flagSuspiciousActivity($sessionId);

            throw new SessionHijackException($sessionId, $originalIp, $currentIp);
        }
    }

    /**
     * Validate JWT - delegates to JwtService.
     * Adds depth: AuthenticationService → JwtService
     */
    private function validateJwt(string $token): array
    {
        return $this->jwtService->validateToken($token);
    }

    private function loadUserFromPayload(array $payload): array
    {
        $email = $payload['email'] ?? null;

        if ($email === null) {
            throw new InvalidTokenException('Token missing email claim');
        }

        $user = $this->userRepository->findByEmail($email);

        if ($user === null) {
            throw new InvalidTokenException('User not found for token');
        }

        return $user;
    }

    private function checkAccountStatus(array $user): void
    {
        if ($user['locked'] ?? false) {
            throw new AccountLockedException(
                $user['email'],
                self::MAX_FAILED_ATTEMPTS,
                new \DateTimeImmutable('+' . self::LOCKOUT_DURATION_MINUTES . ' minutes')
            );
        }
    }

    private function checkAccountLock(string $email): void
    {
        $failedAttempts = $this->userRepository->getFailedAttempts($email);

        if ($failedAttempts >= self::MAX_FAILED_ATTEMPTS) {
            throw new AccountLockedException(
                $email,
                $failedAttempts,
                new \DateTimeImmutable('+' . self::LOCKOUT_DURATION_MINUTES . ' minutes')
            );
        }

        if ($this->userRepository->isAccountLocked($email)) {
            throw new AccountLockedException(
                $email,
                self::MAX_FAILED_ATTEMPTS,
                new \DateTimeImmutable('+' . self::LOCKOUT_DURATION_MINUTES . ' minutes')
            );
        }
    }

    private function verifyCredentials(string $email, string $password): bool
    {
        // Simulate verification - fail for test passwords
        return !str_contains($password, 'wrong') && !str_contains($password, 'invalid');
    }

    private function recordFailedAttempt(string $email): void
    {
        $attempts = $this->userRepository->incrementFailedAttempts($email);

        if ($attempts >= self::MAX_FAILED_ATTEMPTS) {
            $this->userRepository->lockAccount($email);
        }
    }

    private function createSession(string $email, string $clientIp): array
    {
        return [
            'session_id' => bin2hex(random_bytes(16)),
            'email' => $email,
            'ip' => $clientIp,
            'created_at' => time(),
        ];
    }

    private function flagSuspiciousActivity(string $sessionId): void
    {
        // Log suspicious activity (mock)
        error_log("Suspicious activity detected for session: {$sessionId}");
    }
}
