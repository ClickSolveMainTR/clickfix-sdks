<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Webhooks;

use ClickFix\Laravel\Events\WebhookReceived;
use Illuminate\Contracts\Events\Dispatcher as Events;

/** Raises WebhookReceived and, when the event name is known, its specific Laravel event. */
final class Dispatcher
{
    public function __construct(private readonly Events $events) {}

    public function dispatch(WebhookPayload $payload): void
    {
        $this->events->dispatch(new WebhookReceived($payload));
        if ($class = EventMap::classFor($payload->event)) {
            $this->events->dispatch(new $class($payload));
        }
    }
}
