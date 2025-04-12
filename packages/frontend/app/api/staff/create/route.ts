import { NextRequest, NextResponse } from "next/server";
import { buildEmail, createSecurePassword } from "../../utils/email-password";

// Use environment variable or default to localhost for API URL
const API_URL = process.env.BACKEND_API_URL || "http://localhost:1111";

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { username, pin, firstName, lastName } = body;

    // Validate required fields
    if (!pin) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the auth_token cookie if it exists
    const authToken = req.cookies.get('auth_token');
    
    // Prepare headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    // Add Authorization header if auth_token exists
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken.value}`;
    }

    // Forward the request to the backend API
    const response = await fetch(`${API_URL}/api/auth/staff/signup`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email: buildEmail(username),
        password: createSecurePassword(pin, username),
        firstName,
        lastName,
      }),
    });

    // Get the response data
    const data = await response.json();

    // Return the response with the same status code
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Staff creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
