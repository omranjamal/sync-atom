![npm](https://img.shields.io/npm/v/sync-atom)
![NPM](https://img.shields.io/npm/l/sync-atom)
![GitHub issues](https://img.shields.io/github/issues/omranjamal/sync-atom)
![npm bundle size](https://img.shields.io/bundlephobia/min/sync-atom)
![npm](https://img.shields.io/npm/dw/sync-atom)
![GitHub forks](https://img.shields.io/github/forks/omranjamal/sync-atom)
![GitHub Repo stars](https://img.shields.io/github/stars/omranjamal/sync-atom)


# sync-atom

> A powerful (& typed) zero-dependency primitive to help build other synchronization primitives including but not limited to:
> [locks][1],
> [semaphores][2],
> [events][3],
> [barriers][4],
> [channels][5]

## Installation

```bash
# pnpm
pnpm add --save sync-atom
```

## API

### `atom(initialState)`

Creates and returns an `Atom<T>` with the given `initialState: T`.

### `atom.conditionallyUpdate(predicate, nextState)`

Attemts to update the atom's state to `nextState` if the 
current state satisfies the `predicate`. If the current state
does not satisfy the `predicate`, the call blocks until the
predicate is satisfied.

```ts
typeof predicate = (state: T) => boolean
typeof nextState = T | ((state: T) => T)
```

### `atom.waitFor(predicate)`

Blocks until the atom's state satisfies the `predicate`.

```ts
typeof predicate = (state: T) => boolean
```

## Usage Examples

### Make a [lock][1]

```ts
import {atom} from 'sync-atom';

const lockAtom = atom(false /* is locked */);

async function test(n: number) {
    // aquire lock
    await lockAtom.conditionallyUpdate(
        (locked) => locked === false,
        true
    );

    console.log(n, `aquired lock`);
    await doCrazyAsyncStuffHere();
    console.log(n, `releasing lock`);

    // release lock
    lockAtom.conditionallyUpdate(() => true, false);
}

Promise.all([test(1), test(2), test(3)]);
```

### Make a [semaphore][2]

```ts
import { atom } from 'sync-atom';

const semaphoreAtom = atom(3 /* no. of seats */);

async function test(n: number) {
    // aquire lock
    await semaphoreAtom.conditionallyUpdate(
        (seats) => seats > 0,
        (seats) => seats - 1
    );
    
    console.log(n, `aquired lock`);
    await doCrazyAsyncStuffHere();
    console.log(n, `releasing lock`);
    
    // release lock
    semaphoreAtom.conditionallyUpdate(
        () => true,
        seats => seats + 1
    );
}

Promise.all([test(1), test(2), test(3), test(4), test(5)]);
```

### Make a [event][3]

```ts
const eventAtom = atom(false /* is event set */);

async function test(n: number) {
    console.log(n, `waiting for event`);
    await eventAtom.waitFor((isSet) => isSet === true);

    console.log(n, `running`);
}

Promise.all([test(1), test(2), test(3)]);

console.log(`setting event`);
eventAtom.conditionallyUpdate(() => true, true);
```

### Make a [barrier][4]

```ts
const barrierAtom = atom(3 /* empty seats */);

async function test(n: number) {
    await barrierAtom.conditionallyUpdate(
        () => true,
        (emptySeats) => emptySeats - 1
    );

    console.log(n, `waiting for seats to fill`);
    await barrierAtom.waitFor((emptySeats) => emptySeats === 0);

    console.log(n, `running`);
}

Promise.all([test(1), test(2), test(3), test(4), test(5)]);
```

## License
MIT

[1]: https://pkg.go.dev/sync#Mutex
[2]: https://docs.oracle.com/javase/8/docs/api/?java/util/concurrent/Semaphore.html
[3]: https://docs.python.org/3/library/threading.html#event-objects
[4]: https://docs.python.org/3/library/threading.html#barrier-objects
[5]: https://gobyexample.com/channels
