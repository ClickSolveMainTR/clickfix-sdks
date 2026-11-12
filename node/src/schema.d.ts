export interface paths {
    "/v1/public-api/conversations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Public API: get conversations
         * @description API key scope and creator current RBAC both apply. Per-key requests/minute limit. Same response envelope and pagination as tenant API; writes require Idempotency-Key. A reused key with a different body returns 409.
         */
        get: operations["getV1PublicApiConversations"];
        put?: never;
        /**
         * Create conversation
         * @description Requires conversations:write and current conversation read/manage. Active inbox and contact must belong to the key organization. Conversation is assigned to the key creator.
         */
        post: operations["createIntegrationConversation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/public-api/conversations/{uuid}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Public API: get conversations/{uuid}
         * @description API key scope and creator current RBAC both apply. Per-key requests/minute limit. Same response envelope and pagination as tenant API; writes require Idempotency-Key. A reused key with a different body returns 409.
         */
        get: operations["getV1PublicApiConversationsUuid"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Public API: patch conversations/{uuid}
         * @description API key scope and creator current RBAC both apply. Per-key requests/minute limit. Same response envelope and pagination as tenant API; writes require Idempotency-Key. A reused key with a different body returns 409.
         */
        patch: operations["patchV1PublicApiConversationsUuid"];
        trace?: never;
    };
    "/v1/public-api/conversations/{uuid}/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Public API: get conversations/{uuid}/messages
         * @description API key scope and creator current RBAC both apply. Per-key requests/minute limit. Same response envelope and pagination as tenant API; writes require Idempotency-Key. A reused key with a different body returns 409.
         */
        get: operations["getV1PublicApiConversationsUuidMessages"];
        put?: never;
        /**
         * Public API: post conversations/{uuid}/messages
         * @description API key scope and creator current RBAC both apply. Per-key requests/minute limit. Same response envelope and pagination as tenant API; writes require Idempotency-Key. A reused key with a different body returns 409.
         */
        post: operations["postV1PublicApiConversationsUuidMessages"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/public-api/contacts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Public API: get contacts
         * @description API key scope (`contacts:read`) and the key creator's current permissions both apply. Per-key requests/minute limit. Same response envelope and pagination as tenant API. Items carry `external_id`, `verified_at` and the company's `company_external_id`.
         */
        get: operations["getV1PublicApiContacts"];
        put?: never;
        /**
         * Public API: create a contact
         * @description Same body and response as `POST /v1/tenant/contacts`. Needs the `contacts:write` key scope, the key creator's `tenant.contacts.write` permission and an `Idempotency-Key` header. Prefer `PUT /v1/public-api/contacts/by-external-id` to sync users from your system.
         */
        post: operations["postV1PublicApiContacts"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/public-api/contacts/by-external-id": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Public API: create or update a contact by your user id
         * @description Same body and response as `PUT /v1/tenant/contacts/by-external-id`: 201 when created, 200 when the contact with `external_id` existed; the same id twice edits one contact. Needs the `contacts:write` key scope, the key creator's `tenant.contacts.write` permission and an `Idempotency-Key` header (use a new key per change; a reused key replays the stored answer).
         */
        put: operations["putV1PublicApiContactByExternalId"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/public-api/companies": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Public API: get companies
         * @description API key scope (`companies:read`) and the key creator's current permissions both apply. Items carry `domain` and `external_id`, the company's own id (separate from contact ids).
         */
        get: operations["getV1PublicApiCompanies"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/public-api/company-usage": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Public API: report a customer's product usage
         * @description Same body and response as `PUT /v1/tenant/company-usage`. Needs the `health:write` key scope and an `Idempotency-Key` header.
         */
        put: operations["putV1PublicApiCompanyUsage"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/public-api/company-events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Public API: send an in-product event to a company timeline
         * @description Same body and response as `POST /v1/tenant/company-events`. Needs the `events:write` key scope and an `Idempotency-Key` header.
         */
        post: operations["postV1PublicApiCompanyEvent"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/public-api/company-revenue": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Public API: push a customer's revenue
         * @description Same body and response as `PUT /v1/tenant/company-revenue`. Needs the `revenue:write` key scope and an `Idempotency-Key` header; a reused key with a different body returns 409.
         */
        put: operations["putV1PublicApiCompanyRevenue"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/public-api/webhooks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Public API: get webhooks
         * @description API key scope and creator current RBAC both apply. Per-key requests/minute limit. Same response envelope and pagination as tenant API; writes require Idempotency-Key. A reused key with a different body returns 409.
         */
        get: operations["getV1PublicApiWebhooks"];
        put?: never;
        /**
         * Public API: post webhooks
         * @description API key scope and creator current RBAC both apply. Per-key requests/minute limit. Same response envelope and pagination as tenant API; writes require Idempotency-Key. A reused key with a different body returns 409.
         */
        post: operations["postV1PublicApiWebhooks"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/public-api/webhooks/{uuid}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Public API: put webhooks/{uuid}
         * @description API key scope and creator current RBAC both apply. Per-key requests/minute limit. Same response envelope and pagination as tenant API; writes require Idempotency-Key. A reused key with a different body returns 409.
         */
        put: operations["putV1PublicApiWebhooksUuid"];
        post?: never;
        /**
         * Public API: delete webhooks/{uuid}
         * @description API key scope and creator current RBAC both apply. Per-key requests/minute limit. Same response envelope and pagination as tenant API; writes require Idempotency-Key. A reused key with a different body returns 409.
         */
        delete: operations["deleteV1PublicApiWebhooksUuid"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/public-api/triggers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Poll conversation/contact/CSAT/tag triggers
         * @description Requires triggers:read plus current conversation read/read_all and contact read. Returns public references, not transcripts. Cursor rules and 410 expiration match /v1/tenant/integration-triggers. No X-Organization: key fixes the organization.
         */
        get: operations["pollIntegrationTriggers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/public-api/subscriptions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Subscribe a signed REST hook
         * @description Requires webhooks:write and current channels.manage. Same signed durable webhook delivery pipeline as /v1/tenant/webhooks. HTTPS public targets only; secret returned once. Verify ClickFix-Webhook-Signature as HMAC-SHA256 of timestamp.body, reject old timestamps, and deduplicate ClickFix-Webhook-Id.
         */
        post: operations["subscribeIntegrationTrigger"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/public-api/subscriptions/{uuid}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Unsubscribe a REST hook
         * @description API key scope and current member permissions are both checked. Writes require a unique Idempotency-Key; reuse it for retries.
         */
        delete: operations["unsubscribeIntegrationTrigger"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/public-api/contacts/{uuid}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Update contact
         * @description Requires contacts:write and current tenant.contacts.write. Uses the normal contact validator and organization boundary.
         */
        patch: operations["updateIntegrationContact"];
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        ResponseMeta: {
            request_id: string;
        };
        Error: {
            /** @enum {boolean} */
            success: false;
            error: components["schemas"]["ErrorBody"];
            meta: components["schemas"]["ResponseMeta"];
        };
        ErrorBody: {
            /**
             * @description Machine-readable error code
             * @example VALIDATION_ERROR
             * @example INVALID_RESET_CODE
             * @example INVALID_VERIFICATION_CODE
             * @example INVALID_CREDENTIALS
             * @example UNAUTHENTICATED
             * @example FORBIDDEN
             * @example NOT_FOUND
             * @example CONFLICT
             * @example PASSWORD_RESET_FAILED
             * @example INTERNAL_ERROR
             * @example MFA_REQUIRED
             * @example INVALID_MFA_CODE
             * @example RATE_LIMITED
             * @example STEP_UP_REQUIRED
             * @example ACCOUNT_DEACTIVATED
             * @example INVALID_EMAIL_CODE
             * @example INVALID_ID_TOKEN
             * @example OAUTH_ACCOUNT_NOT_LINKED
             * @example OAUTH_LINK_CHOICE_REQUIRED
             * @example INVALID_LINK_TICKET
             * @example OAUTH_PROVIDER_DISABLED
             * @example ORGANIZATION_REQUIRED
             * @example NO_TENANT_MEMBERSHIP
             * @example ORGANIZATION_SUSPENDED
             * @example ORGANIZATION_ACCESS_EXPIRED
             */
            code: string;
            message: string;
            details?: components["schemas"]["ErrorDetail"][];
        };
        ErrorDetail: {
            field?: string;
            message: string;
            code?: string;
        };
        /** @description Name the contact by contact_uuid or contact_external_id (the customer's own user id), not both. On a widget inbox a contact with an external id gets its widget identity, so the agent can write first and the signed-in user finds the conversation on the site. */
        IntegrationCreateConversation: {
            /** Format: uuid */
            contact_uuid?: string;
            contact_external_id?: string;
            /** Format: uuid */
            inbox_uuid: string;
            subject: string;
        };
        IntegrationEnvelope: {
            success: boolean;
            data: unknown;
            meta?: {
                request_id?: string;
            };
        };
        ConversationUpdate: {
            status?: components["schemas"]["ConversationStatus"];
            priority?: components["schemas"]["ConversationPriority"];
            subject?: string;
            /** Format: uuid */
            assignee?: string | null;
            /**
             * Format: uuid
             * @description Team uuid; null removes the team (tenant.conversations.assign)
             */
            team?: string | null;
            /** Format: date-time */
            snoozed_until?: string;
        };
        /** @enum {string} */
        ConversationStatus: "open" | "pending" | "snoozed" | "resolved" | "closed";
        /** @enum {string} */
        ConversationPriority: "low" | "normal" | "high" | "urgent";
        ContactInput: {
            name?: string;
            email?: string;
            phone?: string;
            job_title?: string;
            /** Format: uuid */
            company?: string | null;
            locale?: string;
            timezone?: string;
            notes?: string;
            custom_fields?: {
                [key: string]: unknown;
            };
            blocked?: boolean;
            /** @description The customer's own user id; empty clears it. 409 EXTERNAL_ID_EXISTS when another contact has it. */
            external_id?: string;
        };
        EnvelopeContact: {
            /** @enum {boolean} */
            success: true;
            data: components["schemas"]["Contact"];
            meta: components["schemas"]["ResponseMeta"];
        };
        Contact: {
            /** Format: uuid */
            uuid: string;
            name: string;
            email: string | null;
            phone: string | null;
            /** @description The customer's own user id, unique in the organization. */
            external_id: string | null;
            identity_state: components["schemas"]["ContactIdentityState"];
            /**
             * Format: date-time
             * @description Last widget identify that proved the id with user_hash.
             */
            verified_at: string | null;
            job_title: string;
            company: components["schemas"]["InboxRef"] | null;
            locale: string | null;
            timezone: string | null;
            notes: string;
            custom_fields: {
                [key: string]: unknown;
            };
            blocked: boolean;
            channel_types: string[];
            /** Format: int64 */
            conversation_count: number;
            identities?: components["schemas"]["ContactIdentity"][];
            /** Format: date-time */
            last_seen_at: string | null;
            /** Format: date-time */
            created_at: string;
            /** Format: date-time */
            updated_at: string;
        };
        /**
         * @description Verified: the contact proved the customer's user id with
         *     user_hash (widget identify). anonymous: no name, e-mail or phone.
         *     self_named: a name, e-mail or phone the contact or its channel gave,
         *     not proved.
         * @enum {string}
         */
        ContactIdentityState: "verified" | "anonymous" | "self_named";
        InboxRef: {
            /** Format: uuid */
            uuid: string;
            name: string;
        };
        ContactIdentity: {
            /** Format: int64 */
            id: number;
            channel_type: string;
            /** Format: uuid */
            inbox_uuid: string | null;
            external_id: string;
            display_name: string;
            username: string;
            /** Format: date-time */
            last_seen_at: string | null;
            /** Format: date-time */
            created_at: string;
        };
        CompanyUsageInput: {
            /** Format: uuid */
            company_uuid?: string;
            external_id?: string;
            domain?: string;
            score: number;
        };
        EnvelopeCompanyUsage: {
            /** @enum {boolean} */
            success: true;
            data: {
                /** Format: uuid */
                company_uuid: string;
                usage_score: number;
            };
            meta: components["schemas"]["ResponseMeta"];
        };
        CompanyEventInput: {
            /** Format: uuid */
            company_uuid?: string;
            external_id?: string;
            domain?: string;
            contact_email?: string;
            /** @example seat_limit_reached */
            name: string;
            properties?: {
                [key: string]: unknown;
            };
            /** @default api */
            source?: string;
            idempotency_key?: string;
            /** Format: date-time */
            occurred_at?: string;
        };
        EnvelopeCompanyEvent: {
            /** @enum {boolean} */
            success: true;
            data: components["schemas"]["CompanyEvent"];
            meta: components["schemas"]["ResponseMeta"];
        };
        CompanyEvent: {
            /** Format: uuid */
            uuid: string;
            /** Format: uuid */
            company_uuid: string;
            name: string;
            properties: {
                [key: string]: unknown;
            };
            source: string;
            /** Format: date-time */
            occurred_at: string;
            duplicate: boolean;
        };
        CompanyRevenueUpsertInput: {
            /** Format: uuid */
            company_uuid?: string;
            external_id?: string;
            domain?: string;
            /** @enum {string} */
            source?: "api" | "stripe" | "iyzico";
            /** Format: int64 */
            mrr_minor?: number;
            currency?: string;
            plan?: string;
            /** @enum {string} */
            billing_status?: "none" | "trialing" | "active" | "past_due" | "canceled";
            /** @description RFC 3339 time or YYYY-MM-DD date; null clears it. */
            renewal_at?: string | null;
            /** Format: int64 */
            lifetime_value_minor?: number;
            external_ref?: string;
        };
        EnvelopeCompanyRevenueUpsert: {
            /** @enum {boolean} */
            success: true;
            data: {
                /** Format: uuid */
                company_uuid: string;
                revenue: components["schemas"]["CompanyRevenue"];
            };
            meta: components["schemas"]["ResponseMeta"];
        };
        /** @description What the customer pays the organization. Amounts are minor units of `currency`. */
        CompanyRevenue: {
            /** Format: int64 */
            mrr_minor: number;
            currency: string;
            plan: string;
            /** @enum {string} */
            billing_status: "none" | "trialing" | "active" | "past_due" | "canceled";
            /** Format: date-time */
            renewal_at: string | null;
            /** Format: int64 */
            lifetime_value_minor: number;
            /** @enum {string} */
            source: "manual" | "api" | "stripe" | "iyzico";
            external_ref: string;
            /** Format: date-time */
            updated_at: string;
        };
        OutboundWebhookInput: {
            name: string;
            /**
             * Format: uri
             * @description Public HTTPS URL. Private addresses, redirects and DNS rebinding are blocked.
             */
            url: string;
            events: string[];
            enabled: boolean;
        };
        IntegrationTriggerPage: {
            items: components["schemas"]["IntegrationTrigger"][];
            next_cursor: string;
            has_more: boolean;
            retention_days: number;
        };
        IntegrationTrigger: {
            /** Format: uuid */
            id: string;
            /** @enum {string} */
            event: "conversation.created" | "conversation.resolved" | "contact.created" | "csat.submitted" | "conversation.tag_added";
            /** Format: uuid */
            entity_uuid: string | null;
            /** Format: date-time */
            occurred_at: string;
        };
        IntegrationSubscription: {
            name: string;
            /** Format: uri */
            url: string;
            events: ("conversation.created" | "conversation.resolved" | "contact.created" | "csat.submitted" | "conversation.tag_added")[];
            enabled: boolean;
        };
        IntegrationContactUpdate: {
            name?: string;
            email?: string;
            phone?: string;
            notes?: string;
        };
    };
    responses: {
        /** @description Validation or malformed request */
        BadRequest: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description Missing or invalid credentials / access token */
        Unauthenticated: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description Authenticated but not allowed */
        Forbidden: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description Resource not found */
        NotFound: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description Conflict (duplicate / constraint) */
        Conflict: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description `VALIDATION_ERROR`: `details[].field` names each invalid field (dotted path, e.g. `company.tax_number`) */
        ValidationError: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
    };
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    getV1PublicApiConversations: {
        parameters: {
            query?: {
                limit?: number;
                offset?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IntegrationEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthenticated"];
            403: components["responses"]["Forbidden"];
        };
    };
    createIntegrationConversation: {
        parameters: {
            query?: never;
            header: {
                /** @example workflow-42-step-1 */
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "contact_uuid": "00000000-0000-4000-8000-000000000001",
                 *       "inbox_uuid": "00000000-0000-4000-8000-000000000001",
                 *       "subject": "API support request"
                 *     }
                 */
                "application/json": components["schemas"]["IntegrationCreateConversation"];
            };
        };
        responses: {
            /** @description Success */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        success: true;
                        data: {
                            /** Format: uuid */
                            uuid: string;
                            number: number;
                            status: string;
                        };
                        meta: components["schemas"]["ResponseMeta"];
                    };
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthenticated"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    getV1PublicApiConversationsUuid: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                uuid: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IntegrationEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthenticated"];
            403: components["responses"]["Forbidden"];
        };
    };
    patchV1PublicApiConversationsUuid: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path: {
                uuid: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ConversationUpdate"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IntegrationEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthenticated"];
            403: components["responses"]["Forbidden"];
        };
    };
    getV1PublicApiConversationsUuidMessages: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                uuid: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IntegrationEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthenticated"];
            403: components["responses"]["Forbidden"];
        };
    };
    postV1PublicApiConversationsUuidMessages: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path: {
                uuid: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    content: string;
                    private?: boolean;
                    /** Format: uuid */
                    client_id?: string;
                };
            };
        };
        responses: {
            /** @description Success */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IntegrationEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthenticated"];
            403: components["responses"]["Forbidden"];
        };
    };
    getV1PublicApiContacts: {
        parameters: {
            query?: {
                limit?: number;
                offset?: number;
                /** @description Case-insensitive match on the contact name or e-mail. */
                q?: string;
                /** @description The customer's own user id, exact match. */
                external_id?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IntegrationEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthenticated"];
            403: components["responses"]["Forbidden"];
        };
    };
    postV1PublicApiContacts: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ContactInput"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EnvelopeContact"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthenticated"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
        };
    };
    putV1PublicApiContactByExternalId: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ContactInput"] & {
                    external_id: string;
                };
            };
        };
        responses: {
            /** @description Updated */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EnvelopeContact"];
                };
            };
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EnvelopeContact"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthenticated"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
        };
    };
    getV1PublicApiCompanies: {
        parameters: {
            query?: {
                limit?: number;
                offset?: number;
                /** @description The company's id in your system, exact match. */
                external_id?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IntegrationEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthenticated"];
            403: components["responses"]["Forbidden"];
        };
    };
    putV1PublicApiCompanyUsage: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CompanyUsageInput"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EnvelopeCompanyUsage"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthenticated"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
            422: components["responses"]["ValidationError"];
        };
    };
    postV1PublicApiCompanyEvent: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CompanyEventInput"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EnvelopeCompanyEvent"];
                };
            };
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EnvelopeCompanyEvent"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthenticated"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
            422: components["responses"]["ValidationError"];
        };
    };
    putV1PublicApiCompanyRevenue: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CompanyRevenueUpsertInput"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EnvelopeCompanyRevenueUpsert"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthenticated"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
            422: components["responses"]["ValidationError"];
        };
    };
    getV1PublicApiWebhooks: {
        parameters: {
            query?: {
                limit?: number;
                offset?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IntegrationEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthenticated"];
            403: components["responses"]["Forbidden"];
        };
    };
    postV1PublicApiWebhooks: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OutboundWebhookInput"];
            };
        };
        responses: {
            /** @description Success */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IntegrationEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthenticated"];
            403: components["responses"]["Forbidden"];
        };
    };
    putV1PublicApiWebhooksUuid: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path: {
                uuid: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OutboundWebhookInput"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IntegrationEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthenticated"];
            403: components["responses"]["Forbidden"];
        };
    };
    deleteV1PublicApiWebhooksUuid: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path: {
                uuid: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IntegrationEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthenticated"];
            403: components["responses"]["Forbidden"];
        };
    };
    pollIntegrationTriggers: {
        parameters: {
            query: {
                event: "conversation.created" | "conversation.resolved" | "contact.created" | "csat.submitted" | "conversation.tag_added";
                /** @example 0 */
                cursor?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        success: true;
                        data: components["schemas"]["IntegrationTriggerPage"];
                        meta: components["schemas"]["ResponseMeta"];
                    };
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthenticated"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            /** @description CURSOR_EXPIRED: resynchronize resources and restart with cursor=0 */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    subscribeIntegrationTrigger: {
        parameters: {
            query?: never;
            header: {
                /** @example workflow-42-step-1 */
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "name": "Zapier new conversation",
                 *       "url": "https://hooks.example.com/clickfix",
                 *       "events": [
                 *         "conversation.created"
                 *       ],
                 *       "enabled": true
                 *     }
                 */
                "application/json": components["schemas"]["IntegrationSubscription"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        success: true;
                        data: {
                            [key: string]: unknown;
                        };
                        meta: components["schemas"]["ResponseMeta"];
                    };
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthenticated"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    unsubscribeIntegrationTrigger: {
        parameters: {
            query?: never;
            header: {
                /** @example workflow-42-step-1 */
                "Idempotency-Key": string;
            };
            path: {
                uuid: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        success: true;
                        data: {
                            deleted: boolean;
                        };
                        meta: components["schemas"]["ResponseMeta"];
                    };
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthenticated"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    updateIntegrationContact: {
        parameters: {
            query?: never;
            header: {
                /** @example workflow-42-step-1 */
                "Idempotency-Key": string;
            };
            path: {
                uuid: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "name": "Updated contact"
                 *     }
                 */
                "application/json": components["schemas"]["IntegrationContactUpdate"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        success: true;
                        data: {
                            [key: string]: unknown;
                        };
                        meta: components["schemas"]["ResponseMeta"];
                    };
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthenticated"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
}
