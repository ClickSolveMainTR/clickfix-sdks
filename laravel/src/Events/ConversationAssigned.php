<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Events;

/** ClickFix webhook event `conversation.assigned`. */
final class ConversationAssigned extends WebhookEvent
{
    public const NAME = 'conversation.assigned';
}
