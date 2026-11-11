<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Events;

/** ClickFix webhook event `sla.warning`. */
final class SlaWarning extends WebhookEvent
{
    public const NAME = 'sla.warning';
}
