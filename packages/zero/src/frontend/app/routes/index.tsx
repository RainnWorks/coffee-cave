import { useAuth } from "../AuthedZeroProvider";
import { Redirect } from "wouter";

export default function Index() {
  const { isLoggedIn } = useAuth();
  if (isLoggedIn) return <Redirect to="/tables" />;
  return <Redirect to="/login" />;
}
