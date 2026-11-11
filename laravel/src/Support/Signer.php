<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Support;

use ClickFix\UserHash;
use ClickFix\Webhooks;

/**
 * Thin wrapper over clickfix/sdk's cryptographic helpers so the package has one place for
 * user_hash = hex(HMAC-SHA256(identity secret, user_id)) and the ClickFix-Webhook-Signature check
 * (same bytes as sdks/node and sdks/go).
 */
final class Signer
{
    public static function userHash(string $secret, string $userId): string
    {
        if ($secret === '') {
            throw new \InvalidArgumentException('ClickFix identity secret is empty.');
        }

        return UserHash::make($secret, $userId);
    }

    public static function signWebhook(string $secret, int $timestamp, string $body): string
    {
        return Webhooks::sign($secret, (string) $timestamp, $body);
    }

    /** Verify the raw request body before parsing it. False on any malformed input, never an exception. */
    public static function verifyWebhook(
        string $secret,
        ?string $timestamp,
        ?string $signature,
        string $body,
        ?int $now = null,
        int $tolerance = Webhooks::DEFAULT_TOLERANCE,
    ): bool {
        if ($timestamp === null || $signature === null) {
            return false;
        }

        return Webhooks::verify($secret, $timestamp, $signature, $body, $now, $tolerance);
    }

    /** 32 random bytes as 64 hex characters: the shape ClickFix issues for webhook secrets. */
    public static function generateSecret(): string
    {
        return bin2hex(random_bytes(32));
    }
}
