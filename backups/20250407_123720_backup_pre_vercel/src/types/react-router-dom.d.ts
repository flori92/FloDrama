declare module 'react-router-dom' {
  import { ReactNode, FC } from 'react';

  export interface RouteProps {
    path?: string;
    element?: ReactNode;
    key?: string | number;
  }

  export interface BrowserRouterProps {
    basename?: string;
    children?: ReactNode;
  }

  export interface RoutesProps {
    children?: ReactNode;
    key?: string | number;
  }

  export const BrowserRouter: FC<BrowserRouterProps>;
  export const Routes: FC<RoutesProps>;
  export const Route: FC<RouteProps>;
  
  export interface LinkProps {
    to: string;
    replace?: boolean;
    state?: any;
    children?: ReactNode;
  }
  
  export const Link: FC<LinkProps>;
  
  export interface NavigateProps {
    to: string;
    replace?: boolean;
    state?: any;
  }
  
  export const Navigate: FC<NavigateProps>;
  
  export function useNavigate(): (to: string, options?: { replace?: boolean, state?: any }) => void;
  export function useParams<T extends Record<string, string | undefined>>(): T;
  export function useLocation(): { pathname: string, search: string, hash: string, state: any };
}
