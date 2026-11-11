# Adım 6: API kanalına müşteri mesajı; imza kanalın imza anahtarıyla (API anahtarı değil).
BODY='{"id":"msg-'$(date +%s)'","sender_id":"1001","sender_name":"Ayşe Yılmaz","text":"Siparişim ne zaman gelir?"}'
TS=$(date +%s)
SIG=$(printf '%s.%s' "$TS" "$BODY" | openssl dgst -sha256 -hmac "$CLICKFIX_CHANNEL_SECRET" | sed 's/^.* //')
curl -sS --fail-with-body -X POST "$CLICKFIX_BASE_URL/v1/webhooks/channels/api/$CLICKFIX_CHANNEL_INSTANCE" \
  -H "Content-Type: application/json" \
  -H "X-ClickFix-Timestamp: $TS" \
  -H "X-ClickFix-Signature: sha256=$SIG" \
  -d "$BODY"
