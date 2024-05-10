type EventHandler = (...args: any[]) => void;

export default class EventEmitter {
  private events: Map<string, EventHandler[]>;

  constructor() {
    this.events = new Map();
  }

  on(event: string, handler: EventHandler): void {
    const handlers = this.events.get(event) || [];
    handlers.push(handler);
    this.events.set(event, handlers);
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.events.get(event);
    if (handlers) {
      const newHandlers = handlers.filter((h) => h !== handler);
      this.events.set(event, newHandlers);
    }
  }

  once(event: string, handler: EventHandler): void {
    const onceWrapper: EventHandler = (...args) => {
      handler(...args);
      this.off(event, onceWrapper);
    };

    this.on(event, onceWrapper);
  }

  emit(event: string, ...args: any[]): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.slice().forEach((handler) => handler(...args));
    }
  }
}
