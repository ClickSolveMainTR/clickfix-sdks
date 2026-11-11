<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Http\Controllers;

use ClickFix\Laravel\Jobs\ProcessWebhook;
use ClickFix\Laravel\Webhooks\Dispatcher;
use ClickFix\Laravel\Webhooks\WebhookPayload;
use Illuminate\Contracts\Cache\Repository as Cache;
use Illuminate\Contracts\Config\Repository as Config;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** POST clickfix/webhook (behind VerifyWebhookSignature): dedupe by delivery id, then dispatch. */
final class WebhookController
{
    public function __construct(
        private readonly Config $config,
        private readonly Cache $cache,
        private readonly Dispatcher $dispatcher,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $body = json_decode($request->getContent(), true);
        if (! is_array($body) || ! is_string($body['event'] ?? null) || $body['event'] === '') {
            return new JsonResponse(['error' => ['code' => 'WEBHOOK_BODY_INVALID', 'message' => 'Body must be a JSON object with an event name.']], 400);
        }
        $deliveryId = (string) ($request->headers->get('ClickFix-Webhook-Id') ?: ($body['id'] ?? ''));
        if ($deliveryId === '') {
            $deliveryId = hash('sha256', $request->getContent());
        }
        $ttl = (int) $this->config->get('clickfix.webhook.dedupe_ttl', 0);
        if ($ttl > 0 && ! $this->cache->add('clickfix:webhook:'.$deliveryId, 1, $ttl)) {
            return new JsonResponse(['ok' => true, 'duplicate' => true]);
        }

        $payload = WebhookPayload::fromArray($deliveryId, $body);
        $queue = $this->config->get('clickfix.webhook.queue');
        if ($queue === null || $queue === false || $queue === '' || $queue === 'false' || $queue === '0') {
            $this->dispatcher->dispatch($payload);

            return new JsonResponse(['ok' => true]);
        }
        $dispatch = ProcessWebhook::dispatch($payload);
        if (is_string($queue) && ! in_array($queue, ['true', '1'], true)) {
            $dispatch->onQueue($queue);
        }
        if ($connection = $this->config->get('clickfix.webhook.queue_connection')) {
            $dispatch->onConnection((string) $connection);
        }

        return new JsonResponse(['ok' => true, 'queued' => true], 202);
    }
}
