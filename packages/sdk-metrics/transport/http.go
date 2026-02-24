package transport

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/makfly/sdk-metrics/collector"
	"github.com/makfly/sdk-metrics/config"
)

type MetricsPayload struct {
	HostID   string                  `json:"hostId"`
	Hostname string                  `json:"hostname"`
	Metrics  collector.SystemMetrics `json:"metrics"`
	Tags     map[string]string       `json:"tags,omitempty"`
}

type HTTPTransport struct {
	client  *http.Client
	config  *config.Config
	baseURL string
	apiKey  string
}

func NewHTTPTransport(cfg *config.Config) *HTTPTransport {
	return &HTTPTransport{
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
		config:  cfg,
		baseURL: cfg.Endpoint,
		apiKey:  cfg.APIKey,
	}
}

func (t *HTTPTransport) SendMetrics(ctx context.Context, metrics *collector.SystemMetrics) error {
	payload := MetricsPayload{
		HostID:   t.config.HostID,
		Hostname: t.config.Hostname,
		Metrics:  *metrics,
		Tags:     t.config.Tags,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal metrics: %w", err)
	}

	url := fmt.Sprintf("%s/api/v1/metrics/ingest", t.baseURL)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", t.apiKey)

	resp, err := t.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send metrics: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("metrics endpoint returned %d: %s", resp.StatusCode, string(respBody))
	}

	return nil
}

func (t *HTTPTransport) Close() error {
	t.client.CloseIdleConnections()
	return nil
}
