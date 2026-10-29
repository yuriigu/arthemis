import { AsyncLocalStorage } from 'node:async_hooks';

const requestIdStorage = new AsyncLocalStorage<string>();

export function runWithRequestId<T>(requestId: string, callback: () => T): T {
  return requestIdStorage.run(requestId, callback);
}

export function getRequestId(): string | undefined {
  return requestIdStorage.getStore();
}

export function withRequestId(message: string): string {
  return JSON.stringify({
    requestId: getRequestId() ?? null,
    message,
  });
}
