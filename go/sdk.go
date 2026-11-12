// Package clickfix provides a generated public API client and server-side helpers.
package clickfix

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

// SDK combines generated operations with the authenticated transport.
type SDK struct {
	*ClientWithResponses
	raw *Client
}

// New authenticates every generated operation. baseURL is the API origin, without /v1.
func New(baseURL, key string) (*SDK, error) {
	if strings.TrimSpace(key) == "" {
		return nil, errors.New("clickfix: API key required")
	}
	raw, err := NewClient(baseURL, WithHTTPClient(&RetryClient{Client: &http.Client{Timeout: 30 * time.Second}, Attempts: 3}), WithRequestEditorFn(func(_ context.Context, r *http.Request) error {
		r.Header.Set("Authorization", "Bearer "+key)
		return nil
	}))
	if err != nil {
		return nil, err
	}
	return &SDK{ClientWithResponses: &ClientWithResponses{ClientInterface: raw}, raw: raw}, nil
}

// RetryClient retries reads and replayable writes carrying an Idempotency-Key.
// Attempts includes the first request and is capped at five. Cancellation interrupts backoff.
type RetryClient struct {
	Client    HttpRequestDoer
	Attempts  int
	BaseDelay time.Duration
}

func (c *RetryClient) Do(req *http.Request) (*http.Response, error) {
	attempts := min(max(c.Attempts, 1), 5)
	delay := min(c.BaseDelay, 30*time.Second)
	if delay <= 0 {
		delay = 250 * time.Millisecond
	}
	client := c.Client
	if client == nil {
		client = &http.Client{Timeout: 30 * time.Second}
	}
	safe := req.Method == http.MethodGet || (req.Header.Get("Idempotency-Key") != "" && (req.Body == nil || req.GetBody != nil))
	for n := 0; ; n++ {
		r := req.Clone(req.Context())
		if n > 0 && req.GetBody != nil {
			var err error
			r.Body, err = req.GetBody()
			if err != nil {
				return nil, err
			}
		}
		res, err := client.Do(r)
		retry := err != nil || res.StatusCode == 429 || res.StatusCode == 502 || res.StatusCode == 503 || res.StatusCode == 504
		if !safe || !retry || n+1 >= attempts {
			return res, err
		}
		wait := min(delay*time.Duration(1<<n), 30*time.Second)
		if res != nil {
			if v, err := strconv.Atoi(res.Header.Get("Retry-After")); err == nil && v >= 0 && v <= 30 {
				wait = time.Duration(v) * time.Second
			} else if t, err := http.ParseTime(res.Header.Get("Retry-After")); err == nil {
				wait = min(max(time.Until(t), 0), 30*time.Second)
			}
			_ = res.Body.Close()
		}
		timer := time.NewTimer(wait)
		select {
		case <-req.Context().Done():
			timer.Stop()
			return nil, req.Context().Err()
		case <-timer.C:
		}
	}
}

// VerifyWebhook verifies exact raw bytes and the ClickFix-Webhook-* headers.
// Persist/deduplicate ClickFix-Webhook-Id separately before executing side effects.
func VerifyWebhook(secret, timestamp, signature string, body []byte, now time.Time, tolerance time.Duration) error {
	if secret == "" || tolerance <= 0 {
		return errors.New("clickfix: invalid webhook verification policy")
	}
	stamp, err := strconv.ParseInt(timestamp, 10, 64)
	if err != nil {
		return errors.New("clickfix: invalid timestamp")
	}
	t := time.Unix(stamp, 0)
	if t.Before(now.Add(-tolerance)) || t.After(now.Add(tolerance)) {
		return errors.New("clickfix: stale webhook")
	}
	raw, ok := strings.CutPrefix(signature, "v1=")
	if !ok {
		return errors.New("clickfix: unsupported signature")
	}
	got, err := hex.DecodeString(raw)
	if err != nil {
		return err
	}
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(timestamp + "."))
	_, _ = mac.Write(body)
	if !hmac.Equal(got, mac.Sum(nil)) {
		return errors.New("clickfix: invalid signature")
	}
	return nil
}

// IdentityHash is the widget user_hash of a user id alone:
// hex(HMAC-SHA256(secret, userID)). It is calculated on your server; never
// expose the identity secret to a browser or an app. For a user that
// belongs to a company use IdentityCompanyHash.
func IdentityHash(secret, userID string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(userID))
	return hex.EncodeToString(mac.Sum(nil))
}

// IdentityCompanyHash is the widget user_hash of a user id together with
// the company's id in your system (sent to identify as company.id):
// hex(HMAC-SHA256(secret, userID + "\n" + companyID)), so a signed-in user
// cannot claim another company. With an empty companyID it equals
// IdentityHash. The ids are separated by a newline inside the signed bytes,
// so an id that contains a line break cannot be signed: the result is then
// "" (which the widget API never accepts), as the Node helper throws.
func IdentityCompanyHash(secret, userID, companyID string) string {
	if companyID == "" {
		return IdentityHash(secret, userID)
	}
	if strings.ContainsAny(userID+companyID, "\n\r") {
		return ""
	}
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(userID))
	_, _ = mac.Write([]byte("\n"))
	_, _ = mac.Write([]byte(companyID))
	return hex.EncodeToString(mac.Sum(nil))
}

type Page[T any] struct {
	Items  []T   `json:"items"`
	Total  int64 `json:"total"`
	Limit  int   `json:"limit"`
	Offset int   `json:"offset"`
}

// Iterate traverses a standard offset page, stops on an empty page, and propagates cancellation.
func Iterate[T any](ctx context.Context, fetch func(context.Context, int, int) (Page[T], error), yield func(T) bool) error {
	offset := 0
	for {
		if err := ctx.Err(); err != nil {
			return err
		}
		p, err := fetch(ctx, 100, offset)
		if err != nil {
			return err
		}
		if len(p.Items) == 0 {
			return nil
		}
		for _, v := range p.Items {
			if !yield(v) {
				return nil
			}
		}
		offset += len(p.Items)
		if int64(offset) >= p.Total {
			return nil
		}
	}
}

// DecodeData decodes the data member of a generic response envelope into T.
// Several list and detail responses are typed IntegrationEnvelope with an
// untyped Data; DecodeData gives them a concrete type without a hand-written
// envelope, for example
//
//	res, _ := sdk.GetV1PublicApiCompaniesWithResponse(ctx, params)
//	page, err := clickfix.DecodeData[clickfix.Page[MyCompany]](res.JSON200)
//
// A nil envelope (the response was not a 200) is an error.
func DecodeData[T any](env *IntegrationEnvelope) (T, error) {
	var out T
	if env == nil {
		return out, errors.New("clickfix: no response envelope")
	}
	raw, err := json.Marshal(env.Data)
	if err != nil {
		return out, err
	}
	err = json.Unmarshal(raw, &out)
	return out, err
}

// ListPage decodes the standard envelope. resource is restricted to list endpoints.
func ListPage[T any](ctx context.Context, c *SDK, resource string, limit, offset int) (Page[T], error) {
	return ListPageQuery[T](ctx, c, resource, limit, offset, nil)
}

// ListPageQuery is ListPage with extra query parameters (filters such as
// external_id or q); limit and offset always come from the arguments.
func ListPageQuery[T any](ctx context.Context, c *SDK, resource string, limit, offset int, query url.Values) (Page[T], error) {
	var out Page[T]
	if resource != "contacts" && resource != "companies" && resource != "conversations" && resource != "webhooks" {
		return out, errors.New("clickfix: unsupported list")
	}
	u, err := url.Parse(c.raw.Server)
	if err != nil {
		return out, err
	}
	u.Path = strings.TrimRight(u.Path, "/") + "/v1/public-api/" + resource
	q := u.Query()
	for k, v := range query {
		q[k] = append([]string(nil), v...)
	}
	q.Set("limit", strconv.Itoa(limit))
	q.Set("offset", strconv.Itoa(offset))
	u.RawQuery = q.Encode()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return out, err
	}
	for _, edit := range c.raw.RequestEditors {
		if err = edit(ctx, req); err != nil {
			return out, err
		}
	}
	res, err := c.raw.Client.Do(req)
	if err != nil {
		return out, err
	}
	defer res.Body.Close()
	if res.StatusCode != 200 {
		return out, fmt.Errorf("clickfix: HTTP %d", res.StatusCode)
	}
	var envelope struct {
		Data Page[T] `json:"data"`
	}
	err = json.NewDecoder(io.LimitReader(res.Body, 8<<20)).Decode(&envelope)
	return envelope.Data, err
}
