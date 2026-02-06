import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - OneToOne",
  description: "Read the terms and conditions for using the OneToOne platform.",
};

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: `By accessing or using OneToOne (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use our Service. These Terms apply to all visitors, users, and others who access or use the Service.`,
  },
  {
    id: "description",
    title: "2. Description of Service",
    content: `OneToOne is a business management platform that provides tools for client relationship management, project management, event management, invoicing, team management, and document management. We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time.`,
  },
  {
    id: "accounts",
    title: "3. User Accounts",
    subsections: [
      {
        title: "Registration",
        content: "To use certain features of the Service, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information as needed.",
      },
      {
        title: "Account Security",
        content: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use.",
      },
      {
        title: "Account Termination",
        content: "We reserve the right to suspend or terminate your account at any time for any reason, including violation of these Terms.",
      },
    ],
  },
  {
    id: "acceptable-use",
    title: "4. Acceptable Use",
    content: "You agree not to use the Service in any way that:",
    items: [
      "Violates any applicable law or regulation",
      "Infringes on the rights of others",
      "Is fraudulent, deceptive, or misleading",
      "Distributes malware or harmful code",
      "Interferes with the proper functioning of the Service",
      "Attempts to gain unauthorized access to any systems",
      "Sends spam or unsolicited communications",
      "Resells or redistributes the Service without authorization",
    ],
  },
  {
    id: "intellectual-property",
    title: "5. Intellectual Property",
    subsections: [
      {
        title: "Our Rights",
        content: "The Service and its original content, features, and functionality are owned by Lunar Limited and are protected by international copyright, trademark, and other intellectual property laws.",
      },
      {
        title: "Your Content",
        content: "You retain ownership of any content you upload to the Service. By uploading content, you grant us a worldwide, non-exclusive, royalty-free license to use, store, and display that content as necessary to provide the Service.",
      },
    ],
  },
  {
    id: "payment",
    title: "6. Payment Terms",
    subsections: [
      {
        title: "Billing",
        content: "Some features of the Service require a paid subscription. You agree to pay all fees associated with your chosen plan. Fees are non-refundable except as required by law or as explicitly stated in our refund policy.",
      },
      {
        title: "Automatic Renewal",
        content: "Subscriptions automatically renew unless cancelled before the renewal date. You can cancel your subscription at any time through your account settings.",
      },
      {
        title: "Price Changes",
        content: "We may change our prices at any time. Price changes will take effect at the start of the next subscription period following the date of the price change.",
      },
    ],
  },
  {
    id: "termination",
    title: "7. Termination",
    content: `We may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms. Upon termination, your right to use the Service will cease immediately. All provisions of the Terms which by their nature should survive termination shall survive.`,
  },
  {
    id: "disclaimer",
    title: "8. Disclaimer of Warranties",
    content: `THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.`,
  },
  {
    id: "limitation",
    title: "9. Limitation of Liability",
    content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL LUNAR LIMITED BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR USE, WHETHER IN AN ACTION IN CONTRACT, TORT, OR OTHERWISE, ARISING OUT OF OR IN CONNECTION WITH THE USE OF THE SERVICE.`,
  },
  {
    id: "indemnification",
    title: "10. Indemnification",
    content: `You agree to indemnify, defend, and hold harmless Lunar Limited and its officers, directors, employees, agents, and affiliates from and against any claims, damages, losses, liabilities, costs, and expenses arising out of or relating to your use of the Service or violation of these Terms.`,
  },
  {
    id: "changes",
    title: "11. Changes to Terms",
    content: `We reserve the right to modify these Terms at any time. We will notify you of any material changes by posting the new Terms on this page and updating the effective date. Your continued use of the Service after changes constitutes acceptance of the modified Terms.`,
  },
  {
    id: "governing-law",
    title: "12. Governing Law",
    content: `These Terms shall be governed by and construed in accordance with the laws of the United Arab Emirates, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of the United Arab Emirates.`,
  },
  {
    id: "contact",
    title: "13. Contact",
    content: `If you have any questions about these Terms, please contact us at legal@1i1.ae.`,
  },
];

export default function TermsPage() {
  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <p className="text-sm font-medium text-lime-600 dark:text-lime-400 mb-3">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Terms of Service
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
              <ul className="space-y-2 text-sm max-h-[calc(100vh-8rem)] overflow-y-auto">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="text-gray-600 dark:text-gray-400 hover:text-lime-600 dark:hover:text-lime-400 transition-colors line-clamp-1"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-10">
            {sections.map((section) => (
              <section key={section.id} id={section.id}>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {section.title}
                </h2>
                {section.content && (
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                    {section.content}
                  </p>
                )}
                {section.subsections && (
                  <div className="space-y-6 mt-4">
                    {section.subsections.map((sub, idx) => (
                      <div key={idx} className="pl-4 border-l-2 border-gray-200 dark:border-gray-800">
                        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">
                          {sub.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          {sub.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {section.items && (
                  <ul className="space-y-2 mt-4">
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
                <Link href="/privacy" className="text-sm text-lime-600 dark:text-lime-400 hover:underline">
                  Privacy Policy
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
