"use server";

import { buildEmail } from "@/app/api/utils/email-password";
import { getServerManifestClient } from "@/lib/manifest/api-client/server";
import { cookies } from "next/headers";
import { createSecurePassword } from "@/app/api/utils/email-password";

export const login = async (username: string, pin: string) => {
  const client = await getServerManifestClient();

  const email = buildEmail(username);

  const password = createSecurePassword(pin, username);

  const { errorMessage, result } = await client.staffAuth.login(
    email,
    password
  );

  if (errorMessage) {
    console.error(errorMessage);
    return { error: errorMessage };
  }

  if (!result?.token) {
    console.error("No token returned");
    return { error: "We were unable to log you in due to a technical error." };
  }

  const cookie = await cookies();
  cookie.set({
    name: "auth_token",
    value: result.token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    // Set an expiration time (e.g., 24 hours)
    maxAge: 60 * 60 * 24,
  });

  return { success: true };
};
