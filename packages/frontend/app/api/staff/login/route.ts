import { NextRequest, NextResponse } from "next/server";
import { createSecurePassword } from "../../utils/email-password";
import { buildEmail } from "../../utils/email-password";

// Use environment variable or default to localhost for API URL
const API_URL = process.env.BACKEND_API_URL || "http://localhost:1111";

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { username, pin } = body;

    // Validate required fields
    if (!username || !pin) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    console.log(JSON.stringify({
      email: buildEmail(username),
      password: createSecurePassword(pin, username),
    }))

    // Forward the request to the backend API
    const response = await fetch(`${API_URL}/api/auth/staff/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: buildEmail(username),
        password: createSecurePassword(pin, username),
      }),
    });

    // Get the response data
    const data = await response.json();

    // If the response is not ok, return the error
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // If successful, extract the token and set it as a cookie
    const { token } = data;

    // Create a new response
    const nextResponse = NextResponse.json({ success: true }, { status: 200 });

    // Set the token as a secure HTTP-only cookie
    nextResponse.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      // Set an expiration time (e.g., 24 hours)
      maxAge: 60 * 60 * 24,
    });

    return nextResponse;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
