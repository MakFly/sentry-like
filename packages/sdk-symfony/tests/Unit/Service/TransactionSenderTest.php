<?php

namespace Makfly\ErrorWatch\Tests\Unit\Service;

use PHPUnit\Framework\TestCase;
use Makfly\ErrorWatch\Http\MonitoringClientInterface;
use Makfly\ErrorWatch\Model\Transaction;
use Makfly\ErrorWatch\Service\TransactionSender;

final class TransactionSenderTest extends TestCase
{
    private MonitoringClientInterface $mockClient;

    protected function setUp(): void
    {
        $this->mockClient = $this->createMock(MonitoringClientInterface::class);
    }

    public function testSendCallsClientWithCorrectPayload(): void
    {
        $sender = new TransactionSender(
            client: $this->mockClient,
            enabled: true,
            environment: 'production',
        );

        $txn = new Transaction('GET /users');
        $txn->finish();

        $this->mockClient->expects($this->once())
            ->method('sendTransaction')
            ->with($this->callback(function ($payload) {
                return isset($payload['transaction'])
                    && isset($payload['env'])
                    && $payload['env'] === 'production'
                    && $payload['transaction']['name'] === 'GET /users'
                    && $payload['transaction']['op'] === 'http.server';
            }));

        $sender->send($txn);
    }

    public function testSendSkipsWhenDisabled(): void
    {
        $sender = new TransactionSender(
            client: $this->mockClient,
            enabled: false,
            environment: 'test',
        );

        $this->mockClient->expects($this->never())
            ->method('sendTransaction');

        $txn = new Transaction('GET /users');
        $txn->finish();
        $sender->send($txn);
    }

    public function testSendFailsSilently(): void
    {
        $sender = new TransactionSender(
            client: $this->mockClient,
            enabled: true,
            environment: 'test',
        );

        $this->mockClient->expects($this->once())
            ->method('sendTransaction')
            ->willThrowException(new \RuntimeException('Network error'));

        $txn = new Transaction('GET /users');
        $txn->finish();

        // Should not throw
        $sender->send($txn);
    }
}
