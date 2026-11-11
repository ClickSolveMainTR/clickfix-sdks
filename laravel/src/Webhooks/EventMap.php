<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Webhooks;

use ClickFix\Laravel\Events;
use ClickFix\Laravel\Events\CompanyCreated;
use ClickFix\Laravel\Events\CompanyUpdated;
use ClickFix\Laravel\Events\ContactCreated;
use ClickFix\Laravel\Events\ContactMerged;
use ClickFix\Laravel\Events\ContactUpdated;
use ClickFix\Laravel\Events\ConversationAssigned;
use ClickFix\Laravel\Events\ConversationCreated;
use ClickFix\Laravel\Events\ConversationPriorityChanged;
use ClickFix\Laravel\Events\ConversationReopened;
use ClickFix\Laravel\Events\ConversationResolved;
use ClickFix\Laravel\Events\ConversationSnoozed;
use ClickFix\Laravel\Events\ConversationStatusChanged;
use ClickFix\Laravel\Events\ConversationTagAdded;
use ClickFix\Laravel\Events\ConversationUnassigned;
use ClickFix\Laravel\Events\ConversationUpdated;
use ClickFix\Laravel\Events\CsatSubmitted;
use ClickFix\Laravel\Events\MessageFailed;
use ClickFix\Laravel\Events\MessageReceived;
use ClickFix\Laravel\Events\MessageSent;
use ClickFix\Laravel\Events\SlaBreached;
use ClickFix\Laravel\Events\SlaWarning;

/** ClickFix event name => Laravel event class. Unknown names only raise Events\WebhookReceived. */
final class EventMap
{
    /** @var array<string, class-string<Events\WebhookEvent>> */
    public const EVENTS = [
        ConversationCreated::NAME => ConversationCreated::class,
        ConversationUpdated::NAME => ConversationUpdated::class,
        ConversationAssigned::NAME => ConversationAssigned::class,
        ConversationUnassigned::NAME => ConversationUnassigned::class,
        ConversationStatusChanged::NAME => ConversationStatusChanged::class,
        ConversationPriorityChanged::NAME => ConversationPriorityChanged::class,
        ConversationResolved::NAME => ConversationResolved::class,
        ConversationReopened::NAME => ConversationReopened::class,
        ConversationSnoozed::NAME => ConversationSnoozed::class,
        ConversationTagAdded::NAME => ConversationTagAdded::class,
        MessageReceived::NAME => MessageReceived::class,
        MessageSent::NAME => MessageSent::class,
        MessageFailed::NAME => MessageFailed::class,
        ContactCreated::NAME => ContactCreated::class,
        ContactUpdated::NAME => ContactUpdated::class,
        ContactMerged::NAME => ContactMerged::class,
        CompanyCreated::NAME => CompanyCreated::class,
        CompanyUpdated::NAME => CompanyUpdated::class,
        SlaWarning::NAME => SlaWarning::class,
        SlaBreached::NAME => SlaBreached::class,
        CsatSubmitted::NAME => CsatSubmitted::class,
    ];

    /** @return class-string<Events\WebhookEvent>|null */
    public static function classFor(string $event): ?string
    {
        return self::EVENTS[$event] ?? null;
    }

    /** @return list<string> */
    public static function names(): array
    {
        return array_keys(self::EVENTS);
    }
}
