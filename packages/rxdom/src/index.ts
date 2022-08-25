import {
  Component,
  ComponentSpec,
  composeContext,
  composeFunction,
  RxComponent,
  NodeProps,
} from "@iatools/rxdom";
import { Reactor, CombinedReactor } from "@iatools/reactor-core";

type ComposedReactorState = ReactorContextProps;
interface ComposedReactorProps {
  reactor: ReactorType;
  Provider: (props?: ReactorContextProps & NodeProps) => RxComponent;
}

class ComposedReactorComponent extends Component<
  ComposedReactorState,
  ComposedReactorProps
> {
  constructor(spec: ComponentSpec) {
    super(spec);

    const { reactor } = this.props;
    this.state = { state: reactor.getState(), actions: reactor.actions };
  }

  onMount() {
    const unsubscribe = this.props.reactor.subscribe(state => {
      this.setState(prev => ({ ...prev, state }));
    });

    return unsubscribe;
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

const ComposedReactor = Component.compose(ComposedReactorComponent);

export const composeReactor = <R extends ReactorType = any>(
  reactor: R,
  ...[render, consumer]: Parameters<typeof composeContext>
) => {
  const [Provider, selector] = composeContext<ReactorContextProps<R>>(
    render,
    consumer
  );

  const WrappedComponent = composeFunction(
    ({ props: { key = "ComposedReactor", ...props } }) => {
      return ComposedReactor({ key, reactor, Provider, ...props });
    }
  );

  return [WrappedComponent, selector] as const;
};

export type ReactorContextProps<R extends ReactorType = any> = {
  state: ReturnType<R["getState"]>;
  actions: R["actions"];
};

export type ReactorType = Reactor | CombinedReactor;
