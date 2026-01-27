import { cn } from "@frontend/lib/utils";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { buttonVariants } from "@/frontend/app/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/frontend/app/ui/card";

export const PageError = ({
  backTo,
  errorMessage,
}: {
  backTo: string;
  errorMessage: string;
}) => {
  return (
    <Card className="w-full max-w-6xl shadow-lg">
      <CardHeader className="border-b bg-gray-100">
        <div className="flex items-center">
          <Link
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "mr-4",
            )}
            href={backTo}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <CardTitle className="text-2xl">Error loading tab</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6 text-center">
        <p className="text-gray-500 mb-4">{errorMessage}</p>
        <Link className={cn(buttonVariants())} href={backTo}>
          Return
        </Link>
      </CardContent>
    </Card>
  );
};
