// app/page.tsx

import { redirect } from 'next/navigation';

export default function Home() {
  // Automatically send users to the dashboard
  // The dashboard will handle checking if they are logged in or not
  redirect('/dashboard');
}