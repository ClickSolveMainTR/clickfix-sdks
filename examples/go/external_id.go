package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	clickfix "github.com/ClickSolveMainTR/clickfix-sdks/go"
)

// Adım 2: kişiyi dış kimliğiyle oluştur/güncelle, şirketi dış kimliğiyle bul.
func externalID(ctx context.Context) error {
	client, err := clickfix.New(os.Getenv("CLICKFIX_BASE_URL"), os.Getenv("CLICKFIX_API_KEY"))
	if err != nil {
		return err
	}
	name, email := "Ayşe Yılmaz", "ayse@example.com"
	key := fmt.Sprintf("user-1001-%d", time.Now().UnixNano())
	res, err := client.PutV1PublicApiContactByExternalIdWithResponse(ctx,
		&clickfix.PutV1PublicApiContactByExternalIdParams{IdempotencyKey: key},
		clickfix.PutV1PublicApiContactByExternalIdJSONRequestBody{ExternalId: "1001", Name: &name, Email: &email})
	if err != nil {
		return err
	}
	if res.StatusCode() != 200 && res.StatusCode() != 201 { // 200 güncellendi, 201 oluşturuldu
		return fmt.Errorf("clickfix: HTTP %d", res.StatusCode())
	}
	ext := "F-77" // şirketin dış kimliği (widget identify: company.id)
	companies, err := client.GetV1PublicApiCompaniesWithResponse(ctx, &clickfix.GetV1PublicApiCompaniesParams{ExternalId: &ext})
	if err != nil {
		return err
	}
	return json.NewEncoder(os.Stdout).Encode(map[string]any{"contact": res.StatusCode(), "companies": companies.StatusCode()})
}
