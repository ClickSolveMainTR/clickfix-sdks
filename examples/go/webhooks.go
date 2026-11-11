package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	clickfix "github.com/ClickSolveMainTR/clickfix-sdks/go"
)

// Adım 7: webhook aboneliği aç ve teslimatları ham gövde üzerinde doğrula.
func webhooks(ctx context.Context) error {
	client, err := clickfix.New(os.Getenv("CLICKFIX_BASE_URL"), os.Getenv("CLICKFIX_API_KEY"))
	if err != nil {
		return err
	}
	res, err := client.PostV1PublicApiWebhooksWithResponse(ctx,
		&clickfix.PostV1PublicApiWebhooksParams{IdempotencyKey: fmt.Sprintf("webhook-crm-%d", time.Now().UnixNano())},
		clickfix.PostV1PublicApiWebhooksJSONRequestBody{
			Name: "CRM senkronizasyonu", Url: "https://example.com/clickfix/webhook",
			Events: []string{"conversation.created", "message.received", "contact.updated"}, Enabled: true,
		})
	if err != nil {
		return err
	}
	if res.StatusCode() != 201 {
		return fmt.Errorf("clickfix: HTTP %d", res.StatusCode())
	}
	var created struct {
		Data struct {
			Secret string `json:"secret"` // yalnız bu yanıtta döner
		} `json:"data"`
	}
	if err := json.Unmarshal(res.Body, &created); err != nil {
		return err
	}
	// Yalnız bu yanıtta döner: güvenli saklayın, loglamayın; sunucu onu oradan okur.
	secret := os.Getenv("CLICKFIX_WEBHOOK_SECRET")
	if secret == "" {
		secret = created.Data.Secret
	}
	fmt.Println(`{"subscription":"created"}`)

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		raw, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		if err := clickfix.VerifyWebhook(secret, r.Header.Get("ClickFix-Webhook-Timestamp"),
			r.Header.Get("ClickFix-Webhook-Signature"), raw, time.Now(), 5*time.Minute); err != nil {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		// ClickFix-Webhook-Id ile tekilleştirin, kaydedin, sonra 2xx dönün.
		var event struct {
			Event string `json:"event"`
		}
		_ = json.Unmarshal(raw, &event)
		fmt.Printf(`{"received":%q}`+"\n", event.Event)
		w.WriteHeader(http.StatusOK)
	})
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}
	fmt.Println("listening")
	return http.ListenAndServe("127.0.0.1:"+port, nil)
}
