<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Jobs;

use ClickFix\Laravel\Webhooks\Dispatcher;
use ClickFix\Laravel\Webhooks\WebhookPayload;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;

/** Queued when clickfix.webhook.queue is set: raises the Laravel events outside the request. */
final class ProcessWebhook implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;

    public int $tries = 3;

    public function __construct(public readonly WebhookPayload $payload) {}

    public function handle(Dispatcher $dispatcher): void
    {
        $dispatcher->dispatch($this->payload);
    }
}
