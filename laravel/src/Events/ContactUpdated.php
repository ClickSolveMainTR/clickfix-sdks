<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Events;

/** ClickFix webhook event `contact.updated`. */
final class ContactUpdated extends WebhookEvent
{
    public const NAME = 'contact.updated';
}
