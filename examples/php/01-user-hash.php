<?php
// Adım 1: user_hash sunucuda hesaplanır ve giriş yapmış kullanıcıya verilir.
require __DIR__.'/vendor/autoload.php'; // composer require clickfix/sdk

use ClickFix\UserHash;

// Panel > Web widget > Güvenlik > Kimlik doğrulama anahtarı (bir kez gösterilir)
$secret = getenv('CLICKFIX_IDENTITY_SECRET');

// Oturum açmış kullanıcının sizin sisteminizdeki kimliği (dış kimlik)
function userHashFor(string $secret, string $userId): string
{
    return UserHash::make($secret, $userId);
}

// Örnek: /api/support-session uç noktanız bunu döner, tarayıcı identify'a verir
echo json_encode(['user_id' => '1001', 'user_hash' => userHashFor($secret, '1001')]), PHP_EOL;
