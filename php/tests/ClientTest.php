<?php

declare(strict_types=1);

namespace ClickFix\Tests;

use ClickFix\Client;
use ClickFix\Exception\AuthenticationException;
use ClickFix\Exception\ClickFixException;
use ClickFix\Exception\ConflictException;
use ClickFix\Exception\ForbiddenException;
use ClickFix\Exception\InvalidArgumentException;
use ClickFix\Exception\NotFoundException;
use ClickFix\Exception\RateLimitException;
use ClickFix\Exception\ServerException;
use ClickFix\Exception\TransportException;
use ClickFix\Exception\ValidationException;
use GuzzleHttp\Psr7\HttpFactory;
use GuzzleHttp\Psr7\Request;
use PHPUnit\Framework\TestCase;

final class ClientTest extends TestCase
{
    /** @var list<int> */
    private array $sleeps = [];

    /**
     * @param list<\Psr\Http\Message\ResponseInterface|\Throwable> $script
     *
     * @return array{Client, FakeHttpClient}
     */
    private function client(array $script, int $attempts = 3): array
    {
        $http = new FakeHttpClient($script);
        $factory = new HttpFactory();
        $client = (new Client('https://api.example.test/', 'cf_sk_test', $http, $factory, $factory, $attempts, 250))
            ->withSleeper(function (int $ms): void { $this->sleeps[] = $ms; });

        return [$client, $http];
    }

    public function testRejectsEmptyKeyAndBadBaseUrl(): void
    {
        $this->expectException(InvalidArgumentException::class);
        new Client('https://api.example.test', '  ');
    }

    public function testBadBaseUrl(): void
    {
        $this->expectException(InvalidArgumentException::class);
        new Client('api.example.test', 'key');
    }

    public function testRequestBuildsHeadersPathAndQuery(): void
    {
        [$client, $http] = $this->client([FakeHttpClient::json(200, ['uuid' => 'c-1'])]);
        $res = $client->request('get', '/v1/public-api/conversations/{uuid}', null, ['limit' => 5, 'skip' => null, 'q' => 'a & b'], ['uuid' => 'x/y']);
        $req = $http->calls[0]['request'];
        self::assertSame('GET', $req->getMethod());
        self::assertSame('https://api.example.test/v1/public-api/conversations/x%2Fy?limit=5&q=a%20%26%20b', (string) $req->getUri());
        self::assertSame('Bearer cf_sk_test', $req->getHeaderLine('Authorization'));
        self::assertSame('application/json', $req->getHeaderLine('Accept'));
        self::assertFalse($req->hasHeader('Idempotency-Key'));
        self::assertSame(['uuid' => 'c-1'], $res->object());
        self::assertSame('req-200', $res->requestId);
    }

    public function testMissingPathParameter(): void
    {
        [$client] = $this->client([]);
        $this->expectException(InvalidArgumentException::class);
        $client->request('get', '/v1/public-api/conversations/{uuid}');
    }

    public function testWritesCarryJsonBodyAndGeneratedIdempotencyKey(): void
    {
        [$client, $http] = $this->client([FakeHttpClient::json(201, ['uuid' => 'new'])]);
        $client->contacts()->create(['name' => 'Ayşe', 'tags' => []]);
        $req = $http->calls[0]['request'];
        self::assertSame('POST', $req->getMethod());
        self::assertSame('application/json', $req->getHeaderLine('Content-Type'));
        self::assertSame('{"name":"Ayşe","tags":[]}', $http->calls[0]['body']);
        self::assertMatchesRegularExpression('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/', $req->getHeaderLine('Idempotency-Key'));
    }

    public function testEmptyBodyEncodesAsObject(): void
    {
        [$client, $http] = $this->client([FakeHttpClient::json(200, [])]);
        $client->request('put', '/v1/public-api/company-usage', [], idempotencyKey: 'k');
        self::assertSame('{}', $http->calls[0]['body']);
    }

    public function testRetriesPreserveKeyBodyAndAuthAndHonourRetryAfter(): void
    {
        [$client, $http] = $this->client([
            FakeHttpClient::json(503, null, ['Retry-After' => '2']),
            new FakeNetworkException(new Request('POST', '/')),
            FakeHttpClient::json(201, ['uuid' => 'created']),
        ]);
        $out = $client->conversations()->create(['subject' => 'hello'], 'same');
        self::assertSame(['uuid' => 'created'], $out);
        self::assertCount(3, $http->calls);
        self::assertSame($http->calls[0]['body'], $http->calls[2]['body']);
        self::assertSame('same', $http->calls[2]['request']->getHeaderLine('Idempotency-Key'));
        self::assertSame('Bearer cf_sk_test', $http->calls[2]['request']->getHeaderLine('Authorization'));
        self::assertSame([2000, 500], $this->sleeps);
    }

    public function testRetryBudgetThenTypedError(): void
    {
        [$client, $http] = $this->client([
            FakeHttpClient::json(429, null, ['Retry-After' => '1']),
            FakeHttpClient::json(429, null, ['Retry-After' => '1']),
            FakeHttpClient::json(429, null, ['Retry-After' => '7'], 'RATE_LIMITED'),
        ]);
        try {
            $client->contacts()->list();
            self::fail('expected RateLimitException');
        } catch (RateLimitException $e) {
            self::assertSame(429, $e->status);
            self::assertSame('RATE_LIMITED', $e->errorCode);
            self::assertSame(7, $e->retryAfter);
            self::assertSame('req-429', $e->requestId);
            self::assertSame(['field' => 'x'], $e->details);
            self::assertInstanceOf(ClickFixException::class, $e);
        }
        self::assertCount(3, $http->calls);
    }

    public function testNetworkErrorAfterBudgetIsTransportExceptionWithoutTheRequest(): void
    {
        $req = new Request('GET', '/', ['Authorization' => 'Bearer cf_sk_test']);
        [$client] = $this->client([new FakeNetworkException($req), new FakeNetworkException($req)], 2);
        try {
            $client->contacts()->list();
            self::fail('expected TransportException');
        } catch (TransportException $e) {
            self::assertStringContainsString('connection reset', $e->getMessage());
            self::assertNotNull($e->getPrevious());
            self::assertNotInstanceOf(FakeNetworkException::class, $e->getPrevious(), 'the PSR-18 exception (and its request) must not be chained');
            self::assertStringContainsString(FakeNetworkException::class, $e->getPrevious()->getMessage());
        }
    }

    public function testDebugInfoHidesSecrets(): void
    {
        [$client] = $this->client([]);
        $dump = print_r($client, true);
        self::assertStringNotContainsString('cf_sk_test', $dump);
        self::assertStringNotContainsString('chan-secret', print_r($client->apiChannel('inst', 'chan-secret'), true));
    }

    /**
     * @return iterable<string, array{int, class-string<\Throwable>}>
     */
    public static function statuses(): iterable
    {
        yield '401' => [401, AuthenticationException::class];
        yield '403' => [403, ForbiddenException::class];
        yield '404' => [404, NotFoundException::class];
        yield '409' => [409, ConflictException::class];
        yield '400' => [400, ValidationException::class];
        yield '422' => [422, ValidationException::class];
        yield '500' => [500, ServerException::class];
    }

    /**
     * @dataProvider statuses
     *
     * @param class-string<\Throwable> $class
     */
    public function testStatusMapsToException(int $status, string $class): void
    {
        [$client, $http] = $this->client([FakeHttpClient::json($status, null)]);
        $this->expectException($class);
        try {
            $client->contacts()->list();
        } finally {
            self::assertCount(1, $http->calls, 'non-retryable statuses are not retried');
        }
    }

    public function testNonJsonErrorBody(): void
    {
        [$client] = $this->client([new \GuzzleHttp\Psr7\Response(502, ['X-Request-ID' => 'edge-1'], '<html>bad gateway</html>')], 1);
        try {
            $client->contacts()->list();
            self::fail();
        } catch (ServerException $e) {
            self::assertSame('HTTP_ERROR', $e->errorCode);
            self::assertSame('edge-1', $e->requestId);
            self::assertNull($e->body);
        }
    }

    public function testResourcesHitTheDocumentedRoutes(): void
    {
        [$client, $http] = $this->client(array_fill(0, 20, FakeHttpClient::json(200, ['items' => [], 'total' => 0, 'limit' => 100, 'offset' => 0])));
        $client->contacts()->findByExternalId('1001');
        $client->contacts()->upsertByExternalId('1001', ['name' => 'A'], 'k1');
        $client->contacts()->update('u1', ['name' => 'B'], 'k2');
        $client->customFields()->setForContact('1001', ['plan' => 'pro'], 'k3');
        $client->companies()->findByExternalId('F-77');
        $client->companies()->setUsage(['external_id' => 'F-77', 'score' => 82], 'k4');
        $client->companies()->setRevenue(['external_id' => 'F-77', 'amount' => 1], 'k5');
        $client->events()->track(['external_id' => 'F-77', 'name' => 'x', 'idempotency_key' => 'evt-1']);
        $client->conversations()->get('c1');
        $client->conversations()->update('c1', ['status' => 'resolved'], 'k6');
        $client->conversations()->messages('c1');
        $client->conversations()->addMessage('c1', 'hi', true, 'k7');
        $client->webhooks()->list();
        $client->webhooks()->update('w1', ['name' => 'n'], 'k8');
        $client->webhooks()->delete('w1', 'k9');
        $client->triggers()->poll('conversation.created', 'cur');
        $client->triggers()->subscribe(['event' => 'e', 'target_url' => 'https://x'], 'k10');
        $client->triggers()->unsubscribe('s1', 'k11');
        $seen = array_map(static fn (array $c): string => $c['request']->getMethod().' '.$c['request']->getUri()->getPath().($c['request']->getUri()->getQuery() !== '' ? '?'.$c['request']->getUri()->getQuery() : ''), $http->calls);
        self::assertSame([
            'GET /v1/public-api/contacts?external_id=1001&limit=1',
            'PUT /v1/public-api/contacts/by-external-id',
            'PATCH /v1/public-api/contacts/u1',
            'PUT /v1/public-api/contacts/by-external-id',
            'GET /v1/public-api/companies?external_id=F-77&limit=1',
            'PUT /v1/public-api/company-usage',
            'PUT /v1/public-api/company-revenue',
            'POST /v1/public-api/company-events',
            'GET /v1/public-api/conversations/c1',
            'PATCH /v1/public-api/conversations/c1',
            'GET /v1/public-api/conversations/c1/messages',
            'POST /v1/public-api/conversations/c1/messages',
            'GET /v1/public-api/webhooks',
            'PUT /v1/public-api/webhooks/w1',
            'DELETE /v1/public-api/webhooks/w1',
            'GET /v1/public-api/triggers?event=conversation.created&cursor=cur',
            'POST /v1/public-api/subscriptions',
            'DELETE /v1/public-api/subscriptions/s1',
        ], $seen);
        self::assertSame('{"external_id":"1001","name":"A"}', $http->calls[1]['body']);
        self::assertSame('{"external_id":"1001","custom_fields":{"plan":"pro"}}', $http->calls[3]['body']);
        self::assertSame('evt-1', $http->calls[7]['request']->getHeaderLine('Idempotency-Key'), 'event idempotency_key doubles as the header');
        self::assertSame('{"content":"hi","private":true}', $http->calls[11]['body']);
    }
}
