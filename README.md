![npm](https://img.shields.io/npm/v/synchronization-atom)
![NPM](https://img.shields.io/npm/l/synchronization-atom)
![GitHub issues](https://img.shields.io/github/issues/omranjamal/synchronization-atom)
![npm bundle size](https://img.shields.io/bundlephobia/min/synchronization-atom)
![npm](https://img.shields.io/npm/dw/synchronization-atom)
![GitHub forks](https://img.shields.io/github/forks/omranjamal/synchronization-atom)
![GitHub Repo stars](https://img.shields.io/github/stars/omranjamal/synchronization-atom)


# synchronization-atom

A powerful (& typed) zero-dependency primitive to help build other synchronization primitives including but not limited to:
[locks][1],
[semaphores][2],
[events][3],
[barriers][4],
[channels][5]

> This project was heavily inspired by [mobx's `when`](https://mobx.js.org/reactions.html#when)

## Installation

```bash
# pnpm
pnpm add --save synchronization-atom
```

## API

### `atom`

```ts
function atom<T>(initialState: T): Atom<T>
```

Creates and returns an `Atom<T>` with the given `initialState: T`.

### `async` `atom.conditionallyUpdate`

```ts
interface Atom<T> {
    ...
    conditionallyUpdate: (
        predicate: (state: T) => boolean,
        nextState: T | ((state: T) => T),
        sideEffect?: (state: T) => void,
        abortController?: AbortController
    ) => Promise<T>
    ...
}
```

- Updates the atom's state to `nextState` if the 
  current state satisfies the `predicate`.
- If the current state
  does not satisfy the `predicate`, the call blocks until the
  predicate is satisfied.
- If a `sideEffect` is provided, it is executed atomically 
  as part of the update (i.e. no other update or side-effect will be running 
  simultaneously against the atom).
- Can be cancelled via an optional `AbortController` as last argument.

### `async` `atom.waitFor`

```ts
interface Atom<T> {
    ...
    waitFor: (
        predicate: (state: T) => boolean,
        reaction?: (state: T) => void,
        abortController?: AbortController
    ) => Promise<T> | void
    ...
}
```

- Blocks until the atom's state satisfies the `predicate`, unless a
`reaction` is provided.
- If a `reaction` is provided, the call returns
immediately,  and when the `predicate` is satisfied, the `reaction`
is executed.
- Can be cancelled via an optional `AbortController` as last argument.

### `atom.getState`

```ts
interface Atom<T> {
    ...
    getState: () => T
    ...
}
```

Returns the current state of the atom.

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

## Why?

> I often use async calls like separate threads or at least like
> Go routines, as in as long as I'm fetching from DB or API over
> a network, it is effectively multi-threading (at least in my head).
> 
> Sadly I couldn't enjoy the very powerful sync primitives that
> [Python](https://docs.python.org/3/library/asyncio-sync.html),
> [Java](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/package-summary.html)
> or [Go](https://pkg.go.dev/sync) has to offer.
> 
> Simultaneously, I noticed different standard libraries of the different
> languages have a different set of sync primitives but mutexes were
> at the heart.
> 
> I set out to create these primitives for JS while basing them off
> of a single primitive that is analogous to a mutex, but on parr
> with the level of expressiveness and ease we come to expect from
> the JS ecosystem.
> 
> [synchronization-atom](https://www.npmjs.com/package/synchronization-atom) is the result of that effort.
> 
> — [Omran Jamal](https://omranjamal.me)

## License
MIT

[1]: https://pkg.go.dev/sync#Mutex
[2]: https://docs.oracle.com/javase/8/docs/api/?java/util/concurrent/Semaphore.html
[3]: https://docs.python.org/3/library/threading.html#event-objects
[4]: https://docs.python.org/3/library/threading.html#barrier-objects
[5]: https://gobyexample.com/channels
