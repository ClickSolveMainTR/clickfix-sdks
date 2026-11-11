# Adım 3: özel alanlar; anahtar panelde tanımlı alanın anahtarıdır.
curl -sS --fail-with-body -X PUT "$CLICKFIX_BASE_URL/v1/public-api/contacts/by-external-id" \
  -H "Authorization: Bearer $CLICKFIX_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: user-1001-fields-$(date +%s)" \
  -d '{ "external_id": "1001", "custom_fields": { "plan": "pro", "seats": 12, "renewal_date": "2027-01-31" } }'
