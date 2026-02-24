package collector

import (
	"context"
	"os"
	"runtime"
	"time"

	"github.com/mackerelio/go-osstat/cpu"
	"github.com/mackerelio/go-osstat/memory"
	"github.com/mackerelio/go-osstat/network"
)

type SystemMetrics struct {
	Hostname     string           `json:"hostname"`
	Timestamp    int64            `json:"timestamp"`
	OS           string           `json:"os"`
	OSVersion    string           `json:"osVersion,omitempty"`
	Architecture string           `json:"architecture,omitempty"`
	CPU          CpuMetrics       `json:"cpu"`
	Memory       MemoryMetrics    `json:"memory"`
	Disks        []DiskMetrics    `json:"disks,omitempty"`
	Networks     []NetworkMetrics `json:"networks,omitempty"`
}

type CpuMetrics struct {
	User   float64 `json:"user"`
	System float64 `json:"system"`
	Idle   float64 `json:"idle"`
	IOWait float64 `json:"iowait,omitempty"`
	Steal  float64 `json:"steal,omitempty"`
	Nice   float64 `json:"nice,omitempty"`
}

type MemoryMetrics struct {
	Total     uint64 `json:"total"`
	Used      uint64 `json:"used"`
	Free      uint64 `json:"free"`
	Available uint64 `json:"available"`
	Cached    uint64 `json:"cached,omitempty"`
	Buffers   uint64 `json:"buffers,omitempty"`
	SwapTotal uint64 `json:"swapTotal,omitempty"`
	SwapUsed  uint64 `json:"swapUsed,omitempty"`
	SwapFree  uint64 `json:"swapFree,omitempty"`
}

type DiskMetrics struct {
	Device      string `json:"device"`
	MountPoint  string `json:"mountPoint"`
	Total       uint64 `json:"total"`
	Used        uint64 `json:"used"`
	Free        uint64 `json:"free"`
	InodesTotal uint64 `json:"inodesTotal,omitempty"`
	InodesUsed  uint64 `json:"inodesUsed,omitempty"`
	InodesFree  uint64 `json:"inodesFree,omitempty"`
	ReadBytes   uint64 `json:"readBytes,omitempty"`
	WriteBytes  uint64 `json:"writeBytes,omitempty"`
}

type NetworkMetrics struct {
	Interface string `json:"interface"`
	RxBytes   uint64 `json:"rxBytes"`
	TxBytes   uint64 `json:"txBytes"`
	RxPackets uint64 `json:"rxPackets,omitempty"`
	TxPackets uint64 `json:"txPackets,omitempty"`
	RxErrors  uint64 `json:"rxErrors,omitempty"`
	TxErrors  uint64 `json:"txErrors,omitempty"`
	RxDropped uint64 `json:"rxDropped,omitempty"`
	TxDropped uint64 `json:"txDropped,omitempty"`
}

type Collector struct {
	hostname    string
	prevNetwork map[string]NetworkSample
}

type NetworkSample struct {
	rxBytes uint64
	txBytes uint64
	time    time.Time
}

func New() *Collector {
	hostname, _ := os.Hostname()
	return &Collector{
		hostname:    hostname,
		prevNetwork: make(map[string]NetworkSample),
	}
}

func (c *Collector) Collect(ctx context.Context) (*SystemMetrics, error) {
	metrics := &SystemMetrics{
		Hostname:     c.hostname,
		Timestamp:    time.Now().UnixMilli(),
		OS:           runtime.GOOS,
		Architecture: runtime.GOARCH,
	}

	if err := c.collectCPU(ctx, metrics); err != nil {
		return nil, err
	}

	if err := c.collectMemory(ctx, metrics); err != nil {
		return nil, err
	}

	if err := c.collectNetwork(ctx, metrics); err != nil {
		return nil, err
	}

	if err := c.collectDisk(ctx, metrics); err != nil {
		return nil, err
	}

	return metrics, nil
}

func (c *Collector) collectCPU(ctx context.Context, metrics *SystemMetrics) error {
	before, err := cpu.Get()
	if err != nil {
		return err
	}

	time.Sleep(500 * time.Millisecond)

	after, err := cpu.Get()
	if err != nil {
		return err
	}

	total := after.Total - before.Total
	if total == 0 {
		total = 1
	}

	metrics.CPU = CpuMetrics{
		User:   float64(after.User-before.User) / float64(total) * 100,
		System: float64(after.System-before.System) / float64(total) * 100,
		Idle:   float64(after.Idle-before.Idle) / float64(total) * 100,
		IOWait: 0,
		Steal:  0,
		Nice:   float64(after.Nice-before.Nice) / float64(total) * 100,
	}

	return nil
}

func (c *Collector) collectMemory(ctx context.Context, metrics *SystemMetrics) error {
	mem, err := memory.Get()
	if err != nil {
		return err
	}

	metrics.Memory = MemoryMetrics{
		Total:     mem.Total,
		Used:      mem.Used,
		Free:      mem.Free,
		Available: mem.Free,
		Cached:    mem.Cached,
		Buffers:   0,
		SwapTotal: mem.SwapTotal,
		SwapUsed:  mem.SwapUsed,
		SwapFree:  mem.SwapFree,
	}

	return nil
}

func (c *Collector) collectNetwork(ctx context.Context, metrics *SystemMetrics) error {
	networks, err := network.Get()
	if err != nil {
		return err
	}

	now := time.Now()
	currentSamples := make(map[string]NetworkSample)

	for _, n := range networks {
		if n.Name == "lo" {
			continue
		}

		prev, exists := c.prevNetwork[n.Name]
		if exists {
			timeDelta := now.Sub(prev.time).Seconds()
			if timeDelta > 0 {
				rxRate := float64(n.RxBytes-prev.rxBytes) / timeDelta
				txRate := float64(n.TxBytes-prev.txBytes) / timeDelta

				metrics.Networks = append(metrics.Networks, NetworkMetrics{
					Interface: n.Name,
					RxBytes:   uint64(rxRate),
					TxBytes:   uint64(txRate),
					RxPackets: 0,
					TxPackets: 0,
					RxErrors:  0,
					TxErrors:  0,
					RxDropped: 0,
					TxDropped: 0,
				})
			}
		}

		currentSamples[n.Name] = NetworkSample{
			rxBytes: n.RxBytes,
			txBytes: n.TxBytes,
			time:    now,
		}
	}

	c.prevNetwork = currentSamples
	return nil
}

func (c *Collector) collectDisk(ctx context.Context, metrics *SystemMetrics) error {
	metrics.Disks = []DiskMetrics{
		{
			Device:     "/",
			MountPoint: "/",
			Total:      0,
			Used:       0,
			Free:       0,
		},
	}
	return nil
}
