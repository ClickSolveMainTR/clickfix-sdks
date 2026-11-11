<?php

declare(strict_types=1);

namespace ClickFix;

/**
 * Walks every item of an offset-paged list. Same rules as `paginate` in @getclickfix/node and
 * `Iterate` in the Go module: pages of 100, advance by the items actually returned,
 * stop on an empty page or when offset reaches total.
 *
 * @implements \IteratorAggregate<int, array<string, mixed>>
 */
final class Paginator implements \IteratorAggregate
{
    public const PAGE_SIZE = 100;

    /**
     * @var callable(int, int): Page
     */
    private $fetch;

    /**
     * @param callable(int $limit, int $offset): Page $fetch
     */
    public function __construct(callable $fetch, private readonly int $pageSize = self::PAGE_SIZE)
    {
        $this->fetch = $fetch;
    }

    /**
     * @return \Generator<int, array<string, mixed>>
     */
    public function getIterator(): \Generator
    {
        $offset = 0;
        while (true) {
            $page = ($this->fetch)($this->pageSize, $offset);
            if ($page->isEmpty()) {
                return;
            }
            foreach ($page->items as $item) {
                yield $item;
            }
            $offset += count($page->items);
            if ($offset >= $page->total) {
                return;
            }
        }
    }
}
