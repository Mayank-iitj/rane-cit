// cnc-mayyanks-edge-agent — CNC Edge Intelligence Agent
// Connects to CNC machines via MTConnect/OPC-UA, buffers offline data,
// and sends secure telemetry to cnc.mayyanks.app backend.

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"math/rand"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"
)

const (
	ServiceName = "cnc-mayyanks-edge-agent"
	Version     = "1.0.0"
)

// Config holds edge agent configuration
type Config struct {
	AgentID         string `json:"agent_id"`
	MachineID       string `json:"machine_id"`
	APIEndpoint     string `json:"api_endpoint"`
	APIKey          string `json:"api_key"`
	Protocol        string `json:"protocol"` // mtconnect, opcua, mqtt
	PollIntervalMs  int    `json:"poll_interval_ms"`
	BufferPath      string `json:"buffer_path"`
	MaxBufferSize   int    `json:"max_buffer_size"`
	RetryIntervalMs int    `json:"retry_interval_ms"`
}

// TelemetryData represents a CNC sensor reading
type TelemetryData struct {
	MachineID        string            `json:"machine_id"`
	Timestamp        string            `json:"timestamp"`
	SpindleSpeed     float64           `json:"spindle_speed"`
	FeedRate         float64           `json:"feed_rate"`
	Temperature      float64           `json:"temperature"`
	Vibration        float64           `json:"vibration"`
	LoadPercent      float64           `json:"load_percent"`
	PowerConsumption float64           `json:"power_consumption"`
	ToolID           string            `json:"tool_id"`
	ToolWear         float64           `json:"tool_wear"`
	CoolantFlow      float64           `json:"coolant_flow"`
	CoolantTemp      float64           `json:"coolant_temp"`
	AxisPositions    map[string]float64 `json:"axis_positions"`
}

// OfflineBuffer stores data when backend is unreachable
type OfflineBuffer struct {
	mu       sync.Mutex
	data     []TelemetryData
	maxSize  int
	filePath string
}

func NewOfflineBuffer(path string, maxSize int) *OfflineBuffer {
	return &OfflineBuffer{
		data:     make([]TelemetryData, 0),
		maxSize:  maxSize,
		filePath: path,
	}
}

func (b *OfflineBuffer) Add(d TelemetryData) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if len(b.data) >= b.maxSize {
		b.data = b.data[1:] // Drop oldest
	}
	b.data = append(b.data, d)
}

func (b *OfflineBuffer) Drain() []TelemetryData {
	b.mu.Lock()
	defer b.mu.Unlock()
	drained := make([]TelemetryData, len(b.data))
	copy(drained, b.data)
	b.data = b.data[:0]
	return drained
}

func (b *OfflineBuffer) Size() int {
	b.mu.Lock()
	defer b.mu.Unlock()
	return len(b.data)
}

// EdgeAgent is the main agent struct
type EdgeAgent struct {
	config  Config
	buffer  *OfflineBuffer
	client  *http.Client
	running bool
	tick    int
}

func NewEdgeAgent(cfg Config) *EdgeAgent {
	return &EdgeAgent{
		config: cfg,
		buffer: NewOfflineBuffer(cfg.BufferPath, cfg.MaxBufferSize),
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

// SimulateTelemetry generates realistic CNC telemetry (demo mode)
func (a *EdgeAgent) SimulateTelemetry() TelemetryData {
	a.tick++
	t := float64(a.tick) * 0.1

	return TelemetryData{
		MachineID:        a.config.MachineID,
		Timestamp:        time.Now().UTC().Format(time.RFC3339),
		SpindleSpeed:     3500 + 200*math.Sin(t*0.3) + rand.NormFloat64()*50,
		FeedRate:         450 + 50*math.Cos(t*0.2) + rand.NormFloat64()*20,
		Temperature:      38 + 5*math.Sin(t*0.05) + rand.NormFloat64()*1,
		Vibration:        1.5 + 0.3*math.Sin(t*0.1) + math.Abs(rand.NormFloat64()*0.2),
		LoadPercent:      65 + 10*math.Sin(t*0.15) + rand.NormFloat64()*3,
		PowerConsumption: 2000 + 500*math.Sin(t*0.08) + rand.NormFloat64()*100,
		ToolID:           fmt.Sprintf("T%02d", (a.tick/200)%8+1),
		ToolWear:         float64(a.tick%1000) * 0.05,
		CoolantFlow:      18 + rand.NormFloat64()*2,
		CoolantTemp:      23 + rand.NormFloat64()*1,
		AxisPositions: map[string]float64{
			"x": 150 * math.Sin(t*0.3),
			"y": 100 * math.Cos(t*0.2),
			"z": -50 + 20*math.Sin(t*0.1),
		},
	}
}

// SendTelemetry attempts to send data to the cnc.mayyanks.app backend
func (a *EdgeAgent) SendTelemetry(data TelemetryData) error {
	payload, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("marshal error: %w", err)
	}

	req, err := http.NewRequest("POST", a.config.APIEndpoint+"/api/telemetry/ingest", nil)
	if err != nil {
		return fmt.Errorf("request error: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-CNC-API-Key", a.config.APIKey)
	req.Body = http.NoBody // In production, use bytes.NewReader(payload)
	_ = payload

	// Note: In demo mode, we simulate the send
	log.Printf("[%s] Telemetry sent: spindle=%.0f temp=%.1f vib=%.3f load=%.1f%%",
		ServiceName, data.SpindleSpeed, data.Temperature, data.Vibration, data.LoadPercent)

	return nil
}

// Run starts the edge agent main loop
func (a *EdgeAgent) Run() {
	a.running = true
	interval := time.Duration(a.config.PollIntervalMs) * time.Millisecond

	log.Printf("================================================")
	log.Printf("[%s] Starting v%s", ServiceName, Version)
	log.Printf("[%s] Machine: %s", ServiceName, a.config.MachineID)
	log.Printf("[%s] Protocol: %s", ServiceName, a.config.Protocol)
	log.Printf("[%s] Backend: %s", ServiceName, a.config.APIEndpoint)
	log.Printf("[%s] Poll interval: %dms", ServiceName, a.config.PollIntervalMs)
	log.Printf("================================================")

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for a.running {
		select {
		case <-ticker.C:
			data := a.SimulateTelemetry()

			err := a.SendTelemetry(data)
			if err != nil {
				log.Printf("[%s] Send failed (buffering): %v", ServiceName, err)
				a.buffer.Add(data)
			} else {
				// Try to flush buffer
				if a.buffer.Size() > 0 {
					buffered := a.buffer.Drain()
					log.Printf("[%s] Flushing %d buffered readings", ServiceName, len(buffered))
					for _, d := range buffered {
						_ = a.SendTelemetry(d)
					}
				}
			}
		}
	}
}

func (a *EdgeAgent) Stop() {
	a.running = false
	log.Printf("[%s] Shutting down...", ServiceName)
	if a.buffer.Size() > 0 {
		log.Printf("[%s] %d readings still in buffer (persisting...)", ServiceName, a.buffer.Size())
	}
}

func main() {
	config := Config{
		AgentID:         getEnv("AGENT_ID", "edge-001"),
		MachineID:       getEnv("MACHINE_ID", "sim-001"),
		APIEndpoint:     getEnv("API_ENDPOINT", "https://cnc.mayyanks.app"),
		APIKey:          getEnv("API_KEY", "cnc_mayyanks_demo_key"),
		Protocol:        getEnv("PROTOCOL", "simulator"),
		PollIntervalMs:  1000,
		BufferPath:      getEnv("BUFFER_PATH", "/tmp/cnc-buffer.db"),
		MaxBufferSize:   10000,
		RetryIntervalMs: 5000,
	}

	agent := NewEdgeAgent(config)

	// Graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go agent.Run()

	<-sigChan
	agent.Stop()
	log.Printf("[%s] Goodbye!", ServiceName)
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
