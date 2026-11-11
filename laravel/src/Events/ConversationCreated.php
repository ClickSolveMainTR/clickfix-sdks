<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Events;

/** ClickFix webhook event `conversation.created`. */
final class ConversationCreated extends WebhookEvent
{
    public const NAME = 'conversation.created';
}
