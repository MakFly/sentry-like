<?php

namespace Makfly\ErrorWatch\Service;

use Makfly\ErrorWatch\Http\MonitoringClientInterface;
use Makfly\ErrorWatch\Model\Transaction;

final class TransactionSender
{
    public function __construct(
        private readonly MonitoringClientInterface $client,
        private readonly bool $enabled,
        private readonly string $environment,
    ) {}

    public function send(Transaction $transaction): void
    {
        if (!$this->enabled) {
            return;
        }

        try {
            $this->client->sendTransaction([
                'transaction' => $transaction->toArray(),
                'env' => $this->environment,
            ]);
        } catch (\Throwable) {
        }
    }
}
