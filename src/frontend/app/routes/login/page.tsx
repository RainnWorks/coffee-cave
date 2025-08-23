import { cn } from "../../lib/utils";
import { buttonVariants } from "../../components/ui/button";
import { Crown } from "lucide-react";
import {
  Page,
  PageContent,
  PageHeader,
  PageTitle,
} from "../../components/ui/page";
import { useTypedZero } from "../../lib/zero";
import { useQuery } from "@rocicorp/zero/react";
import { Link } from "wouter";

export default function PosLogin() {
  const z = useTypedZero();
  const [staff] = useQuery(z.query.staff);

  return (
    <Page className="w-full lg:max-w-lg lg:shadow-lg">
      <PageHeader className="bg-gray-100 border-b">
        <PageTitle className="text-2xl text-center flex items-center justify-center gap-4">
          <div>Select Staff Member</div>
          <Link href="/login/admin" className="block text-yellow-600">
            <Crown />
          </Link>
        </PageTitle>
      </PageHeader>
      <PageContent className="p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {staff ? (
            staff.map((staff) => (
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
              An error occurred while loading staff members.
            </div>
          )}
        </div>
      </PageContent>
    </Page>
  );
}
