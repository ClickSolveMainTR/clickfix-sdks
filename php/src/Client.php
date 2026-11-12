<?php

declare(strict_types=1);

namespace ClickFix;

use ClickFix\Exception\ApiException;
use ClickFix\Exception\InvalidArgumentException;
use ClickFix\Exception\RateLimitException;
use ClickFix\Exception\TransportException;
use Http\Discovery\Psr17FactoryDiscovery;
use Http\Discovery\Psr18ClientDiscovery;
use Psr\Http\Client\ClientExceptionInterface;
use Psr\Http\Client\ClientInterface;
use Psr\Http\Client\NetworkExceptionInterface;
use Psr\Http\Message\RequestFactoryInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\StreamFactoryInterface;

/**
 * ClickFix public API client (`/v1/public-api/*`, API key auth).
 *
 * Mirrors `createClient` in @getclickfix/node: Bearer key, JSON envelopes, `Idempotency-Key` on writes,
 * bounded retries for GETs and keyed writes (429/502/503/504 and network errors, exponential backoff,
 * bounded `Retry-After`), typed exceptions for error responses.
 */
final class Client
{
    public const DEFAULT_ATTEMPTS = 3;
    public const MAX_ATTEMPTS = 5;
    public const DEFAULT_BASE_DELAY_MS = 250;
    public const MAX_DELAY_MS = 30000;
    public const DEFAULT_TIMEOUT = 30.0;
    public const USER_AGENT = 'clickfix-php-sdk/0.2.0';

    private readonly string $baseUrl;
    private readonly ClientInterface $http;
    private readonly RequestFactoryInterface $requests;
    private readonly StreamFactoryInterface $streams;
    private readonly int $attempts;
    private readonly int $baseDelayMs;

    /**
     * @var callable(int): void
     */
    private $sleep;

    /**
     * @param string                       $baseUrl        API origin, e.g. https://api.getclickfix.com (no /v1 suffix)
     * @param string                       $apiKey         integration key (`cf_sk_...`), server side only
     * @param ClientInterface|null         $httpClient     any PSR-18 client; discovered when null (Guzzle with $timeout if installed)
     * @param RequestFactoryInterface|null $requestFactory PSR-17 request factory; discovered when null
     * @param StreamFactoryInterface|null  $streamFactory  PSR-17 stream factory; discovered when null
     * @param int                          $attempts       total attempts for retryable requests (1..5)
     * @param int                          $baseDelayMs    first backoff delay; doubles per attempt, capped at 30 s
     * @param float                        $timeout        request timeout in seconds, applied only to the client the SDK creates itself
     */
    public function __construct(
        string $baseUrl,
        #[\SensitiveParameter] private readonly string $apiKey,
        ?ClientInterface $httpClient = null,
        ?RequestFactoryInterface $requestFactory = null,
        ?StreamFactoryInterface $streamFactory = null,
        int $attempts = self::DEFAULT_ATTEMPTS,
        int $baseDelayMs = self::DEFAULT_BASE_DELAY_MS,
        float $timeout = self::DEFAULT_TIMEOUT,
    ) {
        if (trim($apiKey) === '') {
            throw new InvalidArgumentException('ClickFix API key required');
        }
        $baseUrl = rtrim(trim($baseUrl), '/');
        if ($baseUrl === '' || !in_array(parse_url($baseUrl, PHP_URL_SCHEME), ['http', 'https'], true)) {
            throw new InvalidArgumentException('ClickFix base URL must be an http(s) origin');
        }
        $this->baseUrl = $baseUrl;
        $this->http = $httpClient ?? self::defaultHttpClient($timeout);
        $this->requests = $requestFactory ?? Psr17FactoryDiscovery::findRequestFactory();
        $this->streams = $streamFactory ?? Psr17FactoryDiscovery::findStreamFactory();
        $this->attempts = min(max($attempts, 1), self::MAX_ATTEMPTS);
        $this->baseDelayMs = min(max($baseDelayMs, 0), self::MAX_DELAY_MS);
        $this->sleep = static function (int $ms): void {
            if ($ms > 0) {
                usleep($ms * 1000);
            }
        };
    }

    /**
     * Replace the backoff sleeper (tests).
     *
     * @param callable(int $milliseconds): void $sleep
     */
    public function withSleeper(callable $sleep): self
    {
        $clone = clone $this;
        $clone->sleep = $sleep;

        return $clone;
    }

    public function baseUrl(): string
    {
        return $this->baseUrl;
    }

    /**
     * Keeps the API key out of var_dump() and exception dumps.
     *
     * @return array<string, mixed>
     */
    public function __debugInfo(): array
    {
        return ['baseUrl' => $this->baseUrl, 'apiKey' => '***', 'attempts' => $this->attempts, 'baseDelayMs' => $this->baseDelayMs];
    }

    public function contacts(): Resources\Contacts
    {
        return new Resources\Contacts($this);
    }

    public function companies(): Resources\Companies
    {
        return new Resources\Companies($this);
    }

    public function customFields(): Resources\CustomFields
    {
        return new Resources\CustomFields($this);
    }

    public function conversations(): Resources\Conversations
    {
        return new Resources\Conversations($this);
    }

    public function events(): Resources\Events
    {
        return new Resources\Events($this);
    }

    public function webhooks(): Resources\WebhookSubscriptions
    {
        return new Resources\WebhookSubscriptions($this);
    }

    public function triggers(): Resources\Triggers
    {
        return new Resources\Triggers($this);
    }

    /**
     * The API channel inbound endpoint, signed with the channel secret (not the API key) over the same transport.
     */
    public function apiChannel(string $instance, #[\SensitiveParameter] string $channelSecret): ApiChannel
    {
        return new ApiChannel($this->baseUrl, $instance, $channelSecret, $this->http, $this->requests, $this->streams);
    }

    /**
     * Iterate every item of a list endpoint; `$fetch` receives (limit, offset) and returns a Page.
     *
     * @param callable(int, int): Page $fetch
     */
    public function paginate(callable $fetch): Paginator
    {
        return new Paginator($fetch);
    }

    /**
     * Send one request to a `/v1/public-api/*` route and decode the envelope.
     *
     * @param string                              $method         GET, POST, PUT, PATCH or DELETE
     * @param string                              $path           route with `{param}` placeholders, e.g. `/v1/public-api/contacts/{uuid}`
     * @param array<string, mixed>|null           $body           JSON body (null for none)
     * @param array<string, scalar|null>          $query          query parameters; null values are skipped
     * @param array<string, string>               $pathParams     values for the `{param}` placeholders
     * @param string|null                         $idempotencyKey Idempotency-Key for writes; generated when null on a non-GET
     * @param array<string, string>               $headers        extra headers
     *
     * @throws ApiException       for a non-2xx response
     * @throws TransportException when the HTTP client fails after the retry budget
     */
    public function request(
        string $method,
        string $path,
        ?array $body = null,
        array $query = [],
        array $pathParams = [],
        ?string $idempotencyKey = null,
        array $headers = [],
    ): ApiResponse {
        $method = strtoupper($method);
        $route = $path;
        foreach ($pathParams as $name => $value) {
            $route = str_replace('{'.$name.'}', rawurlencode($value), $route);
        }
        if (str_contains($route, '{')) {
            throw new InvalidArgumentException('Missing path parameter in '.$path);
        }
        $url = $this->baseUrl.$route;
        $pairs = [];
        foreach ($query as $name => $value) {
            if ($value === null) {
                continue;
            }
            $pairs[$name] = is_bool($value) ? ($value ? 'true' : 'false') : (string) $value;
        }
        if ($pairs !== []) {
            $url .= '?'.http_build_query($pairs, '', '&', PHP_QUERY_RFC3986);
        }
        if ($method !== 'GET' && ($idempotencyKey === null || $idempotencyKey === '')) {
            $idempotencyKey = IdempotencyKey::generate();
        }
        $request = $this->requests->createRequest($method, $url)
            ->withHeader('Authorization', 'Bearer '.$this->apiKey)
            ->withHeader('Accept', 'application/json')
            ->withHeader('User-Agent', self::USER_AGENT);
        if ($idempotencyKey !== null && $idempotencyKey !== '') {
            $request = $request->withHeader('Idempotency-Key', $idempotencyKey);
        }
        foreach ($headers as $name => $value) {
            $request = $request->withHeader($name, $value);
        }
        if ($body !== null) {
            $request = $request
                ->withHeader('Content-Type', 'application/json')
                ->withBody($this->streams->createStream(self::encode($body)));
        }
        $safe = $method === 'GET' || $idempotencyKey !== null;
        $response = $this->send($request, $safe);

        return self::decode($response);
    }

    /**
     * Retry policy shared with ApiChannel: GET and keyed writes retry on transport errors and 429/502/503/504.
     *
     * @internal
     */
    public function send(\Psr\Http\Message\RequestInterface $request, bool $safe): ResponseInterface
    {
        return self::sendWith($this->http, $request, $safe, $this->attempts, $this->baseDelayMs, $this->sleep);
    }

    /**
     * @internal
     *
     * @param callable(int): void $sleep
     */
    public static function sendWith(ClientInterface $http, \Psr\Http\Message\RequestInterface $request, bool $safe, int $attempts, int $baseDelayMs, callable $sleep): ResponseInterface
    {
        for ($attempt = 0;; ++$attempt) {
            if ($attempt > 0 && $request->getBody()->isSeekable()) {
                $request->getBody()->rewind();
            }
            try {
                $response = $http->sendRequest($request);
            } catch (ClientExceptionInterface $e) {
                $retryable = $e instanceof NetworkExceptionInterface || !($e instanceof \Psr\Http\Client\RequestExceptionInterface);
                if (!$safe || !$retryable || $attempt + 1 >= $attempts) {
                    throw TransportException::wrap($e);
                }
                $sleep((int) min($baseDelayMs * (2 ** $attempt), self::MAX_DELAY_MS));
                continue;
            }
            $status = $response->getStatusCode();
            if ($safe && in_array($status, [429, 502, 503, 504], true) && $attempt + 1 < $attempts) {
                $sleep(self::retryDelay($response->getHeaderLine('Retry-After'), $baseDelayMs, $attempt));
                continue;
            }

            return $response;
        }
    }

    /**
     * @internal
     */
    public static function retryDelay(string $retryAfter, int $baseDelayMs, int $attempt): int
    {
        $wait = (int) min($baseDelayMs * (2 ** $attempt), self::MAX_DELAY_MS);
        if ($retryAfter === '') {
            return $wait;
        }
        if (preg_match('/^\d+$/', $retryAfter) === 1) {
            return (int) min((int) $retryAfter * 1000, self::MAX_DELAY_MS);
        }
        $at = strtotime($retryAfter);
        if ($at !== false) {
            return min(max(($at - time()) * 1000, 0), self::MAX_DELAY_MS);
        }

        return $wait;
    }

    /**
     * Decode the standard envelope, throwing the typed ApiException for non-2xx statuses.
     *
     * @internal
     */
    public static function decode(ResponseInterface $response): ApiResponse
    {
        $status = $response->getStatusCode();
        $raw = (string) $response->getBody();
        $decoded = $raw === '' ? [] : json_decode($raw, true);
        $body = self::object($decoded);
        $requestIdHeader = $response->getHeaderLine('X-Request-ID');
        if ($status < 200 || $status >= 300) {
            $e = ApiException::fromResponse($status, $body, $requestIdHeader !== '' ? $requestIdHeader : null);
            if ($e instanceof RateLimitException) {
                $after = $response->getHeaderLine('Retry-After');
                $e->retryAfter = preg_match('/^\d+$/', $after) === 1 ? (int) $after : null;
            }
            throw $e;
        }
        $body ??= [];
        $meta = is_array($body['meta'] ?? null) ? $body['meta'] : [];
        /** @var array<string, mixed> $meta */
        $data = $body['data'] ?? null;
        $requestId = is_string($meta['request_id'] ?? null) ? $meta['request_id'] : ($requestIdHeader !== '' ? $requestIdHeader : null);

        return new ApiResponse($status, is_array($data) ? $data : null, $meta, $body, $requestId);
    }

    /**
     * A decoded JSON object, or null for anything else (lists, scalars, invalid JSON).
     *
     * @return array<string, mixed>|null
     */
    private static function object(mixed $decoded): ?array
    {
        if (!is_array($decoded) || array_is_list($decoded)) {
            return null;
        }
        $out = [];
        foreach ($decoded as $key => $value) {
            $out[(string) $key] = $value;
        }

        return $out;
    }

    /**
     * @param array<string, mixed> $body
     */
    private static function encode(array $body): string
    {
        $json = json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);

        return $json === '[]' ? '{}' : $json;
    }

    private static function defaultHttpClient(float $timeout): ClientInterface
    {
        if (class_exists(\GuzzleHttp\Client::class)) {
            return new \GuzzleHttp\Client(['timeout' => $timeout, 'connect_timeout' => min($timeout, 10.0), 'allow_redirects' => false, 'http_errors' => false]);
        }

        return Psr18ClientDiscovery::find();
    }
}
