<?php

namespace Makfly\ErrorWatch\Tests\Unit\Service;

use PHPUnit\Framework\TestCase;
use Makfly\ErrorWatch\Service\ErrorSender;
use Makfly\ErrorWatch\Service\LevelMapper;
use Makfly\ErrorWatch\Http\MonitoringClientInterface;
use RuntimeException;

final class ErrorSenderTest extends TestCase
{
    private MonitoringClientInterface $mockClient;
    private ErrorSender $sender;

    protected function setUp(): void
    {
        $this->mockClient = $this->createMock(MonitoringClientInterface::class);
        $this->sender = new ErrorSender(
            enabled: true,
            environment: 'test',
            release: null,
            client: $this->mockClient,
            levelMapper: new LevelMapper(),
        );
    }

    public function testSendsErrorToMonitoringServer(): void
    {
        $exception = new RuntimeException('Test error message');

        $this->mockClient->expects($this->once())
            ->method('sendEventAsync')
            ->with($this->callback(function ($payload) {
                return isset($payload['message'])
                    && $payload['message'] === 'Test error message'
                    && $payload['env'] === 'test';
            }));

        $this->sender->send($exception);
    }

    public function testSkipsWhenDisabled(): void
    {
        $senderDisabled = new ErrorSender(
            enabled: false,
            environment: 'test',
            release: null,
            client: $this->mockClient,
            levelMapper: new LevelMapper(),
        );

        $this->mockClient->expects($this->never())
            ->method('sendEventAsync');

        $senderDisabled->send(new RuntimeException('Test'));
    }

    public function testCallsSendEventAsync(): void
    {
        $exception = new RuntimeException('Test error');

        // Verify that sendEventAsync is called (error handling is in MonitoringClient)
        $this->mockClient->expects($this->once())
            ->method('sendEventAsync');

        $this->sender->send($exception);
    }

    public function testBuildsCorrectPayload(): void
    {
        $exception = new RuntimeException('Test error');

        $this->mockClient->expects($this->once())
            ->method('sendEventAsync')
            ->with($this->callback(function ($payload) {
                return $payload['message'] === 'Test error'
                    && $payload['env'] === 'test'
                    && isset($payload['stack'])
                    && isset($payload['created_at']);
            }));

        $this->sender->send($exception, '/test-url');
    }

    public function testIncludesUrlInPayload(): void
    {
        $exception = new RuntimeException('Test error');
        $url = '/test/endpoint';

        $this->mockClient->expects($this->once())
            ->method('sendEventAsync')
            ->with($this->callback(function ($payload) use ($url) {
                return $payload['url'] === $url;
            }));

        $this->sender->send($exception, $url);
    }
}
