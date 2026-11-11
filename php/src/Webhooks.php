<?php

declare(strict_types=1);

namespace ClickFix;

/**
 * Outbound webhook delivery verification (ClickFix-Webhook-* headers).
 * Same rules as `verifyWebhook` in @getclickfix/node: HMAC-SHA256 over "timestamp.body",
 * signature `v1=<hex>`, timestamp within the tolerance window on both sides.
 */
final class Webhooks
{
    public const DEFAULT_TOLERANCE = 300;

    /**
     * Verify the exact raw request body before JSON decoding.
     * Persist and deduplicate the ClickFix-Webhook-Id header separately before acting on the event.
     *
     * @param string   $secret           the subscription secret (returned once when the webhook was created)
     * @param string   $timestamp        the ClickFix-Webhook-Timestamp header (unix seconds)
     * @param string   $signature        the ClickFix-Webhook-Signature header (`v1=<hex>`)
     * @param string   $body             the raw request body bytes
     * @param int|null $now              unix seconds, defaults to time()
     * @param int      $toleranceSeconds accepted clock skew on either side
     */
    public static function verify(
        #[\SensitiveParameter] string $secret,
        string $timestamp,
        string $signature,
        string $body,
        ?int $now = null,
        int $toleranceSeconds = self::DEFAULT_TOLERANCE,
    ): bool {
        if ($secret === '' || $toleranceSeconds <= 0) {
            return false;
        }
        if (preg_match('/^\d+$/', $timestamp) !== 1 || preg_match('/^v1=[a-fA-F0-9]{64}$/', $signature) !== 1) {
            return false;
        }
        if (strlen($timestamp) > 15) {
            return false;
        }
        $stamp = (int) $timestamp;
        if (abs(($now ?? time()) - $stamp) > $toleranceSeconds) {
            return false;
        }
        $expected = hash_hmac('sha256', $timestamp.'.'.$body, $secret);

        return hash_equals($expected, strtolower(substr($signature, 3)));
    }

    /**
     * Sign a payload the way ClickFix signs deliveries (useful for tests and local stubs).
     */
    public static function sign(#[\SensitiveParameter] string $secret, string $timestamp, string $body): string
    {
        return 'v1='.hash_hmac('sha256', $timestamp.'.'.$body, $secret);
    }
}
