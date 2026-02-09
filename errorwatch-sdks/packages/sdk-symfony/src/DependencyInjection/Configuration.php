<?php

namespace Makfly\ErrorWatch\DependencyInjection;

use Symfony\Component\Config\Definition\Builder\TreeBuilder;
use Symfony\Component\Config\Definition\ConfigurationInterface;

final class Configuration implements ConfigurationInterface
{
    public function getConfigTreeBuilder(): TreeBuilder
    {
        $treeBuilder = new TreeBuilder('error_monitoring');
        $rootNode = $treeBuilder->getRootNode();

        $rootNode
            ->children()
                ->booleanNode('enabled')->defaultTrue()->end()
                ->scalarNode('endpoint')->defaultValue('http://localhost:8000')->end()
                ->scalarNode('api_key')->defaultValue('')->end()
                ->scalarNode('environment')->defaultNull()->end()
                ->scalarNode('release')
                    ->defaultNull()
                    ->info('Release version (e.g., "1.2.3", "abc123"). If null, auto-detects from git or APP_VERSION env.')
                ->end()
                ->arrayNode('replay')
                    ->addDefaultsIfNotSet()
                    ->children()
                        ->booleanNode('enabled')->defaultFalse()->end()
                        ->booleanNode('debug')->defaultFalse()->info('Enable verbose console logging for replay debugging')->end()
                        ->floatNode('sample_rate')
                            ->defaultValue(0.1)
                            ->min(0.0)
                            ->max(1.0)
                        ->end()
                    ->end()
                ->end()
            ->end();

        $rootNode
            ->validate()
                ->ifTrue(static function (array $config): bool {
                    $requiresKey = ($config['enabled'] ?? true)
                        || (($config['replay']['enabled'] ?? false) === true);

                    return $requiresKey && ($config['api_key'] ?? '') === '';
                })
                ->thenInvalid('error_monitoring.api_key is required when error monitoring or replay is enabled.')
            ->end();

        return $treeBuilder;
    }
}
