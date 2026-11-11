<?php

declare(strict_types=1);

namespace ClickFix\Exception;

/**
 * The HTTP client could not complete the request (DNS, connection, timeout) after the retry budget.
 */
final class TransportException extends \RuntimeException implements ClickFixException
{
    /**
     * Chains the PSR-18 exception through a plain wrapper, so the request (and its Authorization header)
     * does not travel with the exception into logs and error reporters.
     */
    public static function wrap(\Throwable $previous): self
    {
        $message = $previous->getMessage();
        $code = is_int($previous->getCode()) ? $previous->getCode() : 0;

        return new self('ClickFix request failed: '.$message, $code, new \RuntimeException(get_class($previous).': '.$message, $code));
    }
}
