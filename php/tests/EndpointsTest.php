<?php

declare(strict_types=1);

namespace ClickFix\Tests;

use ClickFix\Endpoints;
use PHPUnit\Framework\TestCase;

/**
 * Every operation of backend/docs/public-api.yaml (rendered into Endpoints by `make sdks`)
 * must be used by a resource class or ApiChannel, so a new public route fails here until the SDK covers it.
 */
final class EndpointsTest extends TestCase
{
    public function testEveryEndpointIsUsedByTheHandWrittenLayer(): void
    {
        $sources = '';
        foreach (array_merge(glob(__DIR__.'/../src/Resources/*.php') ?: [], [__DIR__.'/../src/ApiChannel.php']) as $file) {
            $sources .= (string) file_get_contents($file);
        }
        $constants = (new \ReflectionClass(Endpoints::class))->getConstants();
        unset($constants['ALL']);
        $missing = [];
        foreach ($constants as $name => $endpoint) {
            if (!str_contains($sources, 'Endpoints::'.$name)) {
                $missing[] = $name;
            }
        }
        self::assertSame([], $missing, 'public-api.yaml operations without a resource method');
        self::assertCount(count($constants), Endpoints::ALL);
    }
}
