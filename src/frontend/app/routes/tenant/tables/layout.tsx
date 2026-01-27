import { useZeroAuth } from "@frontend/zero";
import { Redirect } from "wouter";

export const TablesLayout = ({ children }: { children: React.ReactNode }) => {
  const { isLoading, isLoggedIn } = useZeroAuth();
  if (isLoading) return null;
  if (!isLoggedIn) return <Redirect to="/" />;
  return children;
};
