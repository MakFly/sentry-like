<?php

namespace Makfly\ErrorWatch\Service;

use Makfly\ErrorWatch\Model\Span;
use Makfly\ErrorWatch\Model\Transaction;

final class TransactionCollector
{
    private ?Transaction $current = null;

    public function startTransaction(string $name, string $op = 'http.server'): Transaction
    {
        $this->current = new Transaction($name, $op);

        return $this->current;
    }

    public function getCurrentTransaction(): ?Transaction
    {
        return $this->current;
    }

    public function addSpan(Span $span): void
    {
        if ($this->current === null) {
            return;
        }

        $this->current->addSpan($span);
    }

    public function finishTransaction(string $status = 'ok'): ?Transaction
    {
        if ($this->current === null) {
            return null;
        }

        $this->current->setStatus($status);
        $this->current->finish();
        $txn = $this->current;
        $this->current = null;

        return $txn;
    }

    public function hasTransaction(): bool
    {
        return $this->current !== null;
    }

    public function reset(): void
    {
        $this->current = null;
    }
}
