# Adım 2: kişiyi dış kimliğiyle oluştur/güncelle (201 oluşturuldu, 200 güncellendi).
curl -sS --fail-with-body -X PUT "$CLICKFIX_BASE_URL/v1/public-api/contacts/by-external-id" \
  -H "Authorization: Bearer $CLICKFIX_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: user-1001-$(date +%s)" \
  -d '{ "external_id": "1001", "name": "Ayşe Yılmaz", "email": "ayse@example.com" }'

# Şirketi kendi dış kimliğiyle bul (kişi dış kimliğinden ayrıdır).
curl -sS --fail-with-body "$CLICKFIX_BASE_URL/v1/public-api/companies?external_id=F-77" \
  -H "Authorization: Bearer $CLICKFIX_API_KEY"
