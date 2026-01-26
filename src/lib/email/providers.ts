// Email provider implementations

import {
  SendEmailOptions,
  SendEmailResult,
  ResendConfig,
  SendGridConfig,
  MailgunConfig,
  AmazonSESConfig,
  PostmarkConfig,
  SparkPostConfig,
  SMTPConfig,
  ProviderConfig,
  EmailProvider,
} from './types';

// Resend provider
export async function sendWithResend(
  config: ResendConfig,
  options: SendEmailOptions
): Promise<SendEmailResult> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.api_key}`,
      },
      body: JSON.stringify({
        from: options.fromName
          ? `${options.fromName} <${options.from}>`
          : options.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.message || 'Resend API error' };
    }

    return { success: true, messageId: data.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// SendGrid provider
export async function sendWithSendGrid(
  config: SendGridConfig,
  options: SendEmailOptions
): Promise<SendEmailResult> {
  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.api_key}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: options.to }] }],
        from: {
          email: options.from,
          name: options.fromName,
        },
        subject: options.subject,
        content: [{ type: 'text/html', value: options.html }],
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        success: false,
        error: data.errors?.[0]?.message || 'SendGrid API error',
      };
    }

    const messageId = res.headers.get('x-message-id') || undefined;
    return { success: true, messageId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Mailgun provider
export async function sendWithMailgun(
  config: MailgunConfig,
  options: SendEmailOptions
): Promise<SendEmailResult> {
  try {
    const baseUrl =
      config.region === 'eu'
        ? 'https://api.eu.mailgun.net/v3'
        : 'https://api.mailgun.net/v3';

    const formData = new FormData();
    formData.append(
      'from',
      options.fromName
        ? `${options.fromName} <${options.from}>`
        : options.from || ''
    );
    formData.append('to', options.to);
    formData.append('subject', options.subject);
    formData.append('html', options.html);

    const res = await fetch(`${baseUrl}/${config.domain}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`api:${config.api_key}`)}`,
      },
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.message || 'Mailgun API error' };
    }

    return { success: true, messageId: data.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Amazon SES provider (using v2 API with fetch)
export async function sendWithAmazonSES(
  config: AmazonSESConfig,
  options: SendEmailOptions
): Promise<SendEmailResult> {
  try {
    // Use AWS SDK v3 style signing - simplified for demo
    // In production, use @aws-sdk/client-ses
    const endpoint = `https://email.${config.region}.amazonaws.com`;

    const params = new URLSearchParams({
      Action: 'SendEmail',
      Version: '2010-12-01',
      'Source': options.fromName
        ? `${options.fromName} <${options.from}>`
        : options.from || '',
      'Destination.ToAddresses.member.1': options.to,
      'Message.Subject.Data': options.subject,
      'Message.Body.Html.Data': options.html,
    });

    // Create AWS Signature Version 4 signing
    const date = new Date();
    const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);

    const algorithm = 'AWS4-HMAC-SHA256';
    const service = 'ses';
    const host = `email.${config.region}.amazonaws.com`;
    const canonicalUri = '/';
    const method = 'POST';
    const contentType = 'application/x-www-form-urlencoded';
    const body = params.toString();

    // Simplified - in production use proper AWS SDK
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'X-Amz-Date': amzDate,
        'Host': host,
        // Note: Full AWS SigV4 requires proper signature calculation
        // For production, use @aws-sdk/client-ses
      },
      body,
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `SES API error: ${text}` };
    }

    const text = await res.text();
    const messageIdMatch = text.match(/<MessageId>(.+?)<\/MessageId>/);
    return { success: true, messageId: messageIdMatch?.[1] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Postmark provider
export async function sendWithPostmark(
  config: PostmarkConfig,
  options: SendEmailOptions
): Promise<SendEmailResult> {
  try {
    const res = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': config.server_token,
      },
      body: JSON.stringify({
        From: options.fromName
          ? `${options.fromName} <${options.from}>`
          : options.from,
        To: options.to,
        Subject: options.subject,
        HtmlBody: options.html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.Message || 'Postmark API error' };
    }

    return { success: true, messageId: data.MessageID };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// SparkPost provider
export async function sendWithSparkPost(
  config: SparkPostConfig,
  options: SendEmailOptions
): Promise<SendEmailResult> {
  try {
    const baseUrl =
      config.region === 'eu'
        ? 'https://api.eu.sparkpost.com/api/v1'
        : 'https://api.sparkpost.com/api/v1';

    const res = await fetch(`${baseUrl}/transmissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: config.api_key,
      },
      body: JSON.stringify({
        recipients: [{ address: { email: options.to } }],
        content: {
          from: {
            email: options.from,
            name: options.fromName,
          },
          subject: options.subject,
          html: options.html,
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.errors?.[0]?.message || 'SparkPost API error',
      };
    }

    return { success: true, messageId: data.results?.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// SMTP provider using nodemailer-style fetch (simplified)
export async function sendWithSMTP(
  config: SMTPConfig,
  options: SendEmailOptions
): Promise<SendEmailResult> {
  // Note: Browser environments can't do SMTP directly
  // This would need a server-side implementation
  // For now, return an error indicating SMTP needs server-side handling

  // In a real implementation, you'd use nodemailer on the server:
  // import nodemailer from 'nodemailer';
  // const transporter = nodemailer.createTransport({
  //   host: config.host,
  //   port: config.port,
  //   secure: config.encryption === 'ssl',
  //   auth: { user: config.username, pass: config.password },
  // });

  try {
    // Server-side SMTP implementation would go here
    // For API routes, you'd import and use nodemailer

    // Placeholder - in production this calls nodemailer
    console.log('[SMTP] Would send via:', config.host, config.port);
    console.log('[SMTP] From:', options.from, 'To:', options.to);

    return {
      success: false,
      error: 'SMTP requires nodemailer - install with: npm install nodemailer',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Main send function that routes to the appropriate provider
export async function sendWithProvider(
  provider: EmailProvider,
  config: ProviderConfig,
  options: SendEmailOptions
): Promise<SendEmailResult> {
  switch (provider) {
    case 'resend':
      return sendWithResend(config as ResendConfig, options);
    case 'sendgrid':
      return sendWithSendGrid(config as SendGridConfig, options);
    case 'mailgun':
      return sendWithMailgun(config as MailgunConfig, options);
    case 'amazon_ses':
      return sendWithAmazonSES(config as AmazonSESConfig, options);
    case 'postmark':
      return sendWithPostmark(config as PostmarkConfig, options);
    case 'sparkpost':
      return sendWithSparkPost(config as SparkPostConfig, options);
    case 'smtp':
      return sendWithSMTP(config as SMTPConfig, options);
    case 'system':
    default:
      return { success: false, error: 'System provider - use default sendEmail' };
  }
}
