import { redirect } from 'next/navigation';

// /user redirects back to the root landing page
export default function UserRoot() {
  redirect('/');
}