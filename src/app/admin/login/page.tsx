'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Send, ShieldCheck, AlertCircle, ArrowLeft, RefreshCw, KeyRound } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function AdminLoginPage() {
  const router = useRouter();
  const { showToast } = useToast();

  // Estados do fluxo passwordless
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Contador regressivo para reenvio do código OTP
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Etapa 1: Solicitar envio do código de acesso
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Por favor, informe seu e-mail administrativo.');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Não foi possível enviar o código.');
        showToast(data.error || 'Erro ao solicitar código', 'error');
        return;
      }

      showToast('Código de verificação enviado! Verifique seu e-mail.', 'success');
      setStep('otp');
      setCooldown(60); // 60 segundos de cooldown
      setOtpCode('');
    } catch (err) {
      console.error(err);
      setErrorMessage('Erro de conexão ao solicitar código de acesso.');
    } finally {
      setLoading(false);
    }
  };

  // Etapa 2: Validar o código OTP de 6 dígitos
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitized = otpCode.replace(/\D/g, '').trim();

    if (sanitized.length !== 6) {
      setErrorMessage('Digite o código completo com 6 dígitos.');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: sanitized }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Código incorreto ou expirado.');
        showToast(data.error || 'Erro na verificação', 'error');
        return;
      }

      showToast('Acesso autorizado! Bem-vindo ao painel.', 'success');
      router.push('/admin');
      router.refresh();
    } catch (err) {
      console.error(err);
      setErrorMessage('Erro de conexão ao validar o código.');
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
          maxWidth: '460px',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-cream)',
          padding: '36px 32px',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {/* Cabeçalho da Autenticação */}
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
            {step === 'email' ? <KeyRound size={26} /> : <Mail size={26} />}
          </div>

          <h1 style={{ fontSize: '1.6rem', marginBottom: '6px' }}>
            {step === 'email' ? 'Acesso Administrativo' : 'Verificação de Código'}
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            {step === 'email'
              ? 'Autenticação sem senha via código único por e-mail'
              : 'Digite o código de 6 dígitos enviado para sua caixa de entrada'}
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '12px',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--brand-forest-50)',
              border: '1px solid var(--brand-forest-200)',
              color: 'var(--brand-forest-800)',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            <ShieldCheck size={13} color="var(--brand-forest-600)" />
            <span>Portão Desbloqueado • Camuflagem 404 Ativa</span>
          </div>
        </div>

        {/* Mensagem de Erro */}
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

        {/* ETAPA 1: DIGITAÇÃO DO E-MAIL */}
        {step === 'email' ? (
          <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label
                htmlFor="admin_email"
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--brand-forest-900)',
                  marginBottom: '6px',
                }}
              >
                E-mail Administrativo
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  id="admin_email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu-email@dominio.com"
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
                marginTop: '6px',
                boxShadow: 'var(--shadow-md)',
                opacity: loading ? 0.7 : 1,
                transition: 'var(--transition)',
              }}
            >
              <Send size={16} />
              <span>{loading ? 'Disparando código...' : 'Enviar Código de Acesso'}</span>
            </button>
          </form>
        ) : (
          /* ETAPA 2: DIGITAÇÃO DO CÓDIGO OTP */
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Indicador do E-mail de Envio */}
            <div
              style={{
                backgroundColor: 'var(--bg-cream-subtle)',
                border: '1px solid var(--border-cream)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--brand-forest-900)' }}>
                <Mail size={14} color="var(--brand-forest-700)" />
                <span style={{ fontWeight: 600 }}>{email}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setErrorMessage('');
                }}
                style={{
                  color: 'var(--gold-700)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textDecoration: 'underline',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ArrowLeft size={12} />
                <span>Trocar</span>
              </button>
            </div>

            <div>
              <label
                htmlFor="otp_code"
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--brand-forest-900)',
                  marginBottom: '6px',
                  textAlign: 'center',
                }}
              >
                Código de 6 Dígitos
              </label>
              <input
                type="text"
                id="otp_code"
                required
                autoFocus
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otpCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtpCode(val);
                }}
                placeholder="000 000"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '2px solid var(--brand-forest-700)',
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  letterSpacing: '10px',
                  textAlign: 'center',
                  backgroundColor: '#ffffff',
                  fontFamily: 'monospace',
                  color: 'var(--brand-forest-900)',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.replace(/\D/g, '').length !== 6}
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
                marginTop: '4px',
                boxShadow: 'var(--shadow-md)',
                opacity: loading || otpCode.replace(/\D/g, '').length !== 6 ? 0.6 : 1,
                transition: 'var(--transition)',
              }}
            >
              <ShieldCheck size={18} />
              <span>{loading ? 'Verificando código...' : 'Verificar e Entrar'}</span>
            </button>

            {/* Ações Auxiliares: Reenviar código e Voltar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '6px',
                fontSize: '0.82rem',
              }}
            >
              <button
                type="button"
                onClick={() => setStep('email')}
                style={{
                  color: 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 500,
                }}
              >
                <ArrowLeft size={13} />
                <span>Voltar</span>
              </button>

              <button
                type="button"
                disabled={cooldown > 0 || loading}
                onClick={() => handleRequestOtp()}
                style={{
                  color: cooldown > 0 ? 'var(--text-subtle)' : 'var(--brand-forest-800)',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                <span>{cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar código'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Rodapé de Segurança */}
        <div
          style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-cream-light)',
            textAlign: 'center',
            fontSize: '0.78rem',
            color: 'var(--text-subtle)',
          }}
        >
          <span>Acesso restrito e monitorado. Todas as tentativas são registradas.</span>
        </div>
      </div>
    </div>
  );
}
