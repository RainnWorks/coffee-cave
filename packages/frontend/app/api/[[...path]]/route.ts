import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.BACKEND_API_URL || 'http://localhost:1111'; // The actual URL of your API

/**
 * Helper function to handle the request proxying
 */
async function proxyRequest(request: NextRequest, path: string[]) {
  // Build the target URL
  const targetUrl = `${API_URL}/api/${path.join('/')}`;
  console.log(targetUrl);
  // Get all request headers
  const headers = new Headers(request.headers);
  
  // Get the auth_token cookie if it exists and add to Authorization header
  const authToken = request.cookies.get('auth_token');
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken.value}`);
  }
  
  // Remove host header to avoid conflicts
  headers.delete('host');
  
  // Clone the request with the new URL and headers
  const requestInit: RequestInit = {
    method: request.method,
    headers: headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.blob() : undefined,
    cache: 'no-store',
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
    console.error('Proxy request error:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to proxy request' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

/**
 * Main handler functions for all HTTP methods
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, (await params).path || []);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, (await params).path || []);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, (await params).path || []);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, (await params).path || []);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, (await params).path || []);
}

export async function HEAD(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, (await params).path || []);
}

export async function OPTIONS(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, (await params).path || []);
}