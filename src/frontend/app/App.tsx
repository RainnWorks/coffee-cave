import { AuthedZeroProvider, useAuth } from "./AuthedZeroProvider";
import { RestaurantConfigProvider } from "./contexts/restaurant-config";
import { Toaster } from "sonner";
import { SearchParamsToaster } from "./components/search-params-toaster";
import {
  Redirect,
  Route,
  Switch,
  type DefaultParams,
  type PathPattern,
  type RouteProps,
} from "wouter";
import Index from "./routes";
import TablesPage from "./routes/tables/page";
import "./index.css";
import PosLogin from "./routes/login/page";
import { StaffLogin } from "./routes/login/[id]/page";
import { TablesLayout } from "./routes/tables/layout";
import AdminLogin from "./routes/login/admin/page";
import TableDetailView from "./routes/tables/[tableId]/page";
import { NuqsWouterAdapter } from "./lib/nuqs-adapter";
import { AddItemsPage } from "./routes/tables/[tableId]/tabs/[tabId]/add-items/page";
import { NewTableForm } from "./routes/tables/[tableId]/new/page";
import { ProtectedRoute } from "./components/protected-route";
import { PaymentView } from "./routes/tables/[tableId]/payment/page";
import KitchenView from "./routes/kitchen/page";

const AuthProtectedRoute = <
  T extends DefaultParams | undefined = undefined,
  RoutePath extends PathPattern = PathPattern,
>(
  props: RouteProps<T, RoutePath>
) => {
  const { isLoggedIn } = useAuth();
  return (
    <ProtectedRoute
      path={props.path}
      component={props.component}
      isAllowed={isLoggedIn}
      redirectTo="/login"
    />
  );
};

export function Routes() {
  return (
    <Switch>
      <Route path="/" component={Index} />

      <Route path="/login" component={PosLogin} />
      <Route path="/login/admin" component={AdminLogin} />
      <Route path="/login/:id" component={StaffLogin} />
      <AuthProtectedRoute path="/kitchen" component={KitchenView} />
      <AuthProtectedRoute path="/tables" component={TablesPage} />
      <AuthProtectedRoute path="/tables/new" component={NewTableForm} />
      <AuthProtectedRoute path="/tables/:tableId" component={TableDetailView} />
      <AuthProtectedRoute
        path="/tables/:tableId/payment"
        component={PaymentView}
      />
      <AuthProtectedRoute
        path="/tables/:tableId/tabs/:tabId/add-items"
        component={AddItemsPage}
      />

      {/* Default route in a switch */}
      <Route>404: No such page!</Route>
    </Switch>
  );
}

export function App() {
  return (
    <NuqsWouterAdapter>
      <AuthedZeroProvider
        zeroCacheServer={DMNO_PUBLIC_CONFIG.ZERO_CACHE_SERVER}
        backendServer={DMNO_PUBLIC_CONFIG.BACKEND_BASE_URL}
      >
        <RestaurantConfigProvider>
          <main className="min-h-screen bg-gray-5 lg:flex items-center justify-center lg:p-4">
            <Routes />
          </main>
          <Toaster />
          <SearchParamsToaster />
        </RestaurantConfigProvider>
      </AuthedZeroProvider>
    </NuqsWouterAdapter>
  );
}
