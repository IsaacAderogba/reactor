# Reactor, a type-safe state management library

[Reactor](https://github.com/IsaacAderogba/reactor) is a state management library with a focus on type safety. It shares a similar architecture with `redux-toolkit`, allowing for the creation and composition of different slices of state.

> Reactor, like many of my projects, has been primarily built for my use cases. If you wish to extend the base functionality, you're encouraged to fork the package.

| Library                 | Description                                             |
| ----------------------- | ------------------------------------------------------- |
| `@iatools/reactor-core` | Zero-dependency library for type-safe state management. |

[Reactor, a type-safe state management library](https://www.isaacaderogba.com/reactor)

## Guides

#### Installation

Reactor can be installed as a standalone library through your preferred package manager.

```shell
npm install @iatools/reactor-core
```

Because Reactor focuses on type-safe state management, you’re encouraged to define interfaces for your `State` and `Actions`:

```typescript
interface CounterState {
  value: number;
}

interface CounterActions {
  increment: number;
  decrement: number;
  reset: never;
}
```

We can then provide these as type arguments to the `createReactor` function.

```typescript
import { createReactor } from "@iatools/reactor-core";

// ... CounterState, CounterActions

const counter = createReactor<CounterState, CounterActions>({
  initialState: { value: 0 },
  reducers: {
    increment(state) {
      return { ...state, value: state.value + 1 };
    },
    decrement(state) {
      return { ...state, value: state.value - 1 };
    },
    reset(state) {
      return { ...state, value: 0 };
    },
  },
});
```

This ensures that our `Reducer` functions satisfy our type interface, but also provides us with type-safe `ActionCreators` that we can use to transition our state.

```typescript
console.log(counter.actions);
// {increment: ƒ, decrement: ƒ, reset: ƒ}

counter.actions.increment(1);
```

Often, you’ll want to combine different slices of state to represent the data your app cares about. To support this, the `combineReactors` function allows you to combine different `Reactors` into a `CombinedReactor`. At this point, you're also able to specify external plugins that can operate on your store. The `reactorLogger` plugin, for example, will log all the state changes and the actions that caused them to your console.

```typescript
import { createReactor } from "@iatools/reactor-core";

// ... create reactors for `counter` and `todos`

const store = combineReactors({
  reactors: { counter, todos },
  plugins: [reactorLogger()],
});

store.actions.counter.increment(1);
```

#### Usage with RxDOM

Reactor has bindings for RxDOM library, distributed via the `reactor-rxdom` package.

[RxDOM, a zero-dependency JavaScript library for building reactive user interfaces](https://www.isaacaderogba.com/rxdom)

These bindings should be installed alongside `reactor-core` and `rxdom` packages can be done with your preferred package manager:

```shell
npm install @iatools/reactor-core @iatools/reactor-rxdom @iatools/rxdom
```

After the creation of your reactors using `reactor-core`, use the `composeReactor` factory to create a strongly-typed context provider and selector:

```typescript
import { composeReactor } from "@iatools/reactor-rxdom";

// ... create reactor or combined reactor

const [Provider, selector] = composeReactor<typeof reactor>(({ props }) => {
  return div({ content: props.content });
});
```

When rendering this provider, pass your `reactor` as one of the props. This will make the `reactor` available to all descendant components.

```typescript
import { composeFunction } from "@iatools/rxdom";

const App = composeFunction(() => {
  return Provider({
    reactor,
    content: [Child()],
  });
});
```

To access this context in a child component, define which slice of the reactor you would like to access, and then use the `selector` returned from `composeReactor` to access that slice.

```typescript
import { button } from "@iatools/rxdom";
import { ReactorContextProps } from "@iatools/reactor-rxdom";

// ... composed reactor

type ContextProps = ReactorContextProps<typeof reactor>;

interface ChildContext {
  counterState: ContextProps["state"]["counter"];
  counterActions: ContextProps["actions"]["counter"];
}

const Child = composeFunction<{}, ChildContext>(
  ({ context }) => {
    return button({
      content: [context.counterState.value],
      onclick: () => {
        context.counterActions.increment(1);
      },
    });
  },
  {
    counterState: selector(props => props.state.counter),
    counterActions: selector(props => props.actions.counter),
  }
);
```

## Docs

#### States

`States` represent the current value of a given reactor. Since Reactor works best with type-driven development, we’re encouraged to define our `States` in interface. The following provides an example of a state for a `Counter` reactor.

```typescript
interface CounterState {
  value: number;
}
```

This `CounterState` is then passed as a type argument to the `createReactor` function, forcing us to define an `initialState` that satisfies the interface.

```typescript
const counter = createReactor<CounterState, {}>({
  initialState: { value: 0 },
});
```

`States` are incredibly important as Reactor uses these values to generate a type-safe API.

#### Actions

`Actions` are responsible for transitioning Reactor `States`. As is the case states, Reactor encourages you to define actions in an interface.

```typescript
interface CounterActions {
  increment: number;
  decrement: number;
  reset: never;
}
```

This action interface specifies that the `increment` and `decrement` actions expect a number value, while `reset` *never* expects a value.

When we pass `CounterActions` as the second type argument to `createReactor`, Reactor will enforce that we provide a `reducers` property which satisfies this interface.

```typescript
const counter = createReactor<CounterState, CounterActions>({
  initialState: { value: 0 },
  reducers: {
    increment(state, number) {
      return { ...state, value: state.value + number };
    },
    decrement(state, number) {
      return { ...state, value: state.value - number };
    },
    reset(state) {
      return { ...state, value: 0 };
    },
  },
});
```

Like `States`, `Actions` are another fundamental type unit that Reactor relies on to support type-safe state management. These are the only two interfaces you'll need to declare to productively use Reactor.

#### Reducers

`Reducer` are responsible for responding to different `Actions`. Reactor doesn't require you to specify the types of your reducers as they are inferred from your `State` and `Actions`. At its core, a reducer takes in a `State` and an `Action` and uses that to return a new state.

The following highlights the `increment`, `decrement`, and `reset` reducers. As a reminder, Reactor will report an error if the defined reducers don’t correspond to `CounterState` and `CounterActions` type arguments.

```typescript
const counter = createReactor<CounterState, CounterActions>({
  ...,
  reducers: {
    increment(state, number) {
      return { ...state, value: state.value + number };
    },
    decrement(state, number) {
      return { ...state, value: state.value - number };
    },
    reset(state) {
      return { ...state, value: 0 };
    },
  },
});
```

#### Action Creators

Using the `State` and `Action` type arguments, Reactor is able to generate `ActionCreators`. These can be accessed on the `actions` property of the returned `Reactor`.

```typescript
const counter = createReactor<CounterState, CounterActions>({
  initialState: { value: 0 },
  reducers: {
    increment(state, number) {
      return { ...state, value: state.value + number };
    },
  },
});

counter.actions.increment(4);
```

Failing to provide the correct arguments to this action creator will result in a typescript error.

```typescript
counter.actions.increment();
// Expected 1 arguments, but got 0. ts(2554)

counter.actions.increment("");
// Argument of type 'string' is not assignable to parameter of type 'number | StoredAction<number, Store<CounterState, CounterActions>>'
```

Action creators can also handle async dispatches.

```typescript
counter.actions.increment(async () => {
  const data = // handle async behaviour...
  return data;
})
```

As before, Reactor will verify that the signature of the returned value, `data` in this case, corresponds with the correct type signature.

#### Reactors

`Reactors` are responsible for initializing `State`, accepting `Reducer` functions, and generating `ActionCreators` as specified by the `Action` type signature.

```typescript
interface CounterState {
  value: number;
}

interface CounterActions {
  increment: never;
}

const counter = createReactor<CounterState, CounterActions>({
  initialState: { value: 0 },
  reducers: {
    increment(state) {
      return { ...state, value: state.value + 1 };
    },
  },
});
```

Importantly, `Reactors` allow you to subscribe to store changes through the `reactor.subscribe()`  method, access current actions through `reactor.actions` and access the current state through `reactor.getState()`.

Because reactors are designed to handle individual slices of state (and not represent app state collectively), we also expose a `combineReactors` function which returns a `CombinedReactor`. Here, we can also pass in `ReactorPlugins` to provide additional functionality to our store. The follow example combines a `todos` and `counter` reactor and initializes a `reactorLogger` plugin for providing logs on state changes.

```typescript
const store = combineReactors({
  reactors: { counter, todos },
  plugins: [reactorLogger()],
});
```

Aside from those details, we interact with a `CombinedReactor` in the same way we interact with individual `Reactors`.

