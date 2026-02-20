<?php

namespace ErrorWatch\Symfony\DependencyInjection;

use Symfony\Component\Config\Definition\Builder\TreeBuilder;
use Symfony\Component\Config\Definition\ConfigurationInterface;

final class Configuration implements ConfigurationInterface
{
    public function getConfigTreeBuilder(): TreeBuilder
    {
        $treeBuilder = new TreeBuilder('error_watch');
        $rootNode = $treeBuilder->getRootNode();

        $rootNode
            ->children()
                ->booleanNode('enabled')->defaultTrue()->end()
                ->scalarNode('endpoint')->defaultValue('')->end()
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
                ->arrayNode('breadcrumbs')
                    ->addDefaultsIfNotSet()
                    ->children()
                        ->booleanNode('enabled')->defaultTrue()->info('Enable automatic breadcrumb collection')->end()
                        ->integerNode('max_count')
                            ->defaultValue(100)
                            ->min(1)
                            ->max(500)
                            ->info('Maximum number of breadcrumbs to keep')
                        ->end()
                    ->end()
                ->end()
                ->arrayNode('user_context')
                    ->addDefaultsIfNotSet()
                    ->children()
                        ->booleanNode('enabled')->defaultTrue()->info('Enable user context capture for error attribution')->end()
                        ->booleanNode('capture_ip')
                            ->defaultTrue()
                            ->info('Capture IP address in user context')
                        ->end()
                    ->end()
                ->end()
                ->arrayNode('console')
                    ->addDefaultsIfNotSet()
                    ->children()
                        ->booleanNode('enabled')->defaultTrue()->end()
                        ->booleanNode('capture_exit_codes')->defaultTrue()
                            ->info('Capture non-zero exit codes even without exceptions')->end()
                    ->end()
                ->end()
                ->arrayNode('messenger')
                    ->addDefaultsIfNotSet()
                    ->children()
                        ->booleanNode('enabled')->defaultTrue()->end()
                        ->booleanNode('capture_retries')->defaultFalse()
                            ->info('Also capture failures that will be retried (noisy)')->end()
                    ->end()
                ->end()
                ->arrayNode('deprecations')
                    ->addDefaultsIfNotSet()
                    ->children()
                        ->booleanNode('enabled')->defaultFalse()
                            ->info('Capture PHP deprecations (opt-in, can be noisy)')->end()
                    ->end()
                ->end()
                ->arrayNode('security')
                    ->addDefaultsIfNotSet()
                    ->children()
                        ->booleanNode('enabled')->defaultTrue()->end()
                        ->booleanNode('capture_login_success')->defaultFalse()
                            ->info('Add breadcrumbs for successful logins')->end()
                    ->end()
                ->end()
                ->arrayNode('apm')
                    ->addDefaultsIfNotSet()
                    ->children()
                        ->booleanNode('enabled')->defaultTrue()->end()
                        ->booleanNode('request_tracking')->defaultTrue()->end()
                        ->arrayNode('doctrine')
                            ->addDefaultsIfNotSet()
                            ->children()
                                ->booleanNode('enabled')->defaultTrue()->end()
                                ->booleanNode('log_queries')->defaultTrue()->info('Log sanitized SQL in span descriptions')->end()
                            ->end()
                        ->end()
                        ->arrayNode('http_client')
                            ->addDefaultsIfNotSet()
                            ->children()
                                ->booleanNode('enabled')->defaultTrue()->end()
                                ->booleanNode('capture_errors_as_breadcrumbs')->defaultTrue()->end()
                            ->end()
                        ->end()
                        ->arrayNode('excluded_routes')
                            ->scalarPrototype()->end()
                            ->defaultValue(['_profiler', '_wdt'])
                        ->end()
                    ->end()
                ->end()
                ->arrayNode('monolog')
                    ->addDefaultsIfNotSet()
                    ->children()
                        ->booleanNode('enabled')->defaultTrue()->info('Enable automatic Monolog forwarding to ErrorWatch')->end()
                        ->enumNode('level')
                            ->values(['debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency'])
                            ->defaultValue('warning')
                        ->end()
                        ->arrayNode('excluded_channels')
                            ->scalarPrototype()->end()
                            ->defaultValue(['event', 'doctrine', 'http_client'])
                            ->info('Monolog channels ignored by the ErrorWatch handler')
                        ->end()
                        ->booleanNode('capture_context')->defaultTrue()->info('Include Monolog context in payload')->end()
                        ->booleanNode('capture_extra')->defaultTrue()->info('Include Monolog extra data in payload')->end()
                    ->end()
                ->end()
            ->end();

        $rootNode
            ->validate()
                ->ifTrue(static function (array $config): bool {
                    $active = ($config['enabled'] ?? true)
                        || (($config['replay']['enabled'] ?? false) === true);

                    return $active && ($config['endpoint'] ?? '') === '';
                })
                ->thenInvalid('error_watch.endpoint is required when error_watch is enabled.')
            ->end()
            ->validate()
                ->ifTrue(static function (array $config): bool {
                    $active = ($config['enabled'] ?? true)
                        || (($config['replay']['enabled'] ?? false) === true);

                    return $active && ($config['api_key'] ?? '') === '';
                })
                ->thenInvalid('error_watch.api_key is required when error_watch is enabled.')
            ->end();

        return $treeBuilder;
    }
}
