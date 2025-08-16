import { AuthedZeroProvider } from "./AuthedZeroProvider";
import { RestaurantConfigProvider } from "./contexts/restaurant-config";
import { Toaster } from "sonner";
import { SearchParamsToaster } from "./components/search-params-toaster";
import { Route, Switch } from "wouter";
import Index from "./routes";
import TablesPage from "./routes/tables/page";
import "./index.css";
import { NuqsAdapter } from "nuqs/adapters/react";
import PosLogin from "./routes/login/page";
import { StaffLogin } from "./routes/login/[id]/page";
import { TablesLayout } from "./routes/tables/layout";
import AdminLogin from "./routes/login/admin/page";

function Layout({ children }: React.PropsWithChildren) {
  return (
    <NuqsAdapter>
      <AuthedZeroProvider
        zeroCacheServer={DMNO_PUBLIC_CONFIG.ZERO_CACHE_SERVER}
        backendServer={DMNO_PUBLIC_CONFIG.BACKEND_BASE_URL}
      >
        <RestaurantConfigProvider>
          <main className="min-h-screen bg-gray-5 lg:flex items-center justify-center lg:p-4">
            {children}
          </main>
          <Toaster />
          <SearchParamsToaster />
        </RestaurantConfigProvider>
      </AuthedZeroProvider>
    </NuqsAdapter>
  );
}

export function App() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Index} />

        <Route path="/login" component={PosLogin} />
        <Route path="/login/admin" component={AdminLogin} />
        <Route path="/login/:id" component={StaffLogin} />
        <TablesLayout>
          <Route path="/tables" component={TablesPage} />
        </TablesLayout>

        {/* Default route in a switch */}
        <Route>404: No such page!</Route>
      </Switch>
    </Layout>
  );
}
