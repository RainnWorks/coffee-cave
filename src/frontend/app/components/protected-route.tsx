import { type ComponentProps, useMemo } from "react";
import {
  type DefaultParams,
  type PathPattern,
  Redirect,
  Route,
  type RouteProps,
} from "wouter";

export function ProtectedRoute<
  T extends DefaultParams | undefined = undefined,
  RoutePath extends PathPattern = PathPattern,
>({
  path,
  component: Component,
  isAllowed,
  redirectTo = "/login",
}: RouteProps<T, RoutePath> & {
  isAllowed: boolean;
  redirectTo?: string;
}) {
  const RedirectComponent = useMemo(
    () => () => <Redirect to={redirectTo} />,
    [redirectTo],
  );
  return (
    <Route path={path} component={isAllowed ? Component : RedirectComponent} />
  );
}
