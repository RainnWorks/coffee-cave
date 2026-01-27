import { useZeroAuth } from "@frontend/zero";
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  RefreshCw,
  Users,
} from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "wouter";
import { Button } from "@/frontend/app/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/frontend/app/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/frontend/app/ui/tabs";

interface TenantDetail {
  id: string;
  name: string;
  createdAt: number;
  staffCount: number;
  restaurantName: string | null;
  staff: Array<{
    id: string;
    firstName: string;
    lastName: string;
    staffCode: string;
    isAdmin: boolean;
  }>;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
const APP_DOMAIN = import.meta.env.VITE_APP_DOMAIN || "localhost:5173";

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getImpersonationToken } = useZeroAuth();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeToken, setIframeToken] = useState<string | null>(null);
  const [iframeLoading, setIframeLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (id) {
      fetchTenant(id);
    }
  }, [id]);

  const fetchTenant = async (tenantId: string) => {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/platform/tenants/${tenantId}`,
        {
          credentials: "include",
        },
      );
      if (res.ok) {
        const data = await res.json();
        setTenant(data.tenant);
      }
    } catch (err) {
      console.error("Failed to fetch tenant:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenInIframe = async () => {
    if (!id) return;
    setIframeLoading(true);

    const token = await getImpersonationToken(id);
    if (token) {
      setIframeToken(token);
    }
    setIframeLoading(false);
  };

  const handleOpenInNewTab = () => {
    if (!tenant) return;
    // In production, this would be the tenant's subdomain
    const tenantUrl = `http://${tenant.name.toLowerCase().replace(/\s+/g, "-")}.${APP_DOMAIN}`;
    window.open(tenantUrl, "_blank");
  };

  // Send auth token to iframe via postMessage
  useEffect(() => {
    if (iframeToken && iframeRef.current) {
      const iframe = iframeRef.current;
      const handleLoad = () => {
        iframe.contentWindow?.postMessage(
          { type: "PLATFORM_AUTH", token: iframeToken },
          "*", // In production, use specific origin
        );
      };
      iframe.addEventListener("load", handleLoad);
      return () => iframe.removeEventListener("load", handleLoad);
    }
  }, [iframeToken]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Tenant not found</h2>
          <Link href="/platform/tenants">
            <Button className="mt-4">Back to Tenants</Button>
          </Link>
        </div>
      </div>
    );
  }

  const tenantUrl = `http://${tenant.name.toLowerCase().replace(/\s+/g, "-")}.${APP_DOMAIN}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link
            href="/platform/tenants"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tenants
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Tenant Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {tenant.name}
              </h1>
              <p className="text-muted-foreground">
                {tenant.restaurantName ?? "No restaurant configured"} · Created{" "}
                {DateTime.fromMillis(tenant.createdAt).toRelative()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleOpenInNewTab}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open App
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="staff">Staff ({tenant.staffCount})</TabsTrigger>
            <TabsTrigger value="app">App View</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Tenant ID
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {tenant.id}
                  </code>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">App URL</CardTitle>
                </CardHeader>
                <CardContent>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {tenantUrl}
                  </code>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="staff">
            <Card>
              <CardHeader>
                <CardTitle>Staff Members</CardTitle>
                <CardDescription>
                  All staff members registered for this tenant
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tenant.staff.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No staff members yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {tenant.staff.map((staff) => (
                      <div
                        key={staff.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {staff.firstName[0]}
                              {staff.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">
                              {staff.firstName} {staff.lastName}
                              {staff.isAdmin && (
                                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                  Admin
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Code: {staff.staffCode}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="app">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Tenant App View</span>
                  {iframeToken ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenInIframe}
                      disabled={iframeLoading}
                    >
                      <RefreshCw
                        className={`mr-2 h-4 w-4 ${iframeLoading ? "animate-spin" : ""}`}
                      />
                      Refresh Session
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleOpenInIframe}
                      disabled={iframeLoading}
                    >
                      {iframeLoading
                        ? "Authenticating..."
                        : "Connect as Support"}
                    </Button>
                  )}
                </CardTitle>
                <CardDescription>
                  View and interact with the tenant's app as a support user
                </CardDescription>
              </CardHeader>
              <CardContent>
                {iframeToken ? (
                  <div
                    className="border rounded-lg overflow-hidden"
                    style={{ height: "600px" }}
                  >
                    <iframe
                      ref={iframeRef}
                      src={tenantUrl}
                      className="w-full h-full"
                      title={`${tenant.name} App`}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">
                      Connect to Tenant App
                    </h3>
                    <p className="text-muted-foreground max-w-md mt-2">
                      Click "Connect as Support" to authenticate and view the
                      tenant's app. You'll be able to help troubleshoot issues
                      or configure settings directly.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
