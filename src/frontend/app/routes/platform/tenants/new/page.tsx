import { ArrowLeft, Building2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import { Button } from "@/frontend/app/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/frontend/app/ui/card";
import { Input } from "@/frontend/app/ui/input";
import { Label } from "@/frontend/app/ui/label";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export function CreateTenantPage() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tenant info
  const [tenantName, setTenantName] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");

  // Restaurant settings
  const [restaurantName, setRestaurantName] = useState("");
  const [currencyCode, setCurrencyCode] = useState("EUR");
  const [currencyLocale, setCurrencyLocale] = useState("en-GB");

  // Initial admin
  const [adminEmail, setAdminEmail] = useState("");
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminStaffCode, setAdminStaffCode] = useState("");
  const [adminPin, setAdminPin] = useState("");

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setTenantName(name);
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setTenantSlug(slug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/platform/tenants`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant: {
            name: tenantName,
            slug: tenantSlug,
          },
          restaurant: {
            name: restaurantName,
            currencyCode,
            currencyLocale,
          },
          admin: {
            email: adminEmail,
            firstName: adminFirstName,
            lastName: adminLastName,
            staffCode: adminStaffCode,
            pin: adminPin,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("Tenant created successfully!");
        setLocation(`/tenants/${data.tenant.id}`);
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to create tenant");
      }
    } catch (err) {
      console.error("Failed to create tenant:", err);
      toast.error("Failed to create tenant");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link
            href="/tenants"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tenants
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Tenant</h1>
          <p className="text-muted-foreground">
            Set up a new tenant with restaurant and initial admin
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tenant Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Tenant Information
              </CardTitle>
              <CardDescription>Basic tenant identification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tenantName">Tenant Name *</Label>
                  <Input
                    id="tenantName"
                    value={tenantName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="My Coffee Shop"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenantSlug">Subdomain *</Label>
                  <div className="flex">
                    <Input
                      id="tenantSlug"
                      value={tenantSlug}
                      onChange={(e) => setTenantSlug(e.target.value)}
                      placeholder="my-coffee-shop"
                      className="rounded-r-none"
                      required
                    />
                    <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-input bg-muted text-sm text-muted-foreground">
                      .domain.com
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Restaurant Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Settings</CardTitle>
              <CardDescription>
                Configure the restaurant for this tenant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="restaurantName">Restaurant Name *</Label>
                <Input
                  id="restaurantName"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="The Coffee Cave"
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currencyCode">Currency Code</Label>
                  <Input
                    id="currencyCode"
                    value={currencyCode}
                    onChange={(e) => setCurrencyCode(e.target.value)}
                    placeholder="EUR"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currencyLocale">Currency Locale</Label>
                  <Input
                    id="currencyLocale"
                    value={currencyLocale}
                    onChange={(e) => setCurrencyLocale(e.target.value)}
                    placeholder="en-GB"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Initial Admin */}
          <Card>
            <CardHeader>
              <CardTitle>Initial Admin</CardTitle>
              <CardDescription>
                Set up the first admin user for this tenant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="adminFirstName">First Name *</Label>
                  <Input
                    id="adminFirstName"
                    value={adminFirstName}
                    onChange={(e) => setAdminFirstName(e.target.value)}
                    placeholder="John"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminLastName">Last Name *</Label>
                  <Input
                    id="adminLastName"
                    value={adminLastName}
                    onChange={(e) => setAdminLastName(e.target.value)}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Email *</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="adminStaffCode">
                    Staff Code (3 digits) *
                  </Label>
                  <Input
                    id="adminStaffCode"
                    value={adminStaffCode}
                    onChange={(e) =>
                      setAdminStaffCode(
                        e.target.value.replace(/\D/g, "").slice(0, 3),
                      )
                    }
                    placeholder="001"
                    maxLength={3}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminPin">PIN (4-6 digits) *</Label>
                  <Input
                    id="adminPin"
                    type="password"
                    value={adminPin}
                    onChange={(e) =>
                      setAdminPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="••••"
                    maxLength={6}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link href="/tenants">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Tenant"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
