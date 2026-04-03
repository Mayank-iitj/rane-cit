import { Controller, Post, Body, Res, Get, Query, Logger } from '@nestjs/common';
import { Response } from 'express';
import { CopilotService } from './copilot.service';

interface AskQuestionDto {
  question: string;
  machineId?: string;
  telemetryData?: any;
  stream?: boolean;
  provider?: 'groq' | 'openai' | 'anthropic' | 'azure';
}

@Controller('copilot')
export class CopilotController {
  private readonly logger = new Logger('CopilotController');

  constructor(private readonly copilotService: CopilotService) {}

  @Post('ask')
  async askQuestion(@Body() dto: AskQuestionDto, @Res() res: Response) {
    try {
      if (!dto.question || dto.question.trim().length === 0) {
        return res.status(400).json({ error: 'Question is required' });
      }

      // Streaming response
      if (dto.stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');

        const generator = this.copilotService.askQuestionStream(dto.question, {
          machineId: dto.machineId,
          telemetryData: dto.telemetryData,
          provider: dto.provider || 'groq',
        });

        for await (const event of generator) {
          res.write(`data: ${JSON.stringify(event)}\n\n`);
        }

        res.end();
      } else {
        // Regular response
        const response = await this.copilotService.askQuestion(dto.question, {
          machineId: dto.machineId,
          telemetryData: dto.telemetryData,
          provider: dto.provider || 'groq',
        });

        return res.json(response);
      }
    } catch (error) {
      this.logger.error('Copilot ask failed:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Copilot service error',
      });
    }
  }

  @Post('ask-stream')
  async askQuestionStream(@Body() dto: AskQuestionDto, @Res() res: Response) {
    try {
      if (!dto.question || dto.question.trim().length === 0) {
        return res.status(400).json({ error: 'Question is required' });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('X-Accel-Buffering', 'no');

      const generator = this.copilotService.askQuestionStream(dto.question, {
        machineId: dto.machineId,
        telemetryData: dto.telemetryData,
        provider: dto.provider || 'groq',
      });

      for await (const event of generator) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }

      res.end();
    } catch (error) {
      this.logger.error('Copilot stream failed:', error);
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          content: error instanceof Error ? error.message : 'Stream error',
          timestamp: new Date().toISOString(),
        })}\n\n`,
      );
      res.end();
    }
  }

  @Post('clear-history')
  clearHistory() {
    this.copilotService.clearHistory();
    return { message: 'Conversation history cleared' };
  }

  @Get('status')
  getStatus() {
    return {
      status: 'operational',
      ...this.copilotService.getStats(),
      timestamp: new Date().toISOString(),
    };
  }

  @Post('optimize-machine')
  async optimizeForMachine(@Body() dto: { machineId: string; currentMetrics: any }, @Res() res: Response) {
    const prompt = `${CopilotService.CNC_OPTIMIZATION_PROMPT}\n\nMachine Metrics:\n${JSON.stringify(dto.currentMetrics, null, 2)}`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const generator = this.copilotService.askQuestionStream(prompt, { machineId: dto.machineId });
    for await (const event of generator) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
    res.end();
  }

  @Post('diagnose-health')
  async diagnoseHealth(@Body() dto: { machineId: string; healthData: any }, @Res() res: Response) {
    const prompt = `${CopilotService.CNC_DIAGNOSTIC_PROMPT}\n\nHealth Data:\n${JSON.stringify(dto.healthData, null, 2)}`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const generator = this.copilotService.askQuestionStream(prompt, { machineId: dto.machineId });
    for await (const event of generator) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
    res.end();
  }

  @Post('energy-analysis')
  async analyzeEnergy(@Body() dto: { machineId: string; energyData: any }, @Res() res: Response) {
    const prompt = `${CopilotService.CNC_ENERGY_PROMPT}\n\nEnergy Data:\n${JSON.stringify(dto.energyData, null, 2)}`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const generator = this.copilotService.askQuestionStream(prompt, { machineId: dto.machineId });
    for await (const event of generator) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
    res.end();
  }
}
