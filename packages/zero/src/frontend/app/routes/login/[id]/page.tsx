import {
  Page,
  PageContent,
  PageHeader,
  PageTitle,
} from "../../../components/ui/page";
import { Button } from "../../../components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PinLogin } from "./pin-login";
import { useSuspenseQuery, useTypedZero } from "../../../lib/zero";
import { Link, Redirect } from "wouter";
import { useQuery } from "@rocicorp/zero/react";

export function StaffLogin({ params }: { params: { id: string } }) {
  const z = useTypedZero();
  const [staff] = useQuery(
    z.query.staff.where("id", "=", params.id).one()
  );

  return !staff ? (
    <Redirect to="/login" />
  ) : (
    <Page className="w-full lg:max-w-lg">
      <PageHeader className="bg-gray-100 border-b">
        <PageTitle className="text-2xl text-center">Enter PIN</PageTitle>
      </PageHeader>
      <PageContent className="p-6">
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
            {staff ? (
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 mx-auto mb-2">
                  <span className="text-lg font-semibold">
                    {staff.firstName[0].toUpperCase() +
                      staff.lastName[0].toUpperCase()}
                  </span>
                </div>
                <p className="font-medium">
                  {staff.firstName} {staff.lastName}
                </p>
              </div>
            ) : null}
            <div className="w-16"></div> {/* Spacer for alignment */}
          </div>
          <PinLogin staffMember={staff} />
        </div>
      </PageContent>
    </Page>
  );
}
