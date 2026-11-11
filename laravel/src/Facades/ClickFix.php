<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Facades;

use ClickFix\Laravel\ClickFixManager;
use Illuminate\Support\Facades\Facade;

/**
 * @method static \ClickFix\Client client()
 * @method static \Illuminate\Http\Client\PendingRequest http()
 * @method static string userHash(mixed $user)
 * @method static array<string, mixed> identity(mixed $user)
 * @method static \Illuminate\Support\HtmlString widget(mixed $user = null, array $options = [])
 * @method static bool verifyWebhook(?string $timestamp, ?string $signature, string $body, ?int $now = null)
 * @method static string signWebhook(int $timestamp, string $body)
 * @method static string baseUrl()
 *
 * @see ClickFixManager
 */
class ClickFix extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return ClickFixManager::class;
    }
}
