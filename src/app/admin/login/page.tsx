'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Key, ShieldCheck, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function AdminLoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Credenciais inválidas.');
        showToast(data.error || 'Erro na autenticação', 'error');
        return;
      }

      showToast('Acesso autorizado! Bem-vindo ao painel.', 'success');
      router.push('/admin');
      router.refresh();
    } catch (err) {
      console.error(err);
      setErrorMessage('Erro de conexão ao tentar fazer login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-cream)',
          padding: '36px 32px',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {/* Ícone e Título */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              backgroundColor: 'var(--brand-forest-900)',
              color: 'var(--gold-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 4px 12px rgba(20, 61, 43, 0.25)',
            }}
          >
            <Lock size={26} />
          </div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '6px' }}>
            Acesso Administrativo
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Autenticação restrita para editores e administradores
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              color: '#991b1b',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label
              htmlFor="admin_email"
              style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--brand-forest-900)', marginBottom: '6px' }}
            >
              E-mail Administrativo
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                id="admin_email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@petrankings.com.br"
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 40px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-cream)',
                  fontSize: '0.95rem',
                  backgroundColor: 'var(--bg-cream-card)',
                  fontFamily: 'inherit',
                }}
              />
              <Mail
                size={16}
                color="var(--text-subtle)"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin_password"
              style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--brand-forest-900)', marginBottom: '6px' }}
            >
              Senha de Acesso
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                id="admin_password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 40px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-cream)',
                  fontSize: '0.95rem',
                  backgroundColor: 'var(--bg-cream-card)',
                  fontFamily: 'inherit',
                }}
              />
              <Key
                size={16}
                color="var(--text-subtle)"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: 'var(--brand-forest-800)',
              color: '#ffffff',
              padding: '13px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              fontSize: '0.95rem',
              marginTop: '8px',
              boxShadow: 'var(--shadow-md)',
              opacity: loading ? 0.7 : 1,
              transition: 'var(--transition)',
            }}
          >
            <ShieldCheck size={18} />
            <span>{loading ? 'Validando credenciais...' : 'Entrar no Painel'}</span>
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-cream-light)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
          <span>Credencial padrão inicial: </span>
          <strong style={{ color: 'var(--brand-forest-800)' }}>admin@petrankings.com.br</strong> / <strong style={{ color: 'var(--brand-forest-800)' }}>admin123456</strong>
        </div>
      </div>
    </div>
  );
}
