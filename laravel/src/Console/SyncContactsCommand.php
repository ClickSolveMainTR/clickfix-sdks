<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Console;

use ClickFix\Laravel\ClickFixManager;
use ClickFix\Laravel\Support\Identity;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;

/**
 * Upserts the configured model into ClickFix contacts by external id
 * (PUT /v1/public-api/contacts/by-external-id, scope contacts:write). external_id is the model key,
 * the same value identify() sends as user_id, so widget sessions and synced contacts meet.
 */
final class SyncContactsCommand extends Command
{
    protected $signature = 'clickfix:sync:contacts
        {--id=* : Only these model keys}
        {--since= : Only rows updated after this date/time (updated_at)}
        {--chunk= : Rows per chunk (default clickfix.contacts.chunk)}
        {--dry-run : Print the payloads without calling the API}';

    protected $description = 'Create or update ClickFix contacts from the configured Eloquent model (external_id = model key)';

    public function handle(ClickFixManager $clickfix): int
    {
        $model = (string) config('clickfix.contacts.model');
        if (! class_exists($model) || ! is_subclass_of($model, Model::class)) {
            $this->error("clickfix.contacts.model ($model) is not an Eloquent model.");

            return self::FAILURE;
        }
        $fields = array_filter((array) config('clickfix.contacts.fields', []), fn ($v) => $v !== null && $v !== '');
        $custom = array_filter((array) config('clickfix.contacts.custom_fields', []), fn ($v) => $v !== null && $v !== '');
        $chunk = max(1, (int) ($this->option('chunk') ?: config('clickfix.contacts.chunk', 200)));

        /** @var Builder<Model> $query */
        $query = $model::query();
        $instance = new $model;
        if ($ids = $this->option('id')) {
            $query->whereKey($ids);
        }
        if ($since = $this->option('since')) {
            $query->where($instance->getUpdatedAtColumn() ?? 'updated_at', '>=', $since);
        }

        $counts = ['created' => 0, 'updated' => 0, 'failed' => 0, 'skipped' => 0];
        $dry = (bool) $this->option('dry-run');
        $http = $dry ? null : $clickfix->http();
        $query->chunkById($chunk, function ($rows) use ($fields, $custom, $dry, $http, &$counts) {
            foreach ($rows as $row) {
                $body = $this->payload($row, $fields, $custom);
                if ($dry) {
                    $this->line((string) json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
                    $counts['skipped']++;

                    continue;
                }
                $key = 'laravel-sync-'.substr(hash('sha256', (string) json_encode($body)), 0, 40);
                try {
                    $response = $http->withHeaders(['Idempotency-Key' => $key])->put('/v1/public-api/contacts/by-external-id', $body);
                } catch (ConnectionException $e) {
                    $counts['failed']++;
                    $this->error($body['external_id'].': '.$e->getMessage());

                    continue;
                } catch (RequestException $e) {
                    $response = $e->response;
                }
                match ($response->status()) {
                    201 => $counts['created']++,
                    200 => $counts['updated']++,
                    default => $this->recordFailure($counts, $body['external_id'], $response->status(), (string) $response->json('error.code', '')),
                };
            }
        });

        $this->info(sprintf('created %d, updated %d, failed %d%s', $counts['created'], $counts['updated'], $counts['failed'], $dry ? ", dry-run {$counts['skipped']}" : ''));

        return $counts['failed'] > 0 ? self::FAILURE : self::SUCCESS;
    }

    /**
     * @param  array<string, string>  $fields
     * @param  array<string, string>  $custom
     * @return array<string, mixed>
     */
    private function payload(Model $row, array $fields, array $custom): array
    {
        $body = ['external_id' => Identity::idOf($row)];
        foreach ($fields as $field => $path) {
            $value = data_get($row, $path);
            if ($value !== null && $value !== '') {
                $body[$field] = is_scalar($value) ? (string) $value : $value;
            }
        }
        $customFields = [];
        foreach ($custom as $key => $path) {
            $value = data_get($row, $path);
            if ($value !== null) {
                $customFields[$key] = $value;
            }
        }
        if ($customFields) {
            $body['custom_fields'] = $customFields;
        }

        return $body;
    }

    /** @param  array<string, int>  $counts */
    private function recordFailure(array &$counts, string $externalId, int $status, string $code): void
    {
        $counts['failed']++;
        $this->error("$externalId: HTTP $status $code");
    }
}
