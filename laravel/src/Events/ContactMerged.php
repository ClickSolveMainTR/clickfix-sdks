<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Events;

/** ClickFix webhook event `contact.merged`. */
final class ContactMerged extends WebhookEvent
{
    public const NAME = 'contact.merged';
}
