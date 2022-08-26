import { RxDOM, div, composeFunction, button } from "@iatools/rxdom";
import {
  createReactor,
  combineReactors,
  reactorLogger,
} from "@iatools/reactor-core";
import { composeReactor, ReactorContextProps } from "./src";

interface CounterState {
  value: number;
}

interface CounterActions {
  increment: number;
  decrement: number;
  reset: never;
}

const counter = createReactor<CounterState, CounterActions>({
  initialState: { value: 0 },
  reducers: {
    increment(state, payload) {
      return { ...state, value: state.value + payload };
    },
    decrement(state, payload) {
      return { ...state, value: state.value - payload };
    },
    reset(state) {
      return { ...state, value: 0 };
    },
  },
});

const reactor = combineReactors({
  reactors: { counter },
  plugins: [reactorLogger()],
});

const [Provider, selector] = composeReactor<typeof reactor>(({ props }) => {
  return div({ content: props.content });
});

const App = composeFunction(() => {
  return Provider({
    reactor,
    content: [ReactiveComponent(), NonReactiveComponent()],
  });
});

type ContextProps = ReactorContextProps<typeof reactor>;

interface ReactiveComponentContext {
  counter: {
    state: ContextProps["state"]["counter"];
  };
}

const ReactiveComponent = composeFunction<{}, ReactiveComponentContext>(
  ({ context }) => {
    console.log("ReactiveComponent");

    return button({
      content: [context.counter.state.value],
    });
  },
  {
    counter: selector(props => ({ state: props.state.counter })),
  }
);

interface NonReactiveComponentContext {
  counter: {
    actions: ContextProps["actions"]["counter"];
  };
}

const NonReactiveComponent = composeFunction<{}, NonReactiveComponentContext>(
  ({ context }) => {
    console.log("NonReactiveComponent");

    return button({
      content: ["increment counter"],
      onclick: () => {
        context.counter.actions.increment(1);
      },
    });
  },
  {
    counter: selector(props => ({ actions: props.actions.counter })),
  }
);

const rxdom = new RxDOM();
rxdom.render(App({ key: "root" }), document.getElementById("playground")!);
