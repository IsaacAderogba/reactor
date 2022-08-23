import {
  Action,
  Dispatch,
  ReactorActionCreators,
  ReactorActions,
  ReactorPlugin,
  ReactorReducer,
  ReactorStates,
  ReactorSubscriber,
  Unknown,
} from "./types";

export class Reactor<
  S extends ReactorStates = Unknown,
  A extends ReactorActions = Unknown,
  R extends ReactorReducer = Unknown
> {
  private subscribers = new Set<ReactorSubscriber<ReactorStates>>();
  private internalState: S;
  private internalActions: ReactorActionCreators<A>;
  private reducer: R;
  private plugins: ReactorPlugin[];

  constructor(state: S, reducer: R, plugins: ReactorPlugin[] = []) {
    this.internalState = state;
    this.reducer = reducer;
    this.plugins = plugins;

    this.internalActions = this.buildActions(this.buildDispatch());
  }

  private buildActions(dispatch: Dispatch) {
    const actions: Record<string, Unknown> = {};

    Object.entries(this.reducer).forEach(([type]) => {
      actions[type] = (payload: Action["payload"]) => {
        if (this.reducer[type]) dispatch({ type, payload });
      };
    });

    return actions as ReactorActionCreators<A>;
  }

  private buildDispatch(): Dispatch {
    const dispatch: Dispatch = action => {
      const newState = this.reducer[action.type](this.state, action);
      this.internalState = newState;
      this.subscribers.forEach(subscriber => subscriber(newState));
    };

    const chainedPlugin = this.chainPlugins(this.plugins);

    const hook = chainedPlugin({
      actions: this.buildActions(dispatch),
      getState: () => this.state,
    });

    return hook(dispatch);
  }

  private chainPlugins =
    (plugins: ReactorPlugin[]): ReactorPlugin =>
    store => {
      if (plugins.length === 0) return dispatch => dispatch;
      if (plugins.length === 1) return plugins[0](store);

      const boundPlugins = plugins.map(plugin => plugin(store));
      return boundPlugins.reduce((a, b) => next => a(b(next)));
    };

  get state() {
    return this.internalState;
  }

  get actions(): ReactorActionCreators<A> {
    return this.internalActions;
  }

  subscribe(subscriber: ReactorSubscriber<ReactorStates>) {
    this.subscribers.add(subscriber);

    return () => {
      this.subscribers.delete(subscriber);
    };
  }
}

export const createReactor = <
  S extends ReactorStates,
  A extends ReactorActions,
  R extends ReactorReducer<S, A> = ReactorReducer<S, A>,
  N extends string = string
>(props: {
  name: N;
  initialState: S;
  reducer: R;
  plugins?: ReactorPlugin[];
}) => {
  const { initialState, reducer, plugins } = props;

  const reactor = new Reactor<S, A, R>(initialState, reducer, plugins);

  return reactor;
};
