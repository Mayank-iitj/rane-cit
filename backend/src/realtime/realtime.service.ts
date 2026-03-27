import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { RealtimeEvent } from './realtime.types';

@Injectable()
export class RealtimeService {
  private readonly events$ = new Subject<RealtimeEvent>();

  publish<T>(channel: string, data: T): void {
    this.events$.next({
      channel,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  stream(channel?: string): Observable<RealtimeEvent> {
    if (!channel) {
      return this.events$.asObservable();
    }

    return this.events$.pipe(filter((event) => event.channel === channel));
  }
}
