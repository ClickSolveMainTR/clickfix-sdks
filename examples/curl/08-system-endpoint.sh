# Adım 8: ClickFix'in sisteminize atacağı çağrının aynısı (Sistemini bağla > Dene düğmesi).
# SYSTEM_BASE_URL sizin sisteminiz, {external_id} müşterinin dış kimliğidir.
curl -sS --fail-with-body "$SYSTEM_BASE_URL/customers/1001/invoices" \
  -H "Authorization: Bearer $SYSTEM_TOKEN"
