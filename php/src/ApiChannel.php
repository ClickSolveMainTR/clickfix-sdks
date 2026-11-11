<?php

declare(strict_types=1);

namespace ClickFix;

use ClickFix\Exception\ApiException;
use ClickFix\Exception\InvalidArgumentException;
use ClickFix\Exception\TransportException;
use Http\Discovery\Psr17FactoryDiscovery;
use Http\Discovery\Psr18ClientDiscovery;
use Psr\Http\Client\ClientInterface;
use Psr\Http\Message\RequestFactoryInterface;
use Psr\Http\Message\StreamFactoryInterface;

/**
 * API channel: deliver a customer message from your own application to ClickFix
 * (`POST /v1/webhooks/channels/api/{instance}`). Requests are signed with the channel's
 * signing secret, not the API key: X-ClickFix-Signature = "sha256=" + hex(HMAC-SHA256(secret, "timestamp.body")).
 */
final class ApiChannel
{
    private readonly string $baseUrl;
    private readonly ClientInterface $http;
    private readonly RequestFactoryInterface $requests;
    private readonly StreamFactoryInterface $streams;

    public function __construct(
        string $baseUrl,
        private readonly string $instance,
        #[\SensitiveParameter] private readonly string $secret,
        ?ClientInterface $httpClient = null,
        ?RequestFactoryInterface $requestFactory = null,
        ?StreamFactoryInterface $streamFactory = null,
    ) {
        if (trim($instance) === '' || trim($secret) === '') {
            throw new InvalidArgumentException('ClickFix API channel instance and secret required');
        }
        $this->baseUrl = rtrim(trim($baseUrl), '/');
        $this->http = $httpClient ?? Psr18ClientDiscovery::find();
        $this->requests = $requestFactory ?? Psr17FactoryDiscovery::findRequestFactory();
        $this->streams = $streamFactory ?? Psr17FactoryDiscovery::findStreamFactory();
    }

    /**
     * Keeps the channel secret out of var_dump() and exception dumps.
     *
     * @return array<string, mixed>
     */
    public function __debugInfo(): array
    {
        return ['baseUrl' => $this->baseUrl, 'instance' => $this->instance, 'secret' => '***'];
    }

    /**
     * The X-ClickFix-Signature value for a body at a timestamp (unix seconds).
     */
    public static function signature(#[\SensitiveParameter] string $secret, string $timestamp, string $body): string
    {
        return 'sha256='.hash_hmac('sha256', $timestamp.'.'.$body, $secret);
    }

    /**
     * Deliver one inbound message: `id` (unique within the channel), `sender_id`, `text`, optional `sender_name`, ...
     *
     * @param array<string, mixed> $message an APIChannelMessage (see public-api.yaml)
     *
     * @return array<string, mixed> the `data` member of the response (`{ received: true }`)
     *
     * @throws ApiException
     * @throws TransportException
     */
    public function send(array $message, ?int $timestamp = null): array
    {
        $body = json_encode($message, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        $stamp = (string) ($timestamp ?? time());
        $request = $this->requests
            ->createRequest(Endpoints::POST_WEBHOOKS_CHANNELS_API_BY_INSTANCE[0], $this->baseUrl.str_replace('{instance}', rawurlencode($this->instance), Endpoints::POST_WEBHOOKS_CHANNELS_API_BY_INSTANCE[1]))
            ->withHeader('Content-Type', 'application/json')
            ->withHeader('Accept', 'application/json')
            ->withHeader('User-Agent', Client::USER_AGENT)
            ->withHeader('X-ClickFix-Timestamp', $stamp)
            ->withHeader('X-ClickFix-Signature', self::signature($this->secret, $stamp, $body))
            ->withBody($this->streams->createStream($body));
        // The channel deduplicates on message id, so a retry is safe.
        $response = Client::sendWith($this->http, $request, true, Client::DEFAULT_ATTEMPTS, Client::DEFAULT_BASE_DELAY_MS, static function (int $ms): void {
            if ($ms > 0) {
                usleep($ms * 1000);
            }
        });

        return Client::decode($response)->object();
    }
}
