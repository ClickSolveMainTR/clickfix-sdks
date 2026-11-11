<?php
// Adım 4: şirket. Şirket widget identify (company.id) ile oluşur; API ile
// bulunur ve müşteri sağlığı sinyalleri (kullanım, gelir, olay) gönderilir.
require __DIR__.'/vendor/autoload.php';

use ClickFix\Client;

$client = new Client(
    getenv('CLICKFIX_BASE_URL'),
    getenv('CLICKFIX_API_KEY'), // companies:read, health:write
);

$found = $client->companies()->findByExternalId('F-77');

// 0-100 arası kullanım sinyali; 30 gün boyunca sağlık puanına katılır.
$usage = $client->companies()->setUsage(
    ['external_id' => 'F-77', 'score' => 82],
    // İşlemi tanımlayan sabit değer: kendi ölçüm kaydınızın kimliği (örnekte zaman damgası)
    idempotencyKey: 'usage-F-77-'.(int) (microtime(true) * 1000),
);

echo json_encode(['found' => $found, 'usage' => $usage]), PHP_EOL;
