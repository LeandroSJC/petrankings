'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Send, CheckCircle2, AlertCircle, ArrowLeft, Heart, MessageCircle } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function ContatoPage() {
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
    <div style={{ paddingBottom: '72px' }}>
      {/* Header Acolhedor */}
      <section
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1.5px solid var(--border-cream)',
          padding: '56px 0 40px 0',
          backgroundImage:
            'radial-gradient(ellipse at 85% 20%, rgba(212, 175, 55, 0.08) 0%, transparent 55%), radial-gradient(ellipse at 15% 85%, rgba(15, 54, 35, 0.05) 0%, transparent 55%)',
        }}
      >
        <div className="container" style={{ maxWidth: '840px' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.88rem',
              fontWeight: 700,
              color: 'var(--brand-forest-800)',
              marginBottom: '20px',
              padding: '4px 8px',
              borderRadius: '4px',
            }}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Voltar para a página inicial</span>
          </Link>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--brand-forest-50)',
              border: '1.5px solid var(--brand-forest-200)',
              padding: '7px 18px',
              borderRadius: 'var(--radius-full)',
              color: 'var(--brand-forest-900)',
              fontSize: '0.84rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              marginBottom: '16px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <Heart size={16} color="var(--gold-700)" aria-hidden="true" fill="var(--gold-700)" />
            <span>Adoramos Conversar com Outros Tutores</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.3rem, 3.8vw, 3.1rem)',
              marginBottom: '14px',
              lineHeight: 1.2,
              color: 'var(--brand-forest-900)',
            }}
          >
            Queremos muito ouvir você!
          </h1>

          <p style={{ fontSize: '1.12rem', color: 'var(--text-body)', lineHeight: 1.68 }}>
            Tem uma sugestão de categoria para analisarmos, quer indicar aquele produto que o seu cão ou gato ama, ou notou algo para melhorar? Mande uma mensagem — nossa equipe responde com todo o prazer!
          </p>
        </div>
      </section>

      {/* Conteúdo do Formulário */}
      <div className="container" style={{ maxWidth: '840px', marginTop: '40px' }}>
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
