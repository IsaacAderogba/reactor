import {
  Component,
  ComponentSpec,
  composeContext,
  composeFunction,
  RxComponent,
  NodeProps,
} from "@iatools/rxdom";
import { Reactor, CombinedReactor } from "@iatools/reactor-core";

type ReactorProviderState = ReactorContextProps;
interface ReactorProviderProps {
  reactor: ReactorType;
  Provider: (props?: NodeProps<ReactorContextProps>) => RxComponent;
}

class ReactorProviderComponent extends Component<
  ReactorProviderState,
  ReactorProviderProps
> {
  unsubscribe: () => void;
  
  constructor(spec: ComponentSpec) {
    super(spec);

    const { reactor } = this.props;
    this.state = { state: reactor.getState(), actions: reactor.actions };

    this.unsubscribe = this.props.reactor.subscribe(state => {
      this.setState(prev => ({ ...prev, state }));
    });
  }

  onMount() {
    return this.unsubscribe;
  }

  render() {
    const { Provider, content } = this.props;

    return Provider({
      actions: this.state.actions,
      state: this.state.state,
      content,
    });
  }
}

const ReactorProvider = Component.compose(ReactorProviderComponent);

export const composeReactor = <R extends ReactorType>(
  ...[render, consumer]: Parameters<typeof composeContext>
) => {
  const [Provider, selector] = composeContext<ReactorContextProps<R>>(
    render,
    consumer
  );

  const WrappedProvider = composeFunction<{ reactor: R }>(
    ({ props: { key = "ReactorProvider", ...props } }) => {
      return ReactorProvider({ key, Provider, ...props });
    }
  );

  return [WrappedProvider, selector] as const;
};

export type ReactorContextProps<R extends ReactorType = Unknown> = {
  state: ReturnType<R["getState"]>;
  actions: R["actions"];
};

type ReactorType = Reactor | CombinedReactor;
type Unknown = any;
