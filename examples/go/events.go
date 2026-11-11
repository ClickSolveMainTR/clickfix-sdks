package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	clickfix "github.com/ClickSolveMainTR/clickfix-sdks/go"
)

// Adım 5: ürün olayını şirket zaman çizelgesine yaz (events:write).
func events(ctx context.Context) error {
	client, err := clickfix.New(os.Getenv("CLICKFIX_BASE_URL"), os.Getenv("CLICKFIX_API_KEY"))
	if err != nil {
		return err
	}
	// Olayı sizin sisteminizde tanımlayan kimlik; tekrar gönderimde aynı kalır (örnekte zaman damgası)
	ext, email, idem := "F-77", "ayse@example.com", fmt.Sprintf("seat-limit-F-77-%d", time.Now().UnixNano())
	props := map[string]any{"seats": 12, "limit": 12}
	res, err := client.PostV1PublicApiCompanyEventWithResponse(ctx,
		&clickfix.PostV1PublicApiCompanyEventParams{IdempotencyKey: idem},
		clickfix.PostV1PublicApiCompanyEventJSONRequestBody{
			ExternalId: &ext, ContactEmail: &email, Name: "seat_limit_reached", Properties: &props, IdempotencyKey: &idem,
		})
	if err != nil {
		return err
	}
	if res.StatusCode() != 200 && res.StatusCode() != 201 {
		return fmt.Errorf("clickfix: HTTP %d", res.StatusCode())
	}
	return json.NewEncoder(os.Stdout).Encode(map[string]int{"status": res.StatusCode()})
}
