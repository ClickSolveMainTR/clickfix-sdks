<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Exceptions;

final class MissingConfiguration extends \RuntimeException
{
    public static function key(string $configKey, string $envKey): self
    {
        return new self("ClickFix: config('$configKey') is empty. Set $envKey in .env (php artisan clickfix:install adds the keys).");
    }
}
