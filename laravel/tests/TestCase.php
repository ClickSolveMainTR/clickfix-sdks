<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Tests;

use ClickFix\Laravel\ClickFixServiceProvider;
use ClickFix\Laravel\Facades\ClickFix;
use ClickFix\Laravel\Tests\Fixtures\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Orchestra\Testbench\TestCase as Testbench;

abstract class TestCase extends Testbench
{
    public const IDENTITY_SECRET = 'identity-secret-for-tests';

    public const WEBHOOK_SECRET = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    protected function getPackageProviders($app): array
    {
        return [ClickFixServiceProvider::class];
    }

    protected function getPackageAliases($app): array
    {
        return ['ClickFix' => ClickFix::class];
    }

    protected function defineEnvironment($app): void
    {
        $app['config']->set('app.url', 'https://example.test');
        $app['config']->set('app.key', 'base64:AckfSECXIvnK5r28GVIWUAxmbBSjTsmF1bZ0UIcZdFc=');
        $app['config']->set('cache.default', 'array');
        $app['config']->set('queue.default', 'sync');
        $app['config']->set('database.default', 'testing');
        $app['config']->set('database.connections.testing', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '']);
        $app['config']->set('clickfix.api_key', 'cf_sk_test');
        $app['config']->set('clickfix.base_url', 'https://api.test');
        $app['config']->set('clickfix.widget.id', 'wgt_test');
        $app['config']->set('clickfix.widget.identity_secret', self::IDENTITY_SECRET);
        $app['config']->set('clickfix.webhook.secret', self::WEBHOOK_SECRET);
        $app['config']->set('clickfix.contacts.model', User::class);
        $app['config']->set('clickfix.contacts.fields', ['name' => 'name', 'email' => 'email', 'phone' => 'phone']);
        $app['config']->set('clickfix.contacts.custom_fields', ['plan' => 'plan']);
    }

    protected function setUp(): void
    {
        parent::setUp();
        Schema::create('users', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('plan')->nullable();
            $table->timestamps();
        });
    }

    protected function user(array $attributes = []): User
    {
        return User::query()->create(array_merge(['name' => 'Ayşe Yılmaz', 'email' => 'ayse@example.com'], $attributes));
    }

    /** Signed POST to the webhook route, raw bytes exactly as ClickFix sends them. */
    protected function postWebhook(string $body, array $headerOverrides = [], ?int $timestamp = null, string $path = '/clickfix/webhook'): \Illuminate\Testing\TestResponse
    {
        $timestamp ??= time();
        $headers = array_merge([
            'ClickFix-Webhook-Id' => 'dlv_'.md5($body),
            'ClickFix-Webhook-Event' => (string) (json_decode($body, true)['event'] ?? ''),
            'ClickFix-Webhook-Timestamp' => (string) $timestamp,
            'ClickFix-Webhook-Signature' => 'v1='.hash_hmac('sha256', $timestamp.'.'.$body, self::WEBHOOK_SECRET),
        ], $headerOverrides);
        $server = ['CONTENT_TYPE' => 'application/json'];
        foreach ($headers as $name => $value) {
            if ($value !== null) {
                $server['HTTP_'.strtoupper(str_replace('-', '_', $name))] = $value;
            }
        }

        return $this->call('POST', $path, [], [], [], $server, $body);
    }

    protected function eventBody(string $event = 'conversation.created', array $data = []): string
    {
        return (string) json_encode([
            'id' => 'evt_1',
            'event' => $event,
            'version' => 1,
            'occurred_at' => '2026-10-29T10:15:00Z',
            'data' => $data ?: ['conversation_uuid' => '8f0e0000-0000-0000-0000-000000000001', 'status' => 'open', 'contact_external_id' => '1001'],
        ]);
    }
}
