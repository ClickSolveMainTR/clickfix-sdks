package main

import (
	"context"
	"encoding/json"
	"os"

	clickfix "github.com/ClickSolveMainTR/clickfix-sdks/go"
)

// Adım 1: user_hash sunucuda hesaplanır; anahtar tarayıcıya ve uygulamaya gitmez.
func userHash(ctx context.Context) error {
	secret := os.Getenv("CLICKFIX_IDENTITY_SECRET") // Panel > Web widget > Güvenlik
	userID := "1001"                                // kullanıcının sizin sisteminizdeki kimliği
	companyID := "F-77"                             // firmasının kimliği (identify: company.id)
	return json.NewEncoder(os.Stdout).Encode(map[string]string{
		"user_id":   userID,
		"user_hash": clickfix.IdentityHash(secret, userID), // firmasız: eski formül
		// Firma ile: imza user_id + "\n" + company_id üzerinden; company: { id } ile gönderilir.
		"company_id":        companyID,
		"company_user_hash": clickfix.IdentityCompanyHash(secret, userID, companyID),
	})
}
