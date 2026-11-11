<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Events;

/** ClickFix webhook event `conversation.updated`. */
final class ConversationUpdated extends WebhookEvent
{
    public const NAME = 'conversation.updated';
}
