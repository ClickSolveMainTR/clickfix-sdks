<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Events;

/** ClickFix webhook event `contact.created`. */
final class ContactCreated extends WebhookEvent
{
    public const NAME = 'contact.created';
}
