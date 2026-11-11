<?php

declare(strict_types=1);

namespace ClickFix\Resources;

use ClickFix\Endpoints;

/**
 * Product events on the company timeline (`events:write`). Screen context comes from the widget (track).
 */
final class Events extends Resource
{
    /**
     * Record an event (POST /company-events). Reference the company by `external_id`, `company_uuid` or `domain`;
     * `contact_email` links it to a known contact. Send your own event id as `idempotency_key` and as the
     * Idempotency-Key so a re-send is reported as `duplicate` instead of creating a second event.
     *
     * @param array<string, mixed> $event a CompanyEventInput
     *
     * @return array<string, mixed> the CompanyEvent (`uuid`, `name`, `duplicate`)
     */
    public function track(array $event, ?string $idempotencyKey = null): array
    {
        $key = $idempotencyKey ?? (is_string($event['idempotency_key'] ?? null) ? $event['idempotency_key'] : null);

        return $this->call(Endpoints::POST_COMPANY_EVENTS, $event, [], [], $key)->object();
    }
}
