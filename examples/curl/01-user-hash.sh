# Adım 1: user_hash = hex(HMAC-SHA256(kimlik_anahtari, user_id)); yalnız sunucuda.
USER_ID="1001"
printf '%s' "$USER_ID" | openssl dgst -sha256 -hmac "$CLICKFIX_IDENTITY_SECRET" | sed 's/^.* //'
# Firma ile (company: { id }): imza user_id + "\n" + company_id üzerinden hesaplanır.
COMPANY_ID="F-77"
printf '%s\n%s' "$USER_ID" "$COMPANY_ID" | openssl dgst -sha256 -hmac "$CLICKFIX_IDENTITY_SECRET" | sed 's/^.* //'
