import { createReactor, reactorLogger } from "./src";

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
  plugins: [reactorLogger()],
});

counter.actions.incrementByAmount(5);
counter.actions.decrement();
counter.actions.increment();
counter.actions.increment();
counter.actions.incrementByAmountAsync(() => {
  return { value: 2 };
});
