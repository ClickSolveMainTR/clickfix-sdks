# Adım 7: webhook aboneliği (webhooks:write). data.secret yalnız bu yanıtta döner.
curl -sS --fail-with-body -X POST "$CLICKFIX_BASE_URL/v1/public-api/webhooks" \
  -H "Authorization: Bearer $CLICKFIX_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: webhook-crm-$(date +%s)" \
  -d '{ "name": "CRM senkronizasyonu", "url": "https://example.com/clickfix/webhook", "events": ["conversation.created", "message.received", "contact.updated"], "enabled": true }'
