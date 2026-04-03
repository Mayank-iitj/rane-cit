import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type LLMProvider = 'groq' | 'openai' | 'anthropic' | 'azure';

interface CNCContext {
  machineId?: string;
  telemetryData?: Record<string, any>;
  alerts?: any[];
  recentEvents?: any[];
  provider?: LLMProvider;
}

interface StreamEvent {
  type: 'token' | 'complete' | 'error' | 'thinking';
  content?: string;
  inputTokens?: number;
  outputTokens?: number;
  stopReason?: string;
  timestamp: string;
}

interface ProviderConfig {
  apiKey: string;
  model: string;
  endpoint: string;
  maxTokens: number;
  temperature: number;
}

@Injectable()
export class CopilotService {
  private readonly logger = new Logger('CopilotService');
  
  // Provider configurations
  private providers: Record<LLMProvider, ProviderConfig> = {
    groq: {
      apiKey: '',
      model: '',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      maxTokens: 1000,
      temperature: 0.7,
    },
    openai: {
      apiKey: '',
      model: '',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      maxTokens: 2000,
      temperature: 0.7,
    },
    anthropic: {
      apiKey: '',
      model: '',
      endpoint: 'https://api.anthropic.com/v1/messages',
      maxTokens: 2000,
      temperature: 0.7,
    },
    azure: {
      apiKey: '',
      model: '',
      endpoint: '',
      maxTokens: 2000,
      temperature: 0.7,
    },
  };

  private defaultProvider: LLMProvider = 'groq';
  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  private readonly maxContextWindow = 10;
  private requestCount = 0;
  private readonly maxRequestsPerHour = 100;
  private lastHourReset = Date.now();

  // CNC-Specific System Prompts
  static readonly CNC_SYSTEM_PROMPT = `You are an expert CNC (Computer Numerical Control) platform AI assistant specializing in intelligent machine diagnostics, predictive maintenance, and operational optimization. Your role is to be the digital brain of our CNC intelligence platform.

**Core Expertise Areas:**
1. **Machine Diagnostics**: Analyze machine telemetry data, identify anomalies, root causes of failures, and provide corrective actions
2. **Predictive Maintenance**: Forecast equipment failures before they happen based on vibration, temperature, pressure patterns, and historical data
3. **Performance Optimization**: Recommend feed rates, speeds, spindle RPM adjustments, and cutting strategies for improved throughput and quality
4. **Energy Efficiency**: Analyze power consumption patterns and suggest energy-saving operational techniques
5. **Tool Management**: Advise on optimal tool wear patterns, tool life prediction, and tool change scheduling
6. **Quality Control**: Help identify signs of machining errors, surface finish degradation, and dimensional drift
7. **G-Code Optimization**: Review CNC programs for efficiency improvements, motion optimization, and cycle time reduction

**Communication Style:**
- Be concise and actionable: Always provide specific, implementable recommendations
- Use data-driven insights: Support advice with metrics and reasoning
- Warn appropriately: Flag critical issues immediately with clear severity labels (🔴 CRITICAL, 🟠 WARNING, 🟡 CAUTION, 🟢 INFO)
- Provide context: Explain why you recommend something, not just what to do
- Multi-level responses: Start with immediate action items, then deeper analysis

**When You Have Machine Data:**
- Prioritize safety and equipment protection above output speed
- Look for patterns in temporal data (trends over time)
- Compare against industry benchmarks
- Suggest preventive maintenance intervals
- Identify opportunity areas for efficiency gains

**When You Don't Have Data:**
- Ask clarifying questions about machine type, age, workload, and symptoms
- Provide general best practices for the mentioned machine type
- Explain what data would help you give more precise recommendations

Always maintain a professional, helpful tone. You're the operator's trusted advisor in the machine shop.`;

  static readonly CNC_OPTIMIZATION_PROMPT = `You are analyzing CNC machine performance data to provide optimization recommendations. Focus on:
1. Spindle speed and feed rate optimization
2. Tool wear patterns and life prediction
3. Cycle time reduction opportunities
4. Power consumption efficiency
5. Heat management strategies
6. Motion planning improvements

Provide specific, numeric recommendations with expected improvements (e.g., "increase feed rate from 100 to 120 mm/min for 15% cycle time improvement").`;

  static readonly CNC_DIAGNOSTIC_PROMPT = `You are an expert CNC diagnostician analyzing machine health data. Your task:
1. Identify all operational anomalies
2. Determine root causes using the telemetry provided
3. Predict potential failures in the next 24-48 hours
4. Recommend immediate corrective actions
5. Suggest preventive maintenance steps
6. Rate the urgency level (CRITICAL/WARNING/CAUTION/NORMAL)

Use severity indicators: 🔴🟠🟡🟢`;

  static readonly CNC_ENERGY_PROMPT = `You are analyzing CNC machine energy consumption. Focus on:
1. Identifying power-hungry operations
2. Comparing to baseline energy consumption
3. Recommending energy-efficient machining strategies
4. Calculating potential energy savings
5. Assessing environmental impact
6. Suggesting equipment upgrades for efficiency

Provide energy savings in kWh per shift and associated cost savings.`;

  constructor(private configService: ConfigService) {
    this.initializeProviders();
  }

  /**
   * Initialize all provider configurations from environment
   */
  private initializeProviders(): void {
    // Groq configuration
    this.providers.groq.apiKey = this.configService.get<string>('GROQ_API_KEY') || '';
    this.providers.groq.model = this.configService.get<string>('GROQ_MODEL') || 'gemma-7b-it';
    this.providers.groq.maxTokens = parseInt(this.configService.get<string>('GROQ_MAX_TOKENS') || '1000', 10);
    this.providers.groq.temperature = parseFloat(this.configService.get<string>('GROQ_TEMPERATURE') || '0.7');

    // OpenAI configuration
    this.providers.openai.apiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.providers.openai.model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4';
    this.providers.openai.maxTokens = parseInt(this.configService.get<string>('OPENAI_MAX_TOKENS') || '2000', 10);
    this.providers.openai.temperature = parseFloat(this.configService.get<string>('OPENAI_TEMPERATURE') || '0.7');

    // Anthropic configuration
    this.providers.anthropic.apiKey = this.configService.get<string>('ANTHROPIC_API_KEY') || '';
    this.providers.anthropic.model = this.configService.get<string>('ANTHROPIC_MODEL') || 'claude-3-opus';
    this.providers.anthropic.maxTokens = parseInt(this.configService.get<string>('ANTHROPIC_MAX_TOKENS') || '2000', 10);
    this.providers.anthropic.temperature = parseFloat(this.configService.get<string>('ANTHROPIC_TEMPERATURE') || '0.7');

    // Azure configuration
    const azureKey = this.configService.get<string>('AZURE_OPENAI_API_KEY') || '';
    const azureEndpoint = this.configService.get<string>('AZURE_OPENAI_ENDPOINT') || '';
    const azureDeployment = this.configService.get<string>('AZURE_OPENAI_DEPLOYMENT') || 'gpt-4';
    
    this.providers.azure.apiKey = azureKey;
    this.providers.azure.model = azureDeployment;
    this.providers.azure.endpoint = azureEndpoint 
      ? `${azureEndpoint}/openai/deployments/${azureDeployment}/chat/completions?api-version=2024-02-15-preview`
      : '';
    this.providers.azure.maxTokens = parseInt(this.configService.get<string>('AZURE_MAX_TOKENS') || '2000', 10);
    this.providers.azure.temperature = parseFloat(this.configService.get<string>('AZURE_TEMPERATURE') || '0.7');

    // Log initialization status
    this.logProviderStatus();
  }

  /**
   * Log provider configuration status
   */
  private logProviderStatus(): void {
    const groqKey = this.providers.groq.apiKey ? `${this.providers.groq.apiKey.substring(0, 15)}...` : 'NOT SET';
    const openaiKey = this.providers.openai.apiKey ? `${this.providers.openai.apiKey.substring(0, 15)}...` : 'NOT SET';
    const anthropicKey = this.providers.anthropic.apiKey ? `${this.providers.anthropic.apiKey.substring(0, 15)}...` : 'NOT SET';
    const azureKey = this.providers.azure.apiKey ? `${this.providers.azure.apiKey.substring(0, 15)}...` : 'NOT SET';

    this.logger.log(`
✅ Copilot Service Multi-Provider Initialization:
   • Groq (${this.providers.groq.model}): ${groqKey}
   • OpenAI (${this.providers.openai.model}): ${openaiKey}
   • Anthropic (${this.providers.anthropic.model}): ${anthropicKey}
   • Azure (${this.providers.azure.model}): ${azureKey}
   • Default Provider: ${this.defaultProvider.toUpperCase()}
    `);
  }

  /**
   * Get the provider config, validate it's available
   */
  private getProvider(provider: LLMProvider = this.defaultProvider): ProviderConfig {
    const config = this.providers[provider];
    
    if (!config.apiKey || config.apiKey.trim() === '') {
      this.logger.warn(`Provider ${provider} is not configured, falling back to demo mode`);
      return config;
    }

    return config;
  }

  /**
   * Ask a question using the specified provider
   */
  async askQuestion(question: string, context: CNCContext = {}): Promise<{
    answer: string;
    inputTokens: number;
    outputTokens: number;
    machineId?: string;
    provider: LLMProvider;
    timestamp: string;
  }> {
    this.checkRateLimit();

    const provider = context.provider || this.defaultProvider;
    const config = this.getProvider(provider);

    if (!config.apiKey || config.apiKey.trim() === '') {
      this.logger.log(`[DEMO MODE] Provider ${provider} not configured. Using fallback response.`);
      const fallback = this.provideFallbackResponse(question, context);
      return {
        answer: fallback,
        inputTokens: 0,
        outputTokens: 0,
        machineId: context.machineId,
        provider,
        timestamp: new Date().toISOString(),
      };
    }

    const systemPrompt = this.buildSystemPrompt(context);
    this.conversationHistory.push({ role: 'user', content: question });

    try {
      let response;

      switch (provider) {
        case 'openai':
          response = await this.callOpenAI(config, systemPrompt);
          break;
        case 'anthropic':
          response = await this.callAnthropic(config, systemPrompt);
          break;
        case 'azure':
          response = await this.callAzure(config, systemPrompt);
          break;
        case 'groq':
        default:
          response = await this.callGroq(config, systemPrompt);
      }

      this.conversationHistory.push({ role: 'assistant', content: response.answer });
      this.trimHistory();

      return {
        ...response,
        machineId: context.machineId,
        provider,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error calling ${provider} API:`, error);
      const fallback = this.provideFallbackResponse(question, context);
      return {
        answer: fallback,
        inputTokens: 0,
        outputTokens: 0,
        machineId: context.machineId,
        provider,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Stream questions using the specified provider
   */
  async *askQuestionStream(question: string, context: CNCContext = {}): AsyncGenerator<StreamEvent> {
    this.checkRateLimit();

    const provider = context.provider || this.defaultProvider;
    const config = this.getProvider(provider);

    if (!config.apiKey || config.apiKey.trim() === '') {
      const fallback = this.provideFallbackResponse(question, context);
      yield {
        type: 'token',
        content: fallback,
        timestamp: new Date().toISOString(),
      };
      yield {
        type: 'complete',
        stopReason: 'demo_mode',
        inputTokens: 0,
        outputTokens: 0,
        timestamp: new Date().toISOString(),
      };
      this.conversationHistory.push({ role: 'user', content: question });
      this.conversationHistory.push({ role: 'assistant', content: fallback });
      this.trimHistory();
      return;
    }

    const systemPrompt = this.buildSystemPrompt(context);
    this.conversationHistory.push({ role: 'user', content: question });

    try {
      switch (provider) {
        case 'openai':
          yield* this.StreamOpenAI(config, systemPrompt);
          break;
        case 'anthropic':
          yield* this.StreamAnthropic(config, systemPrompt);
          break;
        case 'azure':
          yield* this.StreamAzure(config, systemPrompt);
          break;
        case 'groq':
        default:
          yield* this.StreamGroq(config, systemPrompt);
      }
    } catch (error) {
      this.logger.error(`Error streaming from ${provider}:`, error);
      yield {
        type: 'error',
        content: `Failed to stream response from ${provider} API`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Call Groq API
   */
  private async callGroq(config: ProviderConfig, systemPrompt: string): Promise<{
    answer: string;
    inputTokens: number;
    outputTokens: number;
  }> {
    this.logger.log(`[GROQ] Calling ${config.model}`);

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...this.conversationHistory,
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${errorText}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || 'Unable to process response';

    return {
      answer,
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
    };
  }

  /**
   * Stream Groq API
   */
  private async *StreamGroq(config: ProviderConfig, systemPrompt: string): AsyncGenerator<StreamEvent> {
    this.logger.log(`[GROQ STREAM] Starting stream with ${config.model}`);

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...this.conversationHistory,
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${await response.text()}`);
    }

    let fullResponse = '';
    let inputTokens = 0;
    let outputTokens = 0;

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response body is not readable');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const event = JSON.parse(data);
            const token = event.choices?.[0]?.delta?.content;

            if (token) {
              fullResponse += token;
              yield {
                type: 'token',
                content: token,
                timestamp: new Date().toISOString(),
              };
            }

            if (event.usage) {
              inputTokens = event.usage.prompt_tokens;
              outputTokens = event.usage.completion_tokens;
            }
          } catch {
            // Silently ignore parse errors
          }
        }
      }
    }

    this.conversationHistory.push({ role: 'assistant', content: fullResponse });
    this.trimHistory();

    yield {
      type: 'complete',
      stopReason: 'end_turn',
      inputTokens,
      outputTokens,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(config: ProviderConfig, systemPrompt: string): Promise<{
    answer: string;
    inputTokens: number;
    outputTokens: number;
  }> {
    this.logger.log(`[OPENAI] Calling ${config.model}`);

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...this.conversationHistory,
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || 'Unable to process response';

    return {
      answer,
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
    };
  }

  /**
   * Stream OpenAI API
   */
  private async *StreamOpenAI(config: ProviderConfig, systemPrompt: string): AsyncGenerator<StreamEvent> {
    this.logger.log(`[OPENAI STREAM] Starting stream with ${config.model}`);

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...this.conversationHistory,
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${await response.text()}`);
    }

    let fullResponse = '';

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response body is not readable');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const event = JSON.parse(data);
            const token = event.choices?.[0]?.delta?.content;

            if (token) {
              fullResponse += token;
              yield {
                type: 'token',
                content: token,
                timestamp: new Date().toISOString(),
              };
            }
          } catch {
            // Silently ignore parse errors
          }
        }
      }
    }

    this.conversationHistory.push({ role: 'assistant', content: fullResponse });
    this.trimHistory();

    yield {
      type: 'complete',
      stopReason: 'end_turn',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Call Anthropic API
   */
  private async callAnthropic(config: ProviderConfig, systemPrompt: string): Promise<{
    answer: string;
    inputTokens: number;
    outputTokens: number;
  }> {
    this.logger.log(`[ANTHROPIC] Calling ${config.model}`);

    const messages = this.conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error: ${errorText}`);
    }

    const data = await response.json();
    const answer = data.content?.[0]?.text || 'Unable to process response';

    return {
      answer,
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
    };
  }

  /**
   * Stream Anthropic API
   */
  private async *StreamAnthropic(config: ProviderConfig, systemPrompt: string): AsyncGenerator<StreamEvent> {
    this.logger.log(`[ANTHROPIC STREAM] Starting stream with ${config.model}`);

    const messages = this.conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens,
        system: systemPrompt,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${await response.text()}`);
    }

    let fullResponse = '';

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response body is not readable');

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();

          try {
            const event = JSON.parse(data);

            if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
              const token = event.delta.text;
              fullResponse += token;
              yield {
                type: 'token',
                content: token,
                timestamp: new Date().toISOString(),
              };
            }
          } catch {
            // Silently ignore parse errors
          }
        }
      }
    }

    this.conversationHistory.push({ role: 'assistant', content: fullResponse });
    this.trimHistory();

    yield {
      type: 'complete',
      stopReason: 'end_turn',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Call Azure OpenAI API
   */
  private async callAzure(config: ProviderConfig, systemPrompt: string): Promise<{
    answer: string;
    inputTokens: number;
    outputTokens: number;
  }> {
    if (!config.endpoint) {
      throw new Error('Azure endpoint not configured');
    }

    this.logger.log(`[AZURE] Calling ${config.model}`);

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.apiKey,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          ...this.conversationHistory,
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure API error: ${errorText}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || 'Unable to process response';

    return {
      answer,
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
    };
  }

  /**
   * Stream Azure OpenAI API
   */
  private async *StreamAzure(config: ProviderConfig, systemPrompt: string): AsyncGenerator<StreamEvent> {
    if (!config.endpoint) {
      throw new Error('Azure endpoint not configured');
    }

    this.logger.log(`[AZURE STREAM] Starting stream with ${config.model}`);

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.apiKey,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          ...this.conversationHistory,
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Azure API error: ${await response.text()}`);
    }

    let fullResponse = '';

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response body is not readable');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const event = JSON.parse(data);
            const token = event.choices?.[0]?.delta?.content;

            if (token) {
              fullResponse += token;
              yield {
                type: 'token',
                content: token,
                timestamp: new Date().toISOString(),
              };
            }
          } catch {
            // Silently ignore parse errors
          }
        }
      }
    }

    this.conversationHistory.push({ role: 'assistant', content: fullResponse });
    this.trimHistory();

    yield {
      type: 'complete',
      stopReason: 'end_turn',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Build contextual system prompt with machine data
   */
  private buildSystemPrompt(context: CNCContext): string {
    let prompt = CopilotService.CNC_SYSTEM_PROMPT;

    if (context.machineId) {
      prompt += `\n\n**Current Machine Context:**\nMachine ID: ${context.machineId}`;
    }

    if (context.telemetryData) {
      prompt += `\n\nRecent Telemetry Data:\n${JSON.stringify(context.telemetryData, null, 2)}`;
    }

    if (context.alerts && context.alerts.length > 0) {
      prompt += `\n\nActive Alerts:\n${context.alerts.map((a) => `- ${a.type}: ${a.message}`).join('\n')}`;
    }

    if (context.recentEvents && context.recentEvents.length > 0) {
      prompt += `\n\nRecent Events:\n${context.recentEvents.map((e) => `- ${e.type} at ${e.timestamp}`).join('\n')}`;
    }

    return prompt;
  }

  /**
   * Rate limiting check
   */
  private checkRateLimit(): void {
    const now = Date.now();
    if (now - this.lastHourReset > 3600000) {
      this.requestCount = 0;
      this.lastHourReset = now;
    }

    if (this.requestCount >= this.maxRequestsPerHour) {
      throw new Error(`Rate limit exceeded: ${this.maxRequestsPerHour} requests per hour`);
    }

    this.requestCount++;
  }

  /**
   * Trim conversation history to maintain context window
   */
  private trimHistory(): void {
    if (this.conversationHistory.length > this.maxContextWindow * 2) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxContextWindow * 2);
    }
  }

  /**
   * Fallback response when API fails (demo mode)
   */
  private provideFallbackResponse(question: string, context: CNCContext): string {
    const provider = context.provider || this.defaultProvider;
    this.logger.log(`Using fallback demo response for provider: ${provider}`);

    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('energy') || lowerQuestion.includes('power')) {
      return `[DEMO] Energy Analysis: Your CNC machine is currently consuming approximately 8-12 kW during active cutting. Reducing spindle speed by 15% and optimizing rapid traverse speeds could save 1.5-2.0 kW. Estimated annual energy savings: $3,200-$4,500. Best operating efficiency: 7-9 AM local time.`;
    }

    if (lowerQuestion.includes('maintenance') || lowerQuestion.includes('health') || lowerQuestion.includes('diagnostic')) {
      return `[DEMO] Machine Health: System operational. No critical alerts detected. Spindle harmonics nominal. Tool changer working optimally. Schedule coolant filter replacement within 8 hours. Preventive maintenance recommended in 72 operating hours. Machine uptime: 99.2%.`;
    }

    if (lowerQuestion.includes('optimize') || lowerQuestion.includes('performance') || lowerQuestion.includes('improve')) {
      return `[DEMO] Performance Optimization: 1) Increase feed rate from 120 to 145 mm/min (+15% throughput) 2) Reduce spindle speed 12% for aluminum (extend tool life 25%) 3) Consolidate tool changes (save 3 min/cycle) Estimated cycle time improvement: 16%. Quality impact: +2.3% precision.`;
    }

    if (lowerQuestion.includes('gcode') || lowerQuestion.includes('program') || lowerQuestion.includes('code')) {
      return `[DEMO] G-Code Analysis: Program efficiency score: 82/100. Contains 285 move commands, 14 tool changes. Optimization opportunities: (1) Consolidate 4 rapids (save 1.2 sec), (2) Smooth arc transitions, (3) Remove redundant clearance moves. Estimated cycle time: 52 min 30 sec → 49 min 45 sec after optimization.`;
    }

    if (lowerQuestion.includes('spindle') || lowerQuestion.includes('speed')) {
      return `[DEMO] Spindle Speed Guidance: Aluminum: 1000-1500 RPM (0.5" endmill). Steel: 400-800 RPM. Titanium: 150-300 RPM. Cast iron: 300-600 RPM. Current machine capability: 50-5000 RPM. Optimal starting point usually 60% of max speed, then adjust for sound quality. Higher speed = cooler chips, lower tool load.`;
    }

    return `[DEMO MODE - ${provider.toUpperCase()}] CNC Copilot Demo Response. I'm running in demonstration mode without a configured API key for ${provider}. Enable the appropriate API key environment variable to enable real AI analysis. Your question: "${question.substring(0, 60)}${question.length > 60 ? '...' : ''}"`;
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
    this.logger.log('Conversation history cleared');
  }

  /**
   * Get current context window size
   */
  getContextWindow(): number {
    return this.conversationHistory.length;
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      requestsThisHour: this.requestCount,
      maxRequestsPerHour: this.maxRequestsPerHour,
      contextWindowSize: this.conversationHistory.length,
      maxContextWindow: this.maxContextWindow,
      providers: {
        groq: {
          model: this.providers.groq.model,
          configured: !!this.providers.groq.apiKey,
        },
        openai: {
          model: this.providers.openai.model,
          configured: !!this.providers.openai.apiKey,
        },
        anthropic: {
          model: this.providers.anthropic.model,
          configured: !!this.providers.anthropic.apiKey,
        },
        azure: {
          model: this.providers.azure.model,
          configured: !!this.providers.azure.apiKey,
        },
      },
      defaultProvider: this.defaultProvider,
      streaming: true,
    };
  }
}
