<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Events;

/** Fired for every verified delivery, known event name or not, before the specific event. */
final class WebhookReceived extends WebhookEvent {}
