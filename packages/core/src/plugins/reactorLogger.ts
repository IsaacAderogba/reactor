import { ReactorPlugin } from "../types";

export interface ReactorLoggerProps {}

export const reactorLogger = (): ReactorPlugin => {
  return ({ getState }) =>
    next =>
    action => {
      console.info("before", getState());
      console.info("action", action);
      // actions.increment();
      const result = next(action);
      console.info("after", getState());
      return result;
    };
};
