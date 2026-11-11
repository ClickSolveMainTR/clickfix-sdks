<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Tests;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;

final class WebhookRouteDisabledTest extends TestCase
{
    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);
        $app['config']->set('clickfix.webhook.route', false);
        $app['config']->set('clickfix.webhook.path', 'hooks/cf');
    }

    public function test_automatic_route_is_not_registered(): void
    {
        $this->assertFalse(Route::has('clickfix.webhook'));
        $this->postWebhook($this->eventBody(), [], null, '/hooks/cf')->assertNotFound();
        Http::fake();
        $this->artisan('clickfix:check')->expectsOutputToContain('automatic route disabled')->assertExitCode(0);
    }
}
