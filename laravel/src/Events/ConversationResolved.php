<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Events;

/** ClickFix webhook event `conversation.resolved`. */
final class ConversationResolved extends WebhookEvent
{
    public const NAME = 'conversation.resolved';
}
