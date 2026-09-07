import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY?.trim();
const emailFrom = process.env.EMAIL_FROM?.trim() || 'PetRankings <onboarding@resend.dev>';

const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Dispara o e-mail transacional com o código de acesso OTP de 6 dígitos.
 * Inclui fallback para console do servidor caso a RESEND_API_KEY ainda não tenha sido preenchida.
 */
export async function sendOtpEmail({
  to,
  code,
}: {
  to: string;
  code: string;
}): Promise<{ success: boolean; error?: string }> {
  // 1. Sempre registra no console em desenvolvimento para agilizar testes locais
  if (process.env.NODE_ENV !== 'production' || !resend) {
    console.log('\n======================================================');
    console.log('🔑 [PETRANKINGS OTP] CÓDIGO DE ACESSO ADMINISTRATIVO:');
    console.log(`   Destinatário: ${to}`);
    console.log(`   Código:       ${code}`);
    console.log('   Validade:     10 minutos');
    if (!resend) {
      console.log('   ⚠️  RESEND_API_KEY não configurada no .env.');
      console.log('      (Obtenha gratuitamente em https://resend.com)');
    }
    console.log('======================================================\n');
  }

  // Se não houver chave configurada mas estamos em dev, consideramos sucesso com fallback
  if (!resend) {
    if (process.env.NODE_ENV === 'production') {
      return {
        success: false,
        error: 'Serviço de e-mail não configurado (RESEND_API_KEY ausente).',
      };
    }
    return { success: true };
  }

  // 2. Envio oficial através da API do Resend
  try {
    const { error } = await resend.emails.send({
      from: emailFrom,
      to,
      subject: `Seu código de acesso PetRankings: ${code}`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Código de Acesso PetRankings</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fbf9f5; color: #0c1c13;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e4dbc9; overflow: hidden; box-shadow: 0 4px 16px rgba(8, 33, 21, 0.06);">
                  
                  <!-- Header com Brand -->
                  <tr>
                    <td style="background-color: #082115; padding: 28px 32px; text-align: center;">
                      <div style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                        Pet<span style="color: #cf9f22;">Rankings</span>
                      </div>
                      <div style="font-size: 12px; color: #b0e3cb; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                        Acesso Administrativo Seguro
                      </div>
                    </td>
                  </tr>

                  <!-- Corpo do E-mail -->
                  <tr>
                    <td style="padding: 36px 32px; text-align: center;">
                      <h1 style="font-size: 22px; font-weight: 800; color: #082115; margin: 0 0 12px 0;">
                        Código de Verificação
                      </h1>
                      <p style="font-size: 15px; color: #3d5447; line-height: 1.5; margin: 0 0 28px 0;">
                        Você solicitou acesso ao painel editorial do <strong>PetRankings</strong>. Utilize o código de uso único abaixo para autenticar sua sessão:
                      </p>

                      <!-- Caixa de Destaque do Código -->
                      <div style="background-color: #f0faf5; border: 2px dashed #3ea576; border-radius: 12px; padding: 20px; margin: 0 auto 28px auto; max-width: 300px;">
                        <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0f3623; display: inline-block;">
                          ${code}
                        </span>
                      </div>

                      <p style="font-size: 13px; color: #4d6657; line-height: 1.5; margin: 0 0 8px 0;">
                        ⏱️ Este código expira em <strong>10 minutos</strong> e só pode ser utilizado uma vez.
                      </p>
                      <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                        Se você não solicitou este acesso, desconsidere esta mensagem. Sua conta permanece protegida.
                      </p>
                    </td>
                  </tr>

                  <!-- Rodapé -->
                  <tr>
                    <td style="background-color: #f4ede2; padding: 18px 32px; text-align: center; border-top: 1px solid #e4dbc9; font-size: 11px; color: #684504;">
                      Equipe de Segurança Editorial PetRankings • Autenticação Passwordless
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Erro no envio Resend:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao enviar e-mail';
    console.error('Exceção ao disparar e-mail:', err);
    return { success: false, error: msg };
  }
}
