'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Send, CheckCircle2, AlertCircle, ArrowLeft, Heart, MessageCircle, Building2, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function ContatoClient() {
  const { showToast } = useToast();
  const [formOpenedAt, setFormOpenedAt] = useState<number>(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    honeypot: '', // Campo isca invisível
  });
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Gravar timestamp de abertura do formulário
    setFormOpenedAt(Date.now());
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validações básicas no cliente
    if (formData.name.trim().length < 2) {
      setErrorMessage('Por favor, informe seu nome com ao menos 2 caracteres.');
      return;
    }
    if (!formData.email || !formData.email.includes('@')) {
      setErrorMessage('Por favor, informe um endereço de e-mail válido para podermos responder.');
      return;
    }
    if (formData.message.trim().length < 10) {
      setErrorMessage('Por favor, escreva um pouquinho mais na mensagem (ao menos 10 caracteres).');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          formOpenedAt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Não conseguimos enviar a mensagem agora. Tente novamente em instantes!');
        showToast(data.error || 'Erro ao enviar mensagem', 'error');
        return;
      }

      setSubmittedSuccess(true);
      showToast('Mensagem enviada com sucesso! 🐾', 'success');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        honeypot: '',
      });
    } catch (err) {
      console.error(err);
      setErrorMessage('Parece que houve uma oscilação na conexão. Verifique sua internet e tente de novo.');
      showToast('Erro de conexão.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-subtle)', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Barra Superior de Breadcrumbs */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border-cream)',
          padding: '10px 0',
        }}
      >
        <div className="container">
          <nav aria-label="Navegação estrutural" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
            <Link href="/" style={{ color: 'var(--text-body)', textDecoration: 'none' }}>
              Início
            </Link>
            <ChevronRight size={13} color="var(--text-subtle)" aria-hidden="true" />
            <span style={{ color: 'var(--brand-forest-700)', fontWeight: 700 }}>
              Fale Conosco
            </span>
          </nav>
        </div>
      </div>

      {/* Hero Padronizado */}
      <section
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border-cream)',
          padding: '24px 0 20px 0',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '840px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--brand-forest-50)',
                border: '1px solid var(--brand-forest-200)',
                color: 'var(--brand-forest-700)',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              <Mail size={13} aria-hidden="true" />
              <span>Canal Direto com a Redação & Ouvidoria</span>
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.5rem, 3vw, 2.05rem)',
                fontWeight: 800,
                color: 'var(--brand-forest-900)',
                letterSpacing: '-0.025em',
                lineHeight: 1.2,
                marginBottom: '8px',
              }}
            >
              Fale com a Nossa Equipe
            </h1>

            <p style={{ fontSize: '0.92rem', color: 'var(--text-body)', lineHeight: 1.55, margin: 0 }}>
              Tem uma dúvida sobre a metodologia, deseja sugerir um produto para análise comparativa de rótulo, notou alguma divergência em dados técnicos ou deseja enviar uma proposta institucional? Preencha o formulário abaixo.
            </p>
          </div>
        </div>
      </section>

      {/* Conteúdo do Formulário */}
      <div className="container" style={{ maxWidth: '840px', marginTop: '24px' }}>
        {/* Box de Redirecionamento Institucional para Fabricantes */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            padding: '18px 22px',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1.5px solid var(--gold-400)',
            marginBottom: '28px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <Building2 size={24} color="var(--brand-forest-700)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.92rem', color: 'var(--brand-forest-900)', lineHeight: 1.55 }}>
            <strong style={{ display: 'block', fontSize: '0.96rem', marginBottom: '4px' }}>
              É fabricante, responsável técnico (RT) ou departamento regulatório?
            </strong>
            <p style={{ margin: 0, color: 'var(--text-body)', fontSize: '0.88rem' }}>
              Para solicitação formal de atualização de novo lote comercial, retificação de níveis de garantia ou contestação técnica com laudo credenciado pelo MAPA, utilize nosso{' '}
              <Link href="/fabricante" style={{ color: 'var(--brand-forest-800)', fontWeight: 800, textDecoration: 'underline' }}>
                Canal Institucional do Fabricante
              </Link>{' '}
              com geração de protocolo oficial e SLA de 5 dias úteis.
            </p>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1.5px solid var(--border-cream)',
            borderRadius: 'var(--radius-xl)',
            padding: '44px 38px',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {submittedSuccess ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '18px',
              }}
              role="status"
            >
              <div
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--brand-forest-50)',
                  color: 'var(--brand-forest-700)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(24, 76, 52, 0.15)',
                  border: '1.5px solid var(--brand-forest-200)',
                }}
              >
                <CheckCircle2 size={44} color="var(--brand-forest-700)" aria-hidden="true" />
              </div>
              <h2 style={{ fontSize: '1.85rem', color: 'var(--brand-forest-900)' }}>
                Mensagem Recebida com Sucesso! 🐾
              </h2>
              <p style={{ color: 'var(--text-body)', maxWidth: '520px', lineHeight: 1.68, fontSize: '1.05rem' }}>
                Muito obrigado pelo seu carinho e contribuição. Nossa equipe vai ler sua mensagem com toda a atenção e, caso necessário, responderemos no e-mail informado.
              </p>
              <button
                onClick={() => setSubmittedSuccess(false)}
                style={{
                  marginTop: '12px',
                  backgroundColor: 'var(--brand-forest-800)',
                  color: '#ffffff',
                  padding: '14px 32px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                  fontSize: '0.98rem',
                  boxShadow: 'var(--shadow-emerald)',
                  minHeight: '48px',
                }}
              >
                Enviar Outra Mensagem
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {errorMessage && (
                <div
                  role="alert"
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '1.5px solid #fecaca',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 18px',
                    color: '#991b1b',
                    fontSize: '0.94rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <AlertCircle size={20} style={{ flexShrink: 0 }} aria-hidden="true" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Campo Isca (Honeypot) - Invisível */}
              <div style={{ display: 'none' }} aria-hidden="true">
                <label htmlFor="website_hp">Não preencha este campo</label>
                <input
                  type="text"
                  id="website_hp"
                  name="honeypot"
                  value={formData.honeypot}
                  onChange={handleChange}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {/* Nome */}
              <div>
                <label
                  htmlFor="name"
                  style={{
                    display: 'block',
                    fontSize: '0.94rem',
                    fontWeight: 700,
                    color: 'var(--brand-forest-900)',
                    marginBottom: '6px',
                  }}
                >
                  Como podemos te chamar? <span aria-hidden="true" style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  aria-required="true"
                  maxLength={120}
                  placeholder="Ex: Ana Silva (Tutora do Thor e da Mel)"
                  value={formData.name}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1.5px solid var(--border-cream)',
                    fontSize: '0.98rem',
                    backgroundColor: '#ffffff',
                    fontFamily: 'inherit',
                    transition: 'var(--transition-fast)',
                  }}
                  className="form-input"
                />
              </div>

              {/* E-mail */}
              <div>
                <label
                  htmlFor="email"
                  style={{
                    display: 'block',
                    fontSize: '0.94rem',
                    fontWeight: 700,
                    color: 'var(--brand-forest-900)',
                    marginBottom: '6px',
                  }}
                >
                  Seu melhor e-mail <span aria-hidden="true" style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  aria-required="true"
                  maxLength={320}
                  placeholder="Ex: ana.silva@exemplo.com.br"
                  value={formData.email}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1.5px solid var(--border-cream)',
                    fontSize: '0.98rem',
                    backgroundColor: '#ffffff',
                    fontFamily: 'inherit',
                    transition: 'var(--transition-fast)',
                  }}
                  className="form-input"
                />
              </div>

              {/* Assunto (Opcional) */}
              <div>
                <label
                  htmlFor="subject"
                  style={{
                    display: 'block',
                    fontSize: '0.94rem',
                    fontWeight: 700,
                    color: 'var(--brand-forest-900)',
                    marginBottom: '6px',
                  }}
                >
                  Sobre o que gostaria de falar? <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>(Opcional)</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  maxLength={160}
                  placeholder="Ex: Sugestão de ração renal para gatinhos ou dúvida"
                  value={formData.subject}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1.5px solid var(--border-cream)',
                    fontSize: '0.98rem',
                    backgroundColor: '#ffffff',
                    fontFamily: 'inherit',
                    transition: 'var(--transition-fast)',
                  }}
                  className="form-input"
                />
              </div>

              {/* Mensagem */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                  }}
                >
                  <label
                    htmlFor="message"
                    style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--brand-forest-900)' }}
                  >
                    Sua mensagem <span aria-hidden="true" style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {formData.message.length}/5000
                  </span>
                </div>
                <textarea
                  id="message"
                  name="message"
                  required
                  aria-required="true"
                  rows={5}
                  minLength={10}
                  maxLength={5000}
                  placeholder="Conte para a gente sua sugestão, dúvida ou experiência com os produtos..."
                  value={formData.message}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1.5px solid var(--border-cream)',
                    fontSize: '0.98rem',
                    backgroundColor: '#ffffff',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    transition: 'var(--transition-fast)',
                  }}
                  className="form-input"
                />
              </div>

              {/* Botão de Envio (WCAG 2.5.5 Touch Target >= 48px) */}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  backgroundColor: 'var(--brand-forest-800)',
                  color: '#ffffff',
                  padding: '16px 32px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 800,
                  fontSize: '1rem',
                  opacity: submitting ? 0.7 : 1,
                  boxShadow: 'var(--shadow-emerald)',
                  transition: 'var(--transition-fast)',
                  marginTop: '8px',
                  minHeight: '52px',
                }}
                className="submit-btn"
              >
                <Send size={18} aria-hidden="true" />
                <span>{submitting ? 'Enviando sua mensagem...' : 'Enviar Mensagem com Amor 🐾'}</span>
              </button>

              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px' }}>
                Protegido por verificação inteligente contra envios automatizados em tempo real.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
