<?php

declare(strict_types=1);

namespace ClickFix\Laravel;

use ClickFix\Laravel\Console\CheckCommand;
use ClickFix\Laravel\Console\InstallCommand;
use ClickFix\Laravel\Console\SyncContactsCommand;
use ClickFix\Laravel\Console\UserHashCommand;
use ClickFix\Laravel\Console\WebhookSecretCommand;
use ClickFix\Laravel\Http\Controllers\WebhookController;
use ClickFix\Laravel\Http\Middleware\VerifyWebhookSignature;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Foundation\Console\AboutCommand;
use Illuminate\Routing\Router;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class ClickFixServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/clickfix.php', 'clickfix');
        $this->app->singleton(ClickFixManager::class);
        $this->app->alias(ClickFixManager::class, 'clickfix');
    }

    public function boot(Router $router): void
    {
        $router->aliasMiddleware('clickfix.webhook', VerifyWebhookSignature::class);
        $this->registerWebhookRoute();
        $this->registerBlade();

        if ($this->app->runningInConsole()) {
            $this->publishes([__DIR__.'/../config/clickfix.php' => $this->app->configPath('clickfix.php')], 'clickfix-config');
            $this->commands([
                InstallCommand::class,
                CheckCommand::class,
                UserHashCommand::class,
                WebhookSecretCommand::class,
                SyncContactsCommand::class,
            ]);
            if (class_exists(AboutCommand::class)) {
                AboutCommand::add('ClickFix', fn () => [
                    'Version' => self::version(),
                    'Base URL' => (string) config('clickfix.base_url'),
                    'Widget' => config('clickfix.widget.id') ? 'configured' : 'missing',
                    'Webhook' => config('clickfix.webhook.route') ? '/'.ltrim((string) config('clickfix.webhook.path'), '/') : 'manual',
                ]);
            }
        }
    }

    /** The newest `## X.Y.Z` heading of CHANGELOG.md is the package version (the release tag). */
    public static function version(): string
    {
        $changelog = (string) @file_get_contents(__DIR__.'/../CHANGELOG.md');

        return preg_match('/^## (\d+\.\d+\.\d+)/m', $changelog, $m) === 1 ? $m[1] : '0.0.0';
    }

    private function registerWebhookRoute(): void
    {
        if (! $this->app['config']->get('clickfix.webhook.route', true)) {
            return;
        }
        $path = '/'.ltrim((string) $this->app['config']->get('clickfix.webhook.path', 'clickfix/webhook'), '/');
        $middleware = array_merge([VerifyWebhookSignature::class], (array) $this->app['config']->get('clickfix.webhook.middleware', []));
        // Not in the `web` group on purpose: no session, no CSRF; the signature is the auth.
        Route::post($path, WebhookController::class)->middleware($middleware)->name('clickfix.webhook');
    }

    private function registerBlade(): void
    {
        // @clickfixWidget            -> the authenticated user (anonymous when nobody is logged in)
        // @clickfixWidget($user)     -> that user; null renders an anonymous widget
        // @clickfixWidget($user, ['locale' => 'tr'])
        Blade::directive('clickfixWidget', function (?string $expression): string {
            $args = trim((string) $expression) === '' ? 'auth()->user()' : $expression;

            return "<?php echo \\ClickFix\\Laravel\\Facades\\ClickFix::widget($args); ?>";
        });
    }
}
