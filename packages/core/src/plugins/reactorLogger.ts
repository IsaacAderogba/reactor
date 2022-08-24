import { DeepPartial, ReactorPlugin } from "../types";

export interface ReactorLoggerProps {
  colors: {
    dispatch: string;
    nextState: string;
  };
}

export const reactorLogger = ({
  colors = {},
  ...props
}: DeepPartial<ReactorLoggerProps> = {}): ReactorPlugin => {
  const config: ReactorLoggerProps = {
    ...props,
    colors: { dispatch: "#03A9F4", nextState: "#4CAF50", ...colors },
  };

  const dispatchColor = `color: ${config.colors.dispatch}`;
  const nextStateColor = `color: ${config.colors.nextState}`;

  return ({ getState }) =>
    next =>
    action => {
      console.info("%cDispatching:", dispatchColor, action);
      const result = next(action);
      console.info("%cNext state: ", nextStateColor, getState());
      return result;
    };
};
