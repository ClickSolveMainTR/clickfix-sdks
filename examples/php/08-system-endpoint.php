<?php
// Adım 8: sistem bağlama. ClickFix sizin sisteminizi çağırır; siz yalnız
// müşterinin dış kimliğiyle cevap veren bir uç yazarsınız. Panelde
// Entegrasyonlar > Sistemini bağla > Kaynak: /customers/{external_id}/invoices
// Çalıştırma: php -S 127.0.0.1:3000 08-system-endpoint.php (ya da framework rotanız)

$token = getenv('SYSTEM_TOKEN') ?: 'example-system-token'; // bağlantıda Bearer

if (($_SERVER['HTTP_AUTHORIZATION'] ?? '') !== 'Bearer '.$token) {
    http_response_code(401);
    exit;
}
$path = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '';
if (!preg_match('#^/customers/([^/]+)/invoices$#', $path, $m)) {
    http_response_code(404);
    exit;
}
$externalId = rawurldecode($m[1]);
// Gerçek sisteminizde: veritabanından externalId'nin faturaları
$items = [
    [
        'number' => 'F-2026-0042',
        'total' => 1250.5,
        'currency' => 'TRY',
        'status' => 'paid',
        'customer_id' => $externalId,
    ],
];
header('Content-Type: application/json');
echo json_encode(['items' => $items]); // Kayıt yolu: items
