<?php
// Adım 6: API kanalı. Kendi uygulamanızdaki müşteri mesajını ClickFix'e
// gönderin; imza API anahtarıyla değil kanalın imza anahtarıyla atılır.
require __DIR__.'/vendor/autoload.php';

use ClickFix\ApiChannel;

$channel = new ApiChannel(
    getenv('CLICKFIX_BASE_URL'),
    getenv('CLICKFIX_CHANNEL_INSTANCE'), // Kanallar > API kanalı
    getenv('CLICKFIX_CHANNEL_SECRET'),
);

// X-ClickFix-Timestamp ve X-ClickFix-Signature başlıklarını SDK ekler.
$received = $channel->send([
    'id' => 'msg-'.(int) (microtime(true) * 1000), // kanal içinde tekil; aynı id bir kez kaydedilir
    'sender_id' => '1001', // müşterinin sizin sisteminizdeki kimliği
    'sender_name' => 'Ayşe Yılmaz',
    'text' => 'Siparişim ne zaman gelir?',
]);

echo json_encode($received), PHP_EOL;
