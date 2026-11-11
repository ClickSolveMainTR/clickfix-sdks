package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
)

// Adım 8: sistem bağlama. ClickFix bu ucu müşterinin dış kimliğiyle çağırır:
// Panel > Entegrasyonlar > Sistemini bağla > Kaynak: /customers/{external_id}/invoices
func systemEndpoint(ctx context.Context) error {
	token := os.Getenv("SYSTEM_TOKEN") // bağlantıda Bearer olarak girilir
	if token == "" {
		token = "example-system-token"
	}
	http.HandleFunc("GET /customers/{external_id}/invoices", func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "Bearer "+token {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		externalID := r.PathValue("external_id")
		// Gerçek sisteminizde: veritabanından externalID'nin faturaları
		items := []map[string]any{{"number": "F-2026-0042", "total": 1250.5, "currency": "TRY", "status": "paid", "customer_id": externalID}}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{"items": items}) // Kayıt yolu: items
	})
	port := strings.TrimSpace(os.Getenv("PORT"))
	if port == "" {
		port = "3000"
	}
	fmt.Println("listening")
	return http.ListenAndServe("127.0.0.1:"+port, nil)
}
