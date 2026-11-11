package main

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"
)

// Adım 6: API kanalına müşteri mesajı gönder; imza kanalın imza anahtarıyla.
func apiChannel(ctx context.Context) error {
	base, instance, secret := os.Getenv("CLICKFIX_BASE_URL"), os.Getenv("CLICKFIX_CHANNEL_INSTANCE"), os.Getenv("CLICKFIX_CHANNEL_SECRET")
	body, _ := json.Marshal(map[string]string{
		"id":          fmt.Sprintf("msg-%d", time.Now().UnixNano()), // kanal içinde tekil
		"sender_id":   "1001",                                       // müşterinin sizin sisteminizdeki kimliği
		"sender_name": "Ayşe Yılmaz",
		"text":        "Siparişim ne zaman gelir?",
	})
	timestamp := strconv.FormatInt(time.Now().Unix(), 10)
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(timestamp + "."))
	mac.Write(body)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, base+"/v1/webhooks/channels/api/"+instance, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-ClickFix-Timestamp", timestamp)
	req.Header.Set("X-ClickFix-Signature", "sha256="+hex.EncodeToString(mac.Sum(nil)))
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return fmt.Errorf("clickfix: HTTP %d", res.StatusCode)
	}
	return json.NewEncoder(os.Stdout).Encode(map[string]int{"status": res.StatusCode})
}
