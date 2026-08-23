import React from 'react';
import { getSession } from '@/lib/auth';
import AdminNav from '@/components/admin/AdminNav';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-cream-main)', display: 'flex', flexDirection: 'column' }}>
      {session && session.role === 'admin' && <AdminNav />}
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
