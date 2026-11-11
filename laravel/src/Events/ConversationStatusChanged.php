<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Events;

/** ClickFix webhook event `conversation.status_changed`. */
final class ConversationStatusChanged extends WebhookEvent
{
    public const NAME = 'conversation.status_changed';
}
