<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Events;

/** ClickFix webhook event `company.updated`. */
final class CompanyUpdated extends WebhookEvent
{
    public const NAME = 'company.updated';
}
