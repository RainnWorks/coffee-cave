import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import {
  getClient,
  isManifestError,
  type ManifestError,
} from "@/lib/manifest/client";
import { to } from "await-to-js";
import { Crown } from "lucide-react";

export type Staff = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
};

export async function PosLogin() {
  const [error, result] = await to(getClient().from("staff").find<Staff>());
  const resultType = result as ManifestError | typeof result;
  const errorMessage = isManifestError(resultType)
    ? resultType.message ?? resultType.error
    : error?.message;
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="bg-gray-100 border-b">
        <CardTitle className="text-2xl text-center flex items-center justify-center gap-4">
          <div>Select Staff Member</div>
          <Link href="/login/admin" className="block text-yellow-600">
            <Crown />
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {resultType && !isManifestError(resultType) ? (
            resultType.data.map((staff) => (
              <Link
                key={staff.id}
                href={`/login/${staff.id}`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-auto py-4 flex flex-col items-center justify-center gap-2 hover:bg-gray-100"
                )}
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-200">
                  <span className="text-lg font-semibold">
                    {staff.firstName[0].toUpperCase() +
                      staff.lastName[0].toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-center">
                  {staff.firstName} {staff.lastName}
                </span>
              </Link>
            ))
          ) : (
            <div className="text-center text-red-500 col-span-2 sm:col-span-3">
              {errorMessage}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <PosLogin />
    </main>
  );
}
