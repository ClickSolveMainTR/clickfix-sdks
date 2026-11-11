package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	clickfix "github.com/ClickSolveMainTR/clickfix-sdks/go"
)

// Adım 3: özel alanlar; anahtar panelde tanımladığınız alanın anahtarıdır.
func customFields(ctx context.Context) error {
	client, err := clickfix.New(os.Getenv("CLICKFIX_BASE_URL"), os.Getenv("CLICKFIX_API_KEY"))
	if err != nil {
		return err
	}
	fields := map[string]any{"plan": "pro", "seats": 12, "renewal_date": "2027-01-31"}
	res, err := client.PutV1PublicApiContactByExternalIdWithResponse(ctx,
		&clickfix.PutV1PublicApiContactByExternalIdParams{IdempotencyKey: fmt.Sprintf("user-1001-fields-%d", time.Now().UnixNano())},
		clickfix.PutV1PublicApiContactByExternalIdJSONRequestBody{ExternalId: "1001", CustomFields: &fields})
	if err != nil {
		return err
	}
	if res.StatusCode() != 200 && res.StatusCode() != 201 {
		return fmt.Errorf("clickfix: HTTP %d", res.StatusCode())
	}
	return json.NewEncoder(os.Stdout).Encode(map[string]int{"status": res.StatusCode()})
}
