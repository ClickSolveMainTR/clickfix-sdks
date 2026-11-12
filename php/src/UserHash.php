<?php

declare(strict_types=1);

namespace ClickFix;

/**
 * Widget identity verification, computed on your server. Send the hash to the browser or app, never the secret.
 *
 * - user only: user_hash = hex(HMAC-SHA256(identity secret, user_id))
 * - with the company's id in your system (sent to identify as `company.id`):
 *   user_hash = hex(HMAC-SHA256(identity secret, user_id . "\n" . company_id)), so a signed-in user cannot
 *   claim another company and the widget reports `company_verified: true`.
 *
 * Bit-identical to `identityHash` in @getclickfix/node and `IdentityHash` / `IdentityCompanyHash` in the Go module.
 */
final class UserHash
{
    /**
     * @param string|null $companyId the company id sent as identify `company.id`; null or '' signs the user id alone
     *
     * @throws \InvalidArgumentException when a company id is given and either id contains a line break
     */
    public static function make(#[\SensitiveParameter] string $secret, string $userId, ?string $companyId = null): string
    {
        if ($companyId === null || $companyId === '') {
            return hash_hmac('sha256', $userId, $secret);
        }

        return self::forCompany($secret, $userId, $companyId);
    }

    /**
     * user_hash covering the user id and the company id together.
     *
     * @throws \InvalidArgumentException when an id is empty or contains a line break
     */
    public static function forCompany(#[\SensitiveParameter] string $secret, string $userId, string $companyId): string
    {
        if ($userId === '' || $companyId === '' || preg_match('/[\r\n]/', $userId.$companyId) === 1) {
            throw new \InvalidArgumentException('user id and company id must be non-empty without line breaks');
        }

        return hash_hmac('sha256', $userId."\n".$companyId, $secret);
    }
}
