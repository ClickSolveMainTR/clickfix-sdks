<?php

declare(strict_types=1);

namespace ClickFix\Resources;

use ClickFix\Endpoints;
use ClickFix\Page;
use ClickFix\Paginator;

/**
 * Contacts and external ids (`contacts:read`, `contacts:write`).
 */
final class Contacts extends Resource
{
    /**
     * One page. Query: `limit`, `offset`, `q` (free text), `external_id`.
     *
     * @param array<string, scalar|null> $query
     */
    public function list(array $query = []): Page
    {
        return $this->call(Endpoints::GET_CONTACTS, null, $query)->page();
    }

    /**
     * Every contact matching the query, page by page.
     *
     * @param array<string, scalar|null> $query
     */
    public function all(array $query = []): Paginator
    {
        return $this->client->paginate(fn (int $limit, int $offset): Page => $this->list(['limit' => $limit, 'offset' => $offset] + $query));
    }

    /**
     * The contact with this external id, or null.
     *
     * @return array<string, mixed>|null
     */
    public function findByExternalId(string $externalId): ?array
    {
        $page = $this->list(['external_id' => $externalId, 'limit' => 1]);

        return $page->items[0] ?? null;
    }

    /**
     * Create a contact (POST /contacts). 409 when the email or external id is taken.
     *
     * @param array<string, mixed> $contact a ContactInput
     *
     * @return array<string, mixed> the created Contact
     */
    public function create(array $contact, ?string $idempotencyKey = null): array
    {
        return $this->call(Endpoints::POST_CONTACTS, $contact, [], [], $idempotencyKey)->object();
    }

    /**
     * Create or update the contact with this external id (PUT /contacts/by-external-id): 201 on create, 200 on update.
     *
     * @param array<string, mixed> $contact ContactInput fields (name, email, phone, custom_fields, ...)
     *
     * @return array<string, mixed> the Contact
     */
    public function upsertByExternalId(string $externalId, array $contact = [], ?string $idempotencyKey = null): array
    {
        return $this->call(Endpoints::PUT_CONTACTS_BY_EXTERNAL_ID, ['external_id' => $externalId] + $contact, [], [], $idempotencyKey)->object();
    }

    /**
     * Partial update by uuid (PATCH /contacts/{uuid}).
     *
     * @param array<string, mixed> $changes an IntegrationContactUpdate
     *
     * @return array<string, mixed>
     */
    public function update(string $uuid, array $changes, ?string $idempotencyKey = null): array
    {
        return $this->call(Endpoints::PATCH_CONTACTS_BY_UUID, $changes, [], ['uuid' => $uuid], $idempotencyKey)->object();
    }
}
