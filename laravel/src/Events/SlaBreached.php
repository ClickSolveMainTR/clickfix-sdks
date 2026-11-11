<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Events;

/** ClickFix webhook event `sla.breached`. */
final class SlaBreached extends WebhookEvent
{
    public const NAME = 'sla.breached';
}
