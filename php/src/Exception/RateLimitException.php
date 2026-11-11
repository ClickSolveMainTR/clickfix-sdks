<?php

declare(strict_types=1);

namespace ClickFix\Exception;

/**
 * HTTP 429 after the retry budget. `retryAfter` is the Retry-After header in seconds when the API sent one.
 */
final class RateLimitException extends ApiException
{
    public ?int $retryAfter = null;
}
