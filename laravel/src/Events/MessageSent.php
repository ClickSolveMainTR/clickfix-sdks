<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Events;

/** ClickFix webhook event `message.sent`. */
final class MessageSent extends WebhookEvent
{
    public const NAME = 'message.sent';
}
