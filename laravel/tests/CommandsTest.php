<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Tests;

use ClickFix\Laravel\Facades\ClickFix;
use ClickFix\Laravel\Support\EnvFile;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

final class CommandsTest extends TestCase
{
    private string $tmp;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tmp = sys_get_temp_dir().'/clickfix-laravel-'.bin2hex(random_bytes(4));
        mkdir($this->tmp);
    }

    protected function tearDown(): void
    {
        foreach (glob($this->tmp.'/{,.}*', GLOB_BRACE) ?: [] as $f) {
            is_file($f) && unlink($f);
        }
        @rmdir($this->tmp);
        @unlink($this->app->configPath('clickfix.php'));
        parent::tearDown();
    }

    private function useEnv(string $contents = "APP_NAME=Demo\n"): string
    {
        file_put_contents($this->tmp.'/.env', $contents);
        file_put_contents($this->tmp.'/.env.example', "APP_NAME=Demo\n");
        $this->app->useEnvironmentPath($this->tmp);

        return $this->tmp.'/.env';
    }

    public function test_webhook_secret_prints_64_hex_and_can_write_env(): void
    {
        $this->artisan('clickfix:webhook:secret')->assertExitCode(0);
        $env = $this->useEnv("CLICKFIX_WEBHOOK_SECRET=old\n");
        $this->artisan('clickfix:webhook:secret', ['--write' => true])->assertExitCode(0);
        $this->assertMatchesRegularExpression('/^CLICKFIX_WEBHOOK_SECRET=[0-9a-f]{64}\n$/', (string) file_get_contents($env));
    }

    public function test_install_publishes_config_adds_env_keys_and_is_idempotent(): void
    {
        $env = $this->useEnv();
        $this->artisan('clickfix:install')->expectsOutputToContain('http://localhost/clickfix/webhook')->assertExitCode(0);

        $this->assertFileExists($this->app->configPath('clickfix.php'));
        $written = (string) file_get_contents($env);
        foreach (['CLICKFIX_API_KEY=', 'CLICKFIX_BASE_URL=https://api.getclickfix.com', 'CLICKFIX_WIDGET_ID=', 'CLICKFIX_IDENTITY_SECRET='] as $line) {
            $this->assertStringContainsString("\n$line\n", $written);
        }
        $this->assertMatchesRegularExpression('/\nCLICKFIX_WEBHOOK_SECRET=[0-9a-f]{64}\n/', $written);
        $this->assertStringContainsString("CLICKFIX_WEBHOOK_SECRET=\n", (string) file_get_contents($this->tmp.'/.env.example'));

        $this->artisan('clickfix:install')->expectsOutputToContain('already has every CLICKFIX_* key')->assertExitCode(0);
        $this->assertSame($written, file_get_contents($env), 'second run must not rewrite the secret');
    }

    public function test_env_file_quotes_and_replaces(): void
    {
        $path = $this->tmp.'/.env';
        $env = new EnvFile($path);
        $env->set('A', 'x y');
        $env->set('B', 'plain');
        $env->set('A', 'z');
        $this->assertSame("A=z\nB=plain\n", file_get_contents($path));
        $this->assertTrue($env->has('B'));
        $this->assertFalse($env->has('BB'));
    }

    public function test_user_hash_command_resolves_the_model_or_hashes_raw_values(): void
    {
        $user = $this->user();
        $this->artisan('clickfix:user-hash', ['user' => (string) $user->id])
            ->expectsOutputToContain(ClickFix::userHash($user))->assertExitCode(0);
        $this->artisan('clickfix:user-hash', ['user' => 'crm-9', '--raw' => true, '--json' => true])
            ->expectsOutputToContain('"user_hash": "'.hash_hmac('sha256', 'crm-9', self::IDENTITY_SECRET).'"')->assertExitCode(0);
        $this->artisan('clickfix:user-hash', ['user' => '999'])->assertExitCode(1);
    }

    public function test_check_passes_with_a_valid_key_and_fails_on_401_or_missing_keys(): void
    {
        Http::fake([
            'https://api.test/*' => Http::sequence()
                ->push(['data' => []], 200)
                ->push(['error' => ['code' => 'UNAUTHENTICATED']], 401)
                ->push(['error' => ['code' => 'FORBIDDEN']], 403),
        ]);
        $this->artisan('clickfix:check')->expectsOutputToContain('ClickFix is configured')->assertExitCode(0);
        Http::assertSent(fn (Request $r) => $r->hasHeader('Authorization', 'Bearer cf_sk_test') && $r->url() === 'https://api.test/v1/public-api/contacts?limit=1');

        $this->artisan('clickfix:check')->expectsOutputToContain('UNAUTHENTICATED')->assertExitCode(1);

        $this->app['config']->set('clickfix.webhook.secret', 'short');
        $this->app['config']->set('clickfix.widget.identity_secret', '');
        $this->artisan('clickfix:check')
            ->expectsOutputToContain('key accepted')
            ->expectsOutputToContain('shorter than 32 characters')
            ->expectsOutputToContain('CLICKFIX_IDENTITY_SECRET is not set')
            ->assertExitCode(1);
        Http::assertSentCount(3);

        $this->app['config']->set('clickfix.api_key', '');
        $this->artisan('clickfix:check')->expectsOutputToContain('CLICKFIX_API_KEY is not set')->assertExitCode(1);
        Http::assertSentCount(3);
    }

    public function test_sync_contacts_upserts_by_external_id_with_the_configured_mapping(): void
    {
        $a = $this->user(['phone' => '+90555', 'plan' => 'pro']);
        $b = $this->user(['name' => 'Mehmet', 'email' => 'm@example.com']);
        $c = $this->user(['name' => 'Conflict', 'email' => 'c@example.com']);
        Http::fake(function (Request $r) use ($a, $b) {
            $body = $r->data();

            return match ($body['external_id']) {
                (string) $a->id => Http::response(['data' => ['uuid' => 'u1']], 201),
                (string) $b->id => Http::response(['data' => ['uuid' => 'u2']], 200),
                default => Http::response(['error' => ['code' => 'EXTERNAL_ID_EXISTS']], 409),
            };
        });

        $this->artisan('clickfix:sync:contacts', ['--chunk' => 2])
            ->expectsOutputToContain('created 1, updated 1, failed 1')
            ->expectsOutputToContain((string) $c->id.': HTTP 409 EXTERNAL_ID_EXISTS')
            ->assertExitCode(1);

        Http::assertSentCount(3);
        Http::assertSent(fn (Request $r) => $r->method() === 'PUT'
            && $r->url() === 'https://api.test/v1/public-api/contacts/by-external-id'
            && $r->hasHeader('Authorization', 'Bearer cf_sk_test')
            && $r->hasHeader('Idempotency-Key')
            && $r->data() === ['external_id' => (string) $a->id, 'name' => 'Ayşe Yılmaz', 'email' => 'ayse@example.com', 'phone' => '+90555', 'custom_fields' => ['plan' => 'pro']]);
        Http::assertSent(fn (Request $r) => $r->data() === ['external_id' => (string) $b->id, 'name' => 'Mehmet', 'email' => 'm@example.com']);
    }

    public function test_sync_contacts_dry_run_and_id_filter_do_not_call_the_api(): void
    {
        $this->user();
        $b = $this->user(['name' => 'Only']);
        Http::fake();
        $this->artisan('clickfix:sync:contacts', ['--dry-run' => true, '--id' => [(string) $b->id]])
            ->expectsOutputToContain('"name":"Only"')
            ->expectsOutputToContain('created 0, updated 0, failed 0, dry-run 1')
            ->assertExitCode(0);
        Http::assertNothingSent();
    }
}
