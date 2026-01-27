import { Toaster } from "sonner";
import { useEffect } from "react";
import {
  type DefaultParams,
  type PathPattern,
  Route,
  type RouteProps,
  Switch,
  useLocation,
} from "wouter";
import { DevModeSwitcher } from "./components/dev-mode-switcher";
import { SearchParamsToaster } from "./components/search-params-toaster";
import { RestaurantConfigProvider } from "./contexts/restaurant-config";
import { RouterModeProvider, useRouterMode } from "./contexts/router-mode";
import { useZeroAuth, ZeroAuthProvider } from "./zero";
import "./index.css";
import { ProtectedRoute } from "./components/protected-route";
import { NuqsWouterAdapter } from "./lib/nuqs-adapter";
// Platform routes (root: coffeecave.app)
import LoginPage from "./routes/platform/login/page";
import LogoutPage from "./routes/platform/logout/page";
import SelectTenantPage from "./routes/platform/select-tenant/page";
import { TenantDetailPage } from "./routes/platform/tenants/[id]/page";
import { CreateTenantPage } from "./routes/platform/tenants/new/page";
import { TenantsPage } from "./routes/platform/tenants/page";
import KitchenView from "./routes/tenant/kitchen/page";
// Tenant routes (subdomain: tenant.coffeecave.app)
import { TenantStaffLogin } from "./routes/tenant/login/page";
import { NewTableForm } from "./routes/tenant/tables/[tableId]/new/page";
import TableDetailView from "./routes/tenant/tables/[tableId]/page";
import { PaymentView } from "./routes/tenant/tables/[tableId]/payment/page";
import { AddItemsPage } from "./routes/tenant/tables/[tableId]/tabs/[tabId]/add-items/page";
import TablesPage from "./routes/tenant/tables/page";

// ─────────────────────────────────────────────────────────────
// Protected Route Helpers
// ─────────────────────────────────────────────────────────────

const TenantProtectedRoute = <
  T extends DefaultParams | undefined = undefined,
  RoutePath extends PathPattern = PathPattern,
>(
  props: RouteProps<T, RoutePath>,
) => {
  const { isLoggedIn, scopeKind } = useZeroAuth();
  return (
    <ProtectedRoute
      path={props.path}
      component={props.component}
      isAllowed={isLoggedIn && scopeKind === "tenant"}
      redirectTo="/login"
    />
  );
};

const PlatformProtectedRoute = <
  T extends DefaultParams | undefined = undefined,
  RoutePath extends PathPattern = PathPattern,
>(
  props: RouteProps<T, RoutePath>,
) => {
  const { isLoggedIn, scopeKind } = useZeroAuth();
  return (
    <ProtectedRoute
      path={props.path}
      component={props.component}
      isAllowed={isLoggedIn && scopeKind === "platform"}
      redirectTo="/login"
    />
  );
};

// ─────────────────────────────────────────────────────────────
// Tenant Router (for subdomain: tenant.coffeecave.app)
// ─────────────────────────────────────────────────────────────

function TenantIndex() {
  const { isLoggedIn } = useZeroAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation(isLoggedIn ? "/tables" : "/login");
  }, [isLoggedIn, setLocation]);

  return null;
}

function TenantRouter() {
  return (
    <RestaurantConfigProvider>
      <Switch>
        <Route path="/" component={TenantIndex} />
        <Route path="/login" component={TenantStaffLogin} />

        {/* Tenant app routes */}
        <TenantProtectedRoute path="/kitchen" component={KitchenView} />
        <TenantProtectedRoute path="/tables" component={TablesPage} />
        <TenantProtectedRoute path="/tables/new" component={NewTableForm} />
        <TenantProtectedRoute
          path="/tables/:tableId"
          component={TableDetailView}
        />
        <TenantProtectedRoute
          path="/tables/:tableId/payment"
          component={PaymentView}
        />
        <TenantProtectedRoute
          path="/tables/:tableId/tabs/:tabId/add-items"
          component={AddItemsPage}
        />

        <Route>404: Page not found</Route>
      </Switch>
    </RestaurantConfigProvider>
  );
}

// ─────────────────────────────────────────────────────────────
// Platform Router (for root: coffeecave.app)
// ─────────────────────────────────────────────────────────────

function PlatformIndex() {
  const { isLoggedIn, availableGrants } = useZeroAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoggedIn && availableGrants.length > 0) {
      setLocation("/select-tenant");
    } else if (!isLoggedIn) {
      setLocation("/login");
    }
  }, [isLoggedIn, availableGrants, setLocation]);

  return null;
}

function PlatformRouter() {
  return (
    <Switch>
      <Route path="/" component={PlatformIndex} />
      <Route path="/login" component={LoginPage} />
      <Route path="/select-tenant" component={SelectTenantPage} />

      {/* Platform admin routes */}
      <PlatformProtectedRoute path="/platform" component={TenantsPage} />
      <PlatformProtectedRoute
        path="/platform/tenants"
        component={TenantsPage}
      />
      <PlatformProtectedRoute
        path="/platform/tenants/new"
        component={CreateTenantPage}
      />
      <PlatformProtectedRoute
        path="/platform/tenants/:id"
        component={TenantDetailPage}
      />

      <Route>404: Page not found</Route>
    </Switch>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Router (selects based on mode)
// ─────────────────────────────────────────────────────────────

function AppRouter() {
  const { mode } = useRouterMode();

  return (
    <Switch>
      <Route path="/logout" component={LogoutPage} />
      <Route>{mode === "tenant" ? <TenantRouter /> : <PlatformRouter />}</Route>
    </Switch>
  );
}

function AppWithAuth() {
  const { mode, tenantSlug } = useRouterMode();

  return (
    <ZeroAuthProvider
      zeroCacheServer={DMNO_PUBLIC_CONFIG.ZERO_CACHE_SERVER}
      backendServer={DMNO_PUBLIC_CONFIG.BACKEND_BASE_URL}
      routerMode={mode}
      devTenantSlug={tenantSlug}
    >
      <main className="min-h-screen bg-gray-5 lg:flex items-center justify-center lg:p-4">
        <AppRouter />
      </main>
      <Toaster />
      <SearchParamsToaster />
      <DevModeSwitcher />
    </ZeroAuthProvider>
  );
}

export function App() {
  return (
    <NuqsWouterAdapter>
      <RouterModeProvider>
        <AppWithAuth />
      </RouterModeProvider>
    </NuqsWouterAdapter>
  );
}
