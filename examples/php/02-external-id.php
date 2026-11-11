<?php
// Adım 2: kişiyi dış kimliğiyle oluştur/güncelle, şirketi dış kimliğiyle bul.
require __DIR__.'/vendor/autoload.php'; // composer require clickfix/sdk guzzlehttp/guzzle

use ClickFix\Client;

$client = new Client(
    getenv('CLICKFIX_BASE_URL'), // https://api.getclickfix.com
    getenv('CLICKFIX_API_KEY'),  // contacts:read, contacts:write, companies:read
);

// Aynı dış kimlikle ikinci çağrı yeni kişi açmaz, günceller (200); ilki 201 döner.
$contact = $client->contacts()->upsertByExternalId(
    '1001',
    ['name' => 'Ayşe Yılmaz', 'email' => 'ayse@example.com'],
    idempotencyKey: 'user-1001-'.(int) (microtime(true) * 1000),
);

// Şirketin dış kimliği kişininkinden ayrıdır (widget: company.id).
$company = $client->companies()->findByExternalId('F-77');

echo json_encode(['contact' => $contact, 'company' => $company]), PHP_EOL;
