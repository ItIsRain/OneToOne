// ---------------------------------------------------------------------------
// 1i1 – Branded Email Templates (v2)
// ---------------------------------------------------------------------------
// All templates use table-based layouts and inline CSS for maximum
// compatibility across Gmail, Outlook, Apple Mail, and Yahoo Mail.
//
// v2 improvements:
// - Preheader text for better inbox previews
// - Unicode visual anchors per email type
// - Individual OTP digit cells for scannability
// - Richer visual hierarchy with gradient header bar
// - Dark mode meta support
// - Improved footer with help link
// ---------------------------------------------------------------------------

const BRAND = {
  primary: "#72b81a",
  primaryDark: "#5a9412",
  primaryLight: "#e8f5d3",
  bg: "#f4f5f7",
  card: "#ffffff",
  text: "#1a1a2e",
  textSecondary: "#4b5563",
  textMuted: "#9ca3af",
  border: "#e5e7eb",
  borderLight: "#f3f4f6",
  success: "#10b981",
  warning: "#f59e0b",
  fontStack:
    "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
} as const;

// ---------------------------------------------------------------------------
// Preheader – hidden text that shows in inbox preview
// ---------------------------------------------------------------------------
function preheader(text: string): string {
  return `<div style="display:none;font-size:1px;color:#f4f5f7;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${text}${"&zwnj;&nbsp;".repeat(30)}</div>`;
}

// ---------------------------------------------------------------------------
// Base layout – wraps every email in a branded shell
// ---------------------------------------------------------------------------
function baseLayout(content: string, preheaderText?: string): string {
  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>1i1</title>
  <!--[if mso]>
  <style>table,td{font-family:Arial,Helvetica,sans-serif !important;}</style>
  <![endif]-->
  <style>
    @media (prefers-color-scheme: dark) {
      .email-bg { background-color: #1a1a2e !important; }
      .email-card { background-color: #2d2d44 !important; border-color: #3d3d55 !important; }
      .email-text { color: #e5e7eb !important; }
      .email-text-secondary { color: #9ca3af !important; }
      .email-text-muted { color: #6b7280 !important; }
      .email-detail-box { background-color: #23233a !important; border-color: #3d3d55 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bg};font-family:${BRAND.fontStack};-webkit-font-smoothing:antialiased;">
  ${preheaderText ? preheader(preheaderText) : ""}

  <!-- Outer wrapper -->
  <table role="presentation" class="email-bg" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bg};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <!-- Container 600px -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header / Logo -->
          <tr>
            <td align="center" style="padding:0 0 32px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:30px;font-weight:800;color:${BRAND.primary};font-family:${BRAND.fontStack};letter-spacing:-0.5px;">
                    1i1
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td class="email-card" style="background-color:${BRAND.card};border-radius:16px;border:1px solid ${BRAND.border};overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04),0 1px 2px rgba(0,0,0,0.02);">
              <!-- Gradient accent bar -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:5px;background:linear-gradient(90deg,${BRAND.primary},${BRAND.primaryDark});font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
              <!-- Content -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:44px 44px 40px 44px;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 0 0 0;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:13px;color:${BRAND.textMuted};line-height:20px;">
                &copy; ${new Date().getFullYear()} 1i1. All rights reserved.
              </p>
              <p style="margin:0 0 12px 0;font-size:12px;color:${BRAND.textMuted};line-height:18px;">
                You received this email because of your account on
                <a href="https://1i1.ae" style="color:${BRAND.primary};text-decoration:none;">1i1.ae</a>.
              </p>
              <p style="margin:0;font-size:12px;line-height:18px;">
                <a href="https://1i1.ae/help" style="color:${BRAND.textMuted};text-decoration:underline;">Help Center</a>
                <span style="color:${BRAND.border};padding:0 6px;">&middot;</span>
                <a href="https://1i1.ae/settings/notifications" style="color:${BRAND.textMuted};text-decoration:underline;">Email Preferences</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

// ---------------------------------------------------------------------------
// Reusable components
// ---------------------------------------------------------------------------
function ctaButton(label: string, href: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
  <tr>
    <td align="center" style="border-radius:10px;background-color:${BRAND.primary};">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${href}" style="height:48px;width:auto;" arcsize="21%" fillcolor="${BRAND.primary}" stroke="f">
        <v:textbox inset="0px,0px,0px,0px"><center>
      <![endif]-->
      <a href="${href}" target="_blank" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;font-family:${BRAND.fontStack};border-radius:10px;line-height:20px;">
        ${label}
      </a>
      <!--[if mso]></center></v:textbox></v:roundrect><![endif]-->
    </td>
  </tr>
</table>`;
}

function secondaryButton(label: string, href: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
  <tr>
    <td align="center" style="border-radius:10px;border:1px solid ${BRAND.border};background-color:${BRAND.card};">
      <a href="${href}" target="_blank" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:${BRAND.text};text-decoration:none;font-family:${BRAND.fontStack};border-radius:10px;line-height:20px;">
        ${label}
      </a>
    </td>
  </tr>
</table>`;
}

function heading(text: string): string {
  return `<h1 class="email-text" style="margin:0 0 16px 0;font-size:24px;font-weight:700;color:${BRAND.text};line-height:32px;font-family:${BRAND.fontStack};">${text}</h1>`;
}

function paragraph(text: string): string {
  return `<p class="email-text-secondary" style="margin:0 0 24px 0;font-size:15px;color:${BRAND.textSecondary};line-height:26px;">${text}</p>`;
}

function divider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:8px 0;"><hr style="border:none;border-top:1px solid ${BRAND.border};margin:0;" /></td></tr></table>`;
}

function iconCircle(emoji: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
  <tr>
    <td align="center" style="width:56px;height:56px;border-radius:28px;background-color:${BRAND.primaryLight};font-size:26px;line-height:56px;text-align:center;">
      ${emoji}
    </td>
  </tr>
</table>`;
}

function detailRow(label: string, value: string, icon?: string): string {
  return `
<tr>
  <td style="padding:10px 0;border-bottom:1px solid ${BRAND.borderLight};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-size:13px;color:${BRAND.textMuted};line-height:20px;width:110px;vertical-align:top;">
          ${icon ? `<span style="margin-right:6px;">${icon}</span>` : ""}${label}
        </td>
        <td class="email-text" style="font-size:15px;color:${BRAND.text};font-weight:500;line-height:22px;text-align:right;">
          ${value}
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}

// ---------------------------------------------------------------------------
// 1. OTP Verification Email
// ---------------------------------------------------------------------------
export function otpEmail(otp: string): string {
  const digits = otp.split("");

  const digitCells = digits
    .map(
      (d) =>
        `<td align="center" style="width:52px;height:60px;background-color:#f9fafb;border:2px solid ${BRAND.border};border-radius:10px;font-size:28px;font-weight:700;color:${BRAND.text};font-family:'Courier New',Courier,monospace;letter-spacing:0;">${d}</td>`
    )
    .join(`<td style="width:8px;"></td>`);

  const content = `
    ${iconCircle("&#128274;")}
    ${heading("Verify your email")}
    ${paragraph("Enter this code to verify your email address and continue setting up your account.")}

    <!-- OTP digit cells -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px auto;">
      <tr>
        ${digitCells}
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
      <tr>
        <td align="center" style="padding:12px 20px;background-color:${BRAND.primaryLight};border-radius:8px;">
          <span class="email-text-secondary" style="font-size:14px;color:${BRAND.textSecondary};line-height:20px;">
            &#9202; This code expires in <strong style="color:${BRAND.text};">10 minutes</strong>
          </span>
        </td>
      </tr>
    </table>

    ${divider()}

    <p class="email-text-muted" style="margin:16px 0 0 0;font-size:13px;color:${BRAND.textMuted};line-height:20px;">
      If you didn&rsquo;t request this code, you can safely ignore this email. Someone may have entered your address by mistake.
    </p>
  `;

  return baseLayout(content, `Your verification code is ${otp}`);
}

// ---------------------------------------------------------------------------
// 2. Welcome Email (after successful registration)
// ---------------------------------------------------------------------------
export function welcomeEmail(name: string): string {
  function stepRow(num: string, title: string, desc: string): string {
    return `
    <tr>
      <td style="padding:14px 0;${num !== "3" ? `border-bottom:1px solid ${BRAND.borderLight};` : ""}">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:40px;vertical-align:top;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="width:32px;height:32px;border-radius:16px;background-color:${BRAND.primary};font-size:14px;font-weight:700;color:#ffffff;line-height:32px;text-align:center;">
                    ${num}
                  </td>
                </tr>
              </table>
            </td>
            <td style="vertical-align:top;padding-left:4px;">
              <p class="email-text" style="margin:0;font-size:15px;font-weight:600;color:${BRAND.text};line-height:22px;">${title}</p>
              <p class="email-text-muted" style="margin:2px 0 0 0;font-size:13px;color:${BRAND.textMuted};line-height:20px;">${desc}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
  }

  const content = `
    ${iconCircle("&#127881;")}
    ${heading(`Welcome aboard, ${name}!`)}
    ${paragraph("Your account is ready. 1i1 gives you a single place to manage your clients, projects, events, invoices, and team &mdash; so you can focus on growing your business.")}

    <!-- Quick-start steps -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px 0;">
      <tr>
        <td class="email-detail-box" style="padding:8px 20px;background-color:#f9fafb;border-radius:12px;border:1px solid ${BRAND.border};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${stepRow("1", "Complete your profile", "Add your photo and business details")}
            ${stepRow("2", "Add your first client", "Start managing your relationships")}
            ${stepRow("3", "Invite your team", "Collaborate with your colleagues")}
          </table>
        </td>
      </tr>
    </table>

    ${ctaButton("Go to Dashboard", "https://1i1.ae/dashboard")}

    <p class="email-text-muted" style="margin:24px 0 0 0;font-size:13px;color:${BRAND.textMuted};line-height:20px;text-align:center;">
      Need help getting started? Reply to this email &mdash; we&rsquo;re happy to assist.
    </p>
  `;

  return baseLayout(content, `Welcome to 1i1, ${name}! Your account is ready.`);
}

// ---------------------------------------------------------------------------
// 3. Team Invitation Email
// ---------------------------------------------------------------------------
export function teamInviteEmail(params: {
  inviterName: string;
  teamName: string;
  role: string;
  inviteUrl: string;
}): string {
  const { inviterName, teamName, role, inviteUrl } = params;

  const content = `
    ${iconCircle("&#129309;")}
    ${heading("You're invited to join a team")}
    ${paragraph(`<strong style="color:${BRAND.text};">${inviterName}</strong> has invited you to join <strong style="color:${BRAND.text};">${teamName}</strong> on 1i1.`)}

    <!-- Role badge -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
      <tr>
        <td class="email-detail-box" style="padding:18px 24px;background-color:#f9fafb;border-radius:12px;border:1px solid ${BRAND.border};text-align:center;">
          <span style="font-size:13px;color:${BRAND.textMuted};line-height:20px;">Your role</span>
          <br />
          <span class="email-text" style="display:inline-block;margin-top:6px;padding:4px 16px;font-size:14px;font-weight:600;color:${BRAND.primaryDark};background-color:${BRAND.primaryLight};border-radius:20px;line-height:22px;">
            ${role}
          </span>
        </td>
      </tr>
    </table>

    ${ctaButton("Accept Invitation", inviteUrl)}

    <p class="email-text-secondary" style="margin:24px 0 0 0;font-size:14px;color:${BRAND.textSecondary};line-height:22px;text-align:center;">
      If you don&rsquo;t have an account yet, one will be created<br />for you when you accept.
    </p>

    ${divider()}

    <p class="email-text-muted" style="margin:16px 0 0 0;font-size:13px;color:${BRAND.textMuted};line-height:20px;">
      If you weren&rsquo;t expecting this invitation, you can safely ignore this email.
    </p>
  `;

  return baseLayout(
    content,
    `${inviterName} invited you to join ${teamName} on 1i1`
  );
}

// ---------------------------------------------------------------------------
// 4. Event Registration Confirmation Email
// ---------------------------------------------------------------------------
export function eventRegistrationEmail(params: {
  attendeeName: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventUrl: string;
}): string {
  const {
    attendeeName,
    eventName,
    eventDate,
    eventTime,
    eventLocation,
    eventUrl,
  } = params;

  const content = `
    ${iconCircle("&#127915;")}
    ${heading("You're registered!")}
    ${paragraph(`Hi ${attendeeName}, your spot for <strong style="color:${BRAND.text};">${eventName}</strong> is confirmed.`)}

    <!-- Event details card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
      <tr>
        <td class="email-detail-box" style="padding:6px 24px;background-color:#f9fafb;border:1px solid ${BRAND.border};border-radius:12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${detailRow("Date", eventDate, "&#128197;")}
            ${detailRow("Time", eventTime, "&#128336;")}
            ${detailRow("Location", eventLocation, "&#128205;")}
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="padding-right:8px;">${ctaButton("View Event", eventUrl)}</td>
      </tr>
    </table>

    <p class="email-text-muted" style="margin:24px 0 0 0;font-size:13px;color:${BRAND.textMuted};line-height:20px;text-align:center;">
      Add this event to your calendar so you don&rsquo;t miss it.
    </p>
  `;

  return baseLayout(
    content,
    `You're registered for ${eventName} on ${eventDate}`
  );
}

// ---------------------------------------------------------------------------
// 5. Invoice / Payment Notification Email
// ---------------------------------------------------------------------------
export function invoiceEmail(params: {
  clientName: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  viewUrl: string;
}): string {
  const { clientName, invoiceNumber, amount, dueDate, viewUrl } = params;

  const content = `
    ${iconCircle("&#128452;")}
    ${heading("New invoice")}
    ${paragraph(`Hi ${clientName}, a new invoice has been generated for you.`)}

    <!-- Invoice summary card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
      <tr>
        <td class="email-detail-box" style="padding:0;background-color:#f9fafb;border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
          <!-- Amount hero -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding:28px 24px 24px 24px;border-bottom:1px solid ${BRAND.border};">
                <span style="display:block;font-size:13px;color:${BRAND.textMuted};line-height:18px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Amount Due</span>
                <span class="email-text" style="font-size:36px;font-weight:800;color:${BRAND.text};line-height:44px;letter-spacing:-0.5px;">${amount}</span>
              </td>
            </tr>
          </table>
          <!-- Details -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:16px 24px;">
            <tr>
              <td style="padding:8px 0;font-size:14px;color:${BRAND.textMuted};line-height:20px;">Invoice</td>
              <td class="email-text" align="right" style="padding:8px 0;font-size:14px;color:${BRAND.text};font-weight:600;line-height:20px;">${invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-size:14px;color:${BRAND.textMuted};line-height:20px;">Due Date</td>
              <td class="email-text" align="right" style="padding:8px 0;font-size:14px;color:${BRAND.text};font-weight:600;line-height:20px;">${dueDate}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${ctaButton("View Invoice", viewUrl)}

    <p class="email-text-muted" style="margin:24px 0 0 0;font-size:13px;color:${BRAND.textMuted};line-height:20px;text-align:center;">
      If you have questions about this invoice, reply to this email.
    </p>
  `;

  return baseLayout(
    content,
    `Invoice ${invoiceNumber} for ${amount} — due ${dueDate}`
  );
}

// ---------------------------------------------------------------------------
// 6. Document Shared Email
// ---------------------------------------------------------------------------
export function documentSharedEmail(params: {
  recipientName: string;
  senderName: string;
  documentName: string;
  message?: string;
  viewUrl: string;
}): string {
  const { recipientName, senderName, documentName, message, viewUrl } = params;

  const messageBlock = message
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
        <tr>
          <td class="email-detail-box" style="padding:16px 20px;background-color:#f9fafb;border-left:3px solid ${BRAND.primary};border-radius:4px;font-size:14px;color:${BRAND.textSecondary};line-height:22px;font-style:italic;">
            &ldquo;${message}&rdquo;
          </td>
        </tr>
      </table>`
    : "";

  const content = `
    ${iconCircle("&#128196;")}
    ${heading("Document shared with you")}
    ${paragraph(`<strong style="color:${BRAND.text};">${senderName}</strong> shared <strong style="color:${BRAND.text};">${documentName}</strong> with you${recipientName ? `, ${recipientName}` : ""}.`)}

    ${messageBlock}

    ${ctaButton("View Document", viewUrl)}

    ${divider()}

    <p class="email-text-muted" style="margin:16px 0 0 0;font-size:13px;color:${BRAND.textMuted};line-height:20px;">
      This link was generated by 1i1&rsquo;s document sharing feature. If you weren&rsquo;t expecting this, you can ignore this email.
    </p>
  `;

  return baseLayout(
    content,
    `${senderName} shared "${documentName}" with you on 1i1`
  );
}
