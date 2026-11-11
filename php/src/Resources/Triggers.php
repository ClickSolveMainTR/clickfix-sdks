<?php

declare(strict_types=1);

namespace ClickFix\Resources;

use ClickFix\Endpoints;

/**
 * Trigger events for Zapier/Make/n8n style integrations: cursor polling and REST hook subscriptions.
 */
final class Triggers extends Resource
{
    /**
     * Poll events (GET /triggers): `data.items` plus `data.cursor` to pass on the next call; 410 when the cursor expired.
     *
     * @return array<string, mixed> an IntegrationTriggerPage
     */
    public function poll(string $event, ?string $cursor = null): array
    {
        return $this->call(Endpoints::GET_TRIGGERS, null, ['event' => $event, 'cursor' => $cursor])->object();
    }

    /**
     * Create a REST hook subscription (POST /subscriptions).
     *
     * @param array<string, mixed> $input an IntegrationSubscription: `event`, `target_url`
     *
     * @return array<string, mixed>
     */
    public function subscribe(array $input, ?string $idempotencyKey = null): array
    {
        return $this->call(Endpoints::POST_SUBSCRIPTIONS, $input, [], [], $idempotencyKey)->object();
    }

    public function unsubscribe(string $uuid, ?string $idempotencyKey = null): void
    {
        $this->call(Endpoints::DELETE_SUBSCRIPTIONS_BY_UUID, null, [], ['uuid' => $uuid], $idempotencyKey);
    }
}
