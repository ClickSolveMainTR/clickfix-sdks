<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Support;

/** Minimal .env editor used by clickfix:install and clickfix:webhook:secret --write. */
final class EnvFile
{
    public function __construct(private readonly string $path) {}

    public function exists(): bool
    {
        return is_file($this->path);
    }

    public function has(string $key): bool
    {
        return $this->exists() && preg_match('/^'.preg_quote($key, '/').'=/m', (string) file_get_contents($this->path)) === 1;
    }

    /** Replace the key's line or append `KEY=value`. Values with spaces or quotes are double-quoted. */
    public function set(string $key, string $value): void
    {
        $line = $key.'='.self::quote($value);
        $content = $this->exists() ? (string) file_get_contents($this->path) : '';
        if ($this->has($key)) {
            $content = (string) preg_replace('/^'.preg_quote($key, '/').'=.*$/m', str_replace(['\\', '$'], ['\\\\', '\\$'], $line), $content, 1);
        } else {
            $content = rtrim($content, "\n");
            $content = ($content === '' ? '' : $content."\n").$line."\n";
        }
        file_put_contents($this->path, $content);
    }

    /** Append the keys that are missing; returns the keys written. @param  array<string, string>  $defaults @return list<string> */
    public function addMissing(array $defaults): array
    {
        $written = [];
        foreach ($defaults as $key => $value) {
            if (! $this->has($key)) {
                $this->set($key, $value);
                $written[] = $key;
            }
        }

        return $written;
    }

    private static function quote(string $value): string
    {
        if ($value === '' || preg_match('/^[A-Za-z0-9_\/.:@+=,-]*$/', $value)) {
            return $value;
        }

        return '"'.str_replace(['\\', '"'], ['\\\\', '\\"'], $value).'"';
    }
}
