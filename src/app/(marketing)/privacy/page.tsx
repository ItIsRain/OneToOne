import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - OneToOne",
  description: "Learn how OneToOne collects, uses, and protects your personal information.",
};

const sections = [
  {
    id: "introduction",
    title: "Introduction",
    content: `Welcome to OneToOne ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.`,
  },
  {
    id: "information-collect",
    title: "Information We Collect",
    content: `We collect information that you provide directly to us, information we obtain automatically when you use our services, and information from third-party sources.`,
    subsections: [
      {
        title: "Information You Provide",
        items: [
          "Account information (name, email, password)",
          "Organization details (company name, address, industry)",
          "Payment information (processed securely by our payment providers)",
          "Content you create (projects, clients, tasks, documents)",
          "Communications with us (support requests, feedback)",
        ],
      },
      {
        title: "Automatically Collected Information",
        items: [
          "Device information (browser type, operating system)",
          "Usage data (features used, pages visited, actions taken)",
          "IP address and approximate location",
          "Cookies and similar tracking technologies",
        ],
      },
    ],
  },
  {
    id: "how-we-use",
    title: "How We Use Your Information",
    items: [
      "Provide, maintain, and improve our services",
      "Process transactions and send related information",
      "Send you technical notices and support messages",
      "Respond to your comments and questions",
      "Analyze usage patterns to improve user experience",
      "Detect, prevent, and address technical issues",
      "Comply with legal obligations",
    ],
  },
  {
    id: "information-sharing",
    title: "Information Sharing",
    content: `We do not sell your personal information. We may share your information in the following circumstances:`,
    items: [
      "Service Providers: Third parties that help us operate our platform",
      "Legal Requirements: When required by law or to protect our rights",
      "Business Transfers: In connection with a merger, acquisition, or sale",
      "With Your Consent: When you explicitly agree to share information",
    ],
  },
  {
    id: "data-security",
    title: "Data Security",
    content: `We implement appropriate technical and organizational measures to protect your personal information, including encryption, access controls, and regular security assessments. However, no method of transmission over the Internet is 100% secure.`,
  },
  {
    id: "data-retention",
    title: "Data Retention",
    content: `We retain your information for as long as your account is active or as needed to provide services. We may retain certain information as required by law or for legitimate business purposes.`,
  },
  {
    id: "your-rights",
    title: "Your Rights",
    content: `Depending on your location, you may have certain rights regarding your personal information:`,
    items: [
      "Access your personal information",
      "Correct inaccurate information",
      "Delete your information",
      "Object to or restrict processing",
      "Data portability",
      "Withdraw consent",
    ],
  },
  {
    id: "international-transfers",
    title: "International Transfers",
    content: `Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in compliance with applicable laws.`,
  },
  {
    id: "children",
    title: "Children's Privacy",
    content: `Our services are not directed to children under 16. We do not knowingly collect personal information from children under 16. If you become aware that a child has provided us with personal information, please contact us.`,
  },
  {
    id: "changes",
    title: "Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the effective date.`,
  },
  {
    id: "contact",
    title: "Contact Us",
    content: `If you have any questions about this Privacy Policy, please contact us at privacy@1i1.ae.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <p className="text-sm font-medium text-lime-600 dark:text-lime-400 mb-3">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Privacy Policy
          </h1>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Last updated: February 1, 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid lg:grid-cols-4 gap-12">
          {/* Table of Contents - Desktop */}
          <nav className="hidden lg:block">
            <div className="sticky top-24">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">On this page</p>
              <ul className="space-y-2 text-sm">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="text-gray-600 dark:text-gray-400 hover:text-lime-600 dark:hover:text-lime-400 transition-colors"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-12">
            {sections.map((section) => (
              <section key={section.id} id={section.id}>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {section.title}
                </h2>
                {section.content && (
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                    {section.content}
                  </p>
                )}
                {section.subsections && (
                  <div className="space-y-6">
                    {section.subsections.map((sub, idx) => (
                      <div key={idx}>
                        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-3">
                          {sub.title}
                        </h3>
                        <ul className="space-y-2">
                          {sub.items.map((item, iidx) => (
                            <li key={iidx} className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-lime-500 mt-2 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
                {section.items && !section.subsections && (
                  <ul className="space-y-2">
                    {section.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-lime-500 mt-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            {/* Footer Links */}
            <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">Related policies</p>
              <div className="flex flex-wrap gap-4">
                <Link href="/terms" className="text-sm text-lime-600 dark:text-lime-400 hover:underline">
                  Terms of Service
                </Link>
                <Link href="/cookies" className="text-sm text-lime-600 dark:text-lime-400 hover:underline">
                  Cookie Policy
                </Link>
                <Link href="/security" className="text-sm text-lime-600 dark:text-lime-400 hover:underline">
                  Security
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
