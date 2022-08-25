import { RxDOM, Component, div, composeFunction } from "@iatools/rxdom";
import {
  createReactor,
  combineReactors,
  reactorLogger,
} from "@iatools/reactor-core";
import { composeReactor } from "./src";

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

const [Provider, selector] = composeReactor(reactor, ({ props }) => {
  return div({ content: props.content });
});

reactor.actions.counter.increment(3);

export class AppComponent extends Component {
  render() {
    return div({
      content: [
        Provider({
          content: [ReactiveComponent()],
        }),
      ],
    });
  }
}

const App = Component.compose(AppComponent);

interface ReactiveComponentContext {
  reactor: typeof reactor;
}

const ReactiveComponent = composeFunction(() => {
  console.log("render");
  return div({ content: ["hello world"] });
}, {});

const rxdom = new RxDOM();
rxdom.render(App({ key: "root" }), document.getElementById("playground")!);
