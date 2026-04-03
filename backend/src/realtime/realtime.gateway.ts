import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { RealtimeService } from './realtime.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:8000', 'https://cnc.mayyanks.app'],
    methods: ['GET', 'POST'],
  },
  namespace: '/api/realtime',
  transports: ['websocket', 'polling'],
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private subscriptions = new Map<Socket, { [channel: string]: boolean }>();

  constructor(private readonly realtimeService: RealtimeService) {
    // Subscribe to all events and broadcast to connected clients
    this.realtimeService.stream().subscribe((event) => {
      this.server.emit(event.channel, event.data);
    });
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, channel: string): void {
    if (!this.subscriptions.has(client)) {
      this.subscriptions.set(client, {});
    }
    const channels = this.subscriptions.get(client)!;
    channels[channel] = true;
    client.join(channel);
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, channel: string): void {
    if (this.subscriptions.has(client)) {
      const channels = this.subscriptions.get(client)!;
      delete channels[channel];
    }
    client.leave(channel);
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket): void {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  handleConnection(client: Socket): void {
    console.log(`[WebSocket] Client connected: ${client.id}`);
    client.emit('connected', { clientId: client.id, message: 'Connected to realtime stream' });
  }

  handleDisconnect(client: Socket): void {
    console.log(`[WebSocket] Client disconnected: ${client.id}`);
    // Clean up subscriptions
    if (this.subscriptions.has(client)) {
      this.subscriptions.delete(client);
    }
  }
}
