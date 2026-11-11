<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Events;

/** ClickFix webhook event `message.failed`. */
final class MessageFailed extends WebhookEvent
{
    public const NAME = 'message.failed';
}
