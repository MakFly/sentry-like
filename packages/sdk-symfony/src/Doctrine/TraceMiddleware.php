<?php

namespace Makfly\ErrorWatch\Doctrine;

use Doctrine\DBAL\Driver;
use Doctrine\DBAL\Driver\Middleware;
use Makfly\ErrorWatch\Service\TransactionCollector;

final class TraceMiddleware implements Middleware
{
    public function __construct(
        private readonly TransactionCollector $collector,
        private readonly bool $logQueries,
    ) {}

    public function wrap(Driver $driver): Driver
    {
        return new TraceDriver($driver, $this->collector, $this->logQueries);
    }
}
