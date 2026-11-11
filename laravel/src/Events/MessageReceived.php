<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Events;

/** ClickFix webhook event `message.received`. */
final class MessageReceived extends WebhookEvent
{
    public const NAME = 'message.received';
}
