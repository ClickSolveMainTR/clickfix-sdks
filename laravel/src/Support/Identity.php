<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Support;

use ClickFix\Laravel\Contracts\ProvidesClickFixIdentity;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;

/** Builds the identify() payload (without user_hash) for a user model or a raw user id. */
final class Identity
{
    /**
     * @param  array<string, string|null>  $fields  identify field => model attribute or dotted path
     * @return array<string, mixed> with a string user_id
     */
    public static function for(mixed $user, array $fields = []): array
    {
        if ($user instanceof ProvidesClickFixIdentity) {
            $identity = $user->toClickFixIdentity();
            $identity['user_id'] = isset($identity['user_id']) ? (string) $identity['user_id'] : self::idOf($user);
            unset($identity['user_hash']);

            return $identity;
        }

        $identity = ['user_id' => self::idOf($user)];
        if (is_object($user)) {
            foreach ($fields as $field => $path) {
                if ($path === null || $path === '') {
                    continue;
                }
                $value = data_get($user, $path);
                if ($value !== null && $value !== '') {
                    $identity[$field] = is_scalar($value) ? (string) $value : $value;
                }
            }
        }

        return $identity;
    }

    public static function idOf(mixed $user): string
    {
        if ($user instanceof Authenticatable) {
            $id = $user->getAuthIdentifier();
        } elseif ($user instanceof Model) {
            $id = $user->getKey();
        } elseif (is_scalar($user) || $user instanceof \Stringable) {
            $id = $user;
        } else {
            throw new \InvalidArgumentException('ClickFix identity needs a user model or a user id.');
        }
        $id = trim((string) $id);
        if ($id === '') {
            throw new \InvalidArgumentException('ClickFix identity: the user id is empty.');
        }

        return $id;
    }
}
