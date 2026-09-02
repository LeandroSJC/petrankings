'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Award, Package, MessageSquare, Megaphone, LogOut, ExternalLink, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      showToast('Sessão encerrada com sucesso', 'info');
      router.push('/admin/login');
      router.refresh();
    } catch {
      router.push('/admin/login');
    }
  };

  const navItems = [
    { href: '/admin', label: 'Visão Geral', icon: LayoutDashboard, exact: true },
    { href: '/admin/rankings', label: 'Rankings', icon: Award },
    { href: '/admin/produtos', label: 'Catálogo de Produtos', icon: Package },
    { href: '/admin/publicidade', label: 'Publicidade', icon: Megaphone },
    { href: '/admin/mensagens', label: 'Caixa de Entrada', icon: MessageSquare },
  ];

  const isActive = (item: { href: string; exact?: boolean }) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <nav
      style={{
        backgroundColor: 'var(--brand-forest-950)',
        color: '#ffffff',
        borderBottom: '1px solid var(--brand-forest-900)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <Link
          href="/admin"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            color: '#ffffff',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--brand-forest-800)',
              color: 'var(--gold-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck size={18} />
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800 }}>
            Painel PetRankings
          </span>
        </Link>

        {/* Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {navItems.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.88rem',
                  fontWeight: active ? 700 : 500,
                  backgroundColor: active ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  color: active ? '#ffffff' : '#94a3b8',
                  borderBottom: active ? '2px solid var(--gold-500)' : '2px solid transparent',
                  transition: 'var(--transition)',
                }}
              >
                <Icon size={16} color={active ? 'var(--gold-500)' : '#94a3b8'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Ações Direitas */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link
          href="/"
          target="_blank"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.82rem',
            color: '#cbd5e1',
            padding: '6px 12px',
            borderRadius: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            transition: 'var(--transition)',
          }}
        >
          <span>Ver Site Público</span>
          <ExternalLink size={13} />
        </Link>

        <button
          onClick={handleLogout}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.82rem',
            color: '#f87171',
            padding: '6px 12px',
            borderRadius: '6px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            transition: 'var(--transition)',
          }}
          title="Encerrar Sessão Administrativa"
        >
          <LogOut size={14} />
          <span>Sair</span>
        </button>
      </div>
    </nav>
  );
}
