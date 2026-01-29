"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

// Feature data with SVG icon names
const features = [
  {
    id: "crm",
    title: "CRM & Client Management",
    description: "Track clients, manage leads, organize contacts, and visualize your sales pipeline with powerful analytics.",
    highlights: ["Lead Pipeline", "Client Profiles", "Contact Management", "Deal Tracking"],
  },
  {
    id: "projects",
    title: "Project Management",
    description: "Organize tasks, visualize workflows with Kanban boards, and track project timelines effortlessly.",
    highlights: ["Kanban Boards", "Task Assignment", "Timeline Views", "Progress Tracking"],
  },
  {
    id: "events",
    title: "Event Management",
    description: "Plan and execute events of any scale. From conferences to product launches, manage every detail.",
    highlights: ["Calendar View", "Venue Management", "Booking System", "Attendee Tracking"],
  },
  {
    id: "finance",
    title: "Finance & Invoicing",
    description: "Create invoices, track expenses, manage budgets, and monitor payments with complete visibility.",
    highlights: ["Invoice Creation", "Expense Tracking", "Budget Management", "Payment Processing"],
  },
  {
    id: "team",
    title: "Team Management",
    description: "Manage team members, define roles and permissions, track time, and streamline payroll operations.",
    highlights: ["Role-Based Access", "Time Tracking", "Payroll Management", "Performance Insights"],
  },
  {
    id: "documents",
    title: "Document Management",
    description: "Store, organize, and share documents securely. Manage contracts and templates with version control.",
    highlights: ["File Storage", "Contract Management", "Template Library", "Secure Sharing"],
  },
];

// Feature Icons Component
const FeatureIcon = ({ id, className = "" }: { id: string; className?: string }) => {
  const icons: Record<string, React.ReactNode> = {
    crm: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    projects: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    events: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="M8 14h.01" />
        <path d="M12 14h.01" />
        <path d="M16 14h.01" />
        <path d="M8 18h.01" />
        <path d="M12 18h.01" />
      </svg>
    ),
    finance: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    team: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    documents: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  };
  return icons[id] || null;
};

const eventTypes = [
  "Conferences", "Workshops", "Product Launches", "Corporate Meetings",
  "Weddings", "Networking Events", "Award Ceremonies", "Team Building",
  "Seminars", "Trade Shows", "Galas", "Fundraisers",
];

const stats = [
  { display: "10+", label: "Active Organizations" },
  { display: "1K+", label: "Tasks Completed" },
  { display: "100%", label: "Secure & Private" },
  { display: "24/7", label: "Support Available" },
];

const testimonials = [
  {
    quote: "One To One transformed how we manage our agency. We went from juggling 5 different tools to having everything in one beautiful platform.",
    author: "Sarah Chen",
    role: "CEO, Digital Spark Agency",
    avatar: "SC",
    rating: 5,
  },
  {
    quote: "The event management features are incredible. We planned our entire annual conference with 500+ attendees using just this platform.",
    author: "Michael Roberts",
    role: "Event Director, TechCorp",
    avatar: "MR",
    rating: 5,
  },
  {
    quote: "Finally, a tool that understands what agencies need. The invoicing and client management alone saved us 20 hours a week.",
    author: "Emma Williams",
    role: "Operations Manager, Creative Hub",
    avatar: "EW",
    rating: 5,
  },
  {
    quote: "The CRM pipeline view changed our sales process entirely. We can now see exactly where each deal stands at a glance.",
    author: "David Park",
    role: "Sales Director, GrowthLabs",
    avatar: "DP",
    rating: 5,
  },
  {
    quote: "Document management was always our weak point. Now everything is organized, searchable, and secure. Game changer!",
    author: "Lisa Thompson",
    role: "COO, MediaWorks",
    avatar: "LT",
    rating: 5,
  },
  {
    quote: "We run 50+ events per year. One To One makes coordination effortless. Our team efficiency improved by 40%.",
    author: "James Wilson",
    role: "Founder, EventPro",
    avatar: "JW",
    rating: 5,
  },
];

const pricingPlans = [
  {
    name: "Free",
    type: "free",
    price: { monthly: 0, yearly: 0 },
    description: "Perfect for trying out the platform",
    features: [
      "3 events total",
      "2 team members",
      "500 MB storage",
      "Basic analytics",
      "Community support",
    ],
    cta: "Get Started Free",
    popular: false,
    badge: null,
  },
  {
    name: "Starter",
    type: "starter",
    price: { monthly: 29, yearly: 279 },
    description: "For small agencies and freelancers",
    features: [
      "10 events/month",
      "5 team members",
      "5 GB storage",
      "Basic CRM features",
      "Email support",
      "Logo branding",
    ],
    cta: "Start Free Trial",
    popular: false,
    badge: null,
  },
  {
    name: "Professional",
    type: "professional",
    price: { monthly: 79, yearly: 758 },
    description: "For growing agencies and organizers",
    features: [
      "50 events/month",
      "15 team members",
      "25 GB storage",
      "Full CRM & Invoicing",
      "Judging system",
      "Priority support",
      "Custom branding",
    ],
    cta: "Start Free Trial",
    popular: true,
    badge: "Most Popular",
  },
  {
    name: "Business",
    type: "business",
    price: { monthly: 199, yearly: 1910 },
    description: "For large agencies and enterprises",
    features: [
      "Unlimited events",
      "Unlimited team members",
      "100 GB storage",
      "White-label branding",
      "SSO/SAML integration",
      "24/7 priority support",
      "Dedicated account manager",
      "99.9% SLA guarantee",
    ],
    cta: "Contact Sales",
    popular: false,
    badge: "Enterprise",
  },
];

const faqs = [
  {
    question: "Is there a free plan?",
    answer: "Yes! We offer a free plan that includes 3 events, 2 team members, and 500MB storage. It's perfect for trying out the platform with no credit card required.",
  },
  {
    question: "Can I switch plans later?",
    answer: "Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any differences.",
  },
  {
    question: "Do you have any discount codes?",
    answer: "Yes! Use the code LUNARLIMITED at checkout for 100% off any paid plan. This is a limited-time offer for early adopters.",
  },
  {
    question: "Is my data secure?",
    answer: "Security is our top priority. We use bank-level encryption, regular backups, and comply with GDPR and SOC 2 standards. Your data is always protected.",
  },
  {
    question: "What kind of support do you offer?",
    answer: "Free plans get community support. Starter plans include email support. Professional plans get priority email support. Business customers get a dedicated account manager and 24/7 support.",
  },
];

// Animated Counter Component
function AnimatedCounter({ value, suffix, duration = 2000 }: { value: number; suffix: string; duration?: number }) {
  const [count, setCount] = useState(value);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          setCount(0);

          let startTime: number;
          const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(easeOutQuart * value));
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(value);
            }
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated, value, duration]);

  const formattedCount = count >= 1000 ? count.toLocaleString() : count;

  return <span ref={ref}>{formattedCount}{suffix}</span>;
}

// Marquee Component for Event Types and Testimonials
function Marquee({ children, direction = "left", speed = 30 }: { children: React.ReactNode; direction?: "left" | "right"; speed?: number }) {
  return (
    <div className="relative overflow-hidden">
      <div
        className="flex gap-4"
        style={{
          animation: `marquee-${direction} ${speed}s linear infinite`,
        }}
      >
        {children}
        {children}
      </div>
      <style jsx>{`
        @keyframes marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}


export default function MarketingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="/Logo.svg"
                alt="OneToOne"
                width={160}
                height={52}
                className="h-13 w-auto dark:brightness-0 dark:invert"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                How It Works
              </a>
              <a href="#pricing" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Pricing
              </a>
              <a href="#faq" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                FAQ
              </a>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/signin"
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-lime-500 text-white text-sm font-medium rounded-lg hover:bg-lime-600 transition-colors"
              >
                Get Started Free
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-400"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex flex-col gap-4">
                <a href="#features" className="text-sm text-gray-600 dark:text-gray-400">Features</a>
                <a href="#how-it-works" className="text-sm text-gray-600 dark:text-gray-400">How It Works</a>
                <a href="#pricing" className="text-sm text-gray-600 dark:text-gray-400">Pricing</a>
                <a href="#faq" className="text-sm text-gray-600 dark:text-gray-400">FAQ</a>
                <Link href="/signin" className="text-sm text-gray-600 dark:text-gray-400">Sign In</Link>
                <Link href="/signup" className="px-4 py-2 bg-lime-500 text-white text-sm font-medium rounded-lg text-center">
                  Get Started Free
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-gray-50 dark:bg-gray-900/50">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-lime-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-lime-100 dark:bg-lime-900/30 rounded-full mb-8">
              <span className="w-2 h-2 bg-lime-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-lime-700 dark:text-lime-400">
                Trusted by 10,000+ organizations worldwide
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
              One Platform to
              <span className="block text-lime-500">Manage Everything</span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              CRM, Projects, Events, Finance, Team, and Documents — all in one powerful platform.
              Streamline your organization and focus on what matters most.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 bg-lime-500 text-white font-semibold rounded-xl hover:bg-lime-600 transition-all hover:shadow-lg hover:shadow-lime-500/25"
              >
                Start Your Free Trial
              </Link>
              <button
                onClick={() => setDemoModalOpen(true)}
                className="w-full sm:w-auto px-8 py-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <span>▶</span> Watch Demo
              </button>
            </div>

            {/* Trust indicators */}
            <p className="mt-6 text-sm text-gray-500 dark:text-gray-500">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>

          {/* Hero Image - Dashboard Preview */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-950 to-transparent z-10 pointer-events-none h-32 bottom-0 top-auto" />
            <div className="relative rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden bg-white dark:bg-gray-900">
              {/* Mock Dashboard Header */}
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white dark:bg-gray-700 rounded-lg px-4 py-1.5 text-sm text-gray-400 max-w-md mx-auto">
                    acme.1i1.ae/dashboard
                  </div>
                </div>
              </div>
              {/* Mock Dashboard Content */}
              <div className="p-6 bg-gray-100 dark:bg-gray-900">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Active Clients", value: "47", change: "+8.2%", color: "lime" },
                    { label: "Upcoming Events", value: "12", change: "3 this week", color: "blue" },
                    { label: "Monthly Revenue", value: "$48,250", change: "+12.5%", color: "emerald" },
                    { label: "Pending Tasks", value: "23", change: "5 overdue", color: "orange" },
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                      <p className={`text-xs mt-1 ${stat.color === 'lime' || stat.color === 'emerald' ? 'text-lime-600' : stat.color === 'orange' ? 'text-orange-500' : 'text-blue-500'}`}>
                        {stat.change}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 h-48">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-4">Revenue Overview</p>
                    <div className="flex items-end gap-2 h-32">
                      {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                        <div key={i} className="flex-1 bg-lime-500/20 rounded-t relative overflow-hidden" style={{ height: `${h}%` }}>
                          <div className="absolute bottom-0 left-0 right-0 bg-lime-500 rounded-t" style={{ height: `${h * 0.7}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 h-48">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-4">Quick Actions</p>
                    <div className="space-y-2">
                      {["New Client", "New Event", "New Task"].map((action, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-300">
                          <span className="w-6 h-6 rounded bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center text-lime-600 text-xs">+</span>
                          {action}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Minimal & Elegant */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50 border-y border-gray-100 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center group">
                <p className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {stat.display}
                </p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-lime-500" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Premium Bento Grid */}
      <section id="features" className="py-24 lg:py-32 relative overflow-hidden bg-gray-50 dark:bg-gray-900/50">
        {/* Subtle Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(132,204,22,0.1),transparent)]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="max-w-3xl mx-auto mb-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
              <span className="text-xs font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase">Features</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white text-center leading-tight">
              Powerful tools, unified platform
            </h2>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 text-center max-w-2xl mx-auto">
              Six integrated modules designed to work together. Stop switching between apps and manage everything from one place.
            </p>
          </div>

          {/* Bento Grid - Asymmetric Layout */}
          <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
            {/* First row - 2 large cards */}
            <div className="lg:col-span-2 group">
              <div className="h-full bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 lg:p-10 transition-all duration-500 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-none relative overflow-hidden">
                {/* Subtle gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-lime-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-lime-500 transition-colors duration-300">
                      <FeatureIcon id="crm" className="w-7 h-7 text-gray-600 dark:text-gray-400 group-hover:text-white transition-colors duration-300" />
                    </div>
                    <svg className="w-5 h-5 text-gray-300 dark:text-gray-700 group-hover:text-lime-500 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7V17" />
                    </svg>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {features[0].title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed max-w-lg">
                    {features[0].description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {features[0].highlights.map((h, i) => (
                      <span key={i} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm rounded-full">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="group">
              <div className="h-full bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 transition-all duration-500 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-none relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-violet-500 transition-colors duration-300">
                      <FeatureIcon id="projects" className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-white transition-colors duration-300" />
                    </div>
                    <svg className="w-5 h-5 text-gray-300 dark:text-gray-700 group-hover:text-violet-500 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7V17" />
                    </svg>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {features[1].title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
                    {features[1].description}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {features[1].highlights.slice(0, 3).map((h, i) => (
                      <span key={i} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Second row - 3 equal cards */}
            {features.slice(2, 5).map((feature, idx) => {
              const colors = [
                { bg: "group-hover:bg-orange-500", text: "group-hover:text-orange-500", gradient: "from-orange-500/5 to-red-500/5" },
                { bg: "group-hover:bg-emerald-500", text: "group-hover:text-emerald-500", gradient: "from-emerald-500/5 to-teal-500/5" },
                { bg: "group-hover:bg-blue-500", text: "group-hover:text-blue-500", gradient: "from-blue-500/5 to-indigo-500/5" },
              ];
              const color = colors[idx];

              return (
                <div key={idx} className="group">
                  <div className="h-full bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 transition-all duration-500 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-none relative overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${color.gradient} via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-6">
                        <div className={`w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${color.bg} transition-colors duration-300`}>
                          <FeatureIcon id={feature.id} className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-white transition-colors duration-300" />
                        </div>
                        <svg className={`w-5 h-5 text-gray-300 dark:text-gray-700 ${color.text} transition-colors duration-300`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7V17" />
                        </svg>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
                        {feature.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        {feature.highlights.slice(0, 3).map((h, i) => (
                          <span key={i} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Last row - Full width card */}
            <div className="lg:col-span-3 group">
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8 lg:p-10 transition-all duration-500 hover:shadow-2xl hover:shadow-gray-900/20 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />

                <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                        <FeatureIcon id="documents" className="w-6 h-6 text-lime-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">
                        {features[5].title}
                      </h3>
                    </div>
                    <p className="text-gray-400 leading-relaxed max-w-2xl">
                      {features[5].description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {features[5].highlights.map((h, i) => (
                      <span key={i} className="px-4 py-2 bg-white/10 text-gray-300 text-sm rounded-full border border-white/10">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Event Types Section - Infinite Marquee */}
      <section className="py-20 relative overflow-hidden bg-gray-900">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-lime-900/20 via-gray-900 to-gray-900" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-lime-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10">
          <div className="text-center mb-12 px-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Built for Every Type of Event
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              From intimate workshops to large-scale conferences, One To One handles it all.
            </p>
          </div>

          {/* Marquee Rows */}
          <div className="space-y-4">
            <Marquee direction="left" speed={40}>
              {eventTypes.map((type, idx) => (
                <span
                  key={idx}
                  className="px-6 py-3 bg-white/5 backdrop-blur-sm border border-white/10 text-white rounded-full text-sm font-medium hover:bg-white/10 hover:border-lime-500/50 transition-all cursor-default whitespace-nowrap"
                >
                  {type}
                </span>
              ))}
            </Marquee>
            <Marquee direction="right" speed={35}>
              {[...eventTypes].reverse().map((type, idx) => (
                <span
                  key={idx}
                  className="px-6 py-3 bg-lime-500/10 backdrop-blur-sm border border-lime-500/20 text-lime-300 rounded-full text-sm font-medium hover:bg-lime-500/20 hover:border-lime-500/40 transition-all cursor-default whitespace-nowrap"
                >
                  {type}
                </span>
              ))}
            </Marquee>
          </div>
        </div>
      </section>

      {/* How It Works Section - Refined Timeline */}
      <section id="how-it-works" className="py-24 lg:py-32 relative bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="max-w-3xl mx-auto mb-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
              <span className="text-xs font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase">How it works</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white text-center leading-tight">
              Up and running in minutes
            </h2>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 text-center max-w-2xl mx-auto">
              Three simple steps to transform how your organization operates.
            </p>
          </div>

          {/* Steps */}
          <div className="relative">
            {/* Connection Line - Desktop */}
            <div className="hidden lg:block absolute top-[60px] left-[calc(16.666%-12px)] right-[calc(16.666%-12px)] h-px">
              <div className="h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800" />
            </div>

            <div className="grid lg:grid-cols-3 gap-12 lg:gap-8">
              {[
                {
                  step: "01",
                  title: "Create your account",
                  description: "Sign up with your email in seconds. No credit card required — start your 14-day free trial instantly.",
                },
                {
                  step: "02",
                  title: "Configure your workspace",
                  description: "Set up your organization profile, invite team members, and customize settings to match your workflow.",
                },
                {
                  step: "03",
                  title: "Start managing",
                  description: "Import existing data or start fresh. Everything you need is ready — clients, projects, events, and more.",
                },
              ].map((item, idx) => (
                <div key={idx} className="relative">
                  {/* Step indicator */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center relative z-10">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{item.step}</span>
                      </div>
                      {/* Active dot */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-lime-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800 lg:hidden" />
                  </div>

                  {/* Content */}
                  <div className="lg:pr-8">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Decorative arrow - Desktop only */}
                  {idx < 2 && (
                    <div className="hidden lg:block absolute top-[54px] -right-4 z-20">
                      <svg className="w-8 h-8 text-gray-300 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <a
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              Get started for free
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Infinite Marquee Cards */}
      <section className="py-20 lg:py-32 bg-gray-50 dark:bg-gray-900/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-lime-100 dark:bg-lime-900/30 rounded-full mb-6">
              <span className="text-sm font-semibold text-lime-700 dark:text-lime-400">TESTIMONIALS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
              Loved by teams everywhere
            </h2>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400">
              See what our customers have to say about their experience with One To One.
            </p>
          </div>
        </div>

        {/* Testimonial Marquee */}
        <div className="space-y-6">
          <Marquee direction="left" speed={50}>
            {testimonials.slice(0, 3).map((testimonial, idx) => (
              <div
                key={idx}
                className="w-[400px] flex-shrink-0 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed line-clamp-4">
                  "{testimonial.quote}"
                </p>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-lime-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.author}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </Marquee>

          <Marquee direction="right" speed={45}>
            {testimonials.slice(3).map((testimonial, idx) => (
              <div
                key={idx}
                className="w-[400px] flex-shrink-0 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed line-clamp-4">
                  "{testimonial.quote}"
                </p>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.author}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </Marquee>
        </div>
      </section>

      {/* Pricing Section - Premium Design */}
      <section id="pricing" className="py-24 lg:py-32 relative bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
              <span className="text-xs font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase">Pricing</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white text-center leading-tight">
              Simple, transparent pricing
            </h2>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 text-center max-w-2xl mx-auto">
              Choose the plan that fits your organization. Start free and upgrade anytime.
            </p>

            {/* Billing Toggle */}
            <div className="mt-8 flex justify-center">
              <div className="inline-flex items-center gap-4 p-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <button
                  onClick={() => setBillingInterval("monthly")}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    billingInterval === "monthly"
                      ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingInterval("yearly")}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    billingInterval === "yearly"
                      ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Yearly
                  <span className="px-2 py-0.5 bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 text-xs font-semibold rounded-full">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-start">
            {pricingPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`relative bg-white dark:bg-gray-900 rounded-2xl transition-all duration-300 ${
                  plan.popular
                    ? "border-2 border-lime-500 lg:-mt-4 lg:mb-4 shadow-xl shadow-lime-500/10"
                    : "border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${
                      plan.badge === "Most Popular"
                        ? "bg-lime-500 text-white"
                        : "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                    }`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="p-6 lg:p-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {plan.name}
                  </h3>

                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {plan.description}
                  </p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                      ${plan.price[billingInterval]}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      /{billingInterval === "yearly" ? "year" : "month"}
                    </span>
                  </div>

                  {billingInterval === "yearly" && plan.price.monthly > 0 && (
                    <p className="mt-1 text-sm text-lime-600 dark:text-lime-400">
                      Save ${(plan.price.monthly * 12) - plan.price.yearly}/year
                    </p>
                  )}

                  <Link
                    href={`/signup?plan=${plan.type}`}
                    className={`mt-6 w-full py-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center ${
                      plan.popular
                        ? "bg-lime-500 text-white hover:bg-lime-600"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {plan.cta}
                  </Link>

                  <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-medium uppercase tracking-wider mb-4 text-gray-400 dark:text-gray-500">
                      What's included
                    </p>
                    <ul className="space-y-3">
                      {plan.features.map((feature, fidx) => (
                        <li key={fidx} className="flex items-start gap-3">
                          <svg className={`w-5 h-5 flex-shrink-0 ${plan.popular ? "text-lime-500" : "text-gray-400 dark:text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust note */}
          <p className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
            All plans include SSL security, daily backups, and 99.9% uptime SLA. Use code <span className="font-semibold text-lime-600 dark:text-lime-400">LUNARLIMITED</span> for 100% off!
          </p>
        </div>
      </section>

      {/* FAQ Section - Animated Accordion */}
      <section id="faq" className="py-20 lg:py-32 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-lime-100 dark:bg-lime-900/30 rounded-full mb-6">
              <span className="text-sm font-semibold text-lime-700 dark:text-lime-400">FAQ</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
              Frequently asked questions
            </h2>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400">
              Everything you need to know about One To One.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={`bg-white dark:bg-gray-800 rounded-2xl border overflow-hidden transition-all duration-300 ${
                  openFaq === idx
                    ? "border-lime-500 shadow-lg shadow-lime-500/10"
                    : "border-gray-200 dark:border-gray-700 hover:border-lime-500/50"
                }`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left"
                >
                  <span className="font-semibold text-gray-900 dark:text-white pr-4">
                    {faq.question}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    openFaq === idx
                      ? "bg-lime-500 text-white rotate-180"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-500"
                  }`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${
                  openFaq === idx ? "max-h-96" : "max-h-0"
                }`}>
                  <div className="px-6 pb-5">
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Spotlight Effect */}
      <section className="py-20 lg:py-32 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gray-900">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-lime-900/40 via-gray-900 to-gray-900" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />
          {/* Animated Orbs */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-lime-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-lime-500/20 rounded-full mb-8 border border-lime-500/30">
            <span className="w-2 h-2 bg-lime-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-lime-300">Start your free trial today</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Ready to transform
            <span className="block bg-gradient-to-r from-lime-400 to-emerald-400 bg-clip-text text-transparent">
              your organization?
            </span>
          </h2>

          <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of organizations already using One To One to streamline their operations.
            Start your free trial today — no credit card required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-lime-500 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-lime-500/30 transition-all duration-300 hover:-translate-y-1"
            >
              Start Your Free Trial
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              Talk to Sales
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-lime-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm">SOC 2 Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-lime-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-sm">256-bit Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-lime-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">GDPR Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Modern Design */}
      <footer className="bg-gray-950 text-white pt-20 pb-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 pb-12 border-b border-gray-800">
            {/* Logo & Description */}
            <div className="col-span-2">
              <div className="flex items-center mb-6">
                <Image
                  src="/Logo.svg"
                  alt="OneToOne"
                  width={180}
                  height={60}
                  className="h-14 w-auto brightness-0 invert"
                />
              </div>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed max-w-xs">
                The all-in-one platform for managing your organization's clients, projects, events, and finances.
              </p>
              <div className="flex gap-3">
                <a
                  href="https://instagram.com/1i1.ae"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:bg-lime-500 hover:text-white transition-all duration-300"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Product</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-lime-400 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-lime-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-lime-400 transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-lime-400 transition-colors">Changelog</a></li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Company</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-lime-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-lime-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-lime-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-lime-400 transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Resources</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-lime-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-lime-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-lime-400 transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-lime-400 transition-colors">Status</a></li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Legal</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-lime-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-lime-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-lime-400 transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-lime-400 transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © 2025 One To One. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <span className="text-xs text-gray-600">Made with</span>
              <div className="flex items-center gap-2">
                <span className="text-lime-500">♥</span>
                <span className="text-xs text-gray-500">for teams everywhere</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Demo Video Modal */}
      {demoModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setDemoModalOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setDemoModalOpen(false)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white transition-colors text-sm flex items-center gap-1"
            >
              Close
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl">
              <iframe
                src="https://www.youtube.com/embed/93BI3hZzKk4?autoplay=1&rel=0"
                title="OneToOne Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
