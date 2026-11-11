<?php

declare(strict_types=1);

namespace ClickFix\Tests;

use GuzzleHttp\Psr7\Response;
use Psr\Http\Client\ClientInterface;
use Psr\Http\Client\NetworkExceptionInterface;
use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ResponseInterface;

/**
 * Scripted PSR-18 client: answers in order with responses or throwables and records every request.
 */
final class FakeHttpClient implements ClientInterface
{
    /** @var list<array{request: RequestInterface, body: string}> */
    public array $calls = [];

    /**
     * @param list<ResponseInterface|\Throwable> $script
     */
    public function __construct(private array $script)
    {
    }

    /**
     * @param array<string, mixed>|list<mixed>|null $data
     * @param array<string, string>                 $headers
     */
    public static function json(int $status, ?array $data, array $headers = [], ?string $code = null): Response
    {
        $body = $status < 400
            ? ['success' => true, 'data' => $data, 'meta' => ['request_id' => 'req-'.$status]]
            : ['success' => false, 'error' => ['code' => $code ?? 'ERROR', 'message' => 'scripted', 'details' => ['field' => 'x']], 'meta' => ['request_id' => 'req-'.$status]];

        return new Response($status, ['Content-Type' => 'application/json'] + $headers, json_encode($body, JSON_THROW_ON_ERROR));
    }

    public function sendRequest(RequestInterface $request): ResponseInterface
    {
        $this->calls[] = ['request' => $request, 'body' => (string) $request->getBody()];
        $next = array_shift($this->script) ?? throw new \LogicException('no scripted response left');
        if ($next instanceof \Throwable) {
            throw $next;
        }

        return $next;
    }
}

final class FakeNetworkException extends \RuntimeException implements NetworkExceptionInterface
{
    public function __construct(private readonly RequestInterface $request)
    {
        parent::__construct('connection reset');
    }

    public function getRequest(): RequestInterface
    {
        return $this->request;
    }
}
