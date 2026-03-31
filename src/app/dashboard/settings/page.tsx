import { redirect } from 'next/navigation';
/** Settings page removed — redirect to dashboard */
export default function SettingsPage() {
  redirect('/dashboard');
}
