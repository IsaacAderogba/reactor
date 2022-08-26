import { RxDOM, Component, div, composeFunction, button } from "@iatools/rxdom";
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

type ReactorProps = ReactorContextProps<typeof reactor>;

const [Provider, selector] = composeReactor<typeof reactor>(({ props }) => {
  return div({ content: props.content });
});

export class AppComponent extends Component {
  render() {
    return div({
      content: [
        Provider({
          reactor,
          content: [ReactiveComponent(), NonReactiveComponent()],
        }),
      ],
    });
  }
}

const App = Component.compose(AppComponent);

interface ReactiveComponentContext {
  counter: {
    state: ReactorProps["state"]["counter"];
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
    counter: selector<ReactiveComponentContext["counter"]>(props => ({
      state: props.state.counter,
    })),
  }
);

interface NonReactiveComponentContext {
  counter: {
    actions: ReactorProps["actions"]["counter"];
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
    counter: selector<NonReactiveComponentContext["counter"]>(props => ({
      actions: props.actions.counter,
    })),
  }
);

const rxdom = new RxDOM();
rxdom.render(App({ key: "root" }), document.getElementById("playground")!);
