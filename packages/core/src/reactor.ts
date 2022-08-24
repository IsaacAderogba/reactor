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

abstract class BaseReactor {}

export class Reactor<
  S extends ReactorStates = Unknown,
  A extends ReactorActions = Unknown,
  R extends ReactorReducer = Unknown
> {
  private subscribers = new Set<ReactorSubscriber<S>>();
  private internalState: S;
  private internalActions: ReactorActionCreators<A, Store<S, A>>;
  public reducer: R;

  constructor(state: S, reducer: R) {
    this.internalState = state;
    this.reducer = reducer;

    this.internalActions = this.buildActions(this.dispatch);
  }

  buildActions(dispatch: Dispatch) {
    const actions: Record<string, Unknown> = {};

    Object.entries(this.reducer).forEach(([type]) => {
      if (!this.reducer[type]) return;

      actions[type] = async (action: Action | StoredAction) => {
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

  private dispatch: Dispatch = action => {
    const { type, payload } = action;
    const newState = this.reducer[type](this.getState(), payload);
    this.setState(newState);
  };

  setState = (state: S) => {
    this.internalState = state;
    this.subscribers.forEach(subscriber => subscriber(state));
  };

  getState = (): S => this.internalState;

  get actions() {
    return this.internalActions;
  }

  subscribe(subscriber: ReactorSubscriber<S>) {
    this.subscribers.add(subscriber);

    return () => {
      this.subscribers.delete(subscriber);
    };
  }
}

export const createReactor = <
  S extends ReactorStates,
  A extends ReactorActions
>(props: {
  initialState: S;
  reducer: ReactorReducer<S, A>;
}) => {
  const { initialState, reducer } = props;

  const reactor = new Reactor<S, A, ReactorReducer<S, A>>(
    initialState,
    reducer
  );

  return reactor;
};

class CombinedReactor<
  R extends Reactors = Unknown,
  S extends CombinedReactorState = Unknown,
  A extends CombinedReactorActions = Unknown
> {
  private subscribers = new Set<ReactorSubscriber<S>>();
  private reactors: R;
  private internalActions: A;
  private plugins: ReactorPlugin[];

  constructor(reactors: R, plugins: ReactorPlugin[] = []) {
    this.reactors = reactors;
    this.plugins = plugins;

    this.internalActions = this.buildActions();
  }

  private buildActions(): A {
    const dispatch = this.buildDispatch();

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
        if (!reactor.reducer[type]) return;

        const prevState = reactor.getState();
        const newState = reactor.reducer[type](prevState, payload);
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

  get actions(): A {
    return this.internalActions;
  }

  subscribe(subscriber: ReactorSubscriber<S>) {
    this.subscribers.add(subscriber);

    return () => {
      this.subscribers.delete(subscriber);
    };
  }
}

export const combineReactors = <R extends Reactors>(props: {
  reactors: R;
  plugins?: ReactorPlugin[];
}) => {
  const { reactors, plugins } = props;
  return new CombinedReactor<
    R,
    CombinedReactorState<R>,
    CombinedReactorActions<R>
  >(reactors, plugins);
};

type Reactors = Record<string, Reactor>;

type CombinedReactorState<R extends Reactors = Unknown> = {
  [P in keyof R]: ReturnType<R[P]["getState"]>;
};

type CombinedReactorActions<R extends Reactors = Unknown> = {
  [P in keyof R]: R[P]["actions"];
};
