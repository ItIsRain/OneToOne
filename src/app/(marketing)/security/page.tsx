import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security - OneToOne",
  description: "Learn about OneToOne security practices, certifications, and how we protect your data.",
};

const securityPractices = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Encryption",
    description: "All data is encrypted at rest using AES-256 and in transit using TLS 1.3.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Authentication",
    description: "Multi-factor authentication, secure session management, and role-based access control.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>
    ),
    title: "Backups",
    description: "Automated daily backups with point-in-time recovery and geo-redundant storage.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    title: "Monitoring",
    description: "24/7 security monitoring, intrusion detection, and automated threat response.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    title: "Auditing",
    description: "Comprehensive audit logs for all actions with tamper-proof storage.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    title: "Testing",
    description: "Regular penetration testing and vulnerability assessments by third parties.",
  },
];

const compliance = [
  { name: "SOC 2 Type II", status: "Certified", icon: "shield-check" },
  { name: "GDPR", status: "Compliant", icon: "globe" },
  { name: "ISO 27001", status: "In Progress", icon: "document" },
];

export default function SecurityPage() {
  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-lime-600 dark:text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-lime-600 dark:text-lime-400">Security</p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Your data is safe with us
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
            Security is fundamental to everything we build. We employ industry-leading practices to protect your information.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Security Practices */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8">
            Security Practices
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {securityPractices.map((practice, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-lime-500/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center text-lime-600 dark:text-lime-400 mb-4">
                  {practice.icon}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {practice.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {practice.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Compliance */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8">
            Compliance & Certifications
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {compliance.map((item, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 text-center"
              >
                <p className="font-semibold text-gray-900 dark:text-white mb-2">{item.name}</p>
                <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                  item.status === "Certified" || item.status === "Compliant"
                    ? "bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Infrastructure */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Infrastructure
          </h2>
          <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Cloud Hosting</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Our infrastructure runs on industry-leading cloud providers with SOC 2 and ISO 27001 certifications.
                  Data is distributed across multiple availability zones for high availability and disaster recovery.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Network Security</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  All traffic is encrypted using TLS 1.3. We employ firewalls, DDoS protection,
                  and intrusion detection systems to protect against network-based attacks.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Data Centers</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Physical security includes 24/7 surveillance, biometric access controls,
                  and environmental protections. All data centers are SOC 2 certified.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Incident Response */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Incident Response
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We have a dedicated security team that monitors for threats 24/7. In the event of a security incident,
            we follow a structured response process:
          </p>
          <div className="flex flex-col gap-4">
            {[
              { step: "1", title: "Detection", description: "Automated monitoring and alerts identify potential threats" },
              { step: "2", title: "Assessment", description: "Security team evaluates the scope and impact" },
              { step: "3", title: "Containment", description: "Immediate action to limit damage and prevent spread" },
              { step: "4", title: "Notification", description: "Affected users are notified within 72 hours" },
              { step: "5", title: "Recovery", description: "Systems are restored and security is verified" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center text-lime-600 dark:text-lime-400 font-semibold text-sm flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Report Vulnerability */}
        <section className="mb-12">
          <div className="p-6 rounded-xl border border-lime-200 dark:border-lime-900/50 bg-lime-50 dark:bg-lime-900/20">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Report a Vulnerability
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We appreciate security researchers who help keep our platform safe. If you discover a vulnerability,
              please report it responsibly to our security team.
            </p>
            <a
              href="mailto:security@1i1.ae"
              className="inline-flex items-center gap-2 text-lime-600 dark:text-lime-400 font-medium hover:underline"
            >
              security@1i1.ae
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </section>

        {/* Footer Links */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">Related policies</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="text-sm text-lime-600 dark:text-lime-400 hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-lime-600 dark:text-lime-400 hover:underline">
              Terms of Service
            </Link>
            <Link href="/cookies" className="text-sm text-lime-600 dark:text-lime-400 hover:underline">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
