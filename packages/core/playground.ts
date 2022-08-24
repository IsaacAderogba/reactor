import {
  Action,
  createReactor,
  ReactorActions,
  ReactorPlugin,
  ReactorStates,
  State,
} from "./src";

interface CounterState extends ReactorStates {
  value: State<number>;
}

interface CounterActions extends ReactorActions {
  increment: Action;
  decrement: Action;
  incrementByAmount: Action<number>;
  incrementByAmountAsync: Action<number>;
}

const loggingPlugin: ReactorPlugin<CounterState, CounterActions> =
  ({ getState }) =>
  next =>
  action => {
    console.info("before", getState());
    console.info("action", action);
    // actions.increment();
    const result = next(action);
    console.info("after", getState());
    return result;
  };

const counter = createReactor<CounterState, CounterActions>({
  name: "counter",
  initialState: { value: 0 },
  reducer: {
    increment: state => {
      return { ...state, value: state.value + 1 };
    },
    decrement: state => {
      return { ...state, value: state.value - 1 };
    },
    incrementByAmount: (state, action) => {
      return { ...state, value: state.value + action.payload };
    },
    incrementByAmountAsync: (state, action) => {
      return { ...state, value: state.value + action.payload };
    },
  },
  plugins: [loggingPlugin],
});

counter.actions.incrementByAmount(5);
counter.actions.decrement();
counter.actions.increment();
counter.actions.increment();
counter.actions.incrementByAmountAsync(async ({ actions, getState }) => {
  return 2;
});
