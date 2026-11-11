<?php

declare(strict_types=1);

namespace ClickFix\Resources;

use ClickFix\ApiResponse;
use ClickFix\Client;

abstract class Resource
{
    public function __construct(protected readonly Client $client)
    {
    }

    /**
     * @param array{0: string, 1: string}  $endpoint   an Endpoints constant
     * @param array<string, mixed>|null    $body
     * @param array<string, scalar|null>   $query
     * @param array<string, string>        $pathParams
     */
    protected function call(array $endpoint, ?array $body = null, array $query = [], array $pathParams = [], ?string $idempotencyKey = null): ApiResponse
    {
        return $this->client->request($endpoint[0], $endpoint[1], $body, $query, $pathParams, $idempotencyKey);
    }
}
