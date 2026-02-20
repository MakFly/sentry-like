<?php

namespace Makfly\ErrorWatch\Model;

final class Span
{
    private string $id;
    private string $op;
    private ?string $description;
    private string $status = 'ok';
    private int $startTimestamp;
    private ?int $endTimestamp = null;
    /** @var array<string, mixed> */
    private array $data = [];

    public function __construct(string $op, ?string $description = null)
    {
        $this->id = bin2hex(random_bytes(16));
        $this->op = $op;
        $this->description = $description;
        $this->startTimestamp = (int) (microtime(true) * 1000);
    }

    public function finish(): void
    {
        $this->endTimestamp = (int) (microtime(true) * 1000);
    }

    public function setStatus(string $status): void
    {
        $this->status = $status;
    }

    public function setData(string $key, mixed $value): void
    {
        $this->data[$key] = $value;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'op' => $this->op,
            'description' => $this->description,
            'status' => $this->status,
            'startTimestamp' => $this->startTimestamp,
            'endTimestamp' => $this->endTimestamp,
            'data' => $this->data,
        ];
    }
}
