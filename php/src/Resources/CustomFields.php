<?php

declare(strict_types=1);

namespace ClickFix\Resources;

/**
 * Custom fields travel inside the contact payload (`custom_fields`): define the field in the panel
 * (Settings > Custom fields) and send its key here. List fields accept the option id or its label.
 */
final class CustomFields extends Resource
{
    /**
     * Set custom field values on the contact with this external id (creates the contact when missing).
     *
     * @param array<string, mixed> $fields key => value
     *
     * @return array<string, mixed> the Contact
     */
    public function setForContact(string $externalId, array $fields, ?string $idempotencyKey = null): array
    {
        return $this->client->contacts()->upsertByExternalId($externalId, ['custom_fields' => $fields], $idempotencyKey);
    }

    /**
     * Set custom field values on a contact by uuid.
     *
     * @param array<string, mixed> $fields key => value
     *
     * @return array<string, mixed> the Contact
     */
    public function setForContactUuid(string $uuid, array $fields, ?string $idempotencyKey = null): array
    {
        return $this->client->contacts()->update($uuid, ['custom_fields' => $fields], $idempotencyKey);
    }
}
