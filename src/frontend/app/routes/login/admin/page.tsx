"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button, buttonVariants } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../../../AuthedZeroProvider";
import { cn } from "../../../lib/utils";
import { Link, useLocation } from "wouter";

export default function AdminLogin() {
  const { loginAdmin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsLoading(true);

    try {
      const response = await loginAdmin(email, password);

      if (!response.success) {
        throw new Error(response.error || "Login failed");
      }

      // Successful login - redirect to dashboard
      setLocation("/");
    } catch (err) {
      toast.error((err as Error).message || "An error occurred during login");
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="bg-gray-100 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1 relative">
            <Link
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "mr-4 absolute left-0 top-1/2 -translate-y-1/2"
              )}
              href={`/login`}
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <CardTitle className="text-2xl flex-1 text-center">
              Admin Login
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@coffeecave.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
