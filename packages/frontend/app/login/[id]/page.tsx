import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  getClient,
  isManifestError,
  ManifestError,
} from "@/lib/manifest/client";
import type { Staff } from "../page";
import { PinLogin } from "./pin-login";
import { redirect } from "next/navigation";
import { to } from "await-to-js";

export default async function PosLogin({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const { id } = await params;
  const [error, result] = await to(
    getClient().from("staff").findOneById<Staff | ManifestError>(id)
  );

  if (error) {
    console.error(error);
    return redirect("/login?error=" + encodeURIComponent(error.message));
  }

  if (isManifestError(result)) {
    console.error(result);
    return redirect("/login?error=" + encodeURIComponent(result.message ?? result.error));
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="bg-gray-100 border-b">
          <CardTitle className="text-2xl text-center">Enter PIN</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Back to staff selection"
                  className="flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              {result ? (
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 mx-auto mb-2">
                    <span className="text-lg font-semibold">
                      {result.firstName[0].toUpperCase() +
                        result.lastName[0].toUpperCase()}
                    </span>
                  </div>
                  <p className="font-medium">
                    {result.firstName} {result.lastName}
                  </p>
                </div>
              ) : null}
              <div className="w-16"></div> {/* Spacer for alignment */}
            </div>
            <PinLogin staffMember={result} />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
