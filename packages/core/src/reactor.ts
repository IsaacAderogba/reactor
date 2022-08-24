import {
  DispatchAction,
  Dispatch,
  ReactorActionCreators,
  ReactorActions,
  ReactorPlugin,
  ReactorReducer,
  ReactorStates,
  ReactorSubscriber,
  Unknown,
  Store,
} from "./types";

export class Reactor<
  S extends ReactorStates = Unknown,
  A extends ReactorActions = Unknown,
  R extends ReactorReducer = Unknown
> {
  private subscribers = new Set<ReactorSubscriber<ReactorStates>>();
  private internalState: S;
  private internalActions: ReactorActionCreators<A, Store<S, A>>;
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
      actions[type] = async (action: DispatchAction) => {
        if (typeof action === "function") {
          const payload = await action({ actions, getState: this.getState });
          dispatch({ type, payload });
        } else {
          dispatch({ type, payload: action });
        }
      };
    });

    return actions as ReactorActionCreators<A>;
  }

  private buildDispatch(): Dispatch {
    const dispatch: Dispatch = action => {
      const newState = this.reducer[action.type](this.getState(), action);
      this.internalState = newState;
      this.subscribers.forEach(subscriber => subscriber(newState));
    };

    const chainedPlugin = this.chainPlugins(this.plugins);

    const hook = chainedPlugin({
      actions: this.buildActions(dispatch),
      getState: this.getState,
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

  getState = () => this.internalState;

  get actions() {
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
  N extends string = string
>(props: {
  name: N;
  initialState: S;
  reducer: ReactorReducer<S, A>;
  plugins?: ReactorPlugin[];
}) => {
  const { initialState, reducer, plugins } = props;

  const reactor = new Reactor<S, A, ReactorReducer<S, A>>(
    initialState,
    reducer,
    plugins
  );

  return reactor;
};
