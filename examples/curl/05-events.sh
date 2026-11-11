# Adım 5: ürün olayını şirket zaman çizelgesine yaz (events:write).
# Olayı sizin sisteminizde tanımlayan kimlik; tekrar gönderimde aynı kalır (örnekte zaman damgası)
EVENT_ID="seat-limit-F-77-$(date +%s%N)"
curl -sS --fail-with-body -X POST "$CLICKFIX_BASE_URL/v1/public-api/company-events" \
  -H "Authorization: Bearer $CLICKFIX_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $EVENT_ID" \
  -d '{ "external_id": "F-77", "contact_email": "ayse@example.com", "name": "seat_limit_reached", "properties": { "seats": 12, "limit": 12 }, "idempotency_key": "'$EVENT_ID'" }'
