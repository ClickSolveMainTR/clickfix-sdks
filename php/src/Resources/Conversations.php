<?php

declare(strict_types=1);

namespace ClickFix\Resources;

use ClickFix\Endpoints;
use ClickFix\Page;
use ClickFix\Paginator;

/**
 * Conversations and their messages (`conversations:read`, `conversations:write`).
 */
final class Conversations extends Resource
{
    /**
     * @param array<string, scalar|null> $query `limit`, `offset`
     */
    public function list(array $query = []): Page
    {
        return $this->call(Endpoints::GET_CONVERSATIONS, null, $query)->page();
    }

    /**
     * @param array<string, scalar|null> $query
     */
    public function all(array $query = []): Paginator
    {
        return $this->client->paginate(fn (int $limit, int $offset): Page => $this->list(['limit' => $limit, 'offset' => $offset] + $query));
    }

    /**
     * @return array<string, mixed>
     */
    public function get(string $uuid): array
    {
        return $this->call(Endpoints::GET_CONVERSATIONS_BY_UUID, null, [], ['uuid' => $uuid])->object();
    }

    /**
     * Open a conversation (POST /conversations): `inbox_uuid` plus `contact_uuid` or `contact_external_id`, optional `subject`, `content`.
     *
     * @param array<string, mixed> $input an IntegrationCreateConversation
     *
     * @return array<string, mixed>
     */
    public function create(array $input, ?string $idempotencyKey = null): array
    {
        return $this->call(Endpoints::POST_CONVERSATIONS, $input, [], [], $idempotencyKey)->object();
    }

    /**
     * @param array<string, mixed> $changes a ConversationUpdate (status, priority, assignee, ...)
     *
     * @return array<string, mixed>
     */
    public function update(string $uuid, array $changes, ?string $idempotencyKey = null): array
    {
        return $this->call(Endpoints::PATCH_CONVERSATIONS_BY_UUID, $changes, [], ['uuid' => $uuid], $idempotencyKey)->object();
    }

    /**
     * Messages of a conversation (GET /conversations/{uuid}/messages).
     *
     * @return list<array<string, mixed>>
     */
    public function messages(string $uuid): array
    {
        $data = $this->call(Endpoints::GET_CONVERSATIONS_BY_UUID_MESSAGES, null, [], ['uuid' => $uuid])->data;
        $items = is_array($data) && array_is_list($data) ? $data : (is_array($data['items'] ?? null) ? $data['items'] : []);
        $out = [];
        foreach ($items as $item) {
            if (is_array($item)) {
                /** @var array<string, mixed> $item */
                $out[] = $item;
            }
        }

        return $out;
    }

    /**
     * Add a reply or, with `$private`, an internal note (POST /conversations/{uuid}/messages).
     *
     * @return array<string, mixed>
     */
    public function addMessage(string $uuid, string $content, bool $private = false, ?string $idempotencyKey = null): array
    {
        return $this->call(Endpoints::POST_CONVERSATIONS_BY_UUID_MESSAGES, ['content' => $content, 'private' => $private], [], ['uuid' => $uuid], $idempotencyKey)->object();
    }
}
