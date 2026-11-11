<?php
// Adım 3: özel alanlar. Alanı panelde tanımlayın (Ayarlar > Özel alanlar);
// anahtarı neyse custom_fields içinde o anahtarla gönderin.
require __DIR__.'/vendor/autoload.php';

use ClickFix\Client;

$client = new Client(getenv('CLICKFIX_BASE_URL'), getenv('CLICKFIX_API_KEY'));

// Liste alanlarında seçeneğin kimliği ya da etiketi kabul edilir.
$contact = $client->customFields()->setForContact(
    '1001',
    ['plan' => 'pro', 'seats' => 12, 'renewal_date' => '2027-01-31'],
    idempotencyKey: 'user-1001-fields-'.(int) (microtime(true) * 1000),
);

echo json_encode($contact), PHP_EOL;
