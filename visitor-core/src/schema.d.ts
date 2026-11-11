export interface paths {
    "/v1/widget/{public_id}/replay-policy": {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path?: never;
            cookie?: never;
        };
        /** Get replay privacy policy */
        get: operations["GetreplayprivacypolicyCF126"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/widget/{public_id}/conversations/{conversation}/sessions": {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Start consented replay */
        post: operations["StartconsentedreplayCF126"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/widget/{public_id}/conversations/{conversation}/sessions/{session}/consent": {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Change visitor session consent */
        post: operations["ChangevisitorsessionconsentCF126"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/widget/{public_id}/conversations/{conversation}/sessions/{session}/chunks": {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Upload masked compressed DOM events */
        post: operations["UploadmaskedcompressedDOMeventsCF126"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/widget/{public_id}/conversations/{conversation}/sessions/{session}/live-token": {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Visitor live stream token */
        post: operations["VisitorlivestreamtokenCF126"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/widget/{public_id}/attributes": {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                /** @description Public widget id (the widget's channel instance uuid) */
                public_id: components["parameters"]["WidgetPublicID"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Store mapped visitor attributes
         * @description `ClickFix('setAttributes', ...)`. A key is stored when it is the key of
         *     a contact custom field (CF-196: defining the field is the only step;
         *     the field's `widget_access` decides whether anonymous visitors may
         *     write it, default identified visitors only) or an entry of the
         *     widget's attribute mapping (an alias; entries not marked anonymous
         *     need an identified visitor). List fields accept the option id or its
         *     label and store the id. A key no field defines is listed in `unknown`
         *     (and `ignored`), recorded as a "tanımsız alan" warning and kept on the
         *     contact until a field is defined. Without a contact yet the result is
         *     `pending` and the SDK sends the attributes with the first message.
         */
        patch: operations["widgetSetAttributes"];
        trace?: never;
    };
    "/v1/widget/{public_id}/bootstrap": {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                /** @description Public widget id (the widget's channel instance uuid) */
                public_id: components["parameters"]["WidgetPublicID"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Start or resume a visitor session
         * @description Returns the widget settings, online state, team, limits, the visitor's
         *     conversations and a visitor token. A valid (or expired less than 90
         *     days ago) token of this widget in `Authorization` resumes the same
         *     visitor; otherwise a new anonymous visitor starts.
         */
        post: operations["widgetBootstrap"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/widget/{public_id}/identify": {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                /** @description Public widget id (the widget's channel instance uuid) */
                public_id: components["parameters"]["WidgetPublicID"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Identify the visitor as one of the customer's users
         * @description `user_hash` is `hex(HMAC-SHA256(identity_secret, user_id))`, computed by
         *     the customer's backend. The anonymous visitor's conversations move to
         *     the user's contact (no second contact is created).
         *
         *     Rejections: `403 WIDGET_IDENTITY_DISABLED` when the widget has no
         *     identity secret, `401 WIDGET_IDENTITY_INVALID` when `user_hash` does
         *     not match `user_id`. The last rejection (code and time only) is shown
         *     in the editor's install check until a user is verified.
         */
        post: operations["widgetIdentify"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/widget/{public_id}/profile": {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                /** @description Public widget id (the widget's channel instance uuid) */
                public_id: components["parameters"]["WidgetPublicID"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Update the visitor's own contact
         * @description Name always; e-mail and phone only fill empty values (an anonymous visitor cannot claim an address another contact uses).
         */
        patch: operations["widgetUpdateProfile"];
        trace?: never;
    };
    "/v1/widget/{public_id}/realtime-token": {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                /** @description Public widget id (the widget's channel instance uuid) */
                public_id: components["parameters"]["WidgetPublicID"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Centrifugo tokens for the visitor's private channel */
        post: operations["widgetRealtimeToken"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/widget/{public_id}/conversations": {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                /** @description Public widget id (the widget's channel instance uuid) */
                public_id: components["parameters"]["WidgetPublicID"];
            };
            cookie?: never;
        };
        /** The visitor's conversations on this widget */
        get: operations["widgetListConversations"];
        put?: never;
        /**
         * Start a conversation with its first message
         * @description JSON or `multipart/form-data` (fields as below plus one `file`).
         */
        post: operations["widgetCreateConversation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/widget/{public_id}/conversations/{conversation}/messages": {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                /** @description Public widget id (the widget's channel instance uuid) */
                public_id: components["parameters"]["WidgetPublicID"];
                conversation: components["parameters"]["WidgetConversation"];
            };
            cookie?: never;
        };
        /** Messages of a conversation (oldest first, up to 50) */
        get: operations["widgetListMessages"];
        put?: never;
        /**
         * Add a visitor message
         * @description A closed conversation answers `409`; start a new one. Retries with the same `client_id` are stored once.
         */
        post: operations["widgetSendMessage"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/widget/{public_id}/conversations/{conversation}/read": {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                /** @description Public widget id (the widget's channel instance uuid) */
                public_id: components["parameters"]["WidgetPublicID"];
                conversation: components["parameters"]["WidgetConversation"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Mark the agent replies read (read receipts) */
        post: operations["widgetMarkRead"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/widget/{public_id}/conversations/{conversation}/typing": {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                /** @description Public widget id (the widget's channel instance uuid) */
                public_id: components["parameters"]["WidgetPublicID"];
                conversation: components["parameters"]["WidgetConversation"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Tell the agents the visitor is typing
         * @description Published on the organization's inbox channel as `contact.typing`; nothing is stored.
         */
        post: operations["widgetTyping"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/widget/{public_id}/conversations/{conversation}/diagnostics": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Attach masked screenshot, screen recording or technical context
         * @description Explicit visitor consent required. Bound to the signed visitor, widget, org and conversation. 10 requests/minute/visitor, 100 live captures/conversation, 1000 captures/org/day plus attachment size/storage quotas. Retained 30 days, then inaccessible and purged hourly. Screenshot: PNG/JPEG up to 5 MiB and 40 megapixels. Recording: WebM video up to 10 MiB and 60 seconds, duration validated from container timestamps. SDK must mask pixels before upload and set pii_masked=true. Multipart context is a JSON string. Raw technical context is masked before storage. Agent visibility follows the inbox team rule.
         */
        post: operations["widgetCaptureDiagnostic"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/widget/{public_id}/conversations/{conversation}/rating": {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                /** @description Public widget id (the widget's channel instance uuid) */
                public_id: components["parameters"]["WidgetPublicID"];
                conversation: components["parameters"]["WidgetConversation"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * CSAT rating of a finished conversation
         * @description Only resolved or closed conversations (`409` otherwise). A conversation
         *     is rated once: a repeated submit returns the stored rating with
         *     `existing: true`.
         */
        post: operations["widgetRateConversation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/widget/{public_id}/booking": {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                /** @description Public widget id (the widget's channel instance uuid) */
                public_id: components["parameters"]["WidgetPublicID"];
            };
            cookie?: never;
        };
        /**
         * Booking entry point inside the widget (CF-138)
         * @description The organization's public booking page (`/book/<org>?source=widget`)
         *     when appointments and public booking are on and at least one public
         *     type is active; otherwise `available` is false. Origin allowlist
         *     applies; no visitor token needed.
         */
        get: operations["widgetBookingLink"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/widget/{public_id}/help/search": {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                /** @description Public widget id (the widget's channel instance uuid) */
                public_id: components["parameters"]["WidgetPublicID"];
            };
            cookie?: never;
        };
        /**
         * Help center search inside the widget (CF-55)
         * @description Published public knowledge articles of the widget's organization with
         *     links to the public help center. Without `q` the latest articles are
         *     returned. `available` is false when the organization has no help center.
         *     Origin allowlist applies; no visitor token needed.
         */
        get: operations["widgetHelpSearch"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        WidgetReplayPolicy: {
            /** @default false */
            replay_enabled: boolean;
            /** @default false */
            cobrowse_enabled: boolean;
            /** @default false */
            control_enabled: boolean;
            block_selectors: string[];
            /** @default 7 */
            retention_days: number;
        };
        ResponseMeta: {
            request_id: string;
        };
        WidgetSession: {
            /** Format: uuid */
            uuid: string;
            /** @enum {string} */
            kind: "replay" | "cobrowse";
            /** @enum {string} */
            status: "requested" | "active" | "ended" | "revoked" | "declined";
            control_enabled: boolean;
            consent_version: string;
            /** Format: date-time */
            accepted_at: string | null;
            /** Format: date-time */
            timeout_at: string;
            /** Format: date-time */
            expires_at: string;
        };
        WidgetLiveTokens: {
            ws_url: string;
            connection_token: string;
            subscription_token: string;
            channel: string;
            /** Format: date-time */
            expires_at: string;
        };
        WidgetAttributesInput: {
            attributes: {
                [key: string]: string | number | boolean;
            };
        };
        EnvelopeWidgetAttributes: {
            /** @enum {boolean} */
            success: true;
            data: components["schemas"]["WidgetAttributesResult"];
            meta: components["schemas"]["ResponseMeta"];
        };
        WidgetAttributesResult: {
            applied: string[];
            ignored: string[];
            /** @description Keys no field defines (CF-196); recorded as warnings, also in `ignored`. */
            unknown: string[];
            /** @description No contact yet; send them with the first message */
            pending: boolean;
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
        WidgetBootstrapInput: {
            page_url?: string;
            referrer?: string;
            /** @description Browser language (two letters) */
            language?: string;
            sdk_version?: string;
        };
        EnvelopeWidgetBootstrap: {
            /** @enum {boolean} */
            success: true;
            data: components["schemas"]["WidgetBootstrap"];
            meta: components["schemas"]["ResponseMeta"];
        };
        WidgetBootstrap: {
            context: components["schemas"]["WidgetBootstrapContext"];
            widget: {
                reply: components["schemas"]["WidgetReplyEstimate"];
                /** Format: uuid */
                brand_id?: string | null;
                /** Format: uuid */
                id: string;
                name: string;
                settings: components["schemas"]["WidgetPublicSettings"];
                online: boolean;
                team: components["schemas"]["WidgetTeamMember"][];
            };
            visitor: components["schemas"]["WidgetVisitor"];
            realtime: {
                enabled: boolean;
            };
            limits: {
                /** Format: int64 */
                max_file_bytes: number;
                max_text_length: number;
            };
            conversations: components["schemas"]["WidgetConversation"][];
            /** @description Start form of a new conversation (CF-52); null when none is offered. */
            request_form?: components["schemas"]["PublicRequestForm"] | null;
        };
        WidgetBootstrapContext: {
            visible: boolean;
            /** @enum {string} */
            hidden_reason: "" | "device" | "country" | "hidden_page" | "not_listed_page" | "offline";
            /** @enum {string} */
            device: "desktop" | "mobile";
            country: string;
            returning: boolean;
            eligible_triggers: string[];
        };
        WidgetReplyEstimate: {
            /** @enum {string} */
            value: "minutes" | "hour" | "hours" | "day" | "";
            /** Format: date-time */
            next_open_at: string | null;
        };
        /** @description The visitor-safe part of WidgetSettings (no allowlist, member ids, attribute targets or handoff keywords). */
        WidgetPublicSettings: {
            schema_version: number;
            /** @example #4f46e5 */
            color: string;
            /** @enum {string} */
            position: "left" | "right";
            /** @enum {string} */
            locale: "auto" | "tr" | "en";
            greeting_title: string;
            greeting_text: string;
            show_team: boolean;
            prechat: components["schemas"]["WidgetPreChat"];
            offline_message: string;
            require_identity: boolean;
            file_upload: boolean;
            csat: boolean;
            appearance: components["schemas"]["WidgetAppearance"];
            texts: {
                [key: string]: components["schemas"]["WidgetTexts"];
            };
            reply_time: components["schemas"]["WidgetReplyTime"];
            home: {
                cards: components["schemas"]["WidgetHomeCard"][];
            };
            quick_replies: components["schemas"]["WidgetLocalized"][];
            csat_options: components["schemas"]["WidgetCSATOptions"];
            offline: components["schemas"]["WidgetOffline"];
            away_mode: boolean;
            channels: components["schemas"]["WidgetChannelLinks"];
            ai: {
                enabled: boolean;
                human_button: boolean;
            };
            attachments: components["schemas"]["WidgetAttachmentSettings"];
            features: components["schemas"]["WidgetFeatures"];
            triggers: components["schemas"]["WidgetTrigger"][];
            targeting: components["schemas"]["WidgetTargeting"];
            privacy: components["schemas"]["WidgetPrivacy"];
            mobile: {
                fullscreen: boolean;
            };
            attribute_keys: {
                key: string;
                anonymous: boolean;
            }[];
        };
        /**
         * @description The pre-chat form is one of the organization's request forms (CF-198,
         *     `/v1/tenant/request-forms`): `form_uuid` picks it, "" means the first
         *     active form offered on the widget channel. The bootstrap serves the
         *     chosen form as `request_form`. The widget keeps only the switch, the
         *     choice and the consent box; the fields live on the form.
         */
        WidgetPreChat: {
            enabled: boolean;
            /** @description Request form uuid or "" (first active widget form) */
            form_uuid: string;
            consent: components["schemas"]["WidgetConsent"];
        };
        WidgetConsent: {
            enabled: boolean;
            required: boolean;
            text: components["schemas"]["WidgetLocalized"];
            /** @description Privacy notice (https) */
            url: string;
        };
        /** @description Text per language; a missing language falls back to the other. */
        WidgetLocalized: {
            tr?: string;
            en?: string;
        };
        WidgetAppearance: {
            /** @enum {string} */
            theme: "light" | "dark" | "auto";
            /** @description #rrggbb or "" (primary color) */
            launcher_color: string;
            header_color: string;
            bubble_color: string;
            /** @enum {string} */
            font: "system" | "inherit" | "rounded" | "serif" | "mono";
            radius: number;
            launcher: components["schemas"]["WidgetLauncher"];
            logo_url: string;
            /** @enum {string} */
            pattern: "none" | "dots" | "grid" | "waves" | "diagonal";
            z_index: number;
            /** @description Sanitized; applied inside the widget's Shadow DOM only */
            custom_css: string;
            show_branding: boolean;
        };
        WidgetLauncher: {
            /** @enum {string} */
            icon: "chat" | "help" | "headset" | "sparkles" | "wave" | "custom";
            image_url: string;
            label: components["schemas"]["WidgetLocalized"];
            size: number;
            /** @enum {string} */
            shape: "circle" | "rounded" | "pill";
            offset_x: number;
            offset_y: number;
        };
        WidgetTexts: {
            greeting_title: string;
            greeting_text: string;
            team_intro: string;
            offline_message: string;
            away_message: string;
            placeholder: string;
        };
        WidgetReplyTime: {
            /** @enum {string} */
            mode: "auto" | "manual" | "hidden";
            /** @enum {string} */
            value: "minutes" | "hour" | "hours" | "day";
        };
        WidgetHomeCard: {
            id: string;
            /** @enum {string} */
            type: "conversation" | "help_search" | "articles" | "status" | "link" | "booking" | "channels";
            enabled: boolean;
            title: components["schemas"]["WidgetLocalized"];
            description: components["schemas"]["WidgetLocalized"];
            url: string;
        };
        WidgetCSATOptions: {
            /** @enum {string} */
            scale: "stars" | "emoji" | "thumbs";
            comment: boolean;
            question: components["schemas"]["WidgetLocalized"];
        };
        WidgetOffline: {
            /** @enum {string} */
            mode: "form" | "message" | "hide";
            collect_email: boolean;
        };
        WidgetChannelLinks: {
            chat: boolean;
            email: string;
            /** @description Digits with country code */
            whatsapp: string;
            instagram: string;
            telegram: string;
            messenger: string;
            phone: string;
            callback: boolean;
            video: boolean;
        };
        WidgetAttachmentSettings: {
            max_mb: number;
            types: ("image" | "pdf" | "document" | "spreadsheet" | "video" | "audio" | "archive" | "text")[];
        };
        WidgetFeatures: {
            emoji: boolean;
            typing: boolean;
            read_receipts: boolean;
            sound: boolean;
            notifications: boolean;
            markdown: boolean;
            history: boolean;
        };
        WidgetTrigger: {
            id: string;
            name: string;
            enabled: boolean;
            message: components["schemas"]["WidgetLocalized"];
            delay_s: number;
            /** @enum {string} */
            frequency: "once" | "session" | "always";
            /** @description Open the panel instead of a preview bubble */
            open: boolean;
            conditions: {
                url: components["schemas"]["WidgetURLRule"][];
                time_on_page_s: number;
                scroll_pct: number;
                exit_intent: boolean;
                /** @enum {string} */
                visitor: "any" | "new" | "returning";
                /** @enum {string} */
                device: "any" | "desktop" | "mobile";
                utm_source: string;
                utm_medium: string;
                utm_campaign: string;
                /** @enum {string} */
                identified: "any" | "yes" | "no";
                languages: string[];
                countries: string[];
            };
        };
        WidgetURLRule: {
            /** @enum {string} */
            op: "contains" | "equals" | "starts_with" | "ends_with" | "glob" | "not_contains";
            /** @description A value starting with / matches path and query; anything else the whole URL */
            value: string;
        };
        WidgetTargeting: {
            show_on: components["schemas"]["WidgetURLRule"][];
            hide_on: components["schemas"]["WidgetURLRule"][];
            /** @enum {string} */
            devices: "all" | "desktop" | "mobile";
            countries: {
                /** @enum {string} */
                mode: "all" | "allow" | "block";
                list: string[];
            };
        };
        WidgetPrivacy: {
            consent_required: boolean;
            cookieless: boolean;
            consent_text: components["schemas"]["WidgetLocalized"];
            privacy_url: string;
            /** @enum {string} */
            persistence: "local" | "session" | "memory";
        };
        WidgetTeamMember: {
            name: string;
            initials: string;
            avatar_url: string | null;
        };
        WidgetVisitor: {
            /** @description Anonymous visitor id */
            id: string;
            /** @description Visitor token, sent as a bearer Authorization header */
            token: string;
            /** Format: date-time */
            expires_at: string;
            verified: boolean;
            /** @description The visitor's contact proved its company with a company-signed user_hash and still belongs to it (CF-206); false when the company came only as a hint */
            company_verified: boolean;
            contact: null | {
                name: string;
                email: string | null;
                phone: string | null;
            };
        };
        WidgetConversation: {
            /** Format: uuid */
            uuid: string;
            /** Format: int64 */
            number: number;
            /** @enum {string} */
            status: "open" | "pending" | "snoozed" | "resolved" | "closed";
            open: boolean;
            last_message_preview: string;
            last_message_direction: string;
            /** Format: date-time */
            last_message_at: string;
            /** Format: int64 */
            unread_count: number;
            can_rate: boolean;
            rating: number | null;
            /** Format: date-time */
            created_at: string;
            /** Format: date-time */
            resolved_at: string | null;
        };
        PublicRequestForm: {
            /** Format: uuid */
            uuid: string;
            name: string;
            description: string;
            fields: components["schemas"]["PublicRequestFormField"][];
        };
        PublicRequestFormField: {
            key: string;
            /** @enum {string} */
            source: "system" | "conversation" | "contact";
            type: components["schemas"]["CustomFieldType"];
            label: string;
            help: string;
            required: boolean;
            options: components["schemas"]["CustomFieldOption"][];
            placeholder: string;
            condition: components["schemas"]["CustomFieldCondition"] | null;
        };
        /** @enum {string} */
        CustomFieldType: "text" | "textarea" | "number" | "money" | "date" | "boolean" | "select" | "multiselect" | "url" | "email" | "phone" | "user";
        CustomFieldOption: {
            value: string;
            label: string;
            color?: string;
            /** @description Kept for stored values; cannot be picked again. */
            archived?: boolean;
        };
        /** @description The field is shown, required and stored only while the referenced field matches. */
        CustomFieldCondition: {
            /** @description Key of another field of the same entity */
            field: string;
            /** @enum {string} */
            operator: "equals" | "not_equals" | "in" | "is_set" | "is_not_set";
            /** @description Compared value; a list for `in` */
            value?: unknown;
        };
        WidgetIdentifyInput: {
            /** @description The user's id in your system (the contact's external id); no line breaks */
            user_id: string;
            /** @description Computed on your server with the widget's identity secret. Without a company id: hex(HMAC-SHA256(identity_secret, user_id)). With company.id (CF-206): hex(HMAC-SHA256(identity_secret, user_id + "\n" + company_id)), so the user cannot claim another company. A user-only hash sent together with company.id still verifies the user, but the company id is then a claim: it binds no company and is not stored (name and domain stay hints). */
            user_hash: string;
            name?: string;
            email?: string;
            phone?: string;
            company?: {
                /** @description The company's id in your system (companies.external_id); binds the contact to the company only when user_hash covers it */
                id?: string;
                name?: string;
                domain?: string;
            };
        };
        EnvelopeWidgetVisitor: {
            /** @enum {boolean} */
            success: true;
            data: components["schemas"]["WidgetVisitor"];
            meta: components["schemas"]["ResponseMeta"];
        };
        WidgetProfileInput: {
            name?: string;
            email?: string;
            phone?: string;
        };
        EnvelopeWidgetRealtimeToken: {
            /** @enum {boolean} */
            success: true;
            data: components["schemas"]["WidgetRealtimeToken"];
            meta: components["schemas"]["ResponseMeta"];
        };
        WidgetRealtimeToken: {
            ws_url: string;
            connection_token: string;
            subscription_token: string;
            channel: string;
            /** Format: date-time */
            expires_at: string;
        };
        EnvelopeWidgetConversations: {
            /** @enum {boolean} */
            success: true;
            data: {
                items: components["schemas"]["WidgetConversation"][];
            };
            meta: components["schemas"]["ResponseMeta"];
        };
        WidgetSendInput: {
            text?: string;
            /**
             * Format: uuid
             * @description Makes retries idempotent
             */
            client_id?: string;
            /** @description Visitor name (older SDKs; the pre-chat form's name field is preferred) */
            name?: string;
            /** @description Visitor e-mail (older SDKs; the pre-chat form's e-mail field is preferred) */
            email?: string;
            page_url?: string;
            profile?: components["schemas"]["WidgetProfileInput"];
            /** @description The pre-chat (request) form answers of a first message (CF-198) */
            form?: components["schemas"]["RequestFormSubmission"];
            /** @description Visitor phone (older SDKs) */
            phone?: string;
            /** @description GDPR/KVKK checkbox of the pre-chat form */
            consent?: boolean;
            /**
             * @description human asks for a person (the AI agent hands off)
             * @enum {string}
             */
            intent?: "" | "human" | "callback" | "video";
            /** @description SDK attributes set before the contact existed */
            attributes?: {
                [key: string]: unknown;
            };
            /** @description Recent `ClickFix('track')` events (last 20 are kept on the message) */
            events?: {
                name: string;
                properties?: {
                    [key: string]: unknown;
                };
                /** Format: date-time */
                at: string;
            }[];
        };
        RequestFormSubmission: {
            /** Format: uuid */
            form_uuid: string;
            /** @description Values keyed by form key. */
            values: {
                [key: string]: unknown;
            };
        };
        WidgetSendMultipart: {
            /** @description RequestFormSubmission as JSON */
            form?: string;
            /** @description Attributes as JSON */
            attributes?: string;
            /** @enum {string} */
            consent?: "true" | "false";
            intent?: string;
            phone?: string;
            text?: string;
            /** Format: uuid */
            client_id?: string;
            name?: string;
            email?: string;
            page_url?: string;
            /** Format: binary */
            file?: string;
        };
        EnvelopeWidgetSent: {
            /** @enum {boolean} */
            success: true;
            data: components["schemas"]["WidgetSent"];
            meta: components["schemas"]["ResponseMeta"];
        };
        WidgetSent: {
            /** Format: uuid */
            conversation_uuid: string;
            message: components["schemas"]["WidgetMessage"];
            created: boolean;
        };
        WidgetMessage: {
            /** Format: uuid */
            uuid: string;
            /** @enum {string} */
            direction: "in" | "out";
            sender_type: string;
            sender_name: string;
            kind: string;
            content: string;
            status: string;
            /** Format: uuid */
            client_id: string | null;
            attachments: components["schemas"]["WidgetAttachment"][];
            /** Format: date-time */
            created_at: string;
            /** Format: date-time */
            read_at: string | null;
        };
        WidgetAttachment: {
            /** Format: uuid */
            uuid: string;
            filename: string;
            content_type: string;
            /** Format: int64 */
            size_bytes: number;
            /** @description Short-lived signed API path (`/v1/public/attachments/...`) */
            url: string;
        };
        EnvelopeWidgetMessagePage: {
            /** @enum {boolean} */
            success: true;
            data: components["schemas"]["WidgetMessagePage"];
            meta: components["schemas"]["ResponseMeta"];
        };
        WidgetMessagePage: {
            conversation: components["schemas"]["WidgetConversation"];
            items: components["schemas"]["WidgetMessage"][];
            has_more: boolean;
        };
        WidgetDiagnostic: {
            /** Format: uuid */
            uuid: string;
            /** @enum {string} */
            kind: "screenshot" | "recording" | "technical_context";
            /** Format: uuid */
            attachment_id?: string | null;
            /** @description Agent-only API-owned attachment path, protected by organization and conversation visibility. */
            download_url?: string | null;
            duration_ms: number;
            context: components["schemas"]["WidgetTechnicalContext"];
            /** Format: date-time */
            expires_at: string;
            /** Format: date-time */
            created_at: string;
        };
        /** @description Consent required. Up to 50 console/network entries. URLs retain origin only; emails, phone numbers, tokens, passwords and sensitive metadata keys are masked. Do not send headers, bodies, cookies or local storage. Capture pixels must be masked by the SDK before upload. */
        WidgetTechnicalContext: {
            console_errors?: string[];
            network_failures?: {
                url?: string;
                /** @enum {string} */
                method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS" | "";
                status?: number;
                error?: string;
            }[];
            browser?: string;
            os?: string;
            url?: string;
            metadata?: {
                [key: string]: unknown;
            };
        };
        EnvelopeWidgetRating: {
            /** @enum {boolean} */
            success: true;
            data: components["schemas"]["WidgetRating"];
            meta: components["schemas"]["ResponseMeta"];
        };
        WidgetRating: {
            score: number;
            comment: string;
            /** Format: date-time */
            created_at: string;
            existing: boolean;
        };
        EnvelopeWidgetHelp: {
            /** @enum {boolean} */
            success: true;
            data: {
                available: boolean;
                help_center_url: string | null;
                items: components["schemas"]["WidgetHelpArticle"][];
            };
            meta: components["schemas"]["ResponseMeta"];
        };
        WidgetHelpArticle: {
            title: string;
            excerpt: string;
            /** Format: uri */
            url: string;
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
        /** @description Resource not found */
        NotFound: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description Rate limited */
        TooManyRequests: {
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
    parameters: {
        /**
         * @description Mobile app key (CF-201): a native app sends it with
         *     `X-ClickFix-App-Package` instead of a page origin; the widget's
         *     origin allowlist is then not consulted. Unknown, revoked or
         *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
         *     that arrives together with an `Origin` or `Referer` (a page never
         *     holds an app key; the headers are not CORS-allowed).
         */
        WidgetAppKey: string;
        /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
        WidgetAppPackage: string;
        /** @description Public widget id (the widget's channel instance uuid) */
        WidgetPublicID: string;
        WidgetConversation: string;
    };
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    GetreplayprivacypolicyCF126: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                public_id: string;
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
                        success: boolean;
                        data: components["schemas"]["WidgetReplayPolicy"];
                        meta: components["schemas"]["ResponseMeta"];
                    };
                };
            };
            /** @description Invalid request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Authentication required */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Origin, consent, permission or entitlement denied */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Resource not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Rate or plan quota exceeded */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StartconsentedreplayCF126: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                public_id: string;
                conversation: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @constant */
                    consent: true;
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
                    "application/json": {
                        success: boolean;
                        data: components["schemas"]["WidgetSession"];
                        meta: components["schemas"]["ResponseMeta"];
                    };
                };
            };
            /** @description Invalid request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Authentication required */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Origin, consent, permission or entitlement denied */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Resource not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Rate or plan quota exceeded */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ChangevisitorsessionconsentCF126: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                public_id: string;
                conversation: string;
                session: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @enum {string} */
                    action: "accept" | "decline" | "stop" | "revoke";
                };
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
                        success: boolean;
                        data: components["schemas"]["WidgetSession"];
                        meta: components["schemas"]["ResponseMeta"];
                    };
                };
            };
            /** @description Invalid request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Authentication required */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Origin, consent, permission or entitlement denied */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Resource not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Rate or plan quota exceeded */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UploadmaskedcompressedDOMeventsCF126: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                public_id: string;
                conversation: string;
                session: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    sequence: number;
                    /**
                     * Format: byte
                     * @description Base64 gzip of rrweb event array; max 512 KiB compressed, 2 MiB expanded; sequential for replay, ephemeral for co-browse
                     */
                    data: string;
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
                    "application/json": {
                        success: boolean;
                        data: {
                            [key: string]: unknown;
                        };
                        meta: components["schemas"]["ResponseMeta"];
                    };
                };
            };
            /** @description Invalid request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Authentication required */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Origin, consent, permission or entitlement denied */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Resource not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Rate or plan quota exceeded */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    VisitorlivestreamtokenCF126: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                public_id: string;
                conversation: string;
                session: string;
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
                        success: boolean;
                        data: components["schemas"]["WidgetLiveTokens"];
                        meta: components["schemas"]["ResponseMeta"];
                    };
                };
            };
            /** @description Invalid request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Authentication required */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Origin, consent, permission or entitlement denied */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Resource not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Rate or plan quota exceeded */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    widgetSetAttributes: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                /** @description Public widget id (the widget's channel instance uuid) */
                public_id: components["parameters"]["WidgetPublicID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WidgetAttributesInput"];
            };
        };
        responses: {
            /** @description Result */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EnvelopeWidgetAttributes"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthenticated"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
        };
    };
    widgetBootstrap: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                /** @description Public widget id (the widget's channel instance uuid) */
                public_id: components["parameters"]["WidgetPublicID"];
            };
            cookie?: never;
        };
        /** @description The page view (optional; older SDKs send no body). Feeds targeting, triggers and the install checker. */
        requestBody?: {
            content: {
                "application/json": components["schemas"]["WidgetBootstrapInput"];
            };
        };
        responses: {
            /** @description Visitor session */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EnvelopeWidgetBootstrap"];
                };
            };
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
        };
    };
    widgetIdentify: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                /** @description Public widget id (the widget's channel instance uuid) */
                public_id: components["parameters"]["WidgetPublicID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WidgetIdentifyInput"];
            };
        };
        responses: {
            /** @description Visitor session of the user */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EnvelopeWidgetVisitor"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthenticated"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
        };
    };
    widgetUpdateProfile: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                /** @description Public widget id (the widget's channel instance uuid) */
                public_id: components["parameters"]["WidgetPublicID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WidgetProfileInput"];
            };
        };
        responses: {
            /** @description Visitor session */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EnvelopeWidgetVisitor"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthenticated"];
            404: components["responses"]["NotFound"];
        };
    };
    widgetRealtimeToken: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                /** @description Public widget id (the widget's channel instance uuid) */
                public_id: components["parameters"]["WidgetPublicID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Tokens */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EnvelopeWidgetRealtimeToken"];
                };
            };
            401: components["responses"]["Unauthenticated"];
            404: components["responses"]["NotFound"];
            /** @description Realtime is disabled; the widget polls */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    widgetListConversations: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                /** @description Public widget id (the widget's channel instance uuid) */
                public_id: components["parameters"]["WidgetPublicID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Conversations, newest first */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EnvelopeWidgetConversations"];
                };
            };
            401: components["responses"]["Unauthenticated"];
            404: components["responses"]["NotFound"];
        };
    };
    widgetCreateConversation: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                /** @description Public widget id (the widget's channel instance uuid) */
                public_id: components["parameters"]["WidgetPublicID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WidgetSendInput"];
                "multipart/form-data": components["schemas"]["WidgetSendMultipart"];
            };
        };
        responses: {
            /** @description Stored */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EnvelopeWidgetSent"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthenticated"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            /** @description The file is too large */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            429: components["responses"]["TooManyRequests"];
        };
    };
    widgetListMessages: {
        parameters: {
            query?: {
                /** @description Only messages after this message (polling) */
                after?: string;
                /** @description Only messages before this message (history) */
                before?: string;
            };
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                /** @description Public widget id (the widget's channel instance uuid) */
                public_id: components["parameters"]["WidgetPublicID"];
                conversation: components["parameters"]["WidgetConversation"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Page */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EnvelopeWidgetMessagePage"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthenticated"];
            404: components["responses"]["NotFound"];
        };
    };
    widgetSendMessage: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                /** @description Public widget id (the widget's channel instance uuid) */
                public_id: components["parameters"]["WidgetPublicID"];
                conversation: components["parameters"]["WidgetConversation"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WidgetSendInput"];
                "multipart/form-data": components["schemas"]["WidgetSendMultipart"];
            };
        };
        responses: {
            /** @description Stored */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EnvelopeWidgetSent"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthenticated"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
            /** @description The file is too large */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            429: components["responses"]["TooManyRequests"];
        };
    };
    widgetMarkRead: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                /** @description Public widget id (the widget's channel instance uuid) */
                public_id: components["parameters"]["WidgetPublicID"];
                conversation: components["parameters"]["WidgetConversation"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Updated count */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @enum {boolean} */
                        success: true;
                        data: {
                            updated: number;
                        };
                        meta: components["schemas"]["ResponseMeta"];
                    };
                };
            };
            401: components["responses"]["Unauthenticated"];
            404: components["responses"]["NotFound"];
        };
    };
    widgetTyping: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                /** @description Public widget id (the widget's channel instance uuid) */
                public_id: components["parameters"]["WidgetPublicID"];
                conversation: components["parameters"]["WidgetConversation"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    typing: boolean;
                };
            };
        };
        responses: {
            /** @description Relayed */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @enum {boolean} */
                        success: true;
                        data: {
                            typing: boolean;
                        };
                        meta: components["schemas"]["ResponseMeta"];
                    };
                };
            };
            401: components["responses"]["Unauthenticated"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
        };
    };
    widgetCaptureDiagnostic: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Public widget id (the widget's channel instance uuid) */
                public_id: components["parameters"]["WidgetPublicID"];
                conversation: components["parameters"]["WidgetConversation"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @constant */
                    consent: true;
                    context?: components["schemas"]["WidgetTechnicalContext"];
                };
                "multipart/form-data": {
                    /** @enum {string} */
                    kind: "screenshot" | "recording";
                    /** Format: binary */
                    file: string;
                    /** @description JSON WidgetTechnicalContext */
                    context?: string;
                    /** @enum {string} */
                    consent: "true";
                    /** @enum {string} */
                    pii_masked: "true";
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
                    "application/json": {
                        success: boolean;
                        data: components["schemas"]["WidgetDiagnostic"];
                        meta: components["schemas"]["ResponseMeta"];
                    };
                };
            };
            400: components["responses"]["ValidationError"];
            401: components["responses"]["Unauthenticated"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            /** @description Capture exceeds file size cap */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            429: components["responses"]["TooManyRequests"];
        };
    };
    widgetRateConversation: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                /** @description Public widget id (the widget's channel instance uuid) */
                public_id: components["parameters"]["WidgetPublicID"];
                conversation: components["parameters"]["WidgetConversation"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    score: number;
                    comment?: string;
                };
            };
        };
        responses: {
            /** @description Rating */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EnvelopeWidgetRating"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthenticated"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    widgetBookingLink: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                /** @description Public widget id (the widget's channel instance uuid) */
                public_id: components["parameters"]["WidgetPublicID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Booking link */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        success: true;
                        data: {
                            available: boolean;
                            url: string | null;
                        };
                        meta: components["schemas"]["ResponseMeta"];
                    };
                };
            };
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
        };
    };
    widgetHelpSearch: {
        parameters: {
            query?: {
                q?: string;
                locale?: "tr" | "en";
            };
            header?: {
                /**
                 * @description Mobile app key (CF-201): a native app sends it with
                 *     `X-ClickFix-App-Package` instead of a page origin; the widget's
                 *     origin allowlist is then not consulted. Unknown, revoked or
                 *     mismatched keys answer 403 `WIDGET_APP_KEY_INVALID`, as does a key
                 *     that arrives together with an `Origin` or `Referer` (a page never
                 *     holds an app key; the headers are not CORS-allowed).
                 */
                "X-ClickFix-App-Key"?: components["parameters"]["WidgetAppKey"];
                /** @description The app's bundle id (iOS) or application id (Android), compared case-insensitively with the key's. */
                "X-ClickFix-App-Package"?: components["parameters"]["WidgetAppPackage"];
            };
            path: {
                /** @description Public widget id (the widget's channel instance uuid) */
                public_id: components["parameters"]["WidgetPublicID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Help articles */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EnvelopeWidgetHelp"];
                };
            };
            400: components["responses"]["BadRequest"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
        };
    };
}
