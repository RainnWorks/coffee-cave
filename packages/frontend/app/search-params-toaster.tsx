"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export const SearchParamsToaster = () => {

  const pathName = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    const errorMessage = searchParams.get("error");
    if (errorMessage) {
      if (Array.isArray(errorMessage)) {
        errorMessage.forEach((e) => toast.error(e));
      } else {
        toast.error(errorMessage);
      }
    }
  }, [pathName, searchParams]);

  return null;  
};
