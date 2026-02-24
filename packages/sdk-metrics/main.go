package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/makfly/sdk-metrics/collector"
	"github.com/makfly/sdk-metrics/config"
	"github.com/makfly/sdk-metrics/transport"
)

var Version = "0.1.0"

func main() {
	configPath := flag.String("config", "", "Path to config file")
	showVersion := flag.Bool("version", false, "Show version")
	showConfig := flag.Bool("config-show", false, "Show current configuration")
	resetConfig := flag.Bool("config-reset", false, "Reset configuration to defaults")
	initConfig := flag.Bool("init", false, "Initialize configuration file")
	flag.Parse()

	if *showVersion {
		fmt.Printf("sdk-metrics version %s\n", Version)
		os.Exit(0)
	}

	if *initConfig {
		defaultConfig := `endpoint: "http://localhost:3333"
api_key: "your_api_key_here"
host_id: ""
hostname: ""
collection_interval: 10
tags:
  env: production
transport:
  use_sse: false
  retry_interval: 5
  max_retries: 10
  buffer_size: 100
`
		err := os.WriteFile("sdk-metrics.yaml", []byte(defaultConfig), 0644)
		if err != nil {
			fmt.Printf("Error creating config: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("Created sdk-metrics.yaml in current directory")
		fmt.Println("Edit the file with your settings, then run with: sdk-metrics -c sdk-metrics.yaml")
		os.Exit(0)
	}

	if *resetConfig {
		configPaths := []string{
			"/etc/sdk-metrics/config.yaml",
			".sdk-metrics.yaml",
			"./sdk-metrics.yaml",
		}
		homeDir, _ := os.UserHomeDir()
		configPaths = append(configPaths, fmt.Sprintf("%s/.sdk-metrics/config.yaml", homeDir))

		removed := false
		for _, path := range configPaths {
			if _, err := os.Stat(path); err == nil {
				if err := os.Remove(path); err == nil {
					fmt.Printf("Removed: %s\n", path)
					removed = true
				}
			}
		}

		if !removed {
			fmt.Println("No config files found to remove")
		}

		fmt.Println("\nConfiguration reset to defaults via environment variables:")
		fmt.Println("  METRICS_API_KEY - Your API key")
		fmt.Println("  METRICS_ENDPOINT - ErrorWatch endpoint")
		fmt.Println("  METRICS_HOST_ID - Unique host identifier")
		fmt.Println("  METRICS_TAGS - Comma-separated tags")
		os.Exit(0)
	}

	if *showConfig {
		cfg := config.LoadFromEnv()
		fmt.Println("Current configuration:")
		fmt.Printf("  Endpoint: %s\n", cfg.Endpoint)
		fmt.Printf("  API Key: %s\n", maskAPIKey(cfg.APIKey))
		fmt.Printf("  Host ID: %s\n", cfg.HostID)
		fmt.Printf("  Hostname: %s\n", cfg.Hostname)
		fmt.Printf("  Collection Interval: %ds\n", cfg.CollectionInterval)
		fmt.Printf("  Tags: %v\n", cfg.Tags)
		os.Exit(0)
	}

	runAgent(*configPath)
}

func runAgent(configPath string) {
	var cfg *config.Config

	if configPath != "" {
		cfg = config.LoadWithDefaults(configPath)
	} else if configFile := config.FindConfigFile(); configFile != "" {
		cfg = config.LoadWithDefaults(configFile)
	} else {
		cfg = config.LoadFromEnv()
	}

	if cfg.APIKey == "" {
		log.Fatal("API key is required. Set METRICS_API_KEY environment variable or provide config file")
	}

	if cfg.HostID == "" {
		hostname, _ := os.Hostname()
		cfg.HostID = hostname
	}
	if cfg.Hostname == "" {
		cfg.Hostname, _ = os.Hostname()
	}

	log.Printf("Starting sdk-metrics v%s", Version)
	log.Printf("Endpoint: %s", cfg.Endpoint)
	log.Printf("Collection interval: %ds", cfg.CollectionInterval)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigChan
		log.Println("Shutting down...")
		cancel()
	}()

	col := collector.New()
	trans := transport.NewHTTPTransport(cfg)

	ticker := time.NewTicker(time.Duration(cfg.CollectionInterval) * time.Second)
	defer ticker.Stop()

	if err := collectAndSend(ctx, col, trans); err != nil {
		log.Printf("Initial collection failed: %v", err)
	}

	for {
		select {
		case <-ctx.Done():
			log.Println("Context cancelled, exiting")
			trans.Close()
			return
		case <-ticker.C:
			if err := collectAndSend(ctx, col, trans); err != nil {
				log.Printf("Collection failed: %v", err)
			}
		}
	}
}

func collectAndSend(ctx context.Context, col *collector.Collector, trans *transport.HTTPTransport) error {
	metrics, err := col.Collect(ctx)
	if err != nil {
		return fmt.Errorf("failed to collect metrics: %w", err)
	}

	if err := trans.SendMetrics(ctx, metrics); err != nil {
		return fmt.Errorf("failed to send metrics: %w", err)
	}

	log.Printf("Metrics sent: CPU=%.1f%%, Memory=%.1f%%",
		metrics.CPU.User+metrics.CPU.System,
		float64(metrics.Memory.Used)/float64(metrics.Memory.Total)*100)

	return nil
}

func maskAPIKey(key string) string {
	if len(key) <= 8 {
		return "***"
	}
	return key[:8] + "***"
}
