export function atom<T>(initialState: T) {
  let state = initialState;

  const pendingUpdates = new Map<Function, Function>();
  const blocked = new Map<Function, Function>();

  function conditionallyUpdate(
    predicate: (state: T) => boolean,
    nextState: T | ((state: T) => T),
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

      return new Promise((resolve) => {
        resolve(state);
        attemptToApplyUptoOnePendingUpdate();
        attemptToUnblockWaitingThreads();
      });
    } else {
      return new Promise((resolve) => {
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
  ): void;
  function waitFor(predicate: (state: T) => boolean): Promise<T>;
  function waitFor(
    predicate: (state: T) => boolean,
    reaction?: (state: T) => void,
  ): any {
    if (reaction) {
      if (predicate(state)) {
        reaction(state);
      } else {
        blocked.set(predicate, (state: T) => reaction(state));
      }
    } else {
      if (predicate(state)) {
        return Promise.resolve(state);
      } else {
        return new Promise<T>((resolve) => {
          blocked.set(predicate, (state: T) => resolve(state));
        });
      }
    }
  }

  return { conditionallyUpdate, waitFor };
}
