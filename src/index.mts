export class AbortError extends Error {
  constructor(public reason: any) {
    super();
  }
}

export function atom<T>(initialState: T) {
  let state = initialState;

  const pendingUpdates = new Map<Function, Function>();
  const blocked = new Map<Function, Function>();

  function conditionallyUpdate(
    predicate: (state: T) => boolean,
    nextState: T | ((state: T) => T),
    abortController?: AbortController,
  ): Promise<T> {
    function attemptToApplyUptoOnePendingUpdate() {
      for (const [predicate, update] of pendingUpdates) {
        if (predicate(state)) {
          pendingUpdates.delete(predicate);
          update();
          break;
        }
      }
    }

    function attemptToUnblockWaitingThreads() {
      for (const [predicate, unblock] of blocked) {
        if (predicate(state)) {
          blocked.delete(predicate);
          unblock();
        }
      }
    }

    if (predicate(state)) {
      if (nextState instanceof Function) {
        state = nextState(state);
      } else {
        state = nextState;
      }

      return new Promise((resolve, reject) => {
        resolve(state);

        attemptToApplyUptoOnePendingUpdate();
        attemptToUnblockWaitingThreads();
      });
    } else {
      return new Promise((resolve, reject) => {
        if (abortController) {
          abortController.signal.addEventListener('abort', () => {
            pendingUpdates.delete(predicate);
            reject(new AbortError(abortController.signal.reason));
          });
        }

        pendingUpdates.set(predicate, () => {
          if (nextState instanceof Function) {
            state = nextState(state);
          } else {
            state = nextState;
          }

          resolve(state);

          attemptToApplyUptoOnePendingUpdate();
          attemptToUnblockWaitingThreads();
        });
      });
    }
  }

  function waitFor(
    predicate: (state: T) => boolean,
    reaction: (state: T) => void,
    abortController?: AbortController,
  ): void;
  function waitFor(predicate: (state: T) => boolean, reaction: undefined, abortController?: AbortController): Promise<T>;
  function waitFor(
    predicate: (state: T) => boolean,
    reaction?: (state: T) => void,
    abortController?: AbortController,
  ): any {
    if (reaction) {
      if (predicate(state)) {
        reaction(state);
      } else {
        if (abortController) {
          abortController.signal.addEventListener('abort', () => {
            blocked.delete(predicate);
          });
        }

        blocked.set(predicate, (state: T) => reaction(state));
      }
    } else {
      if (predicate(state)) {
        return Promise.resolve(state);
      } else {
        return new Promise<T>((resolve, reject) => {
          if (abortController) {
            abortController.signal.addEventListener('abort', () => {
              blocked.delete(predicate);
              reject(new AbortError(abortController.signal.reason));
            });
          }

          blocked.set(predicate, (state: T) => resolve(state));
        });
      }
    }
  }

  return { conditionallyUpdate, waitFor };
}
