export type Unknown = any;

export type Action<P = Unknown> = { type: string; payload: P };
export type ReactorActions = Record<string, Action>;

export type State<S = Unknown> = S;
export type ReactorStates = Record<string, State>;

export type ActionCreator<A extends Action> = (
  ...args: A["payload"] extends never ? [] : [payload: A["payload"]]
) => void;

export type ReactorActionCreators<A extends ReactorActions> = {
  [P in keyof A]: ActionCreator<A[P]>;
};

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

export type Dispatch = (action: Action) => void;

export type ReactorPlugin<
  S extends ReactorStates = Unknown,
  A extends ReactorActions = Unknown
> = (store: {
  actions: ReactorActionCreators<A>;
  getState: () => S;
}) => (dispatch: Dispatch) => Dispatch;

export type ReactorSelector<S extends ReactorStates, K = Unknown> = (
  state: S
) => K;
