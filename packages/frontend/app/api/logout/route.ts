import { NextRequest, NextResponse } from 'next/server';

/**
 * Logout route handler that clears cookies and redirects the user
 * @param request The incoming request
 * @returns NextResponse with cleared cookies and redirect
 */
export async function GET(request: NextRequest) {
  // Create a response that redirects to the homepage
  const response = NextResponse.redirect(new URL('/', request.url));
  
  // Clear all authentication-related cookies
  response.cookies.delete('auth_token');
  response.cookies.delete('auth_refresh_token');
  response.cookies.delete('auth_user_id');
  response.cookies.delete('auth_role');
  
  return response;
}
