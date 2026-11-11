<?php

declare(strict_types=1);

namespace ClickFix;

/**
 * Widget identity verification: user_hash = hex(HMAC-SHA256(identity secret, user id)).
 * Server only. Send the hash to the browser, never the secret.
 * Bit-identical to `identityHash` in @getclickfix/node and `IdentityHash` in the Go module.
 */
final class UserHash
{
    public static function make(#[\SensitiveParameter] string $secret, string $userId): string
    {
        return hash_hmac('sha256', $userId, $secret);
    }
}
