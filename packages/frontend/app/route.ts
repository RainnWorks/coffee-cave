import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token');

  if (authToken) {
    // User is authenticated, redirect to tables page
    redirect('/tables');
  } else {
    // User is not authenticated, redirect to login page
    redirect('/login');
  }
}
