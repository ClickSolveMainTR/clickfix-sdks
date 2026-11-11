<?php
// Adım 7: webhook aboneliği aç ve teslimatları ham gövde üzerinde doğrula.
// Komut satırından çalışınca aboneliği açar; web sunucusu altında
// (php -S 127.0.0.1:3000 07-webhooks.php ya da framework rotanız) teslimatları doğrular.
require __DIR__.'/vendor/autoload.php';

use ClickFix\Client;
use ClickFix\Webhooks;

if (PHP_SAPI === 'cli') {
    $client = new Client(
        getenv('CLICKFIX_BASE_URL'),
        getenv('CLICKFIX_API_KEY'), // webhooks:write
    );
    $created = $client->webhooks()->create([
        'name' => 'CRM senkronizasyonu',
        'url' => 'https://example.com/clickfix/webhook',
        'events' => ['conversation.created', 'message.received', 'contact.updated'],
        'enabled' => true,
    ], idempotencyKey: 'webhook-crm-'.(int) (microtime(true) * 1000));
    // secret yalnız bu yanıtta döner: güvenli saklayın (ör. gizli değer deposu),
    // loglamayın. Doğrulama sunucunuz onu oradan okur (örnekte CLICKFIX_WEBHOOK_SECRET).
    unset($created['secret']);
    echo json_encode(['subscription' => $created]), PHP_EOL;
    exit;
}

$secret = getenv('CLICKFIX_WEBHOOK_SECRET');
$raw = file_get_contents('php://input'); // ham gövde; JSON'a çevirmeden doğrulayın
$ok = Webhooks::verify(
    $secret,
    $_SERVER['HTTP_CLICKFIX_WEBHOOK_TIMESTAMP'] ?? '',
    $_SERVER['HTTP_CLICKFIX_WEBHOOK_SIGNATURE'] ?? '',
    $raw,
);
if (!$ok) {
    http_response_code(401);
    exit;
}
// ClickFix-Webhook-Id ile tekilleştirin, kaydedin, sonra 2xx dönün.
$event = json_decode($raw, true);
error_log(json_encode(['received' => $event['event'] ?? null]));
http_response_code(200);
