import { EventEmitter } from "node:events";
import { logger } from "../utils/logger.js";
import type { DomainEvent, DomainEventName } from "./types.js";

type Handler = (event: DomainEvent) => Promise<void> | void;

class DomainEventBus {
  private readonly emitter = new EventEmitter();

  on(name: DomainEventName, handler: Handler): void {
    this.emitter.on(name, (event: DomainEvent) => {
      Promise.resolve(handler(event)).catch((error: unknown) => {
        logger.error({ err: error, event: name }, "Domain event handler failed");
      });
    });
  }

  publish(name: DomainEventName, payload: Record<string, unknown>): void {
    const event: DomainEvent = {
      name,
      occurredAt: new Date().toISOString(),
      payload,
    };

    logger.info({ event: name, payload }, "Domain event published");
    this.emitter.emit(name, event);
  }
}

export const domainEvents = new DomainEventBus();
