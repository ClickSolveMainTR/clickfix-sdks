<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Console;

use ClickFix\Laravel\Support\EnvFile;
use ClickFix\Laravel\Support\Signer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Route;

final class InstallCommand extends Command
{
    protected $signature = 'clickfix:install
        {--force : Overwrite a published config/clickfix.php}
        {--no-env : Do not touch .env / .env.example}';

    protected $description = 'Publish config/clickfix.php, add the CLICKFIX_* keys to .env and show the webhook URL';

    public function handle(): int
    {
        $this->call('vendor:publish', ['--tag' => 'clickfix-config', '--force' => (bool) $this->option('force')]);

        if (! $this->option('no-env')) {
            $this->writeEnv();
        }

        $this->newLine();
        $this->info('ClickFix is installed. Next:');
        $this->table(['Key', 'Where to get it'], [
            ['CLICKFIX_API_KEY', 'Organization -> API and automations -> API keys (cf_sk_...)'],
            ['CLICKFIX_WIDGET_ID', 'Web widget -> Install'],
            ['CLICKFIX_IDENTITY_SECRET', 'Web widget -> Security -> Identity verification'],
            ['CLICKFIX_WEBHOOK_SECRET', 'generated; use it as the subscription secret, or paste data.secret from POST /v1/public-api/webhooks'],
        ]);
        $url = Route::has('clickfix.webhook') ? route('clickfix.webhook') : url('/'.ltrim((string) config('clickfix.webhook.path'), '/'));
        $this->line("Webhook URL to subscribe (public https): <comment>$url</comment>");
        $this->line('Blade: <comment>@clickfixWidget</comment> before </body>; identity for SPAs: <comment>ClickFix::identity($user)</comment>.');
        $this->line('Then run <comment>php artisan clickfix:check</comment>.');

        return self::SUCCESS;
    }

    private function writeEnv(): void
    {
        $envPath = $this->laravel->environmentFilePath();
        $env = new EnvFile($envPath);
        if (! $env->exists()) {
            $this->warn("$envPath does not exist; skipped (.env keys are listed below).");
        } else {
            $written = $env->addMissing([
                'CLICKFIX_API_KEY' => '',
                'CLICKFIX_BASE_URL' => 'https://api.getclickfix.com',
                'CLICKFIX_WIDGET_ID' => '',
                'CLICKFIX_IDENTITY_SECRET' => '',
                'CLICKFIX_WEBHOOK_SECRET' => Signer::generateSecret(),
            ]);
            $this->line($written ? 'Added to .env: '.implode(', ', $written) : '.env already has every CLICKFIX_* key.');
        }
        $example = new EnvFile(dirname($envPath).'/.env.example');
        if ($example->exists()) {
            $example->addMissing([
                'CLICKFIX_API_KEY' => '',
                'CLICKFIX_BASE_URL' => 'https://api.getclickfix.com',
                'CLICKFIX_WIDGET_ID' => '',
                'CLICKFIX_IDENTITY_SECRET' => '',
                'CLICKFIX_WEBHOOK_SECRET' => '',
            ]);
        }
    }
}
