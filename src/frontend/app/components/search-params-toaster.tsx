import { useEffect } from "react";
import { toast } from "sonner";
import { useSearchParams } from "wouter";

export const SearchParamsToaster = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const errorMessage = searchParams.get("error");
    if (errorMessage) {
      if (Array.isArray(errorMessage)) {
        for (const e of errorMessage) {
          toast.error(e);
        }
      } else {
        toast.error(errorMessage);
      }
    }
  }, [searchParams]);

  return null;
};
