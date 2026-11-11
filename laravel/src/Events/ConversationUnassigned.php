<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Events;

/** ClickFix webhook event `conversation.unassigned`. */
final class ConversationUnassigned extends WebhookEvent
{
    public const NAME = 'conversation.unassigned';
}
