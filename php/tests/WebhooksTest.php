<?php

declare(strict_types=1);

namespace ClickFix\Tests;

use ClickFix\UserHash;
use ClickFix\Webhooks;
use PHPUnit\Framework\TestCase;

final class WebhooksTest extends TestCase
{
    public function testVerifyChecksRawBytesWindowAndSignature(): void
    {
        $body = '{"hello":1}';
        $stamp = '1700000000';
        $signature = 'v1='.hash_hmac('sha256', $stamp.'.'.$body, 'test');
        self::assertSame(Webhooks::sign('test', $stamp, $body), $signature);
        self::assertTrue(Webhooks::verify('test', $stamp, $signature, $body, 1700000000));
        self::assertTrue(Webhooks::verify('test', $stamp, 'v1='.strtoupper(substr($signature, 3)), $body, 1700000000), 'hex case is irrelevant');
        self::assertFalse(Webhooks::verify('test', $stamp, $signature, 'changed', 1700000000));
        self::assertFalse(Webhooks::verify('test', $stamp, $signature, $body, 1700000400), 'stale');
        self::assertFalse(Webhooks::verify('test', $stamp, $signature, $body, 1699999600), 'future');
        self::assertFalse(Webhooks::verify('test', $stamp, 'v1=zz', $body, 1700000000));
        self::assertFalse(Webhooks::verify('test', 'abc', $signature, $body, 1700000000));
        self::assertFalse(Webhooks::verify('', $stamp, $signature, $body, 1700000000));
        self::assertFalse(Webhooks::verify('test', $stamp, $signature, $body, 1700000000, 0));
        self::assertFalse(Webhooks::verify('other', $stamp, $signature, $body, 1700000000));
    }

    /**
     * Fixed vectors produced by @getclickfix/node (createHmac) and checked against the Go module; the
     * example runner (sdks/examples/run.mjs) repeats the comparison live for all three SDKs.
     */
    public function testCrossSdkVectors(): void
    {
        self::assertSame('534aa0f56b16209739c72164206ae5b141ba705b9f5cffcf7e7b724022c720d7', UserHash::make('example-identity-secret', '1001'));
        $body = '{"id":"evt-1","event":"conversation.created"}';
        self::assertSame('v1=764d18bbe573e4a03a9fd8d8f8e21b55e4a7abe799e6bdb28d2598e8124fd31d', Webhooks::sign('whsec_example_stored_secret', '1700000000', $body));
        self::assertTrue(Webhooks::verify('whsec_example_stored_secret', '1700000000', 'v1=764d18bbe573e4a03a9fd8d8f8e21b55e4a7abe799e6bdb28d2598e8124fd31d', $body, 1700000100));
        self::assertSame('sha256=40043654ab9bdbba3965ccfd698c8dc745747333954275cb2135e14691f4ba65', \ClickFix\ApiChannel::signature('example-channel-secret', '1700000000', '{"id":"msg-1","sender_id":"1001","text":"Merhaba"}'));
    }
}
