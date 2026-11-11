<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Events;

/** ClickFix webhook event `conversation.snoozed`. */
final class ConversationSnoozed extends WebhookEvent
{
    public const NAME = 'conversation.snoozed';
}
