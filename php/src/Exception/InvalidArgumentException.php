<?php

declare(strict_types=1);

namespace ClickFix\Exception;

/**
 * Thrown before any request is sent: empty API key, missing path parameter, invalid options.
 */
final class InvalidArgumentException extends \InvalidArgumentException implements ClickFixException
{
}
