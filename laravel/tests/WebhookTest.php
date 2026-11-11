<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Tests;

use ClickFix\Laravel\Events\ConversationCreated;
use ClickFix\Laravel\Events\MessageSent;
use ClickFix\Laravel\Events\WebhookReceived;
use ClickFix\Laravel\Http\Middleware\VerifyWebhookSignature;
use ClickFix\Laravel\Jobs\ProcessWebhook;
use ClickFix\Laravel\Support\Signer;
use ClickFix\Laravel\Webhooks\EventMap;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Route;

final class WebhookTest extends TestCase
{
    public function test_valid_signature_returns_200_and_raises_both_events(): void
    {
        Event::fake();
        $this->postWebhook($this->eventBody())->assertOk()->assertJson(['ok' => true]);

        Event::assertDispatched(WebhookReceived::class, fn (WebhookReceived $e) => $e->name() === 'conversation.created' && $e->payload->id === 'evt_1');
        Event::assertDispatched(ConversationCreated::class, function (ConversationCreated $e) {
            return $e->get('contact_external_id') === '1001'
                && $e->get('status') === 'open'
                && $e->payload->occurredAt()?->format('Y-m-d') === '2026-10-29'
                && $e->payload->deliveryId !== '';
        });
    }

    public function test_message_sent_maps_to_its_event_and_unknown_events_only_raise_received(): void
    {
        Event::fake();
        $this->postWebhook($this->eventBody('message.sent', ['message_uuid' => 'm1']))->assertOk();
        Event::assertDispatched(MessageSent::class, fn (MessageSent $e) => $e->get('message_uuid') === 'm1');

        $this->postWebhook($this->eventBody('future.event', ['x' => 1]))->assertOk();
        Event::assertDispatched(WebhookReceived::class, fn (WebhookReceived $e) => $e->name() === 'future.event');
        $this->assertNull(EventMap::classFor('future.event'));
        $this->assertCount(21, EventMap::names());
    }

    public function test_tampered_body_returns_401_without_events(): void
    {
        Event::fake([WebhookReceived::class, ConversationCreated::class]);
        $body = $this->eventBody();
        $ts = time();
        $headers = ['ClickFix-Webhook-Signature' => 'v1='.hash_hmac('sha256', $ts.'.'.$body, self::WEBHOOK_SECRET)];
        $this->postWebhook(str_replace('"open"', '"resolved"', $body), $headers, $ts)
            ->assertStatus(401)->assertJsonPath('error.code', 'WEBHOOK_SIGNATURE_INVALID');
        Event::assertNotDispatched(WebhookReceived::class);
        Event::assertNotDispatched(ConversationCreated::class);
    }

    public function test_wrong_secret_missing_header_and_stale_timestamp_return_401(): void
    {
        Event::fake();
        $body = $this->eventBody();
        $ts = time();
        $this->postWebhook($body, ['ClickFix-Webhook-Signature' => Signer::signWebhook('other-secret', $ts, $body)], $ts)->assertStatus(401);
        $this->postWebhook($body, ['ClickFix-Webhook-Signature' => null])->assertStatus(401);
        $this->postWebhook($body, ['ClickFix-Webhook-Signature' => 'sha256=abc'])->assertStatus(401);
        $this->postWebhook($body, [], time() - 301)->assertStatus(401);
        $this->postWebhook($body, [], time() - 200)->assertOk();
        Event::assertDispatchedTimes(WebhookReceived::class, 1);
    }

    public function test_missing_secret_returns_503(): void
    {
        $this->app['config']->set('clickfix.webhook.secret', '');
        $this->postWebhook($this->eventBody())->assertStatus(503)->assertJsonPath('error.code', 'WEBHOOK_SECRET_MISSING');
    }

    public function test_invalid_json_returns_400_after_a_valid_signature(): void
    {
        $this->postWebhook('not json')->assertStatus(400)->assertJsonPath('error.code', 'WEBHOOK_BODY_INVALID');
    }

    public function test_redelivery_with_the_same_id_is_acknowledged_once(): void
    {
        Event::fake();
        $body = $this->eventBody();
        $this->postWebhook($body, ['ClickFix-Webhook-Id' => 'dlv_same'])->assertOk()->assertJsonMissing(['duplicate' => true]);
        $this->postWebhook($body, ['ClickFix-Webhook-Id' => 'dlv_same'])->assertOk()->assertJson(['duplicate' => true]);
        Event::assertDispatchedTimes(ConversationCreated::class, 1);
    }

    public function test_queue_option_dispatches_the_job_instead_of_the_events(): void
    {
        $this->app['config']->set('clickfix.webhook.queue', 'clickfix');
        $this->app['config']->set('clickfix.webhook.queue_connection', 'sync');
        Bus::fake();
        Event::fake();
        $this->postWebhook($this->eventBody())->assertStatus(202)->assertJson(['queued' => true]);
        Bus::assertDispatched(ProcessWebhook::class, fn (ProcessWebhook $job) => $job->queue === 'clickfix' && $job->connection === 'sync' && $job->payload->event === 'conversation.created');
        Event::assertNotDispatched(ConversationCreated::class);
    }

    public function test_queued_job_raises_the_events_when_it_runs(): void
    {
        Event::fake();
        $this->app['config']->set('clickfix.webhook.queue', true);
        $this->postWebhook($this->eventBody())->assertStatus(202);
        // queue.default is sync in tests, so the job already ran.
        Event::assertDispatched(ConversationCreated::class);
    }

    public function test_custom_path_and_manual_route_with_the_middleware_alias(): void
    {
        Route::post('/hooks/clickfix', fn () => response()->json(['custom' => true]))->middleware('clickfix.webhook');
        $this->postWebhook($this->eventBody(), [], null, '/hooks/clickfix')->assertOk()->assertJson(['custom' => true]);
        $this->postWebhook($this->eventBody(), ['ClickFix-Webhook-Signature' => 'v1='.str_repeat('0', 64)], null, '/hooks/clickfix')->assertStatus(401);
        $this->assertSame(VerifyWebhookSignature::class, $this->app['router']->getMiddleware()['clickfix.webhook']);
    }

    public function test_signer_matches_the_node_and_go_sdks(): void
    {
        // Same vector as sdks/tests/sdk.test.mjs: HMAC over timestamp + "." + body.
        $this->assertSame('v1='.hash_hmac('sha256', '1700000000.{"a":1}', 'secret'), Signer::signWebhook('secret', 1700000000, '{"a":1}'));
        $this->assertTrue(Signer::verifyWebhook('secret', '1700000000', Signer::signWebhook('secret', 1700000000, '{"a":1}'), '{"a":1}', 1700000100));
        $this->assertFalse(Signer::verifyWebhook('secret', '1700000000', Signer::signWebhook('secret', 1700000000, '{"a":1}'), '{"a":1}', 1700000301));
        $this->assertFalse(Signer::verifyWebhook('', '1700000000', 'v1='.str_repeat('a', 64), '{}', 1700000000));
        $this->assertFalse(Signer::verifyWebhook('secret', 'abc', 'v1='.str_repeat('a', 64), '{}', 1700000000));
        $this->assertSame(hash_hmac('sha256', '1001', 'k'), Signer::userHash('k', '1001'));
        $this->assertMatchesRegularExpression('/^[0-9a-f]{64}$/', Signer::generateSecret());
    }
}
