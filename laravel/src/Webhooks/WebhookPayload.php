<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Webhooks;

use Illuminate\Support\Carbon;

/** One verified delivery: the JSON body ClickFix posted plus the delivery id header. */
final class WebhookPayload
{
    /** @param  array<string, mixed>  $data */
    public function __construct(
        public readonly string $deliveryId,
        public readonly string $event,
        public readonly string $id,
        public readonly int $version,
        public readonly ?string $occurredAt,
        public readonly array $data,
    ) {}

    /** @param  array<string, mixed>  $body */
    public static function fromArray(string $deliveryId, array $body): self
    {
        return new self(
            deliveryId: $deliveryId,
            event: (string) ($body['event'] ?? ''),
            id: (string) ($body['id'] ?? $deliveryId),
            version: (int) ($body['version'] ?? 1),
            occurredAt: isset($body['occurred_at']) ? (string) $body['occurred_at'] : null,
            data: is_array($body['data'] ?? null) ? $body['data'] : [],
        );
    }

    public function occurredAt(): ?Carbon
    {
        return $this->occurredAt === null ? null : Carbon::parse($this->occurredAt);
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'delivery_id' => $this->deliveryId,
            'id' => $this->id,
            'event' => $this->event,
            'version' => $this->version,
            'occurred_at' => $this->occurredAt,
            'data' => $this->data,
        ];
    }
}
