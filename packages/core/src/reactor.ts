import {
  Dispatch,
  ReactorActionCreators,
  ReactorActions,
  ReactorPlugin,
  ReactorReducer,
  ReactorStates,
  ReactorSubscriber,
  Unknown,
  Store,
  Action,
  StoredAction,
} from "./types";

abstract class BaseReactor<S, A> {
  protected subscribers = new Set<ReactorSubscriber<S>>();

  subscribe(subscriber: ReactorSubscriber<S>) {
    this.subscribers.add(subscriber);

    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  abstract getState(): S;
  abstract get actions(): A;
}

export class Reactor<
  S extends ReactorStates = Unknown,
  A extends ReactorActionCreators = Unknown,
  R extends ReactorReducer = Unknown
> extends BaseReactor<S, A> {
  private internalState: S;
  public readonly reducers: R;
  public readonly actions: A;

  constructor(state: S, reducers: R) {
    super();
    this.internalState = state;
    this.reducers = reducers;

    this.actions = this.buildActions(this.dispatch);
  }

  // @internal
  buildActions(dispatch: Dispatch) {
    const actions: Record<string, Unknown> = {};

    Object.entries(this.reducers).forEach(([type]) => {
      if (!this.reducers[type]) return;

      actions[type] = async (action: Action | StoredAction) => {
        if (typeof action === "function") {
          const payload = await action({ actions, getState: this.getState });
          dispatch({ type, payload });
        } else {
          dispatch({ type, payload: action });
        }
      };
    });

    return actions as A;
  }

  private dispatch: Dispatch = action => {
    const { type, payload } = action;
    const newState = this.reducers[type](this.getState(), payload);
    this.setState(newState);
  };

  // @internal
  setState = (state: S) => {
    this.internalState = state;
    this.subscribers.forEach(subscriber => subscriber(state));
  };

  getState = (): S => this.internalState;
}

export const createReactor = <
  S extends ReactorStates,
  A extends ReactorActions
>(props: {
  initialState: S;
  reducers: ReactorReducer<S, A>;
}) => {
  const { initialState, reducers } = props;

  const reactor = new Reactor<
    S,
    ReactorActionCreators<A, Store<S, A>>,
    ReactorReducer<S, A>
  >(initialState, reducers);

  return reactor;
};

class CombinedReactor<
  S extends CombinedReactorState = Unknown,
  A extends CombinedReactorActions = Unknown,
  R extends Reactors = Unknown
> extends BaseReactor<S, A> {
  private plugins: ReactorPlugin[];
  public readonly reactors: R;
  public readonly actions: A;

  constructor(reactors: R, plugins: ReactorPlugin[] = []) {
    super();
    this.reactors = reactors;
    this.plugins = plugins;

    this.actions = this.buildActions(this.buildDispatch());
  }

  private buildActions(dispatch: Dispatch): A {
    const actions: Record<string, Unknown> = {};
    Object.entries(this.reactors).forEach(([key, reactor]) => {
      actions[key] = reactor.buildActions(dispatch);
    });

    return actions as A;
  }

  private buildDispatch(): Dispatch {
    const dispatch: Dispatch = action => {
      const { type, payload } = action;

      Object.values(this.reactors).forEach(reactor => {
        if (!reactor.reducers[type]) return;

        const prevState = reactor.getState();
        const newState = reactor.reducers[type](prevState, payload);
        reactor.setState(newState);
        this.subscribers.forEach(subscriber => subscriber(this.getState()));
      });
    };

    return dispatch;
  }

  // private buildDispatch(): Dispatch {
  //   const dispatch: Dispatch = action => {
  //     const { type, payload } = action;
  //     const newState = this.reducer[type](this.getState(), payload);
  //     this.internalState = newState;
  //     this.subscribers.forEach(subscriber => subscriber(newState));
  //   };

  //   const chainedPlugin = this.chainPlugins(this.plugins);

  //   const hook = chainedPlugin({
  //     actions: this.buildActions(dispatch),
  //     getState: this.getState,
  //   });

  //   return hook(dispatch);
  // }

  // private chainPlugins =
  //   (plugins: ReactorPlugin[]): ReactorPlugin =>
  //   store => {
  //     if (plugins.length === 0) return dispatch => dispatch;
  //     if (plugins.length === 1) return plugins[0](store);

  //     const boundPlugins = plugins.map(plugin => plugin(store));
  //     return boundPlugins.reduce((a, b) => next => a(b(next)));
  //   };

  getState = (): S => {
    const state: Record<string, Unknown> = {};
    Object.entries(this.reactors).forEach(([key, reactor]) => {
      state[key] = reactor.getState();
    });

    return state as S;
  };
}

export const combineReactors = <R extends Reactors>(props: {
  reactors: R;
  plugins?: ReactorPlugin[];
}) => {
  const { reactors, plugins } = props;
  return new CombinedReactor<
    CombinedReactorState<R>,
    CombinedReactorActions<R>,
    R
  >(reactors, plugins);
};

type Reactors = Record<string, Reactor>;

type CombinedReactorState<R extends Reactors = Unknown> = {
  [P in keyof R]: ReturnType<R[P]["getState"]>;
};

type CombinedReactorActions<R extends Reactors = Unknown> = {
  [P in keyof R]: R[P]["actions"];
};
