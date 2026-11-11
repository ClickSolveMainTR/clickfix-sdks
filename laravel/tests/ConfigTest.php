<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Tests;

use ClickFix\Laravel\ClickFixManager;
use ClickFix\Laravel\ClickFixServiceProvider;
use ClickFix\Laravel\Facades\ClickFix;
use Illuminate\Support\Facades\Route;

final class ConfigTest extends TestCase
{
    public function test_package_discovery_points_at_the_provider_and_facade(): void
    {
        $composer = json_decode((string) file_get_contents(__DIR__.'/../composer.json'), true);
        $this->assertSame([ClickFixServiceProvider::class], $composer['extra']['laravel']['providers']);
        $this->assertSame(['ClickFix' => ClickFix::class], $composer['extra']['laravel']['aliases']);
        foreach (['illuminate/support', 'illuminate/console', 'illuminate/routing'] as $dep) {
            $this->assertSame('^10.0 || ^11.0 || ^12.0 || ^13.0', $composer['require'][$dep]);
        }
        $this->assertSame('^8.1', $composer['require']['php']);
        $this->assertMatchesRegularExpression('/^\d+\.\d+\.\d+$/', ClickFixServiceProvider::version());
        $this->assertSame('https://github.com/ClickSolveMainTR/clickfix-laravel', $composer['support']['source']);
    }

    public function test_config_is_merged_and_facade_resolves(): void
    {
        $this->assertSame('https://getclickfix.com/widget.js', config('clickfix.widget.script_url'));
        $this->assertSame(86400, config('clickfix.webhook.dedupe_ttl'));
        $this->assertSame('clickfix/webhook', config('clickfix.webhook.path'));
        $this->assertSame(300, config('clickfix.webhook.tolerance'));
        $this->assertInstanceOf(ClickFixManager::class, ClickFix::getFacadeRoot());
        $this->assertSame($this->app->make('clickfix'), ClickFix::getFacadeRoot());
        $this->assertTrue(Route::has('clickfix.webhook'));
        $this->assertStringEndsWith('/clickfix/webhook', route('clickfix.webhook'));
    }

    public function test_config_publishes_to_the_app(): void
    {
        $target = $this->app->configPath('clickfix.php');
        @unlink($target);
        try {
            $this->artisan('vendor:publish', ['--tag' => 'clickfix-config'])->assertExitCode(0);
            $this->assertFileExists($target);
            $this->assertFileEquals(__DIR__.'/../config/clickfix.php', $target);
        } finally {
            @unlink($target);
        }
    }
}
