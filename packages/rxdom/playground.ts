import { RxDOM, Component, div } from "@iatools/rxdom";
import {
  createReactor,
  combineReactors,
  reactorLogger,
} from "@iatools/reactor-core";

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

const store = combineReactors({
  reactors: { counter },
  plugins: [reactorLogger()],
});

store.actions.counter.increment(3)

export class AppComponent extends Component {
  render() {
    return div({ content: ["App"] });
  }
}

const App = Component.compose(AppComponent);

const rxdom = new RxDOM();
rxdom.render(App({ key: "root" }), document.getElementById("playground")!);
