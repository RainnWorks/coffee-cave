import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { AuthedZeroProvider } from "./AuthedZeroProvider";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>My App</title>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  const server = import.meta.env.VITE_PUBLIC_SERVER;

  if (!server) {
    throw new Error("VITE_PUBLIC_SERVER environment variable is required");
  }

  return (
    <AuthedZeroProvider serverUrl={server!}>
      <Outlet />
    </AuthedZeroProvider>
  );
}
