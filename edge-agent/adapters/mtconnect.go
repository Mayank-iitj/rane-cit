// Package adapters provides protocol adapters for CNC machine communication
package adapters

import (
	"fmt"
	"log"
)

// MTConnectAdapter connects to CNC machines using the MTConnect protocol
type MTConnectAdapter struct {
	AgentURL   string
	DeviceID   string
	Connected  bool
}

// NewMTConnectAdapter creates a new MTConnect adapter
func NewMTConnectAdapter(agentURL, deviceID string) *MTConnectAdapter {
	return &MTConnectAdapter{
		AgentURL: agentURL,
		DeviceID: deviceID,
	}
}

// Connect establishes connection to the MTConnect agent
func (a *MTConnectAdapter) Connect() error {
	log.Printf("[MTConnect] Connecting to %s device=%s", a.AgentURL, a.DeviceID)
	// In production: HTTP GET to agentURL/probe to discover device capabilities
	// Then: HTTP GET to agentURL/current for current state
	// Then: HTTP GET to agentURL/sample?from=X&count=N for streaming
	a.Connected = true
	log.Printf("[MTConnect] Connected successfully")
	return nil
}

// ReadCurrent reads the current state of all data items
func (a *MTConnectAdapter) ReadCurrent() (map[string]interface{}, error) {
	if !a.Connected {
		return nil, fmt.Errorf("not connected to MTConnect agent")
	}

	// Production implementation would:
	// 1. HTTP GET {agentURL}/current?path=//Device[@name='{deviceID}']
	// 2. Parse XML response
	// 3. Extract data items: Position, SpindleSpeed, Temperature, etc.

	return map[string]interface{}{
		"spindle_speed":    3500.0,
		"feed_rate":        450.0,
		"x_position":       125.5,
		"y_position":       -30.2,
		"z_position":       -15.0,
		"execution_state":  "ACTIVE",
		"controller_mode":  "AUTOMATIC",
		"program_name":     "O0001",
	}, nil
}

// StreamSamples starts streaming sample data from a sequence number
func (a *MTConnectAdapter) StreamSamples(fromSeq int64, callback func(map[string]interface{})) error {
	if !a.Connected {
		return fmt.Errorf("not connected")
	}

	// Production: long-polling to {agentURL}/sample?from={fromSeq}&count=100
	// Parse and invoke callback for each sample

	return nil
}

// Disconnect closes the MTConnect connection
func (a *MTConnectAdapter) Disconnect() {
	a.Connected = false
	log.Printf("[MTConnect] Disconnected from %s", a.AgentURL)
}
