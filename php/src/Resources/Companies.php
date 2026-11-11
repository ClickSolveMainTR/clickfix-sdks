<?php

declare(strict_types=1);

namespace ClickFix\Resources;

use ClickFix\Endpoints;
use ClickFix\Page;
use ClickFix\Paginator;

/**
 * Companies (`companies:read`) and customer health signals (`health:write`).
 * Companies are created by the widget (identify with company.id); the API finds them and feeds signals.
 */
final class Companies extends Resource
{
    /**
     * One page. Query: `limit`, `offset`, `external_id`.
     *
     * @param array<string, scalar|null> $query
     */
    public function list(array $query = []): Page
    {
        return $this->call(Endpoints::GET_COMPANIES, null, $query)->page();
    }

    /**
     * @param array<string, scalar|null> $query
     */
    public function all(array $query = []): Paginator
    {
        return $this->client->paginate(fn (int $limit, int $offset): Page => $this->list(['limit' => $limit, 'offset' => $offset] + $query));
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findByExternalId(string $externalId): ?array
    {
        $page = $this->list(['external_id' => $externalId, 'limit' => 1]);

        return $page->items[0] ?? null;
    }

    /**
     * Usage signal 0-100 (PUT /company-usage); counts toward the health score for 30 days.
     *
     * @param array<string, mixed> $input a CompanyUsageInput: `score` plus `external_id`, `company_uuid` or `domain`
     *
     * @return array<string, mixed>
     */
    public function setUsage(array $input, ?string $idempotencyKey = null): array
    {
        return $this->call(Endpoints::PUT_COMPANY_USAGE, $input, [], [], $idempotencyKey)->object();
    }

    /**
     * Revenue upsert (PUT /company-revenue).
     *
     * @param array<string, mixed> $input a CompanyRevenueUpsertInput
     *
     * @return array<string, mixed>
     */
    public function setRevenue(array $input, ?string $idempotencyKey = null): array
    {
        return $this->call(Endpoints::PUT_COMPANY_REVENUE, $input, [], [], $idempotencyKey)->object();
    }
}
