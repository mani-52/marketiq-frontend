import { redirect } from 'next/navigation';
/** Register removed — app runs without authentication */
export default function RegisterPage() { redirect('/dashboard'); }
