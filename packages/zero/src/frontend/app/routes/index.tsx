import { Zero } from "@rocicorp/zero";
import { schema, type Schema } from "../../../schema";
import { useQuery, useZero } from "@rocicorp/zero/react";
import { useAuth } from "../AuthedZeroProvider";
import { useRestaurantConfig } from "../contexts/restaurant-config";
import { Redirect } from "wouter";

export default function Index() {
  const { isLoggedIn } = useAuth();
  if (isLoggedIn) return <Redirect to="/tables" />;
  return <Redirect to="/login" />;
}
