<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Tests\Fixtures;

use ClickFix\Laravel\Contracts\ProvidesClickFixIdentity;

final class IdentityUser extends User implements ProvidesClickFixIdentity
{
    public function toClickFixIdentity(): array
    {
        return ['user_id' => 'crm-77', 'name' => 'Custom', 'company' => ['id' => 'F-77', 'name' => 'Acme'], 'user_hash' => 'ignored'];
    }
}
