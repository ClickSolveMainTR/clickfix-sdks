package clickfix

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"
)

type doer func(*http.Request) (*http.Response, error)

func (f doer) Do(r *http.Request) (*http.Response, error) { return f(r) }
func TestRetryReplayAndUnsafeWrite(t *testing.T) {
	calls := 0
	var bodies []string
	c := &RetryClient{Attempts: 3, BaseDelay: time.Nanosecond, Client: doer(func(r *http.Request) (*http.Response, error) {
		calls++
		b, _ := io.ReadAll(r.Body)
		bodies = append(bodies, string(b))
		code := 503
		if calls == 2 {
			code = 200
		}
		return &http.Response{StatusCode: code, Header: http.Header{}, Body: io.NopCloser(strings.NewReader("{}"))}, nil
	})}
	r, _ := http.NewRequestWithContext(context.Background(), "POST", "https://example.test", strings.NewReader("same body"))
	r.Header.Set("Idempotency-Key", "test-key")
	res, err := c.Do(r)
	if err != nil || res.StatusCode != 200 || calls != 2 || bodies[0] != bodies[1] {
		t.Fatal("unsafe replay", calls, bodies, err)
	}
	_ = res.Body.Close()
	calls = 0
	r, _ = http.NewRequestWithContext(context.Background(), "POST", "https://example.test", strings.NewReader("body"))
	res, err = c.Do(r)
	if err != nil || calls != 1 {
		t.Fatal("unsafe write retried", calls, err)
	}
	_ = res.Body.Close()
}
func TestWebhookTamperAndFreshness(t *testing.T) {
	now := time.Unix(1700000000, 0)
	body := []byte(`{"event":"created"}`)
	mac := hmac.New(sha256.New, []byte("test"))
	_, _ = mac.Write(append([]byte("1700000000."), body...))
	sig := "v1=" + hex.EncodeToString(mac.Sum(nil))
	if err := VerifyWebhook("test", "1700000000", sig, body, now, 5*time.Minute); err != nil {
		t.Fatal(err)
	}
	for _, tc := range []struct {
		body []byte
		now  time.Time
	}{{[]byte("changed"), now}, {body, now.Add(6 * time.Minute)}, {body, now.Add(-6 * time.Minute)}} {
		if VerifyWebhook("test", "1700000000", sig, tc.body, tc.now, 5*time.Minute) == nil {
			t.Fatal("tampered/stale signature accepted")
		}
	}
}
func TestPaginationAndCancellation(t *testing.T) {
	offsets := []int{}
	items := []int{}
	err := Iterate(context.Background(), func(_ context.Context, _ int, offset int) (Page[int], error) {
		offsets = append(offsets, offset)
		if offset == 0 {
			return Page[int]{Items: []int{1, 2}, Total: 100}, nil
		}
		return Page[int]{}, nil
	}, func(v int) bool { items = append(items, v); return true })
	if err != nil || len(items) != 2 || len(offsets) != 2 || offsets[1] != 2 {
		t.Fatal(items, offsets, err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if Iterate(ctx, func(context.Context, int, int) (Page[int], error) {
		t.Fatal("called after cancellation")
		return Page[int]{}, nil
	}, func(int) bool { return true }) == nil {
		t.Fatal("cancellation lost")
	}
}

// The company-signed user_hash is HMAC over user id, newline,
// company id; it never collides with the user-only hash or with plain
// concatenation, and the backend verifies exactly these bytes.
func TestIdentityCompanyHash(t *testing.T) {
	const secret = "identity-secret-0123456789abcdef"
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte("1001\nF-77"))
	if got, want := IdentityCompanyHash(secret, "1001", "F-77"), hex.EncodeToString(mac.Sum(nil)); got != want {
		t.Fatalf("IdentityCompanyHash = %s, want %s", got, want)
	}
	if IdentityCompanyHash(secret, "1001", "") != IdentityHash(secret, "1001") {
		t.Fatal("empty company id must fall back to the user-only hash")
	}
	if IdentityCompanyHash(secret, "1001", "F-77") == IdentityHash(secret, "1001F-77") {
		t.Fatal("company hash must not equal the hash of the concatenated ids")
	}
	if IdentityCompanyHash(secret, "1", "12") == IdentityCompanyHash(secret, "11", "2") {
		t.Fatal("the separator must keep the ids apart")
	}
	if IdentityCompanyHash(secret, "10\n01", "F-77") != "" || IdentityCompanyHash(secret, "1001", "F\r77") != "" {
		t.Fatal("ids with line breaks must not be signed")
	}
}

func TestDecodeDataAndListPageQuery(t *testing.T) {
	type company struct {
		UUID       string `json:"uuid"`
		ExternalID string `json:"external_id"`
	}
	env := &IntegrationEnvelope{Success: true, Data: map[string]any{
		"items": []any{map[string]any{"uuid": "c-1", "external_id": "F-77"}}, "total": 1, "limit": 100, "offset": 0,
	}}
	page, err := DecodeData[Page[company]](env)
	if err != nil || page.Total != 1 || len(page.Items) != 1 || page.Items[0].ExternalID != "F-77" {
		t.Fatal(page, err)
	}
	if _, err := DecodeData[Page[company]](nil); err == nil {
		t.Fatal("nil envelope accepted")
	}

	var gotQuery url.Values
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v1/public-api/companies" || r.Header.Get("Authorization") != "Bearer k" {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		gotQuery = r.URL.Query()
		_, _ = w.Write([]byte(`{"success":true,"data":{"items":[{"uuid":"c-1","external_id":"F-77"}],"total":1,"limit":5,"offset":0},"meta":{}}`))
	}))
	defer srv.Close()
	c, err := New(srv.URL, "k")
	if err != nil {
		t.Fatal(err)
	}
	p, err := ListPageQuery[company](context.Background(), c, "companies", 5, 0, url.Values{"external_id": {"F-77"}, "limit": {"999"}})
	if err != nil || len(p.Items) != 1 || p.Items[0].UUID != "c-1" {
		t.Fatal(p, err)
	}
	if gotQuery.Get("external_id") != "F-77" || gotQuery.Get("limit") != "5" || gotQuery.Get("offset") != "0" {
		t.Fatal(gotQuery)
	}
}
