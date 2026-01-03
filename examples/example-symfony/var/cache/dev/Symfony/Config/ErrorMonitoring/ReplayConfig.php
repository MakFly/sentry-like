<?php

namespace Symfony\Config\ErrorMonitoring;

use Symfony\Component\Config\Loader\ParamConfigurator;
use Symfony\Component\Config\Definition\Exception\InvalidConfigurationException;

/**
 * This class is automatically generated to help in creating a config.
 */
class ReplayConfig 
{
    private $enabled;
    private $sampleRate;
    private $_usedProperties = [];

    /**
     * @default false
     * @param ParamConfigurator|bool $value
     * @return $this
     */
    public function enabled($value): static
    {
        $this->_usedProperties['enabled'] = true;
        $this->enabled = $value;

        return $this;
    }

    /**
     * @default 0.1
     * @param ParamConfigurator|float $value
     * @return $this
     */
    public function sampleRate($value): static
    {
        $this->_usedProperties['sampleRate'] = true;
        $this->sampleRate = $value;

        return $this;
    }

    public function __construct(array $config = [])
    {
        if (array_key_exists('enabled', $config)) {
            $this->_usedProperties['enabled'] = true;
            $this->enabled = $config['enabled'];
            unset($config['enabled']);
        }

        if (array_key_exists('sample_rate', $config)) {
            $this->_usedProperties['sampleRate'] = true;
            $this->sampleRate = $config['sample_rate'];
            unset($config['sample_rate']);
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
        if (isset($this->_usedProperties['sampleRate'])) {
            $output['sample_rate'] = $this->sampleRate;
        }

        return $output;
    }

}
