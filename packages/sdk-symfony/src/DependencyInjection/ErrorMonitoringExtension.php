<?php

namespace Makfly\ErrorWatch\DependencyInjection;

use Symfony\Component\Config\Definition\Processor;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Extension\Extension;
use Symfony\Component\DependencyInjection\Extension\PrependExtensionInterface;
use Symfony\Component\DependencyInjection\Loader\YamlFileLoader;
use Symfony\Component\Config\FileLocator;

final class ErrorMonitoringExtension extends Extension implements PrependExtensionInterface
{
    public function prepend(ContainerBuilder $container): void
    {
        if (!$container->hasExtension('monolog')) {
            return;
        }

        $rawConfigs = $container->getExtensionConfig($this->getAlias());
        $processor = new Processor();
        $resolved = $processor->processConfiguration(new Configuration(), $rawConfigs ?: [[]]);

        if (!$resolved['enabled'] || !$resolved['monolog']['enabled']) {
            return;
        }

        $container->prependExtensionConfig('monolog', [
            'handlers' => [
                'errorwatch' => [
                    'type' => 'service',
                    'id' => 'Makfly\ErrorWatch\Monolog\ErrorMonitoringHandler',
                    'level' => $resolved['monolog']['level'],
                ],
            ],
        ]);
    }

    public function load(array $configs, ContainerBuilder $container): void
    {
        $loader = new YamlFileLoader($container, new FileLocator(__DIR__ . '/../resources/config'));
        $loader->load('services.yaml');
        if (class_exists(\Twig\Extension\AbstractExtension::class)) {
            $loader->load('twig.yaml');
        }

        $configuration = new Configuration();
        $config = $this->processConfiguration($configuration, $configs);

        $container->setParameter('error_monitoring.enabled', $config['enabled']);
        $container->setParameter('error_monitoring.endpoint', $config['endpoint']);
        $container->setParameter('error_monitoring.api_key', $config['api_key']);
        // Use kernel.environment by default if not explicitly configured
        $environment = $config['environment'] ?? $container->getParameter('kernel.environment');
        $container->setParameter('error_monitoring.environment', $environment);

        // Release: use config, or auto-detect from env/git
        $release = $config['release'] ?? $this->detectRelease($container);
        $container->setParameter('error_monitoring.release', $release);

        // Replay parameters
        $container->setParameter('error_monitoring.replay.enabled', $config['replay']['enabled']);
        $container->setParameter('error_monitoring.replay.debug', $config['replay']['debug']);
        $container->setParameter('error_monitoring.replay.sample_rate', $config['replay']['sample_rate']);

        // Breadcrumbs parameters
        $container->setParameter('error_monitoring.breadcrumbs.enabled', $config['breadcrumbs']['enabled']);
        $container->setParameter('error_monitoring.breadcrumbs.max_count', $config['breadcrumbs']['max_count']);

        // User context parameters
        $container->setParameter('error_monitoring.user_context.enabled', $config['user_context']['enabled']);
        $container->setParameter('error_monitoring.user_context.capture_ip', $config['user_context']['capture_ip']);

        // APM parameters
        $container->setParameter('error_monitoring.apm.enabled', $config['apm']['enabled']);
        $container->setParameter('error_monitoring.apm.request_tracking', $config['apm']['request_tracking']);
        $container->setParameter('error_monitoring.apm.doctrine.enabled', $config['apm']['doctrine']['enabled']);
        $container->setParameter('error_monitoring.apm.doctrine.log_queries', $config['apm']['doctrine']['log_queries']);
        $container->setParameter('error_monitoring.apm.excluded_routes', $config['apm']['excluded_routes']);

        if ($config['apm']['enabled']) {
            $loader->load('apm.yaml');
            if ($config['apm']['doctrine']['enabled'] && class_exists(\Doctrine\DBAL\Driver\Middleware::class)) {
                $loader->load('apm_doctrine.yaml');
            }
        }

        // Monolog parameters
        $container->setParameter('error_monitoring.monolog.enabled', $config['monolog']['enabled']);
        $container->setParameter('error_monitoring.monolog.level', $config['monolog']['level']);
        $container->setParameter('error_monitoring.monolog.excluded_channels', $config['monolog']['excluded_channels']);
        $container->setParameter('error_monitoring.monolog.capture_context', $config['monolog']['capture_context']);
        $container->setParameter('error_monitoring.monolog.capture_extra', $config['monolog']['capture_extra']);
    }

    /**
     * Auto-detect release version from environment or git.
     */
    private function detectRelease(ContainerBuilder $container): ?string
    {
        // 1. Check APP_VERSION environment variable
        $appVersion = $_ENV['APP_VERSION'] ?? $_SERVER['APP_VERSION'] ?? getenv('APP_VERSION');
        if ($appVersion && $appVersion !== '') {
            return $appVersion;
        }

        // 2. Try to get git commit hash (check current dir and parent dirs)
        $projectDir = $container->getParameter('kernel.project_dir');
        $gitDir = $this->findGitDir($projectDir);

        if ($gitDir) {
            $gitHeadFile = $gitDir . '/HEAD';
            if (file_exists($gitHeadFile)) {
                $head = trim(file_get_contents($gitHeadFile));

                // Check if it's a ref (branch) or direct commit
                if (str_starts_with($head, 'ref: ')) {
                    $refPath = $gitDir . '/' . substr($head, 5);
                    if (file_exists($refPath)) {
                        return substr(trim(file_get_contents($refPath)), 0, 8); // Short hash
                    }
                } else {
                    return substr($head, 0, 8); // Direct commit hash
                }
            }
        }

        return null;
    }

    /**
     * Find .git directory (searches current dir and up to 3 parent dirs)
     */
    private function findGitDir(string $startDir): ?string
    {
        $dir = $startDir;
        $maxLevels = 4; // Check current + 3 parent levels

        for ($i = 0; $i < $maxLevels; $i++) {
            $gitDir = $dir . '/.git';
            if (is_dir($gitDir)) {
                return $gitDir;
            }
            $parentDir = dirname($dir);
            if ($parentDir === $dir) {
                break; // Reached root
            }
            $dir = $parentDir;
        }

        return null;
    }
}
