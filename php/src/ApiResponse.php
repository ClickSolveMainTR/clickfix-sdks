<?php

declare(strict_types=1);

namespace ClickFix;

/**
 * A decoded 2xx envelope: `{ success, data, meta }`.
 */
final class ApiResponse
{
    /**
     * @param array<array-key, mixed>|null $data the `data` member (object, list or null)
     * @param array<string, mixed>                  $meta the `meta` member (`request_id`, ...)
     * @param array<string, mixed>                  $body the whole decoded body
     */
    public function __construct(
        public readonly int $status,
        public readonly ?array $data,
        public readonly array $meta,
        public readonly array $body,
        public readonly ?string $requestId,
    ) {
    }

    /**
     * `data` as an associative array; an empty array when it is null or a list.
     *
     * @return array<string, mixed>
     */
    public function object(): array
    {
        if ($this->data === null || array_is_list($this->data)) {
            return [];
        }

        /** @var array<string, mixed> $data */
        $data = $this->data;

        return $data;
    }

    /**
     * `data` decoded as a standard offset page `{ items, total, limit, offset }`.
     */
    public function page(): Page
    {
        return Page::fromArray($this->object());
    }
}
