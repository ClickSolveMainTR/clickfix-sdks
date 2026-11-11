<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Events;

/** ClickFix webhook event `conversation.priority_changed`. */
final class ConversationPriorityChanged extends WebhookEvent
{
    public const NAME = 'conversation.priority_changed';
}
