package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/makfly/sdk-metrics/collector"
	"github.com/makfly/sdk-metrics/cmd"
	"github.com/makfly/sdk-metrics/config"
	"github.com/makfly/sdk-metrics/transport"
)

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigChan
		log.Println("Shutting down...")
		cancel()
	}()

	cfg := loadConfig()

	log.Printf("Starting sdk-metrics v%s", cmd.Version)
	log.Printf("Endpoint: %s", cfg.Endpoint)
	log.Printf("Collection interval: %ds", cfg.CollectionInterval)

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

func loadConfig() *config.Config {
	cfg := config.LoadFromEnv()
	if cfg.APIKey == "" {
		log.Fatal("API key is required. Set METRICS_API_KEY environment variable.")
	}

	if cfg.HostID == "" {
		hostname, _ := os.Hostname()
		cfg.HostID = hostname
	}
	if cfg.Hostname == "" {
		cfg.Hostname, _ = os.Hostname()
	}

	return cfg
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
