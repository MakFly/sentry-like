<?php

namespace Symfony\Config;

require_once __DIR__.\DIRECTORY_SEPARATOR.'ErrorMonitoring'.\DIRECTORY_SEPARATOR.'ReplayConfig.php';

use Symfony\Component\Config\Loader\ParamConfigurator;
use Symfony\Component\Config\Definition\Exception\InvalidConfigurationException;

/**
 * This class is automatically generated to help in creating a config.
 */
class ErrorMonitoringConfig implements \Symfony\Component\Config\Builder\ConfigBuilderInterface
{
    private $enabled;
    private $endpoint;
    private $apiKey;
    private $environment;
    private $release;
    private $replay;
    private $_usedProperties = [];
    private $_hasDeprecatedCalls = false;

    /**
     * @default true
     * @param ParamConfigurator|bool $value
     * @return $this
     * @deprecated since Symfony 7.4
     */
    public function enabled($value): static
    {
        $this->_hasDeprecatedCalls = true;
        $this->_usedProperties['enabled'] = true;
        $this->enabled = $value;

        return $this;
    }

    /**
     * @default 'http://localhost:8000'
     * @param ParamConfigurator|mixed $value
     * @return $this
     * @deprecated since Symfony 7.4
     */
    public function endpoint($value): static
    {
        $this->_hasDeprecatedCalls = true;
        $this->_usedProperties['endpoint'] = true;
        $this->endpoint = $value;

        return $this;
    }

    /**
     * @default null
     * @param ParamConfigurator|mixed $value
     * @return $this
     * @deprecated since Symfony 7.4
     */
    public function apiKey($value): static
    {
        $this->_hasDeprecatedCalls = true;
        $this->_usedProperties['apiKey'] = true;
        $this->apiKey = $value;

        return $this;
    }

    /**
     * @default null
     * @param ParamConfigurator|mixed $value
     * @return $this
     * @deprecated since Symfony 7.4
     */
    public function environment($value): static
    {
        $this->_hasDeprecatedCalls = true;
        $this->_usedProperties['environment'] = true;
        $this->environment = $value;

        return $this;
    }

    /**
     * Release version (e.g., "1.2.3", "abc123"). If null, auto-detects from git or APP_VERSION env.
     * @default null
     * @param ParamConfigurator|mixed $value
     * @return $this
     * @deprecated since Symfony 7.4
     */
    public function release($value): static
    {
        $this->_hasDeprecatedCalls = true;
        $this->_usedProperties['release'] = true;
        $this->release = $value;

        return $this;
    }

    /**
     * @default {"enabled":false,"sample_rate":0.1}
     * @deprecated since Symfony 7.4
     */
    public function replay(array $value = []): \Symfony\Config\ErrorMonitoring\ReplayConfig
    {
        $this->_hasDeprecatedCalls = true;
        if (null === $this->replay) {
            $this->_usedProperties['replay'] = true;
            $this->replay = new \Symfony\Config\ErrorMonitoring\ReplayConfig($value);
        } elseif (0 < \func_num_args()) {
            throw new InvalidConfigurationException('The node created by "replay()" has already been initialized. You cannot pass values the second time you call replay().');
        }

        return $this->replay;
    }

    public function getExtensionAlias(): string
    {
        return 'error_monitoring';
    }

    public function __construct(array $config = [])
    {
        if (array_key_exists('enabled', $config)) {
            $this->_usedProperties['enabled'] = true;
            $this->enabled = $config['enabled'];
            unset($config['enabled']);
        }

        if (array_key_exists('endpoint', $config)) {
            $this->_usedProperties['endpoint'] = true;
            $this->endpoint = $config['endpoint'];
            unset($config['endpoint']);
        }

        if (array_key_exists('api_key', $config)) {
            $this->_usedProperties['apiKey'] = true;
            $this->apiKey = $config['api_key'];
            unset($config['api_key']);
        }

        if (array_key_exists('environment', $config)) {
            $this->_usedProperties['environment'] = true;
            $this->environment = $config['environment'];
            unset($config['environment']);
        }

        if (array_key_exists('release', $config)) {
            $this->_usedProperties['release'] = true;
            $this->release = $config['release'];
            unset($config['release']);
        }

        if (array_key_exists('replay', $config)) {
            $this->_usedProperties['replay'] = true;
            $this->replay = new \Symfony\Config\ErrorMonitoring\ReplayConfig($config['replay']);
            unset($config['replay']);
        }

        if ($config) {
            throw new InvalidConfigurationException(sprintf('The following keys are not supported by "%s": ', __CLASS__).implode(', ', array_keys($config)));
        }
    }

    public function toArray(): array
    {
        $output = [];
        if (isset($this->_usedProperties['enabled'])) {
            $output['enabled'] = $this->enabled;
        }
        if (isset($this->_usedProperties['endpoint'])) {
            $output['endpoint'] = $this->endpoint;
        }
        if (isset($this->_usedProperties['apiKey'])) {
            $output['api_key'] = $this->apiKey;
        }
        if (isset($this->_usedProperties['environment'])) {
            $output['environment'] = $this->environment;
        }
        if (isset($this->_usedProperties['release'])) {
            $output['release'] = $this->release;
        }
        if (isset($this->_usedProperties['replay'])) {
            $output['replay'] = $this->replay->toArray();
        }
        if ($this->_hasDeprecatedCalls) {
            trigger_deprecation('symfony/config', '7.4', 'Calling any fluent method on "%s" is deprecated; pass the configuration to the constructor instead.', $this::class);
        }

        return $output;
    }

}
