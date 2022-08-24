import { createReactor, composeReactors, reactorLogger } from "./src";

interface CounterState {
  value: number;
}

interface CounterActions {
  increment: never;
  decrement: never;
  incrementByAmount: number;
  incrementByAmountAsync: { value: number };
}

const counter = createReactor<CounterState, CounterActions>({
  initialState: { value: 0 },
  reducer: {
    increment(state) {
      return { ...state, value: state.value + 1 };
    },
    decrement(state) {
      return { ...state, value: state.value - 1 };
    },
    incrementByAmount(state, payload) {
      return { ...state, value: state.value + payload };
    },
    incrementByAmountAsync(state, payload) {
      return { ...state, value: state.value + payload.value };
    },
  },
});

interface StringStore {
  value: string;
}

interface StringActions {
  append: string;
}

const string = createReactor<StringStore, StringActions>({
  initialState: { value: "" },
  reducer: {
    append(state, payload) {
      return { ...state, value: state.value + payload };
    },
  },
});

string.actions.append("reactor");
console.log("refactored");

counter.actions.incrementByAmount(5);
counter.actions.decrement();
counter.actions.increment();
counter.actions.increment();
counter.actions.incrementByAmountAsync(({ actions }) => {
  actions.incrementByAmountAsync(() => {
    return { value: 20 };
  });
  return { value: 2 };
});

const store = composeReactors({
  reactors: { counter, string },
  plugins: [reactorLogger()],
});

console.log(store.getState());
// store.getState().counter
// store.reactors.counter.
console.log(store.actions.counter);
store.actions.counter.decrement();
console.log(store.getState());
store.actions.string.append("combined")
console.log(store.getState());
