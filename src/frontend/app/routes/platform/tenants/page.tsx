import { useZeroAuth } from "@frontend/zero";
import { useQuery } from "@rocicorp/zero/react";
import {
  Building2,
  ChevronRight,
  LogOut,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import { DateTime } from "luxon";
import { Link } from "wouter";
import { Button } from "@/frontend/app/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/frontend/app/ui/card";
import { queries } from "@/queries";

export function TenantsPage() {
  const { email, displayName, logout } = useZeroAuth();

  // Use Zero query to fetch tenants with restaurant settings
  const [tenants, result] = useQuery(queries.platform.tenants());

  if(result.type === 'error') {
    return null;
  }


  // Calculate stats
  const isLoading = tenants === undefined;
  const tenantList = tenants ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Platform Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{email}</span>
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
            <p className="text-muted-foreground">
              Manage tenants and their configurations
            </p>
          </div>
          <Link href="/platform/tenants/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Tenant
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Tenants
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenantList.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenantList.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">—</div>
            </CardContent>
          </Card>
        </div>

        {/* Tenants List */}
        <Card>
          <CardHeader>
            <CardTitle>All Tenants</CardTitle>
            <CardDescription>
              All registered tenants in the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : tenantList.length === 0 ? (
              <div className="text-center py-10">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No tenants yet</h3>
                <p className="text-muted-foreground">
                  Get started by creating your first tenant.
                </p>
                <Link href="/platform/tenants/new">
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Tenant
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {tenantList.map((tenant) => (
                  <Link
                    key={tenant.id}
                    href={`/platform/tenants/${tenant.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{tenant.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {tenant.restaurantSettings?.name ??
                            "No restaurant configured"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm font-medium">—</div>
                        <div className="text-xs text-muted-foreground">
                          {tenant.createdAt
                            ? DateTime.fromMillis(tenant.createdAt).toRelative()
                            : "—"}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
