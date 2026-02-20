<?php

namespace Makfly\ErrorWatch\Doctrine;

use Doctrine\DBAL\Driver\Middleware\AbstractDriverMiddleware;
use Doctrine\DBAL\Driver\Connection as ConnectionInterface;
use Makfly\ErrorWatch\Service\TransactionCollector;

final class TraceDriver extends AbstractDriverMiddleware
{
    public function __construct(
        \Doctrine\DBAL\Driver $driver,
        private readonly TransactionCollector $collector,
        private readonly bool $logQueries,
    ) {
        parent::__construct($driver);
    }

    public function connect(array $params): ConnectionInterface
    {
        return new TraceConnection(parent::connect($params), $this->collector, $this->logQueries);
    }
}
