export type Unknown = any;
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type State<S = Unknown> = S;
export type ReactorStates = Record<string, State>;

export type Action<P = Unknown> = P;
export type ReactorActions = Record<string, Action>;

export type StoredAction<P = Unknown, S extends Store = Store> = (
  store: S
) => Promise<P> | P;

export type ActionCreator<
  A extends Action | StoredAction,
  S extends Store = Store
> = (
  ...args: A extends Action
    ? A extends never
      ? []
      : [payload: A | StoredAction<A, S>]
    : [resolver: StoredAction]
) => void;

export type ReactorActionCreators<
  A extends Record<string, Action | StoredAction>,
  S extends Store = Store
> = {
  [P in keyof A]: ActionCreator<A[P], S>;
};

export type Dispatch = (action: { type: string; payload: Action }) => void;

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
