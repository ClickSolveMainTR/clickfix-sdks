<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Events;

/** ClickFix webhook event `conversation.tag_added`. */
final class ConversationTagAdded extends WebhookEvent
{
    public const NAME = 'conversation.tag_added';
}
