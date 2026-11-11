<?php

declare(strict_types=1);

namespace ClickFix\Resources;

use ClickFix\Endpoints;
use ClickFix\Page;
use ClickFix\Paginator;

/**
 * Outbound webhook subscriptions (`webhooks:write`). Deliveries are verified with \ClickFix\Webhooks::verify().
 */
final class WebhookSubscriptions extends Resource
{
    /**
     * @param array<string, scalar|null> $query `limit`, `offset`
     */
    public function list(array $query = []): Page
    {
        return $this->call(Endpoints::GET_WEBHOOKS, null, $query)->page();
    }

    /**
     * @param array<string, scalar|null> $query
     */
    public function all(array $query = []): Paginator
    {
        return $this->client->paginate(fn (int $limit, int $offset): Page => $this->list(['limit' => $limit, 'offset' => $offset] + $query));
    }

    /**
     * Create a subscription (POST /webhooks). `secret` is returned only in this response: store it securely, never log it.
     *
     * @param array<string, mixed> $input an OutboundWebhookInput: `name`, https `url`, `events`, `enabled`
     *
     * @return array<string, mixed>
     */
    public function create(array $input, ?string $idempotencyKey = null): array
    {
        return $this->call(Endpoints::POST_WEBHOOKS, $input, [], [], $idempotencyKey)->object();
    }

    /**
     * @param array<string, mixed> $input an OutboundWebhookInput
     *
     * @return array<string, mixed>
     */
    public function update(string $uuid, array $input, ?string $idempotencyKey = null): array
    {
        return $this->call(Endpoints::PUT_WEBHOOKS_BY_UUID, $input, [], ['uuid' => $uuid], $idempotencyKey)->object();
    }

    public function delete(string $uuid, ?string $idempotencyKey = null): void
    {
        $this->call(Endpoints::DELETE_WEBHOOKS_BY_UUID, null, [], ['uuid' => $uuid], $idempotencyKey);
    }
}
