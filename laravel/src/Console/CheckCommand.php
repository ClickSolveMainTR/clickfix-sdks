<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Console;

use ClickFix\Laravel\ClickFixManager;
use ClickFix\Laravel\Exceptions\MissingConfiguration;
use Illuminate\Console\Command;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Route;

final class CheckCommand extends Command
{
    protected $signature = 'clickfix:check';

    protected $description = 'Verify the ClickFix configuration: API key against the API, widget identity secret, webhook secret and route';

    /** @var list<array{string, bool, string}> */
    private array $rows = [];

    public function handle(ClickFixManager $clickfix): int
    {
        $this->checkApiKey($clickfix);
        $this->checkWidget();
        $this->checkWebhook($clickfix);

        $this->table(['Check', 'Status', 'Detail'], array_map(
            fn (array $r) => [$r[0], $r[1] ? 'OK' : 'FAIL', $r[2]],
            $this->rows,
        ));
        $failed = array_filter($this->rows, fn (array $r) => ! $r[1]);
        if ($failed) {
            $this->error(count($failed).' check(s) failed. php artisan clickfix:install adds the missing .env keys.');

            return self::FAILURE;
        }
        $this->info('ClickFix is configured.');

        return self::SUCCESS;
    }

    private function checkApiKey(ClickFixManager $clickfix): void
    {
        try {
            $clickfix->apiKey();
        } catch (MissingConfiguration) {
            $this->rows[] = ['API key', false, 'CLICKFIX_API_KEY is not set'];

            return;
        }
        try {
            // Cheapest authenticated read; 403 still proves the key (missing contacts:read scope).
            $response = $clickfix->http()->get('/v1/public-api/contacts', ['limit' => 1]);
        } catch (ConnectionException $e) {
            $this->rows[] = ['API key', false, 'cannot reach '.$clickfix->baseUrl().': '.$e->getMessage()];

            return;
        } catch (RequestException $e) {
            $response = $e->response;
        }
        $status = $response->status();
        $this->rows[] = match (true) {
            $status === 200 => ['API key', true, 'authenticated against '.$clickfix->baseUrl()],
            $status === 401 => ['API key', false, '401 '.(string) $response->json('error.code', 'UNAUTHENTICATED').': the key is invalid or revoked'],
            $status === 403 => ['API key', true, 'key accepted; add the contacts:read scope to list contacts'],
            default => ['API key', false, "unexpected HTTP $status from ".$clickfix->baseUrl()],
        };
    }

    private function checkWidget(): void
    {
        $id = (string) config('clickfix.widget.id');
        $this->rows[] = ['Widget id', $id !== '', $id !== '' ? $id : 'CLICKFIX_WIDGET_ID is not set (Web widget -> Install)'];
        $secret = (string) config('clickfix.widget.identity_secret');
        $this->rows[] = ['Identity secret', $secret !== '', $secret !== ''
            ? 'set ('.strlen($secret).' chars); user_hash is computed server side'
            : 'CLICKFIX_IDENTITY_SECRET is not set (Web widget -> Security -> Identity verification)'];
    }

    private function checkWebhook(ClickFixManager $clickfix): void
    {
        $secret = $clickfix->webhookSecret();
        $this->rows[] = match (true) {
            $secret === '' => ['Webhook secret', false, 'CLICKFIX_WEBHOOK_SECRET is not set (php artisan clickfix:webhook:secret --write)'],
            strlen($secret) < 32 => ['Webhook secret', false, 'shorter than 32 characters; use the secret ClickFix issued'],
            default => ['Webhook secret', true, 'set ('.strlen($secret).' chars), tolerance '.$clickfix->webhookTolerance().'s'],
        };
        if (! config('clickfix.webhook.route')) {
            $this->rows[] = ['Webhook route', true, 'automatic route disabled (clickfix.webhook.route=false)'];

            return;
        }
        $route = Route::has('clickfix.webhook');
        $url = $route ? route('clickfix.webhook') : null;
        $https = $url !== null && str_starts_with($url, 'https://');
        $this->rows[] = ['Webhook route', $route, $route
            ? $url.($https ? '' : ' (ClickFix only delivers to public https URLs; set APP_URL)')
            : 'route clickfix.webhook is not registered'];
    }
}
