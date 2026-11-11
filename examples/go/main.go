// Kılavuz örnekleri: `go run . <adım>` (user-hash, external-id,
// custom-fields, company, events, api-channel, webhooks, system-endpoint).
// Her adım kendi dosyasındadır ve kılavuza aynen gömülür.
package main

import (
	"context"
	"fmt"
	"os"
)

func main() {
	steps := map[string]func(context.Context) error{
		"user-hash":       userHash,
		"external-id":     externalID,
		"custom-fields":   customFields,
		"company":         company,
		"events":          events,
		"api-channel":     apiChannel,
		"webhooks":        webhooks,
		"system-endpoint": systemEndpoint,
	}
	if len(os.Args) < 2 || steps[os.Args[1]] == nil {
		fmt.Fprintln(os.Stderr, "usage: go run . <step>")
		os.Exit(2)
	}
	if err := steps[os.Args[1]](context.Background()); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
