<?php

declare(strict_types=1);

namespace ClickFix\Exception;

/**
 * A non-2xx response. Subclasses map the statuses the public API documents:
 * 401 AuthenticationException, 403 ForbiddenException, 404 NotFoundException,
 * 409 ConflictException, 400/422 ValidationException, 429 RateLimitException,
 * 5xx ServerException. Anything else is a plain ApiException.
 */
class ApiException extends \RuntimeException implements ClickFixException
{
    /**
     * @param array<string, mixed>       $details the error body details (`error.details`), if any
     * @param array<string, mixed>|null  $body    the decoded response body, if it was JSON
     */
    public function __construct(
        public readonly int $status,
        public readonly string $errorCode,
        public readonly ?string $requestId,
        public readonly array $details = [],
        public readonly ?array $body = null,
        ?string $message = null,
    ) {
        parent::__construct($message ?? sprintf('ClickFix %d: %s', $status, $errorCode));
    }

    /**
     * @param array<string, mixed>|null $body decoded JSON body (null when the body was not JSON)
     */
    public static function fromResponse(int $status, ?array $body, ?string $requestIdHeader): ApiException
    {
        $error = is_array($body['error'] ?? null) ? $body['error'] : [];
        $code = is_string($error['code'] ?? null) && $error['code'] !== '' ? $error['code'] : 'HTTP_ERROR';
        $meta = is_array($body['meta'] ?? null) ? $body['meta'] : [];
        $requestId = is_string($meta['request_id'] ?? null) ? $meta['request_id'] : $requestIdHeader;
        $details = is_array($error['details'] ?? null) ? $error['details'] : [];
        $message = is_string($error['message'] ?? null) && $error['message'] !== ''
            ? sprintf('ClickFix %d: %s (%s)', $status, $code, $error['message'])
            : null;

        return match (true) {
            $status === 401 => new AuthenticationException($status, $code, $requestId, $details, $body, $message),
            $status === 403 => new ForbiddenException($status, $code, $requestId, $details, $body, $message),
            $status === 404 => new NotFoundException($status, $code, $requestId, $details, $body, $message),
            $status === 409 => new ConflictException($status, $code, $requestId, $details, $body, $message),
            $status === 400, $status === 422 => new ValidationException($status, $code, $requestId, $details, $body, $message),
            $status === 429 => new RateLimitException($status, $code, $requestId, $details, $body, $message),
            $status >= 500 => new ServerException($status, $code, $requestId, $details, $body, $message),
            default => new self($status, $code, $requestId, $details, $body, $message),
        };
    }
}
