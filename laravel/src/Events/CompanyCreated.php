<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Events;

/** ClickFix webhook event `company.created`. */
final class CompanyCreated extends WebhookEvent
{
    public const NAME = 'company.created';
}
