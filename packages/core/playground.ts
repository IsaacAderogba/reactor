import { createReactor, combineReactors, reactorLogger } from "./src";

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
  reducers: {
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

counter.subscribe(state => console.log("counter changed", state));

interface StringStore {
  value: string;
}

interface StringActions {
  append: string;
}

const string = createReactor<StringStore, StringActions>({
  initialState: { value: "" },
  reducers: {
    append(state, payload) {
      return { ...state, value: state.value + payload };
    },
  },
});

string.subscribe(state => console.log("string changed", state));

string.actions.append("reactor");

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

const store = combineReactors({
  reactors: { counter, string },
  plugins: [reactorLogger()],
});

store.subscribe(state => console.log("store changed", state));
store.actions.string.append("combined");
store.actions.counter.decrement();
