<?php
// Adım 5: olaylar. Ekran bağlamı widget'tan (track) gelir; ürün olayları
// şirket zaman çizelgesine API ile yazılır (events:write).
require __DIR__.'/vendor/autoload.php';

use ClickFix\Client;

$client = new Client(getenv('CLICKFIX_BASE_URL'), getenv('CLICKFIX_API_KEY'));

// Olayı sizin sisteminizde tanımlayan kimlik; tekrar gönderimde aynı kalır (örnekte zaman damgası)
$eventId = 'seat-limit-F-77-'.(int) (microtime(true) * 1000);

// idempotency_key aynı zamanda Idempotency-Key başlığı olur.
$event = $client->events()->track([
    'external_id' => 'F-77', // şirketin dış kimliği (ya da company_uuid / domain)
    'contact_email' => 'ayse@example.com', // olayı bilinen kişiye bağlar
    'name' => 'seat_limit_reached',
    'properties' => ['seats' => 12, 'limit' => 12],
    'idempotency_key' => $eventId,
]);

echo json_encode($event), PHP_EOL;
