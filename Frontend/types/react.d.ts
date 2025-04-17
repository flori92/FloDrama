// Définir le namespace React avant de l'utiliser
namespace React {
  export interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: Key | null;
  }

  export type Key = string | number;

  export type ReactNode = ReactElement | ReactFragment | string | number | boolean | null | undefined | ReactNode[];

  export interface ReactFragment {
    children?: ReactNode;
  }

  export type JSXElementConstructor<P> = ((props: P) => ReactElement<any, any> | null) | (new (props: P) => Component<any, any>);

  export interface Component<P = {}, S = {}> {
    constructor(props: P);
    readonly props: Readonly<P>;
    state: Readonly<S>;
    setState(state: S | ((prevState: S, props: P) => S)): void;
    render(): ReactElement<any, any> | null;
  }

  export interface FC<P = {}> {
    (props: P): ReactElement<any, any> | null;
    displayName?: string;
  }

  export interface FunctionComponent<P = {}> {
    (props: P): ReactElement<any, any> | null;
    displayName?: string;
  }

  export function createElement<P extends {}>(
    type: string | JSXElementConstructor<P>,
    props?: P | null,
    ...children: ReactNode[]
  ): ReactElement<P>;

  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];

  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;

  export function useRef<T>(initialValue: T | null): RefObject<T>;

  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;

  export const Fragment: JSXElementConstructor<{ children?: ReactNode }>;

  export namespace JSX {
    // @ts-ignore - Ces interfaces sont utilisées par le compilateur TypeScript
    // Cette interface est utilisée pour représenter un élément JSX
    interface Element extends ReactElement<any, any> {}
    // @ts-ignore - Ces interfaces sont utilisées par le compilateur TypeScript
    // Cette interface est utilisée pour représenter une classe de composant JSX
    interface ElementClass extends Component<any> {}
    // @ts-ignore - Ces interfaces sont utilisées par le compilateur TypeScript
    // Cette interface est utilisée pour représenter les attributs d'un élément JSX
    interface ElementAttributesProperty { props: {}; }
    // @ts-ignore - Ces interfaces sont utilisées par le compilateur TypeScript
    // Cette interface est utilisée pour représenter les enfants d'un élément JSX
    interface ElementChildrenAttribute { children: {}; }

    // @ts-ignore - Cette interface est utilisée par le compilateur TypeScript
    // Cette interface est utilisée pour représenter les éléments JSX intrinsèques
    interface IntrinsicElements {
      div: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      span: DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
      p: DetailedHTMLProps<HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>;
      h1: DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h2: DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h3: DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      img: DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;
      video: DetailedHTMLProps<VideoHTMLAttributes<HTMLVideoElement>, HTMLVideoElement>;
      button: DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
      input: DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
      h4: any;
      h5: any;
      h6: any;
      header: any;
      [elemName: string]: any;
    }
  }

  interface CSSProperties {
    [key: string]: string | number | undefined;
  }

  // @ts-ignore - Ce type générique est utilisé par le compilateur TypeScript
  // Ce type est utilisé pour représenter les attributs DOM génériques
  interface DOMAttributes<T> {
    children?: ReactNode;
    dangerouslySetInnerHTML?: {
      __html: string;
    };
    suppressContentEditableWarning?: boolean;
    suppressHydrationWarning?: boolean;
    onClick?: (event: MouseEvent) => void;
    onMouseEnter?: (event: MouseEvent) => void;
    onMouseLeave?: (event: MouseEvent) => void;
  }

  interface AriaAttributes {
    'aria-activedescendant'?: string;
    'aria-atomic'?: boolean | 'false' | 'true';
    'aria-autocomplete'?: 'none' | 'inline' | 'list' | 'both';
    'aria-busy'?: boolean | 'false' | 'true';
    'aria-checked'?: boolean | 'false' | 'mixed' | 'true';
    'aria-colcount'?: number;
    'aria-colindex'?: number;
    'aria-colspan'?: number;
    'aria-controls'?: string;
    'aria-current'?: boolean | 'false' | 'true' | 'page' | 'step' | 'location' | 'date' | 'time';
    'aria-describedby'?: string;
    'aria-details'?: string;
    'aria-disabled'?: boolean | 'false' | 'true';
    'aria-dropeffect'?: 'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup';
    'aria-errormessage'?: string;
    'aria-expanded'?: boolean | 'false' | 'true';
    'aria-flowto'?: string;
    'aria-grabbed'?: boolean | 'false' | 'true';
    'aria-haspopup'?: boolean | 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
    'aria-hidden'?: boolean | 'false' | 'true';
    'aria-invalid'?: boolean | 'false' | 'true' | 'grammar' | 'spelling';
    'aria-keyshortcuts'?: string;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-level'?: number;
    'aria-live'?: 'off' | 'assertive' | 'polite';
    'aria-modal'?: boolean | 'false' | 'true';
    'aria-multiline'?: boolean | 'false' | 'true';
    'aria-multiselectable'?: boolean | 'false' | 'true';
    'aria-orientation'?: 'horizontal' | 'vertical';
    'aria-owns'?: string;
    'aria-placeholder'?: string;
    'aria-pressed'?: boolean | 'false' | 'mixed' | 'true';
    'aria-readonly'?: boolean | 'false' | 'true';
    'aria-relevant'?: 'additions' | 'all' | 'removals' | 'text';
    'aria-required'?: boolean | 'false' | 'true';
    'aria-roledescription'?: string;
    'aria-rowcount'?: number;
    'aria-rowindex'?: number;
    'aria-rowspan'?: number;
    'aria-selected'?: boolean | 'false' | 'true';
    'aria-setsize'?: number;
    'aria-sort'?: 'none' | 'ascending' | 'descending' | 'other';
    'aria-valuemax'?: number;
    'aria-valuemin'?: number;
    'aria-valuenow'?: number;
    'aria-valuetext'?: string;
  }

  // @ts-ignore - Ce type générique est utilisé par le compilateur TypeScript
  // Ce type est utilisé pour représenter les props HTML génériques
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    className?: string;
    style?: CSSProperties;
    'data-testid'?: string;
    onClick?: (event: MouseEvent) => void;
    onMouseEnter?: (event: MouseEvent) => void;
    onMouseLeave?: (event: MouseEvent) => void;
    [key: string]: any;
  }

  // @ts-ignore - Ce type générique est utilisé par le compilateur TypeScript
  // Ce type est utilisé pour représenter les props HTML détaillées
  interface DetailedHTMLProps<E, T> {
    // E est utilisé comme type pour les attributs HTML
    // T est utilisé comme type pour l'élément HTML
  }

  // @ts-ignore - Ce type est utilisé par le compilateur TypeScript
  // Ce type est utilisé pour représenter les props HTML génériques
  interface HTMLProps<T> {
    // Type utilisé pour les props HTML génériques
  }

  interface VideoHTMLAttributes<T> extends HTMLAttributes<T> {
    src?: string;
    poster?: string;
    autoPlay?: boolean;
    controls?: boolean;
    onPlay?: (event: SyntheticEvent) => void;
    onPause?: (event: SyntheticEvent) => void;
    onEnded?: (event: SyntheticEvent) => void;
    onError?: (event: SyntheticEvent) => void;
    onTimeUpdate?: (event: SyntheticEvent) => void;
    onDurationChange?: (event: SyntheticEvent) => void;
    onProgress?: (event: SyntheticEvent) => void;
  }

  interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
    src?: string;
    alt?: string;
  }

  interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
  }

  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    // @ts-ignore - T est utilisé comme paramètre de type générique pour l'élément HTML
    type?: string;
    value?: string | number | readonly string[];
    placeholder?: string;
    onChange?: (event: SyntheticEvent) => void;
  }

  interface SyntheticEvent {
    currentTarget: Element;
    target: EventTarget;
    preventDefault(): void;
    stopPropagation(): void;
    type: string;
  }

  interface Event {
    currentTarget: EventTarget;
  }

  interface EventTarget {
    error?: { message?: string };
  }

  interface MouseEvent extends Event {
    preventDefault(): void;
  }

  interface RefObject<T> {
    readonly current: T | null;
  }
}

declare module 'react' {
  export = React;
  export as namespace React;
}

declare module 'react/jsx-runtime' {
  export namespace JSX {
    interface Element extends React.ReactElement<any, any> { }
    interface ElementClass extends React.Component<any> { }
    interface ElementAttributesProperty { props: {}; }
    interface ElementChildrenAttribute { children: {}; }
    interface IntrinsicElements extends React.JSX.IntrinsicElements { }
  }
  export function jsx(type: any, props: any): JSX.Element;
  export function jsxs(type: any, props: any): JSX.Element;
}
