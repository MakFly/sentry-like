<?php

namespace Makfly\ErrorWatch\DependencyInjection;

use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Extension\Extension;
use Symfony\Component\DependencyInjection\Loader\YamlFileLoader;
use Symfony\Component\Config\FileLocator;

final class ErrorMonitoringExtension extends Extension
{
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
