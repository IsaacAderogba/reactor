export type Unknown = any;

export type State<S = Unknown> = S;
export type ReactorStates = Record<string, State>;

export type Action<P = Unknown> = { type: string; payload: P };
export type AsyncAction<P = Unknown, S extends Store = Store> = (
  store: S
) => Promise<P> | P;

export type DispatchAction = Action | AsyncAction;
export type ReactorActions = Record<string, Action>;

export type ActionCreator<A extends DispatchAction, S extends Store = Store> = (
  ...args: A extends Action
    ? A["payload"] extends never
      ? []
      : [payload: A["payload"] | AsyncAction<A["payload"], S>]
    : [resolver: AsyncAction]
) => void;

export type ReactorActionCreators<
  A extends Record<string, DispatchAction>,
  S extends Store = Store
> = {
  [P in keyof A]: ActionCreator<A[P], S>;
};

export type Dispatch = (action: Action) => void;

export type Reducer<S extends State, A extends Action> = (
  state: S,
  action: A
) => S;

export type ReactorReducer<
  S extends ReactorStates = Unknown,
  A extends ReactorActions = Unknown
> = {
  [P in keyof A]: Reducer<S, A[P]>;
};

export type ReactorSubscriber<S extends ReactorStates> = (state: S) => void;

export type Store<
  S extends ReactorStates = Unknown,
  A extends ReactorActions = Unknown
> = {
  actions: ReactorActionCreators<A>;
  getState: () => S;
};

export type ReactorPlugin<
  S extends ReactorStates = Unknown,
  A extends ReactorActions = Unknown
> = (store: Store<S, A>) => (dispatch: Dispatch) => Dispatch;
