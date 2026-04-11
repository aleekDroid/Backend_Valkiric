import { Injectable, Logger, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as dns from 'dns';
import * as https from 'https';
import { promisify } from 'util';

const resolve4 = promisify(dns.resolve4);

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly brevoApiUrl = 'https://api.brevo.com/v3/smtp/email';

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    if (this.config.get<string>('BREVO_API_KEY')) {
      this.logger.log('MailService configured to use Brevo HTTPS API');
      return;
    }

    const port = parseInt(this.config.get<string>('SMTP_PORT', '587'), 10);
    const connectionTimeout = parseInt(
      this.config.get<string>('SMTP_CONNECTION_TIMEOUT', '15000'),
      10,
    );
    const greetingTimeout = parseInt(
      this.config.get<string>('SMTP_GREETING_TIMEOUT', '10000'),
      10,
    );
    const socketTimeout = parseInt(
      this.config.get<string>('SMTP_SOCKET_TIMEOUT', '20000'),
      10,
    );

    const rawHost = this.config.get<string>('SMTP_HOST', 'smtp-relay.brevo.com');

    // Railway is IPv4-only. Pre-resolve the SMTP hostname to an IPv4 address
    // so nodemailer connects directly to an A record, bypassing IPv6.
    let host = rawHost;
    try {
      const addresses = await resolve4(rawHost);
      if (addresses.length > 0) {
        host = addresses[0];
        this.logger.log(`SMTP: resolved ${rawHost} → ${host} (IPv4)`);
      }
    } catch (err: any) {
      this.logger.warn(`SMTP: could not resolve ${rawHost} to IPv4, using hostname: ${err.message}`);
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      connectionTimeout,
      greetingTimeout,
      socketTimeout,
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
      tls: {
        rejectUnauthorized: false,
        // Keep original hostname for TLS SNI so the cert is validated correctly
        servername: rawHost,
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
    const html = this.buildTwoFactorHtml(name, code);

    try {
      if (this.config.get<string>('BREVO_API_KEY')) {
        await this.sendWithBrevoApi(from, email, name, code, html);
      } else {
        await this.sendWithSmtp(from, email, code, html);
      }
      this.logger.log(`2FA code sent to ${email}`);
    } catch (err: any) {
      this.logger.error(
        `Failed to send 2FA email to ${email}: ${err.message} (${err.code ?? 'NO_CODE'})`,
      );
      throw new InternalServerErrorException('No se pudo enviar el correo de verificación. Inténtalo más tarde.');
    }
  }

  private async sendWithSmtp(from: string, email: string, code: string, html: string) {
    if (!this.transporter) {
      throw new Error('SMTP transporter is not configured');
    }

    await this.transporter.sendMail({
      from,
      to: email,
      subject: `${code} — Tu código de verificación Valkiric`,
      html,
    });
  }

  private async sendWithBrevoApi(
    from: string,
    email: string,
    name: string,
    code: string,
    html: string,
  ) {
    const apiKey = this.config.get<string>('BREVO_API_KEY');
    if (!apiKey) {
      throw new Error('BREVO_API_KEY is not configured');
    }

    const sender = this.parseFromAddress(from);
    const body = JSON.stringify({
      sender,
      to: [{ email, name }],
      subject: `${code} — Tu código de verificación Valkiric`,
      htmlContent: html,
    });

    await new Promise<void>((resolve, reject) => {
      const request = https.request(
        this.brevoApiUrl,
        {
          method: 'POST',
          headers: {
            'api-key': apiKey,
            'content-type': 'application/json',
            'content-length': Buffer.byteLength(body),
          },
          timeout: 15000,
        },
        (response) => {
          let responseBody = '';

          response.on('data', (chunk) => {
            responseBody += chunk;
          });

          response.on('end', () => {
            const statusCode = response.statusCode ?? 500;
            if (statusCode >= 200 && statusCode < 300) {
              resolve();
              return;
            }

            reject(
              new Error(`Brevo API ${statusCode}: ${responseBody || 'Empty response body'}`),
            );
          });
        },
      );

      request.on('timeout', () => {
        request.destroy(new Error('Brevo API connection timeout'));
      });

      request.on('error', (error) => {
        reject(error);
      });

      request.write(body);
      request.end();
    });
  }

  private parseFromAddress(from: string) {
    const match = from.match(/^(.*?)\s*<([^>]+)>$/);
    if (!match) {
      return { email: from.trim() };
    }

    return {
      name: match[1].trim().replace(/^"|"$/g, ''),
      email: match[2].trim(),
    };
  }

  private buildTwoFactorHtml(name: string, code: string) {
    return `
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
      `;
  }
}

