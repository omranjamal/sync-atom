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
    sideEffect?: ((state: T) => void) | ((state: T) => Promise<void>),
    abortSignal?: AbortSignal,
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

      sideEffect?.(state);

      return new Promise((resolve, reject) => {
        resolve(state);
        attemptToApplyUptoOnePendingUpdate();
        attemptToUnblockWaitingThreads();
      });
    } else {
      return new Promise((resolve, reject) => {
        if (abortSignal) {
          abortSignal.addEventListener('abort', () => {
            pendingUpdates.delete(predicate);
            reject(new AbortError(abortSignal.reason));
          });
        }

        pendingUpdates.set(predicate, () => {
          if (nextState instanceof Function) {
            state = nextState(state);
          } else {
            state = nextState;
          }

          sideEffect?.(state);

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
  ): void;
  function waitFor(
    predicate: (state: T) => boolean,
    reaction: (state: T) => void,
    abortSignal: AbortSignal,
  ): void;
  function waitFor(predicate: (state: T) => boolean): Promise<T>;
  function waitFor(predicate: (state: T) => boolean, reaction: undefined, abortSignal: AbortSignal): Promise<T>;
  function waitFor(
    predicate: (state: T) => boolean,
    reaction?: (state: T) => void,
    abortSignal?: AbortSignal,
  ): any {
    if (reaction) {
      if (predicate(state)) {
        reaction(state);
      } else {
        if (abortSignal) {
          abortSignal.addEventListener('abort', () => {
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
          if (abortSignal) {
            abortSignal.addEventListener('abort', () => {
              blocked.delete(predicate);
              reject(new AbortError(abortSignal.reason));
            });
          }

          blocked.set(predicate, (state: T) => resolve(state));
        });
      }
    }
  }

  function getState() {
    return state;
  }

  return { conditionallyUpdate, waitFor, getState };
}
