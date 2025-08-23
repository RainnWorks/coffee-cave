import { useEffect } from "react";
import { toast } from "sonner";
import { useLocation, useSearchParams } from "wouter";

export const SearchParamsToaster = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const errorMessage = searchParams.get("error");
    if (errorMessage) {
      if (Array.isArray(errorMessage)) {
        errorMessage.forEach((e) => toast.error(e));
      } else {
        toast.error(errorMessage);
      }
    }
  }, [location, searchParams]);

  return null;
};
