// ---------------------------------------------------------------------------
// 1i1 – Branded Email Templates (v3)
// ---------------------------------------------------------------------------
// Modern, clean email templates with table-based layouts and inline CSS
// for maximum compatibility across Gmail, Outlook, Apple Mail, and Yahoo Mail.
//
// v3 improvements:
// - Full logo image in header (Logo.svg)
// - Refined modern aesthetic with softer palette
// - Glassmorphism-inspired detail cards
// - Pill-style OTP digits with brand gradient
// - Elevated CTA buttons with shadow
// - Centered, minimal layout with generous whitespace
// - Dark mode meta support
// - Polished footer with small logo
// ---------------------------------------------------------------------------

const BRAND = {
  primary: "#465FFF",
  primaryDark: "#3347cc",
  primaryLight: "#eef0ff",
  primaryGlow: "rgba(70,95,255,0.12)",
  accent: "#72b81a",
  accentLight: "#e8f5d3",
  bg: "#f0f2f5",
  card: "#ffffff",
  text: "#111827",
  textSecondary: "#4b5563",
  textMuted: "#9ca3af",
  border: "#e5e7eb",
  borderLight: "#f3f4f6",
  success: "#10b981",
  successLight: "#ecfdf5",
  warning: "#f59e0b",
  warningLight: "#fffbeb",
  danger: "#ef4444",
  dangerLight: "#fef2f2",
  fontStack:
    "'Inter', 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  logoUrl: "https://1i1.ae/Logo.svg",
} as const;

// ---------------------------------------------------------------------------
// Preheader – hidden text that shows in inbox preview
// ---------------------------------------------------------------------------
function preheader(text: string): string {
  return `<div style="display:none;font-size:1px;color:${BRAND.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${text}${"&zwnj;&nbsp;".repeat(30)}</div>`;
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
      .email-bg { background-color: #0f1117 !important; }
      .email-card { background-color: #1a1d2e !important; border-color: #2a2d3e !important; }
      .email-text { color: #f3f4f6 !important; }
      .email-text-secondary { color: #d1d5db !important; }
      .email-text-muted { color: #6b7280 !important; }
      .email-detail-box { background-color: #151725 !important; border-color: #2a2d3e !important; }
      .email-otp-cell { background-color: #1e2235 !important; border-color: #3a3d4e !important; color: #f3f4f6 !important; }
      .email-footer-divider { border-color: #2a2d3e !important; }
    }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .email-content { padding: 32px 24px 28px 24px !important; }
      .email-otp-cell { width: 42px !important; height: 52px !important; font-size: 22px !important; }
      .email-otp-gap { width: 6px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bg};font-family:${BRAND.fontStack};-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">
  ${preheaderText ? preheader(preheaderText) : ""}

  <!-- Outer wrapper -->
  <table role="presentation" class="email-bg" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bg};">
    <tr>
      <td align="center" style="padding:48px 16px 40px 16px;">
        <!-- Container 560px -->
        <table role="presentation" class="email-container" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header / Logo -->
          <tr>
            <td align="center" style="padding:0 0 36px 0;">
              <a href="https://1i1.ae" target="_blank" style="text-decoration:none;">
                <img src="${BRAND.logoUrl}" alt="1i1" width="100" style="display:block;border:0;outline:none;height:auto;max-width:100px;" />
              </a>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td class="email-card" style="background-color:${BRAND.card};border-radius:20px;border:1px solid ${BRAND.border};overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.03);">
              <!-- Content -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="email-content" style="padding:48px 48px 44px 48px;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:36px 0 0 0;">
              <!-- Divider -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="email-footer-divider" style="border-top:1px solid ${BRAND.border};padding-top:28px;text-align:center;">
                    <!-- Small logo in footer -->
                    <img src="${BRAND.logoUrl}" alt="1i1" width="48" style="display:inline-block;border:0;outline:none;height:auto;max-width:48px;margin-bottom:16px;opacity:0.5;" />
                    <p style="margin:0 0 8px 0;font-size:13px;color:${BRAND.textMuted};line-height:20px;">
                      &copy; ${new Date().getFullYear()} 1i1. All rights reserved.
                    </p>
                    <p style="margin:0 0 16px 0;font-size:12px;color:${BRAND.textMuted};line-height:18px;">
                      You received this email because of your account on
                      <a href="https://1i1.ae" style="color:${BRAND.primary};text-decoration:none;font-weight:500;">1i1.ae</a>
                    </p>
                    <p style="margin:0;font-size:12px;line-height:18px;">
                      <a href="https://1i1.ae/help" style="color:${BRAND.textMuted};text-decoration:none;font-weight:500;">Help Center</a>
                      <span style="color:${BRAND.border};padding:0 8px;">&#8226;</span>
                      <a href="https://1i1.ae/settings/notifications" style="color:${BRAND.textMuted};text-decoration:none;font-weight:500;">Email Preferences</a>
                    </p>
                  </td>
                </tr>
              </table>
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
    <td align="center" style="border-radius:12px;background-color:${BRAND.primary};">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${href}" style="height:50px;width:auto;" arcsize="24%" fillcolor="${BRAND.primary}" stroke="f">
        <v:textbox inset="0px,0px,0px,0px"><center>
      <![endif]-->
      <a href="${href}" target="_blank" style="display:inline-block;padding:15px 40px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;font-family:${BRAND.fontStack};border-radius:12px;line-height:20px;letter-spacing:0.2px;">
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
    <td align="center" style="border-radius:12px;border:2px solid ${BRAND.border};background-color:${BRAND.card};">
      <a href="${href}" target="_blank" style="display:inline-block;padding:13px 32px;font-size:14px;font-weight:600;color:${BRAND.text};text-decoration:none;font-family:${BRAND.fontStack};border-radius:12px;line-height:20px;">
        ${label}
      </a>
    </td>
  </tr>
</table>`;
}

function heading(text: string, align: string = "left"): string {
  return `<h1 class="email-text" style="margin:0 0 12px 0;font-size:26px;font-weight:700;color:${BRAND.text};line-height:34px;font-family:${BRAND.fontStack};letter-spacing:-0.3px;text-align:${align};">${text}</h1>`;
}

function paragraph(text: string, align: string = "left"): string {
  return `<p class="email-text-secondary" style="margin:0 0 24px 0;font-size:15px;color:${BRAND.textSecondary};line-height:26px;text-align:${align};">${text}</p>`;
}

function divider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:12px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="height:1px;background-color:${BRAND.border};font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr></table>`;
}

function iconBadge(emoji: string, bgColor: string = BRAND.primaryLight): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
  <tr>
    <td align="center" style="width:60px;height:60px;border-radius:16px;background-color:${bgColor};font-size:28px;line-height:60px;text-align:center;">
      ${emoji}
    </td>
  </tr>
</table>`;
}

function detailRow(label: string, value: string, isLast: boolean = false): string {
  return `
<tr>
  <td style="padding:14px 0;${!isLast ? `border-bottom:1px solid ${BRAND.borderLight};` : ""}">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td class="email-text-muted" style="font-size:13px;color:${BRAND.textMuted};line-height:20px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;">
          ${label}
        </td>
        <td class="email-text" align="right" style="font-size:15px;color:${BRAND.text};font-weight:600;line-height:22px;">
          ${value}
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}

function noteBox(text: string, variant: "info" | "warning" | "success" = "info"): string {
  const colors = {
    info: { bg: BRAND.primaryLight, border: BRAND.primary, text: BRAND.primaryDark },
    warning: { bg: BRAND.warningLight, border: BRAND.warning, text: "#92400e" },
    success: { bg: BRAND.successLight, border: BRAND.success, text: "#065f46" },
  };
  const c = colors[variant];
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
  <tr>
    <td style="padding:14px 20px;background-color:${c.bg};border-radius:12px;border-left:4px solid ${c.border};font-size:14px;color:${c.text};line-height:22px;font-weight:500;">
      ${text}
    </td>
  </tr>
</table>`;
}

// ---------------------------------------------------------------------------
// 1. OTP Verification Email
// ---------------------------------------------------------------------------
export function otpEmail(otp: string): string {
  const digits = otp.split("");

  const digitCells = digits
    .map(
      (d) =>
        `<td class="email-otp-cell" align="center" style="width:50px;height:62px;background-color:${BRAND.primaryLight};border:2px solid ${BRAND.primary};border-radius:14px;font-size:26px;font-weight:800;color:${BRAND.primary};font-family:'SF Mono','Fira Code','Courier New',Courier,monospace;letter-spacing:0;">${d}</td>`
    )
    .join(`<td class="email-otp-gap" style="width:10px;"></td>`);

  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          ${iconBadge("&#128274;", BRAND.primaryLight)}
        </td>
      </tr>
      <tr>
        <td align="center">
          ${heading("Verify your email", "center")}
          ${paragraph("Enter this verification code to confirm your email address and continue setting up your account.", "center")}
        </td>
      </tr>
    </table>

    <!-- OTP digit cells -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 32px auto;">
      <tr>
        ${digitCells}
      </tr>
    </table>

    ${noteBox("&#9202;&nbsp; This code expires in <strong>10 minutes</strong>. Do not share it with anyone.")}

    ${divider()}

    <p class="email-text-muted" style="margin:16px 0 0 0;font-size:13px;color:${BRAND.textMuted};line-height:20px;text-align:center;">
      If you didn&rsquo;t request this code, you can safely ignore this email.<br />Someone may have entered your address by mistake.
    </p>
  `;

  return baseLayout(content, `Your verification code is ${otp}`);
}

// ---------------------------------------------------------------------------
// 2. Welcome Email (after successful registration)
// ---------------------------------------------------------------------------
export function welcomeEmail(name: string): string {
  function stepRow(num: string, title: string, desc: string, isLast: boolean = false): string {
    return `
    <tr>
      <td style="padding:16px 0;${!isLast ? `border-bottom:1px solid ${BRAND.borderLight};` : ""}">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:44px;vertical-align:top;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="width:36px;height:36px;border-radius:10px;background-color:${BRAND.primary};font-size:14px;font-weight:700;color:#ffffff;line-height:36px;text-align:center;">
                    ${num}
                  </td>
                </tr>
              </table>
            </td>
            <td style="vertical-align:top;padding-left:8px;">
              <p class="email-text" style="margin:0;font-size:15px;font-weight:600;color:${BRAND.text};line-height:22px;">${title}</p>
              <p class="email-text-muted" style="margin:4px 0 0 0;font-size:13px;color:${BRAND.textMuted};line-height:20px;">${desc}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
  }

  const content = `
    ${iconBadge("&#127881;", BRAND.primaryLight)}
    ${heading(`Welcome aboard, ${name}!`)}
    ${paragraph("Your account is ready. 1i1 gives you a single place to manage your clients, projects, events, invoices, and team &mdash; so you can focus on growing your business.")}

    <!-- Quick-start steps -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 36px 0;">
      <tr>
        <td class="email-detail-box" style="padding:8px 24px;background-color:#fafbfc;border-radius:16px;border:1px solid ${BRAND.border};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${stepRow("1", "Complete your profile", "Add your photo and business details")}
            ${stepRow("2", "Add your first client", "Start managing your relationships")}
            ${stepRow("3", "Invite your team", "Collaborate with your colleagues", true)}
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">${ctaButton("Go to Dashboard", "https://1i1.ae/dashboard")}</td></tr>
    </table>

    <p class="email-text-muted" style="margin:28px 0 0 0;font-size:13px;color:${BRAND.textMuted};line-height:20px;text-align:center;">
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
    ${iconBadge("&#129309;", BRAND.primaryLight)}
    ${heading("You're invited to join a team")}
    ${paragraph(`<strong style="color:${BRAND.text};">${inviterName}</strong> has invited you to join <strong style="color:${BRAND.text};">${teamName}</strong> on 1i1.`)}

    <!-- Team + Role card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px 0;">
      <tr>
        <td class="email-detail-box" style="padding:24px;background-color:#fafbfc;border-radius:16px;border:1px solid ${BRAND.border};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom:16px;border-bottom:1px solid ${BRAND.borderLight};">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td class="email-text-muted" style="font-size:12px;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px;font-weight:600;line-height:18px;">Team</td>
                    <td class="email-text" align="right" style="font-size:16px;color:${BRAND.text};font-weight:700;line-height:24px;">${teamName}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-top:16px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td class="email-text-muted" style="font-size:12px;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px;font-weight:600;line-height:18px;">Your Role</td>
                    <td align="right">
                      <span style="display:inline-block;padding:4px 16px;font-size:13px;font-weight:600;color:${BRAND.primary};background-color:${BRAND.primaryLight};border-radius:20px;line-height:22px;">
                        ${role}
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">${ctaButton("Accept Invitation", inviteUrl)}</td></tr>
    </table>

    <p class="email-text-secondary" style="margin:24px 0 0 0;font-size:14px;color:${BRAND.textSecondary};line-height:22px;text-align:center;">
      If you don&rsquo;t have an account yet, one will be created<br />for you when you accept.
    </p>

    ${divider()}

    <p class="email-text-muted" style="margin:16px 0 0 0;font-size:13px;color:${BRAND.textMuted};line-height:20px;text-align:center;">
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
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          ${iconBadge("&#127915;", BRAND.successLight)}
        </td>
      </tr>
      <tr>
        <td align="center">
          ${heading("You're registered!", "center")}
          ${paragraph(`Hi ${attendeeName}, your spot for <strong style="color:${BRAND.text};">${eventName}</strong> is confirmed.`, "center")}
        </td>
      </tr>
    </table>

    <!-- Event details card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px 0;">
      <tr>
        <td class="email-detail-box" style="padding:8px 24px;background-color:#fafbfc;border:1px solid ${BRAND.border};border-radius:16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${detailRow("DATE", eventDate)}
            ${detailRow("TIME", eventTime)}
            ${detailRow("LOCATION", eventLocation, true)}
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">${ctaButton("View Event", eventUrl)}</td></tr>
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
    ${iconBadge("&#128452;", BRAND.primaryLight)}
    ${heading("New invoice")}
    ${paragraph(`Hi ${clientName}, a new invoice has been generated for you.`)}

    <!-- Invoice summary card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px 0;">
      <tr>
        <td class="email-detail-box" style="padding:0;background-color:#fafbfc;border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;">
          <!-- Amount hero -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding:32px 24px 28px 24px;background-color:#fafbfc;border-bottom:1px solid ${BRAND.border};">
                <span style="display:block;font-size:11px;color:${BRAND.textSecondary};line-height:16px;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Amount Due</span>
                <span class="email-text" style="font-size:40px;font-weight:800;color:${BRAND.text};line-height:48px;letter-spacing:-1px;">${amount}</span>
              </td>
            </tr>
          </table>
          <!-- Details -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:20px 24px;">
            <tr>
              <td class="email-text-muted" style="padding:10px 0;font-size:13px;color:${BRAND.textMuted};line-height:20px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;">Invoice</td>
              <td class="email-text" align="right" style="padding:10px 0;font-size:15px;color:${BRAND.text};font-weight:600;line-height:20px;">${invoiceNumber}</td>
            </tr>
            <tr>
              <td style="height:1px;background-color:${BRAND.borderLight};" colspan="2"></td>
            </tr>
            <tr>
              <td class="email-text-muted" style="padding:10px 0;font-size:13px;color:${BRAND.textMuted};line-height:20px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;">Due Date</td>
              <td class="email-text" align="right" style="padding:10px 0;font-size:15px;color:${BRAND.text};font-weight:600;line-height:20px;">${dueDate}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">${ctaButton("View Invoice", viewUrl)}</td></tr>
    </table>

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
// 6. Client Onboarding Welcome Email
// ---------------------------------------------------------------------------
export function clientOnboardingWelcomeEmail(params: {
  clientName: string;
  senderName: string;
  companyName: string;
  dashboardUrl?: string;
}): string {
  const { clientName, senderName, companyName, dashboardUrl } = params;

  function onboardingStep(icon: string, title: string, desc: string, isLast: boolean = false): string {
    return `
    <tr>
      <td style="padding:14px 0;${!isLast ? `border-bottom:1px solid ${BRAND.borderLight};` : ""}">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:40px;vertical-align:top;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="width:36px;height:36px;border-radius:10px;background-color:${BRAND.primaryLight};font-size:18px;line-height:36px;text-align:center;">
                    ${icon}
                  </td>
                </tr>
              </table>
            </td>
            <td style="vertical-align:top;padding-left:12px;">
              <p class="email-text" style="margin:0;font-size:15px;font-weight:600;color:${BRAND.text};line-height:22px;">${title}</p>
              <p class="email-text-muted" style="margin:4px 0 0 0;font-size:13px;color:${BRAND.textMuted};line-height:20px;">${desc}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
  }

  const content = `
    ${iconBadge("&#128075;", BRAND.primaryLight)}
    ${heading(`Welcome aboard, ${clientName}!`)}
    ${paragraph(`<strong style="color:${BRAND.text};">${senderName}</strong> from <strong style="color:${BRAND.text};">${companyName}</strong> is excited to start working with you.`)}
    ${paragraph("We&rsquo;ve set up everything needed to kick off our collaboration. Here&rsquo;s what to expect next:")}

    <!-- What's next card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px 0;">
      <tr>
        <td class="email-detail-box" style="padding:12px 24px;background-color:#fafbfc;border-radius:16px;border:1px solid ${BRAND.border};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${onboardingStep("&#128196;", "Intake & Requirements", "We may send you a brief questionnaire to understand your needs")}
            ${onboardingStep("&#128221;", "Agreement & Scope", "We&rsquo;ll share a contract or NDA for your review")}
            ${onboardingStep("&#128222;", "Kickoff Meeting", "A call to align on goals, timeline, and next steps", true)}
          </table>
        </td>
      </tr>
    </table>

    ${dashboardUrl ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">${ctaButton("View Your Portal", dashboardUrl)}</td></tr></table>` : ""}

    <p class="email-text-muted" style="margin:24px 0 0 0;font-size:13px;color:${BRAND.textMuted};line-height:20px;text-align:center;">
      Questions? Simply reply to this email &mdash; we&rsquo;re here to help.
    </p>
  `;

  return baseLayout(
    content,
    `Welcome to ${companyName}! Here's what to expect next.`
  );
}

// ---------------------------------------------------------------------------
// 7. Generic Onboarding Step Email
// ---------------------------------------------------------------------------
export function onboardingStepEmail(params: {
  clientName: string;
  senderName: string;
  companyName: string;
  stepTitle: string;
  stepDescription?: string;
}): string {
  const { clientName, senderName, companyName, stepTitle, stepDescription } = params;

  const content = `
    ${iconBadge("&#128232;", BRAND.primaryLight)}
    ${heading(stepTitle)}
    ${paragraph(`Hi ${clientName}, <strong style="color:${BRAND.text};">${senderName}</strong> from <strong style="color:${BRAND.text};">${companyName}</strong> wanted to let you know about this onboarding step.`)}
    ${stepDescription ? paragraph(stepDescription) : ""}

    <p class="email-text-muted" style="margin:8px 0 0 0;font-size:13px;color:${BRAND.textMuted};line-height:20px;text-align:center;">
      If you have any questions, simply reply to this email.
    </p>
  `;

  return baseLayout(
    content,
    `${stepTitle} — ${companyName} Onboarding`
  );
}

// ---------------------------------------------------------------------------
// 8. Document Shared Email
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
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
        <tr>
          <td class="email-detail-box" style="padding:18px 24px;background-color:#fafbfc;border-left:4px solid ${BRAND.primary};border-radius:4px 12px 12px 4px;font-size:14px;color:${BRAND.textSecondary};line-height:24px;font-style:italic;">
            &ldquo;${message}&rdquo;
          </td>
        </tr>
      </table>`
    : "";

  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          ${iconBadge("&#128196;", BRAND.primaryLight)}
        </td>
      </tr>
      <tr>
        <td align="center">
          ${heading("Document shared with you", "center")}
          ${paragraph(`<strong style="color:${BRAND.text};">${senderName}</strong> shared <strong style="color:${BRAND.text};">${documentName}</strong> with you${recipientName ? `, ${recipientName}` : ""}.`, "center")}
        </td>
      </tr>
    </table>

    ${messageBlock}

    <!-- Document card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px 0;">
      <tr>
        <td class="email-detail-box" style="padding:20px 24px;background-color:#fafbfc;border-radius:16px;border:1px solid ${BRAND.border};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:44px;vertical-align:middle;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="width:40px;height:40px;border-radius:10px;background-color:${BRAND.primaryLight};font-size:20px;line-height:40px;text-align:center;">
                      &#128196;
                    </td>
                  </tr>
                </table>
              </td>
              <td style="vertical-align:middle;padding-left:14px;">
                <p class="email-text" style="margin:0;font-size:15px;font-weight:600;color:${BRAND.text};line-height:20px;">${documentName}</p>
                <p class="email-text-muted" style="margin:2px 0 0 0;font-size:12px;color:${BRAND.textMuted};line-height:18px;">Shared by ${senderName}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">${ctaButton("View Document", viewUrl)}</td></tr>
    </table>

    ${divider()}

    <p class="email-text-muted" style="margin:16px 0 0 0;font-size:13px;color:${BRAND.textMuted};line-height:20px;text-align:center;">
      This link was generated by 1i1&rsquo;s document sharing feature.<br />If you weren&rsquo;t expecting this, you can ignore this email.
    </p>
  `;

  return baseLayout(
    content,
    `${senderName} shared "${documentName}" with you on 1i1`
  );
}
