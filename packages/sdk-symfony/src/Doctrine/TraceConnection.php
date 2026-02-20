<?php

namespace Makfly\ErrorWatch\Doctrine;

use Doctrine\DBAL\Driver\Middleware\AbstractConnectionMiddleware;
use Doctrine\DBAL\Driver\Result;
use Doctrine\DBAL\Driver\Statement as StatementInterface;
use Makfly\ErrorWatch\Model\Span;
use Makfly\ErrorWatch\Service\TransactionCollector;

final class TraceConnection extends AbstractConnectionMiddleware
{
    public function __construct(
        \Doctrine\DBAL\Driver\Connection $connection,
        private readonly TransactionCollector $collector,
        private readonly bool $logQueries,
    ) {
        parent::__construct($connection);
    }

    public function prepare(string $sql): StatementInterface
    {
        return new TraceStatement(parent::prepare($sql), $this->collector, $sql, $this->logQueries);
    }

    public function query(string $sql): Result
    {
        $span = new Span('db.sql.query', $this->logQueries ? self::sanitize($sql) : null);

        try {
            $result = parent::query($sql);
            $span->setStatus('ok');

            return $result;
        } catch (\Throwable $e) {
            $span->setStatus('error');
            throw $e;
        } finally {
            $span->finish();
            $this->collector->addSpan($span);
        }
    }

    public static function sanitize(string $sql): string
    {
        return preg_replace(["/\'[^\']*\'/", '/\b\d+\b/'], '?', $sql);
    }
}
