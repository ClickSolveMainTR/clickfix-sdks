<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Http\Middleware;

use ClickFix\Laravel\ClickFixManager;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Verifies ClickFix-Webhook-Timestamp and ClickFix-Webhook-Signature over the raw body.
 * Alias: `clickfix.webhook`. 401 on a bad or stale signature, 503 while no secret is configured.
 */
final class VerifyWebhookSignature
{
    public function __construct(private readonly ClickFixManager $clickfix) {}

    public function handle(Request $request, Closure $next): Response
    {
        if ($this->clickfix->webhookSecret() === '') {
            return new JsonResponse(['error' => ['code' => 'WEBHOOK_SECRET_MISSING', 'message' => 'CLICKFIX_WEBHOOK_SECRET is not set.']], 503);
        }
        $ok = $this->clickfix->verifyWebhook(
            $request->headers->get('ClickFix-Webhook-Timestamp'),
            $request->headers->get('ClickFix-Webhook-Signature'),
            $request->getContent(),
        );
        if (! $ok) {
            return new JsonResponse(['error' => ['code' => 'WEBHOOK_SIGNATURE_INVALID', 'message' => 'Webhook signature is missing, invalid or stale.']], 401);
        }

        return $next($request);
    }
}
