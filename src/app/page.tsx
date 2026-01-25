"use client";
import Link from "next/link";
import { useState } from "react";

// Feature data
const features = [
  {
    icon: "👥",
    title: "CRM & Client Management",
    description: "Track clients, manage leads, organize contacts, and visualize your sales pipeline. Never lose a potential customer again.",
    highlights: ["Lead Pipeline", "Client Profiles", "Contact Management", "Deal Tracking"],
  },
  {
    icon: "📋",
    title: "Project Management",
    description: "Organize tasks, visualize workflows with Kanban boards, and track project timelines. Keep your team aligned and productive.",
    highlights: ["Kanban Boards", "Task Assignment", "Timeline Views", "Progress Tracking"],
  },
  {
    icon: "🎉",
    title: "Event Management",
    description: "Plan and execute events of any scale. From conferences to product launches, manage every detail in one place.",
    highlights: ["Calendar View", "Venue Management", "Booking System", "Attendee Tracking"],
  },
  {
    icon: "💰",
    title: "Finance & Invoicing",
    description: "Create invoices, track expenses, manage budgets, and monitor payments. Complete financial visibility at your fingertips.",
    highlights: ["Invoice Creation", "Expense Tracking", "Budget Management", "Payment Processing"],
  },
  {
    icon: "👨‍💼",
    title: "Team Management",
    description: "Manage team members, define roles and permissions, track time, and handle payroll. Build a high-performing team.",
    highlights: ["Role-Based Access", "Time Tracking", "Payroll Management", "Performance Insights"],
  },
  {
    icon: "📁",
    title: "Document Management",
    description: "Store, organize, and share documents securely. Manage contracts and templates with version control.",
    highlights: ["File Storage", "Contract Management", "Template Library", "Secure Sharing"],
  },
];

const eventTypes = [
  "Conferences", "Workshops", "Product Launches", "Corporate Meetings",
  "Weddings", "Networking Events", "Award Ceremonies", "Team Building",
];

const stats = [
  { value: "10,000+", label: "Active Organizations" },
  { value: "50M+", label: "Tasks Completed" },
  { value: "99.9%", label: "Uptime Guarantee" },
  { value: "24/7", label: "Support Available" },
];

const testimonials = [
  {
    quote: "One To One transformed how we manage our agency. We went from juggling 5 different tools to having everything in one beautiful platform.",
    author: "Sarah Chen",
    role: "CEO, Digital Spark Agency",
    avatar: "SC",
  },
  {
    quote: "The event management features are incredible. We planned our entire annual conference with 500+ attendees using just this platform.",
    author: "Michael Roberts",
    role: "Event Director, TechCorp",
    avatar: "MR",
  },
  {
    quote: "Finally, a tool that understands what agencies need. The invoicing and client management alone saved us 20 hours a week.",
    author: "Emma Williams",
    role: "Operations Manager, Creative Hub",
    avatar: "EW",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "29",
    description: "Perfect for small teams getting started",
    features: [
      "Up to 5 team members",
      "Basic CRM & Contacts",
      "Project Management",
      "5GB Document Storage",
      "Email Support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    price: "79",
    description: "For growing organizations that need more",
    features: [
      "Up to 25 team members",
      "Advanced CRM & Pipeline",
      "Event Management",
      "Finance & Invoicing",
      "50GB Document Storage",
      "Priority Support",
      "Custom Reports",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "199",
    description: "For large organizations with custom needs",
    features: [
      "Unlimited team members",
      "All Professional features",
      "API Access",
      "White-label Options",
      "Unlimited Storage",
      "Dedicated Account Manager",
      "Custom Integrations",
      "SLA Guarantee",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const faqs = [
  {
    question: "How long is the free trial?",
    answer: "We offer a 14-day free trial on all plans. No credit card required to start. You'll have access to all features during the trial period.",
  },
  {
    question: "Can I switch plans later?",
    answer: "Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle, and we'll prorate any differences.",
  },
  {
    question: "Is my data secure?",
    answer: "Security is our top priority. We use bank-level encryption, regular backups, and comply with GDPR and SOC 2 standards. Your data is always protected.",
  },
  {
    question: "Do you offer custom integrations?",
    answer: "Yes! Our Enterprise plan includes custom integrations. We can connect One To One with your existing tools and workflows. Contact our sales team to discuss your needs.",
  },
  {
    question: "What kind of support do you offer?",
    answer: "All plans include email support. Professional plans get priority support with faster response times. Enterprise customers get a dedicated account manager and 24/7 phone support.",
  },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-lime-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">1:1</span>
              </div>
              <span className="font-bold text-xl text-gray-900 dark:text-white">One To One</span>
            </div>

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
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-lime-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />
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
              <Link
                href="#demo"
                className="w-full sm:w-auto px-8 py-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <span>▶</span> Watch Demo
              </Link>
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
                    app.onetoone.com/dashboard
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

      {/* Stats Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-lime-500">{stat.value}</p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-lime-500 font-semibold mb-4">FEATURES</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Everything you need to run your organization
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Six powerful modules working together seamlessly. Replace your scattered tools with one unified platform.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-lime-500 dark:hover:border-lime-500 transition-all hover:shadow-xl hover:shadow-lime-500/5"
              >
                <div className="w-12 h-12 bg-lime-100 dark:bg-lime-900/30 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {feature.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {feature.highlights.map((highlight, hidx) => (
                    <span
                      key={hidx}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Event Types Section */}
      <section className="py-20 bg-gradient-to-br from-lime-500 to-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Built for Every Type of Event
            </h2>
            <p className="text-lime-100 text-lg max-w-2xl mx-auto">
              From intimate workshops to large-scale conferences, One To One handles it all.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {eventTypes.map((type, idx) => (
              <span
                key={idx}
                className="px-5 py-2.5 bg-white/10 backdrop-blur text-white rounded-full text-sm font-medium hover:bg-white/20 transition-colors cursor-default"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-lime-500 font-semibold mb-4">HOW IT WORKS</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Get started in minutes
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Simple setup, powerful results. Here's how easy it is to transform your organization.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create Your Account",
                description: "Sign up in seconds with your email. No credit card required for the free trial.",
              },
              {
                step: "02",
                title: "Set Up Your Workspace",
                description: "Customize your organization profile, invite team members, and configure your preferences.",
              },
              {
                step: "03",
                title: "Start Managing",
                description: "Import your data or start fresh. Begin managing clients, projects, and events immediately.",
              },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                {idx < 2 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-lime-500 to-transparent -translate-x-8" />
                )}
                <div className="text-center">
                  <div className="w-16 h-16 bg-lime-100 dark:bg-lime-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-lime-500">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-lime-500 font-semibold mb-4">TESTIMONIALS</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Loved by teams everywhere
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-lime-100 dark:bg-lime-900/30 rounded-full flex items-center justify-center text-lime-600 dark:text-lime-400 font-semibold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {testimonial.author}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-lime-500 font-semibold mb-4">PRICING</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Choose the plan that fits your organization. All plans include a 14-day free trial.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`relative rounded-2xl p-8 ${
                  plan.popular
                    ? "bg-lime-500 text-white ring-4 ring-lime-500/20"
                    : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gray-900 text-white text-sm font-medium rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className={`text-xl font-semibold ${plan.popular ? "text-white" : "text-gray-900 dark:text-white"}`}>
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-baseline">
                  <span className={`text-4xl font-bold ${plan.popular ? "text-white" : "text-gray-900 dark:text-white"}`}>
                    ${plan.price}
                  </span>
                  <span className={`ml-2 ${plan.popular ? "text-lime-100" : "text-gray-500 dark:text-gray-400"}`}>
                    /month
                  </span>
                </div>
                <p className={`mt-2 text-sm ${plan.popular ? "text-lime-100" : "text-gray-600 dark:text-gray-400"}`}>
                  {plan.description}
                </p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-center gap-2 text-sm">
                      <span className={plan.popular ? "text-white" : "text-lime-500"}>✓</span>
                      <span className={plan.popular ? "text-white" : "text-gray-600 dark:text-gray-400"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`mt-8 w-full py-3 rounded-xl font-semibold transition-colors ${
                    plan.popular
                      ? "bg-white text-lime-600 hover:bg-lime-50"
                      : "bg-lime-500 text-white hover:bg-lime-600"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-lime-500 font-semibold mb-4">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <span className="font-medium text-gray-900 dark:text-white">
                    {faq.question}
                  </span>
                  <span className={`text-gray-500 transition-transform ${openFaq === idx ? "rotate-180" : ""}`}>
                    ▼
                  </span>
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 dark:text-gray-400">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to transform your organization?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of organizations already using One To One to streamline their operations.
            Start your free trial today — no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 bg-lime-500 text-white font-semibold rounded-xl hover:bg-lime-600 transition-all hover:shadow-lg hover:shadow-lime-500/25"
            >
              Start Your Free Trial
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto px-8 py-4 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Logo & Description */}
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-lime-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">1:1</span>
                </div>
                <span className="font-bold text-xl">One To One</span>
              </div>
              <p className="text-gray-400 text-sm mb-4 max-w-xs">
                The all-in-one platform for managing your organization's clients, projects, events, and finances.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">𝕏</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">in</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">▶</a>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">
              © 2025 One To One. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
