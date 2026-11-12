<?php

declare(strict_types=1);

namespace ClickFix\Laravel;

use ClickFix\Client;
use ClickFix\Laravel\Exceptions\MissingConfiguration;
use ClickFix\Laravel\Support\Identity;
use ClickFix\Laravel\Support\Signer;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\HtmlString;

/** What the ClickFix facade resolves to. Bound as a singleton under "clickfix". */
class ClickFixManager
{
    private ?Client $client = null;

    public function __construct(
        private readonly Repository $config,
        private readonly HttpFactory $http,
    ) {}

    /** The clickfix/sdk client configured from config/clickfix.php, for API calls from app code. */
    public function client(): Client
    {
        // PSR-18 transport is discovered (Guzzle ships with Laravel); the timeout applies to that client.
        return $this->client ??= new Client($this->baseUrl(), $this->apiKey(), timeout: (float) $this->timeout());
    }

    /**
     * A Laravel HTTP client bound to the API: bearer key, JSON, timeout, retries on 429/5xx.
     * Used by the artisan commands so Http::fake() covers them in tests.
     */
    public function http(): PendingRequest
    {
        return $this->http
            ->baseUrl($this->baseUrl())
            ->withToken($this->apiKey())
            ->acceptJson()
            ->timeout($this->timeout())
            ->retry(3, 250, fn ($e, $request) => $e instanceof \Illuminate\Http\Client\ConnectionException
                || ($e instanceof \Illuminate\Http\Client\RequestException && in_array($e->response->status(), [429, 502, 503, 504], true)), false);
    }

    /**
     * user_hash for identify(): computed here, never in the browser. With $companyId (the company id
     * sent as identify company.id) the hash signs both ids, and the widget reports company_verified.
     */
    public function userHash(mixed $user, ?string $companyId = null): string
    {
        return Signer::userHash($this->identitySecret(), Identity::idOf($user), $companyId);
    }

    /**
     * The identify() payload for a user: user_id, user_hash and the configured profile fields.
     * When the payload carries company.id (from toClickFixIdentity() or a "company.id" field in
     * clickfix.widget.user), user_hash signs the user id and the company id together.
     * Share it with Inertia or a JSON endpoint and pass it to ClickFix("identify", ...).
     *
     * @return array<string, mixed>
     */
    public function identity(mixed $user): array
    {
        $identity = Identity::for($user, (array) $this->config->get('clickfix.widget.user', []));
        $identity['user_hash'] = Signer::userHash($this->identitySecret(), $identity['user_id'], Identity::companyIdOf($identity));

        return $identity;
    }

    /**
     * The widget embed: queue snippet, ClickFix("boot", {...}) and the async widget.js tag.
     * $user null renders an anonymous widget. $options are boot options (locale, theme, ...).
     *
     * @param  array<string, mixed>  $options
     */
    public function widget(mixed $user = null, array $options = []): HtmlString
    {
        $widgetId = (string) $this->config->get('clickfix.widget.id', '');
        if ($widgetId === '') {
            throw MissingConfiguration::key('clickfix.widget.id', 'CLICKFIX_WIDGET_ID');
        }
        $boot = array_merge(
            ['widgetId' => $widgetId],
            (array) $this->config->get('clickfix.widget.options', []),
            $options,
        );
        if ($user !== null) {
            $boot['user'] = $this->identity($user);
        }
        $flags = JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR;
        $script = htmlspecialchars((string) $this->config->get('clickfix.widget.script_url', 'https://getclickfix.com/widget.js'), ENT_QUOTES, 'UTF-8');

        return new HtmlString(
            "<script>window.ClickFix=window.ClickFix||function(){(window.ClickFix.q=window.ClickFix.q||[]).push(arguments)};"
            ."ClickFix(\"boot\",".json_encode($boot, $flags).");</script>\n"
            ."<script src=\"$script\" async></script>"
        );
    }

    public function verifyWebhook(?string $timestamp, ?string $signature, string $body, ?int $now = null): bool
    {
        return Signer::verifyWebhook($this->webhookSecret(), $timestamp, $signature, $body, $now, $this->webhookTolerance());
    }

    public function signWebhook(int $timestamp, string $body): string
    {
        return Signer::signWebhook($this->webhookSecret(), $timestamp, $body);
    }

    public function apiKey(): string
    {
        $key = (string) $this->config->get('clickfix.api_key', '');
        if ($key === '') {
            throw MissingConfiguration::key('clickfix.api_key', 'CLICKFIX_API_KEY');
        }

        return $key;
    }

    public function baseUrl(): string
    {
        return rtrim((string) $this->config->get('clickfix.base_url', 'https://api.getclickfix.com'), '/');
    }

    public function timeout(): int
    {
        return max(1, (int) $this->config->get('clickfix.timeout', 10));
    }

    public function identitySecret(): string
    {
        $secret = (string) $this->config->get('clickfix.widget.identity_secret', '');
        if ($secret === '') {
            throw MissingConfiguration::key('clickfix.widget.identity_secret', 'CLICKFIX_IDENTITY_SECRET');
        }

        return $secret;
    }

    public function webhookSecret(): string
    {
        return (string) $this->config->get('clickfix.webhook.secret', '');
    }

    public function webhookTolerance(): int
    {
        return (int) $this->config->get('clickfix.webhook.tolerance', 300);
    }
}
