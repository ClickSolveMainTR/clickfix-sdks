<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Events;

/** ClickFix webhook event `csat.submitted`. */
final class CsatSubmitted extends WebhookEvent
{
    public const NAME = 'csat.submitted';
}
