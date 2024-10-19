![npm](https://img.shields.io/npm/v/synchronization-atom)
![NPM](https://img.shields.io/npm/l/synchronization-atom)
![GitHub issues](https://img.shields.io/github/issues/omranjamal/synchronization-atom)
![npm bundle size](https://img.shields.io/bundlephobia/min/synchronization-atom)
![npm](https://img.shields.io/npm/dw/synchronization-atom)
![GitHub forks](https://img.shields.io/github/forks/omranjamal/synchronization-atom)
![GitHub Repo stars](https://img.shields.io/github/stars/omranjamal/synchronization-atom)


# synchronization-atom

> A powerful (& typed) zero-dependency primitive to help build other synchronization primitives including but not limited to:
> [locks][1],
> [semaphores][2],
> [events][3],
> [barriers][4],
> [channels][5]

## Installation

```bash
# pnpm
pnpm add --save synchronization-atom
```

## API

### `atom(initialState)`

Creates and returns an `Atom<T>` with the given `initialState: T`.

### `async atom.conditionallyUpdate(predicate, nextState, abortController?)`

Attempts to update the atom's state to `nextState` if the 
current state satisfies the `predicate`. If the current state
does not satisfy the `predicate`, the call blocks until the
predicate is satisfied.

Can be cancelled via an optional `AbortController` as last argument.

```ts
typeof predicate = (state: T) => boolean
typeof nextState = T | ((state: T) => T)
```

### `async atom.waitFor(predicate, reaction?, abortController?)`

Blocks until the atom's state satisfies the `predicate` unless a
`reaction` is provided. If a `reaction` is provided, the call returns
immediately,  and when the `predicate` is satisfied, the `reaction`
is executed.

Can be cancelled via an optional `AbortController` as last argument.

```ts
typeof predicate = (state: T) => boolean
typeof reaction = Function
```

## Usage Examples

### Make a [lock][1]

```ts
import {atom} from 'synchronization-atom';

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
import { atom } from 'synchronization-atom';

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
import { atom } from 'synchronization-atom';

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
import { atom } from 'synchronization-atom';

const barrierAtom = atom(3 /* empty seats */);

async function test(n: number) {
    await barrierAtom.conditionallyUpdate(
        () => true,
        (emptySeats) => emptySeats - 1
    );

    console.log(n, `waiting for seats to fill`);
    await barrierAtom.waitFor((emptySeats) => emptySeats < 0);

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
