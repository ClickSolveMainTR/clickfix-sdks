# Adım 4: şirket kullanım sinyali (0-100, health:write); şirket external_id ile bulunur.
curl -sS --fail-with-body -X PUT "$CLICKFIX_BASE_URL/v1/public-api/company-usage" \
  -H "Authorization: Bearer $CLICKFIX_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: usage-F-77-$(date +%s%N)" \
  -d '{ "external_id": "F-77", "score": 82 }'
