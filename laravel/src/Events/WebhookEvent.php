<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Events;

use ClickFix\Laravel\Webhooks\WebhookPayload;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Base of every ClickFix webhook event. The `data` keys follow the event
 * (conversation_uuid, contact_external_id, ...); see https://getclickfix.com/docs/webhooks.
 */
abstract class WebhookEvent
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(public readonly WebhookPayload $payload) {}

    /** The ClickFix event name, e.g. conversation.created. */
    public function name(): string
    {
        return $this->payload->event;
    }

    /** @return array<string, mixed> */
    public function data(): array
    {
        return $this->payload->data;
    }

    public function get(string $key, mixed $default = null): mixed
    {
        return data_get($this->payload->data, $key, $default);
    }
}
