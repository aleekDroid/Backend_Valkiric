import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    const port = parseInt(config.get<string>('SMTP_PORT', '587'), 10);
    const connectionTimeout = parseInt(
      config.get<string>('SMTP_CONNECTION_TIMEOUT', '15000'),
      10,
    );
    const greetingTimeout = parseInt(
      config.get<string>('SMTP_GREETING_TIMEOUT', '10000'),
      10,
    );
    const socketTimeout = parseInt(
      config.get<string>('SMTP_SOCKET_TIMEOUT', '20000'),
      10,
    );

    this.transporter = nodemailer.createTransport({
      host: config.get<string>('SMTP_HOST'),
      port,
      secure: port === 465,
      connectionTimeout,
      greetingTimeout,
      socketTimeout,
      auth: {
        user: config.get<string>('SMTP_USER'),
        pass: config.get<string>('SMTP_PASS'),
      },
      tls: {
        // Allows self-signed/intercepted certs (VPN, corporate proxies).
        // In production the server connects directly — no VPN, no issue.
        rejectUnauthorized: false,
      },
    });

    // Verify SMTP connection on startup
    this.transporter.verify((err) => {
      if (err) {
        this.logger.error('SMTP connection FAILED: ' + err.message);
      } else {
        this.logger.log('SMTP connection OK — ready to send emails');
      }
    });
  }

  async sendTwoFactorCode(email: string, name: string, code: string): Promise<void> {
    const from = this.config.get<string>('SMTP_FROM', 'Valkiric <noreply@valkiric.com>');

    try {
      await this.transporter.sendMail({
        from,
        to: email,
        subject: `${code} — Tu código de verificación Valkiric`,
        html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#0f0f0f;color:#e8e8e8;border-radius:8px;overflow:hidden;">
          <div style="background:#C0392B;padding:24px 32px;">
            <h1 style="margin:0;font-size:1.4rem;letter-spacing:0.15em;color:#fff;">VALKIRIC</h1>
          </div>
          <div style="padding:32px;">
            <p style="margin:0 0 8px;">Hola, <strong>${name}</strong>.</p>
            <p style="margin:0 0 24px;color:#aaa;">Usa este código para completar tu inicio de sesión. Expira en <strong>10 minutos</strong>.</p>
            <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
              <span style="font-size:2.5rem;font-weight:700;letter-spacing:0.5em;color:#C0392B;font-family:monospace;">${code}</span>
            </div>
            <p style="margin:0;font-size:0.8rem;color:#666;">Si no intentaste iniciar sesión, ignora este correo. Nunca compartas este código con nadie.</p>
          </div>
        </div>
      `,
      });
      this.logger.log(`2FA code sent to ${email}`);
    } catch (err: any) {
      this.logger.error(
        `Failed to send 2FA email to ${email}: ${err.message} (${err.code ?? 'NO_CODE'})`,
      );
      throw new InternalServerErrorException('No se pudo enviar el correo de verificación. Inténtalo más tarde.');
    }
  }
}

