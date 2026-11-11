<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Contracts;

/**
 * Implement on the user model to control what identify() receives. Return the fields of the
 * widget's ClickFixIdentity type without user_hash: user_id (string), name, email, phone,
 * company ({id, name, domain, ...}) and attributes. user_id defaults to the model key when omitted.
 *
 * @see https://getclickfix.com/docs/integration-guide#identity
 */
interface ProvidesClickFixIdentity
{
    /** @return array<string, mixed> */
    public function toClickFixIdentity(): array;
}
