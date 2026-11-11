<?php

declare(strict_types=1);

namespace ClickFix\Tests;

use ClickFix\ApiChannel;
use ClickFix\Client;
use GuzzleHttp\Psr7\HttpFactory;
use PHPUnit\Framework\TestCase;

final class ApiChannelTest extends TestCase
{
    public function testSendSignsTimestampDotBodyWithChannelSecret(): void
    {
        $http = new FakeHttpClient([FakeHttpClient::json(200, ['received' => true])]);
        $factory = new HttpFactory();
        $channel = (new Client('https://api.example.test', 'cf_sk_test', $http, $factory, $factory))->apiChannel('inst/1', 'chan-secret');
        $out = $channel->send(['id' => 'msg-1', 'sender_id' => '1001', 'text' => 'Merhaba'], 1700000000);
        self::assertSame(['received' => true], $out);
        $req = $http->calls[0]['request'];
        self::assertSame('https://api.example.test/v1/webhooks/channels/api/inst%2F1', (string) $req->getUri());
        self::assertFalse($req->hasHeader('Authorization'), 'the channel is signed, not keyed');
        self::assertSame('1700000000', $req->getHeaderLine('X-ClickFix-Timestamp'));
        $body = $http->calls[0]['body'];
        self::assertSame('{"id":"msg-1","sender_id":"1001","text":"Merhaba"}', $body);
        self::assertSame('sha256='.hash_hmac('sha256', '1700000000.'.$body, 'chan-secret'), $req->getHeaderLine('X-ClickFix-Signature'));
        self::assertSame(ApiChannel::signature('chan-secret', '1700000000', $body), $req->getHeaderLine('X-ClickFix-Signature'));
    }
}
