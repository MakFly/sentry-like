<?php

namespace ErrorWatch\Symfony\Service;

use ErrorWatch\Symfony\Model\Span;
use ErrorWatch\Symfony\Model\Transaction;

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
        if (null === $this->current) {
            return;
        }

        $this->current->addSpan($span);
    }

    public function finishTransaction(string $status = 'ok'): ?Transaction
    {
        if (null === $this->current) {
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
        return null !== $this->current;
    }

    public function reset(): void
    {
        $this->current = null;
    }
}
