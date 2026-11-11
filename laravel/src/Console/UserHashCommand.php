<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Console;

use ClickFix\Laravel\ClickFixManager;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Model;

final class UserHashCommand extends Command
{
    protected $signature = 'clickfix:user-hash
        {user : Primary key of the user (clickfix.contacts.model) or, with --raw, the user_id string itself}
        {--raw : Hash the given value as user_id without loading a model}
        {--json : Print the full identify() payload as JSON}';

    protected $description = 'Compute the widget user_hash for a user (debugging identity verification)';

    public function handle(ClickFixManager $clickfix): int
    {
        $arg = (string) $this->argument('user');
        $user = $arg;
        if (! $this->option('raw')) {
            $model = (string) config('clickfix.contacts.model');
            if (! class_exists($model) || ! is_subclass_of($model, Model::class)) {
                $this->error("clickfix.contacts.model ($model) is not an Eloquent model; use --raw to hash a plain user_id.");

                return self::FAILURE;
            }
            $user = $model::query()->find($arg);
            if ($user === null) {
                $this->error("$model with key $arg not found.");

                return self::FAILURE;
            }
        }
        $identity = $clickfix->identity($user);
        if ($this->option('json')) {
            $this->line((string) json_encode($identity, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));

            return self::SUCCESS;
        }
        $this->table(['Field', 'Value'], [
            ['user_id', $identity['user_id']],
            ['user_hash', $identity['user_hash']],
        ]);
        $this->comment('ClickFix("identify", { user_id: "'.$identity['user_id'].'", user_hash: "'.$identity['user_hash'].'" })');

        return self::SUCCESS;
    }
}
