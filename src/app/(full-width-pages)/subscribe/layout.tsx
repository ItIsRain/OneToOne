import { Metadata } from "next";
import Script from "next/script";
import { generateFAQSchema, generateBreadcrumbSchema } from "@/lib/seo/schemas";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://1i1.ae";

export const metadata: Metadata = {
  title: "Pricing & Plans - Choose Your Plan",
  description:
    "Choose the perfect OneToOne plan for your business. From free to enterprise, we have plans for agencies, freelancers, and large organizations. Start your free trial today.",
  keywords: [
    "OneToOne pricing",
    "business management pricing",
    "CRM pricing",
    "project management plans",
    "free CRM",
    "agency software pricing",
  ],
  alternates: {
    canonical: `${BASE_URL}/subscribe`,
  },
  openGraph: {
    title: "Pricing & Plans - OneToOne",
    description:
      "Choose the perfect plan for your business. Free tier available. Start managing your clients, projects, and team today.",
    url: `${BASE_URL}/subscribe`,
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// FAQ data for rich snippets in Google search results
const pricingFaqs = [
  {
    question: "Is there a free plan available?",
    answer:
      "Yes! OneToOne offers a generous free tier that includes core CRM features, basic project management, and up to 3 team members. Perfect for freelancers and small teams getting started.",
  },
  {
    question: "Can I upgrade or downgrade my plan at any time?",
    answer:
      "Absolutely. You can upgrade your plan instantly to access more features, or downgrade at the end of your billing cycle. No long-term contracts required.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, MasterCard, American Express) and process payments securely through Stripe. Enterprise customers can also pay via invoice.",
  },
  {
    question: "Do you offer a free trial for paid plans?",
    answer:
      "Yes, all paid plans come with a 14-day free trial. No credit card required to start. Experience the full features before committing.",
  },
  {
    question: "What happens to my data if I cancel?",
    answer:
      "Your data remains accessible for 30 days after cancellation. You can export all your data at any time. We never delete your data without giving you ample time to retrieve it.",
  },
];

// Breadcrumb for navigation
const breadcrumbs = [
  { name: "Home", url: BASE_URL },
  { name: "Pricing", url: `${BASE_URL}/subscribe` },
];

export default function SubscribeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const faqSchema = generateFAQSchema(pricingFaqs);
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);

  return (
    <>
      <Script
        id="pricing-faq-jsonld"
        type="application/ld+json"
        strategy="afterInteractive"
      >
        {JSON.stringify(faqSchema)}
      </Script>
      <Script
        id="pricing-breadcrumb-jsonld"
        type="application/ld+json"
        strategy="afterInteractive"
      >
        {JSON.stringify(breadcrumbSchema)}
      </Script>
      {children}
    </>
  );
}
