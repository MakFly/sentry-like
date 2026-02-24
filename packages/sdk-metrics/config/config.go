package config

import (
	"fmt"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Endpoint           string            `yaml:"endpoint"`
	APIKey             string            `yaml:"api_key"`
	HostID             string            `yaml:"host_id"`
	Hostname           string            `yaml:"hostname"`
	CollectionInterval int               `yaml:"collection_interval"`
	Tags               map[string]string `yaml:"tags"`
	Transport          TransportConfig   `yaml:"transport"`
}

type TransportConfig struct {
	UseSSE        bool `yaml:"use_sse"`
	RetryInterval int  `yaml:"retry_interval"`
	MaxRetries    int  `yaml:"max_retries"`
	BufferSize    int  `yaml:"buffer_size"`
}

func Load(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}

	return applyDefaults(&cfg), nil
}

func LoadWithDefaults(path string) *Config {
	cfg, err := Load(path)
	if err != nil {
		cfg = LoadFromEnv()
	} else {
		cfg = mergeWithEnv(cfg)
	}
	return cfg
}

func LoadFromEnv() *Config {
	collectionInterval := 10
	fmt.Sscanf(os.Getenv("METRICS_COLLECTION_INTERVAL"), "%d", &collectionInterval)

	return &Config{
		Endpoint:           getEnv("METRICS_ENDPOINT", "http://localhost:3333"),
		APIKey:             getEnv("METRICS_API_KEY", ""),
		HostID:             getEnv("METRICS_HOST_ID", ""),
		Hostname:           getEnv("METRICS_HOSTNAME", ""),
		CollectionInterval: collectionInterval,
		Tags:               parseTags(getEnv("METRICS_TAGS", "")),
		Transport: TransportConfig{
			UseSSE:        getEnvBool("METRICS_USE_SSE", false),
			RetryInterval: getEnvInt("METRICS_RETRY_INTERVAL", 5),
			MaxRetries:    getEnvInt("METRICS_MAX_RETRIES", 10),
			BufferSize:    getEnvInt("METRICS_BUFFER_SIZE", 100),
		},
	}
}

func applyDefaults(cfg *Config) *Config {
	if cfg.CollectionInterval == 0 {
		cfg.CollectionInterval = 10
	}
	if cfg.Transport.RetryInterval == 0 {
		cfg.Transport.RetryInterval = 5
	}
	if cfg.Transport.MaxRetries == 0 {
		cfg.Transport.MaxRetries = 10
	}
	if cfg.Transport.BufferSize == 0 {
		cfg.Transport.BufferSize = 100
	}
	if cfg.Tags == nil {
		cfg.Tags = make(map[string]string)
	}
	return cfg
}

func mergeWithEnv(cfg *Config) *Config {
	cfg = applyDefaults(cfg)

	if endpoint := os.Getenv("METRICS_ENDPOINT"); endpoint != "" {
		cfg.Endpoint = endpoint
	}
	if apiKey := os.Getenv("METRICS_API_KEY"); apiKey != "" {
		cfg.APIKey = apiKey
	}
	if hostID := os.Getenv("METRICS_HOST_ID"); hostID != "" {
		cfg.HostID = hostID
	}
	if hostname := os.Getenv("METRICS_HOSTNAME"); hostname != "" {
		cfg.Hostname = hostname
	}
	if interval := os.Getenv("METRICS_COLLECTION_INTERVAL"); interval != "" {
		fmt.Sscanf(interval, "%d", &cfg.CollectionInterval)
	}
	if tags := os.Getenv("METRICS_TAGS"); tags != "" {
		cfg.Tags = parseTags(tags)
	}

	return cfg
}

func GetConfigPaths() []string {
	homeDir, _ := os.UserHomeDir()
	return []string{
		"/etc/sdk-metrics/config.yaml",
		filepath.Join(homeDir, ".sdk-metrics", "config.yaml"),
		"./sdk-metrics.yaml",
	}
}

func FindConfigFile() string {
	for _, path := range GetConfigPaths() {
		expanded := os.ExpandEnv(path)
		if _, err := os.Stat(expanded); err == nil {
			return expanded
		}
	}
	return ""
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		var result int
		fmt.Sscanf(value, "%d", &result)
		return result
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		return value == "true" || value == "1"
	}
	return defaultValue
}

func parseTags(tags string) map[string]string {
	result := make(map[string]string)
	if tags == "" {
		return result
	}
	// Format: "key1:value1,key2:value2"
	pairs := splitAndTrim(tags, ",")
	for _, pair := range pairs {
		kv := splitAndTrim(pair, ":")
		if len(kv) == 2 {
			result[kv[0]] = kv[1]
		}
	}
	return result
}

func splitAndTrim(s, sep string) []string {
	parts := make([]string, 0)
	for _, p := range split(s, sep) {
		trimmed := trim(p)
		if trimmed != "" {
			parts = append(parts, trimmed)
		}
	}
	return parts
}

func split(s, sep string) []string {
	if s == "" {
		return nil
	}
	result := make([]string, 0)
	start := 0
	for i := 0; i <= len(s)-len(sep); i++ {
		if s[i:i+len(sep)] == sep {
			result = append(result, s[start:i])
			start = i + len(sep)
			i += len(sep) - 1
		}
	}
	result = append(result, s[start:])
	return result
}

func trim(s string) string {
	start := 0
	end := len(s)
	for start < end && (s[start] == ' ' || s[start] == '\t') {
		start++
	}
	for end > start && (s[end-1] == ' ' || s[end-1] == '\t') {
		end--
	}
	return s[start:end]
}
