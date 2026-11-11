<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Events;

/** ClickFix webhook event `conversation.reopened`. */
final class ConversationReopened extends WebhookEvent
{
    public const NAME = 'conversation.reopened';
}
