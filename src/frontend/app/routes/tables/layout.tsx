import { Redirect } from "wouter";
import { useAuth } from "../../AuthedZeroProvider";

export const TablesLayout = ({ children }: { children: React.ReactNode }) => {
  const { isLoading, isLoggedIn } = useAuth();
  if (isLoading) return null;
  if (!isLoggedIn) return <Redirect to="/" />;
  return children;
};
