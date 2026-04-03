# Multi-Provider LLM Integration Guide

## Overview

The CNC Intelligence Platform Copilot service has been upgraded to support **multiple LLM providers** in a single, unified interface. Users can now seamlessly switch between different AI models without changing code or endpoints.

## Supported Providers

| Provider | Model | Status | Configuration |
|----------|-------|--------|-----------------|
| **Groq** | gemma-7b-it | ✅ Configured & Active | `GROQ_API_KEY` |
| **OpenAI** | gpt-4 (configurable) | ⚠️ Demo Mode | `OPENAI_API_KEY` |
| **Anthropic** | claude-3-opus | ⚠️ Demo Mode | `ANTHROPIC_API_KEY` |
| **Azure OpenAI** | gpt-4 (configurable) | ⚠️ Demo Mode | `AZURE_OPENAI_API_KEY` |

## Quick Start

### Test Current Setup

```bash
# Test Groq (default provider)
curl -X POST http://localhost:8000/api/copilot/ask \
  -H "Content-Type: application/json" \
  -d '{ "question": "What spindle speed for aluminum?" }'

# Response includes "provider": "groq"
```

### Using Specific Providers

Add the `provider` field to request any model:

```bash
# Use OpenAI
curl -X POST http://localhost:8000/api/copilot/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Optimize my CNC machine",
    "provider": "openai"
  }'

# Use Anthropic
curl -X POST http://localhost:8000/api/copilot/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Machine health diagnostics",
    "provider": "anthropic"
  }'

# Use Azure OpenAI
curl -X POST http://localhost:8000/api/copilot/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Energy analysis",
    "provider": "azure"
  }'
```

## Setup Instructions

### 1. Enable OpenAI

```bash
# Set environment variables
export OPENAI_API_KEY="sk-..."
export OPENAI_MODEL="gpt-4"                 # optional, defaults to gpt-4
export OPENAI_MAX_TOKENS="2000"             # optional, defaults to 2000
export OPENAI_TEMPERATURE="0.7"             # optional, defaults to 0.7

# Restart backend
npm run build && npm start
```

### 2. Enable Anthropic (Claude)

```bash
# Set environment variables
export ANTHROPIC_API_KEY="sk-ant-..."
export ANTHROPIC_MODEL="claude-3-opus"      # optional, defaults to claude-3-opus
export ANTHROPIC_MAX_TOKENS="2000"          # optional, defaults to 2000
export ANTHROPIC_TEMPERATURE="0.7"          # optional, defaults to 0.7

# Restart backend
npm run build && npm start
```

### 3. Enable Azure OpenAI

```bash
# Set environment variables
export AZURE_OPENAI_API_KEY="your-key..."
export AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com"
export AZURE_OPENAI_DEPLOYMENT="gpt-4"      # Your deployment name
export AZURE_MAX_TOKENS="2000"               # optional, defaults to 2000
export AZURE_TEMPERATURE="0.7"               # optional, defaults to 0.7

# Restart backend
npm run build && npm start
```

### 4. Keep Groq (Already Configured)

```bash
# Current Groq settings (in `.env` or environment)
GROQ_API_KEY="gsk_IhX5qxPLoIo..."           # Already set
GROQ_MODEL="gemma-7b-it"                    # Free, fast model
GROQ_MAX_TOKENS="1000"
GROQ_TEMPERATURE="0.7"
```

## API Endpoints

All copilot endpoints support provider selection:

### `/api/copilot/ask` - Single Request
```json
{
  "question": "What machine issue should I investigate?",
  "provider": "openai",           // optional, defaults to "groq"
  "machineId": "machine-001",     // optional
  "telemetryData": {},            // optional
  "stream": false                 // optional, defaults to false
}
```

### `/api/copilot/ask-stream` - Streaming Response
```json
{
  "question": "Analyze my CNC performance",
  "provider": "anthropic",
  "machineId": "machine-001",
  "stream": true
}
```

### `/api/copilot/status` - Service Status
Returns configuration status of all providers:
```json
{
  "providers": {
    "groq": { "model": "gemma-7b-it", "configured": true },
    "openai": { "model": "gpt-4", "configured": false },
    "anthropic": { "model": "claude-3-opus", "configured": false },
    "azure": { "model": "gpt-4", "configured": false}
  },
  "defaultProvider": "groq",
  "streaming": true
}
```

## Advanced Usage

### Machine Context With Custom Provider

```bash
curl -X POST http://localhost:8000/api/copilot/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What maintenance is needed?",
    "provider": "openai",
    "machineId": "machine-001",
    "telemetryData": {
      "spindle_temp": 85,
      "vibration_level": 2.3,
      "power_draw": 12.5
    }
  }'
```

### Streaming With Anthropic

```bash
curl -X POST http://localhost:8000/api/copilot/ask-stream \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Optimize spindle parameters for aluminum",
    "provider": "anthropic"
  }'
```

## Specialized Endpoints

### Machine Optimization
```bash
POST /api/copilot/optimize-machine
{
  "machineId": "machine-001",
  "currentMetrics": { "cycle_time": 120, "tool_wear": 45 }
}
```

### Health Diagnostics
```bash
POST /api/copilot/diagnose-health
{
  "machineId": "machine-001",
  "healthData": { "spindle_vibration": 1.2, "coolant_ph": 8.1 }
}
```

### Energy Analysis
```bash
POST /api/copilot/energy-analysis
{
  "machineId": "machine-001",
  "energyData": { "power_consumption": 12.5, "idle_percent": 15 }
}
```

## Environment Variable Reference

### Groq Configuration
- `GROQ_API_KEY` - Your Groq API key (required)
- `GROQ_MODEL` - Model name (default: `gemma-7b-it`)
- `GROQ_MAX_TOKENS` - Max tokens (default: `1000`)
- `GROQ_TEMPERATURE` - Temperature (default: `0.7`)

### OpenAI Configuration
- `OPENAI_API_KEY` - Your OpenAI API key
- `OPENAI_MODEL` - Model name (default: `gpt-4`)
- `OPENAI_MAX_TOKENS` - Max tokens (default: `2000`)
- `OPENAI_TEMPERATURE` - Temperature (default: `0.7`)

### Anthropic Configuration
- `ANTHROPIC_API_KEY` - Your Anthropic API key
- `ANTHROPIC_MODEL` - Model name (default: `claude-3-opus`)
- `ANTHROPIC_MAX_TOKENS` - Max tokens (default: `2000`)
- `ANTHROPIC_TEMPERATURE` - Temperature (default: `0.7`)

### Azure OpenAI Configuration
- `AZURE_OPENAI_API_KEY` - Your Azure API key
- `AZURE_OPENAI_ENDPOINT` - Your Azure resource endpoint
- `AZURE_OPENAI_DEPLOYMENT` - Your deployment name
- `AZURE_MAX_TOKENS` - Max tokens (default: `2000`)
- `AZURE_TEMPERATURE` - Temperature (default: `0.7`)

## Model Comparison

| Feature | Groq | OpenAI | Anthropic | Azure |
|---------|------|--------|-----------|-------|
| Speed | ⚡⚡⚡ Very Fast | ⚡⚡ Fast | ⚡ Standard | ⚡⚡ Fast |
| Cost | 💰 Free Tier | 💰💰💰 | 💰💰 | 💰💰 |
| Context | 8K | 128K | 200K | 128K |
| Best For | **Real-time** | General Purpose | Long Context | Enterprise |

## Troubleshooting

### Issue: Getting demo responses for configured provider

**Solution:** Verify the API key is correctly set:
```bash
echo $OPENAI_API_KEY  # Should show your key, not empty
```

### Issue: Provider not recognized

**Solution:** Use one of these exact values:
- `"groq"`
- `"openai"`
- `"anthropic"`
- `"azure"`

### Issue: Rate limits exceeded

**Solution:** Groq free tier has rate limits. Use `OPENAI_API_KEY` for higher limits:
```bash
export OPENAI_API_KEY="sk-..."
# Requests will now use OpenAI instead
```

## Architecture

```typescript
CopilotService
├── Groq Provider
│   ├── callGroq()
│   └── StreamGroq()
├── OpenAI Provider
│   ├── callOpenAI()
│   └── StreamOpenAI()
├── Anthropic Provider
│   ├── callAnthropic()
│   └── StreamAnthropic()
└── Azure Provider
    ├── callAzure()
    └── StreamAzure()
```

## Code Example - TypeScript

```typescript
// Use default provider (Groq)
const response = await fetch('http://localhost:8000/api/copilot/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: 'What is the optimal spindle speed for aluminum?'
  })
});

// Use specific provider
const response2 = await fetch('http://localhost:8000/api/copilot/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: 'Optimize my CNC machine',
    provider: 'openai'  // Or 'anthropic', 'azure'
  })
});
```

## Performance Tips

1. **Groq** - Use for real-time/streaming scenarios (fastest)
2. **OpenAI** - Use for general analysis with good cost/quality balance
3. **Anthropic** - Use when you need longer context or nuanced responses
4. **Azure** - Use in enterprise environments with SSO/compliance needs

## Support

For issues with LLM providers:
- Groq: https://console.groq.com
- OpenAI: https://platform.openai.com
- Anthropic: https://console.anthropic.com
- Azure: https://portal.azure.com
