package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	clickfix "github.com/ClickSolveMainTR/clickfix-sdks/go"
)

// Adım 4: şirketi bul ve kullanım sinyali gönder (health:write).
func company(ctx context.Context) error {
	client, err := clickfix.New(os.Getenv("CLICKFIX_BASE_URL"), os.Getenv("CLICKFIX_API_KEY"))
	if err != nil {
		return err
	}
	ext := "F-77"
	found, err := client.GetV1PublicApiCompaniesWithResponse(ctx, &clickfix.GetV1PublicApiCompaniesParams{ExternalId: &ext})
	if err != nil {
		return err
	}
	usage, err := client.PutV1PublicApiCompanyUsageWithResponse(ctx,
		// İşlemi tanımlayan sabit değer: kendi ölçüm kaydınızın kimliği (örnekte zaman damgası)
		&clickfix.PutV1PublicApiCompanyUsageParams{IdempotencyKey: fmt.Sprintf("usage-F-77-%d", time.Now().UnixNano())},
		clickfix.PutV1PublicApiCompanyUsageJSONRequestBody{ExternalId: &ext, Score: 82})
	if err != nil {
		return err
	}
	if usage.StatusCode() != 200 {
		return fmt.Errorf("clickfix: HTTP %d", usage.StatusCode())
	}
	return json.NewEncoder(os.Stdout).Encode(map[string]int{"found": found.StatusCode(), "usage": usage.StatusCode()})
}
