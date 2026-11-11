<?php

declare(strict_types=1);

namespace ClickFix\Tests;

use ClickFix\Page;
use ClickFix\Paginator;
use PHPUnit\Framework\TestCase;

final class PaginatorTest extends TestCase
{
    public function testAdvancesByActualItemsAndStopsOnEmptyPage(): void
    {
        $offsets = [];
        $paginator = new Paginator(function (int $limit, int $offset) use (&$offsets): Page {
            $offsets[] = $offset;
            self::assertSame(100, $limit);

            return new Page($offset === 0 ? [['id' => 1], ['id' => 2]] : [], 10, $limit, $offset);
        });
        self::assertSame([['id' => 1], ['id' => 2]], iterator_to_array($paginator, false));
        self::assertSame([0, 2], $offsets);
    }

    public function testStopsWhenOffsetReachesTotal(): void
    {
        $calls = 0;
        $paginator = new Paginator(function (int $limit, int $offset) use (&$calls): Page {
            ++$calls;

            return new Page([['id' => 1]], 1, $limit, $offset);
        });
        self::assertCount(1, iterator_to_array($paginator, false));
        self::assertSame(1, $calls);
    }

    public function testPageFromArrayTolerant(): void
    {
        $page = Page::fromArray(['items' => [['a' => 1], 'junk', ['b' => 2]]]);
        self::assertSame([['a' => 1], ['b' => 2]], $page->items);
        self::assertSame(2, $page->total);
        self::assertTrue(Page::fromArray([])->isEmpty());
    }
}
