import { connection } from "next/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.BACKEND_API_URL || "http://localhost:1111"; // The actual URL of your API

export const dynamic = "force-dynamic";

/**
 * Helper function to handle the request proxying
 */
async function proxyRequest(
  request: NextRequest,
  path: string[],
  searchParams: URLSearchParams | undefined
) {
  // Build the target URL
  const targetUrl = `${API_URL}/api/${path.join("/")}${
    searchParams ? `?${searchParams.toString()}` : ""
  }`;

  // Get the request body only once and store it for reuse
  const bodyBlob =
    request.method !== "GET" && request.method !== "HEAD"
      ? await request.blob()
      : null;

  // Get all request headers
  const headers = new Headers(request.headers);

  const cookie = await cookies();

  // Get the auth_token cookie if it exists and add to Authorization header
  const authToken = cookie.get("auth_token");
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken.value}`);
  }

  // Set up the request init with the body we already read
  const requestInit: RequestInit = {
    method: request.method,
    headers: headers,
    body: bodyBlob || undefined,
    cache: "no-store",
  };

  try {
    // Forward the request to the API
    const response = await fetch(targetUrl, requestInit);

    // Get response data
    const responseData = await response.blob();

    // Create a new response with the API response data
    const newResponse = new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
    });

    // Copy all response headers
    response.headers.forEach((value, key) => {
      newResponse.headers.set(key, value);
    });

    return newResponse;
  } catch (error) {
    console.error("Proxy request error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to proxy request" }),
      {
        status: 500,
        headers: {
          "content-type": "application/json",
        },
      }
    );
  }
}

/**
 * Main handler functions for all HTTP methods
 */
export async function GET(
  request: NextRequest,
  result: {
    params: Promise<{ path: string[] }>;
  }
) {
  await connection();
  return proxyRequest(
    request,
    (await result.params).path || [],
    request.nextUrl.searchParams
  );
}

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ path: string[] }>;
  }
) {
  await connection();
  return proxyRequest(
    request,
    (await params).path || [],
    request.nextUrl.searchParams
  );
}

export async function PUT(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ path: string[] }>;
  }
) {
  await connection();
  return proxyRequest(
    request,
    (await params).path || [],
    request.nextUrl.searchParams
  );
}

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ path: string[] }>;
  }
) {
  await connection();
  return proxyRequest(
    request,
    (await params).path || [],
    request.nextUrl.searchParams
  );
}

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ path: string[] }>;
  }
) {
  await connection();
  return proxyRequest(
    request,
    (await params).path || [],
    request.nextUrl.searchParams
  );
}

export async function HEAD(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ path: string[] }>;
  }
) {
  await connection();
  return proxyRequest(
    request,
    (await params).path || [],
    request.nextUrl.searchParams
  );
}

export async function OPTIONS(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ path: string[] }>;
  }
) {
  await connection();
  return proxyRequest(
    request,
    (await params).path || [],
    request.nextUrl.searchParams
  );
}
