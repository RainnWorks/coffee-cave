"use client";

import { type RoleGrant, useZeroAuth } from "@frontend/zero";
import { Building2, ChevronRight, LogOut, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/frontend/app/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/frontend/app/ui/card";

export default function SelectTenantPage() {
  const { isLoggedIn, displayName, email, availableGrants, logout } =
    useZeroAuth();
  const [, setLocation] = useLocation();

  // If not logged in, redirect to login
  if (!isLoggedIn) {
    setLocation("/login");
    return null;
  }

  // Group grants by scope kind
  const tenantGrants = availableGrants.filter((g) => g.scopeKind === "tenant");
  const platformGrants = availableGrants.filter(
    (g) => g.scopeKind === "platform",
  );
  const hasPlatformAccess = platformGrants.length > 0;

  // If only one tenant grant and no platform access, redirect directly
  if (tenantGrants.length === 1 && !hasPlatformAccess) {
    const grant = tenantGrants[0];
    // Redirect to tenant subdomain
    window.location.href = `https://${grant.tenantId}.coffeecave.app`;
    return null;
  }

  const handleTenantSelect = (grant: Pick<RoleGrant, "tenantId">) => {
    // Redirect to tenant subdomain - the cookie will auto-login them
    window.location.href = `https://${grant.tenantId}.coffeecave.app`;
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Coffee Cave</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium">{displayName}</div>
              <div className="text-xs text-muted-foreground">{email}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {displayName?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground">
            Select a restaurant to continue
          </p>
        </div>

        {/* Tenant List */}
        {tenantGrants.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Restaurants</CardTitle>
              <CardDescription>Select a restaurant to manage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tenantGrants.map((grant) => (
                  <button
                    key={grant.id}
                    onClick={() => handleTenantSelect(grant)}
                    className="w-full flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{grant.tenantId}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {grant.role}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Platform Admin Section */}
        {hasPlatformAccess && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Platform Administration
              </CardTitle>
              <CardDescription>
                Manage tenants and platform settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/platform/tenants">
                <Button className="w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Open Platform Admin
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* No tenants message */}
        {tenantGrants.length === 0 && !hasPlatformAccess && (
          <Card>
            <CardContent className="py-10 text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                No restaurants assigned
              </h3>
              <p className="text-muted-foreground mt-2">
                You don't have access to any restaurants yet. Contact your
                administrator.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
