<?php

declare(strict_types=1);

namespace ClickFix;

/**
 * One offset page of a list endpoint: `{ items, total, limit, offset }`.
 */
final class Page
{
    /**
     * @param list<array<string, mixed>> $items
     */
    public function __construct(
        public readonly array $items,
        public readonly int $total,
        public readonly int $limit,
        public readonly int $offset,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        $items = [];
        foreach (is_array($data['items'] ?? null) ? $data['items'] : [] as $item) {
            if (is_array($item)) {
                /** @var array<string, mixed> $item */
                $items[] = $item;
            }
        }

        return new self(
            $items,
            is_int($data['total'] ?? null) ? $data['total'] : count($items),
            is_int($data['limit'] ?? null) ? $data['limit'] : count($items),
            is_int($data['offset'] ?? null) ? $data['offset'] : 0,
        );
    }

    public function isEmpty(): bool
    {
        return $this->items === [];
    }
}
