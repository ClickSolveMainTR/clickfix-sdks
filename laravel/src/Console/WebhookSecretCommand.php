<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Console;

use ClickFix\Laravel\Support\EnvFile;
use ClickFix\Laravel\Support\Signer;
use Illuminate\Console\Command;

final class WebhookSecretCommand extends Command
{
    protected $signature = 'clickfix:webhook:secret {--write : Write it to .env as CLICKFIX_WEBHOOK_SECRET}';

    protected $description = 'Generate a webhook signing secret (64 hex characters)';

    public function handle(): int
    {
        $secret = Signer::generateSecret();
        if ($this->option('write')) {
            $env = new EnvFile($this->laravel->environmentFilePath());
            $env->set('CLICKFIX_WEBHOOK_SECRET', $secret);
            $this->info('CLICKFIX_WEBHOOK_SECRET written to '.$this->laravel->environmentFilePath());
        } else {
            $this->line($secret);
        }
        $this->comment('Use the same value as the subscription secret in ClickFix (Organization -> API and automations -> Webhooks)'
            .' or create the subscription with POST /v1/public-api/webhooks and copy its data.secret instead.');

        return self::SUCCESS;
    }
}
