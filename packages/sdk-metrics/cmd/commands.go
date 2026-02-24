package cmd

import (
	"fmt"
	"os"

	"github.com/makfly/sdk-metrics/config"
	"github.com/spf13/cobra"
)

var Version = "0.1.0"

var rootCmd = &cobra.Command{
	Use:   "sdk-metrics",
	Short: "ErrorWatch metrics collection agent",
	Long:  `System metrics collector for ErrorWatch - sends CPU, RAM, and Network metrics to your ErrorWatch instance`,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("Run 'sdk-metrics start' to begin collecting metrics")
	},
}

var startCmd = &cobra.Command{
	Use:   "start",
	Short: "Start the metrics collection agent",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("Starting metrics agent...")
		// The actual start logic is in main.go
	},
}

var configCmd = &cobra.Command{
	Use:   "config",
	Short: "Manage configuration",
}

var configShowCmd = &cobra.Command{
	Use:   "show",
	Short: "Show current configuration",
	Run: func(cmd *cobra.Command, args []string) {
		cfg := config.LoadFromEnv()
		fmt.Println("Current configuration:")
		fmt.Printf("  Endpoint: %s\n", cfg.Endpoint)
		fmt.Printf("  API Key: %s\n", maskAPIKey(cfg.APIKey))
		fmt.Printf("  Host ID: %s\n", cfg.HostID)
		fmt.Printf("  Hostname: %s\n", cfg.Hostname)
		fmt.Printf("  Collection Interval: %ds\n", cfg.CollectionInterval)
		fmt.Printf("  Tags: %v\n", cfg.Tags)
	},
}

var configResetCmd = &cobra.Command{
	Use:   "reset",
	Short: "Reset configuration to defaults",
	Long:  "Removes the config file and resets all settings to default values",
	Run: func(cmd *cobra.Command, args []string) {
		configPaths := []string{
			"/etc/sdk-metrics/config.yaml",
			"~/.sdk-metrics/config.yaml",
			".sdk-metrics.yaml",
		}

		removed := false
		for _, path := range configPaths {
			expanded := os.ExpandEnv(path)
			if _, err := os.Stat(expanded); err == nil {
				if err := os.Remove(expanded); err == nil {
					fmt.Printf("Removed: %s\n", expanded)
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
	},
}

var initCmd = &cobra.Command{
	Use:   "init",
	Short: "Initialize configuration file",
	Long:  "Creates a default configuration file in the current directory",
	Run: func(cmd *cobra.Command, args []string) {
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
	},
}

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print version information",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Printf("sdk-metrics version %s\n", Version)
	},
}

func Execute() {
	rootCmd.AddCommand(startCmd)
	rootCmd.AddCommand(configCmd)
	rootCmd.AddCommand(initCmd)
	rootCmd.AddCommand(versionCmd)

	configCmd.AddCommand(configShowCmd)
	configCmd.AddCommand(configResetCmd)

	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}

func maskAPIKey(key string) string {
	if len(key) <= 8 {
		return "***"
	}
	return key[:8] + "***"
}
