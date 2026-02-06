import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog - OneToOne",
  description: "Insights, tips, and best practices for managing your organization effectively. Learn from the OneToOne team.",
};

const featuredPost = {
  title: "Introducing Workflow Automation: Streamline Your Operations",
  description: "We're excited to announce our most requested feature: workflow automation. Create custom triggers, automate repetitive tasks, and build complex workflows without writing a single line of code.",
  date: "February 1, 2026",
  category: "Product Updates",
  readTime: "5 min read",
  slug: "introducing-workflow-automation",
};

const posts = [
  {
    title: "10 Tips for Managing Client Relationships",
    description: "Building strong client relationships is key to business success. Here are our top tips for using CRM effectively.",
    date: "January 25, 2026",
    category: "Tips & Tricks",
    readTime: "4 min read",
    slug: "tips-for-managing-client-relationships",
  },
  {
    title: "How to Plan Events That People Actually Want to Attend",
    description: "From venue selection to attendee engagement, learn the secrets to hosting successful events.",
    date: "January 18, 2026",
    category: "Event Management",
    readTime: "6 min read",
    slug: "plan-events-people-want-to-attend",
  },
  {
    title: "Project Management Best Practices for Agencies",
    description: "Keep projects on track, clients happy, and your team productive with these proven strategies.",
    date: "January 10, 2026",
    category: "Project Management",
    readTime: "7 min read",
    slug: "project-management-best-practices",
  },
  {
    title: "Financial Reporting: What Metrics Matter Most",
    description: "Understanding your numbers is crucial. Learn which financial metrics you should be tracking.",
    date: "January 5, 2026",
    category: "Finance",
    readTime: "5 min read",
    slug: "financial-reporting-metrics",
  },
  {
    title: "Remote Team Management: A Complete Guide",
    description: "Managing distributed teams requires different approaches. Here's everything you need to know.",
    date: "December 28, 2025",
    category: "Team Management",
    readTime: "8 min read",
    slug: "remote-team-management-guide",
  },
  {
    title: "Contract Management: Avoiding Common Pitfalls",
    description: "Contracts protect your business. Learn how to manage them effectively and avoid costly mistakes.",
    date: "December 20, 2025",
    category: "Documents",
    readTime: "5 min read",
    slug: "contract-management-pitfalls",
  },
];

const categories = ["All", "Product Updates", "Tips & Tricks", "Event Management", "Project Management", "Finance", "Team Management", "Documents"];

export default function BlogPage() {
  return (
    <div className="bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
              OneToOne
              <span className="block text-lime-500">Blog</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-400">
              Insights, tips, and best practices for managing your organization effectively.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-lime-500/10 to-emerald-500/10 rounded-3xl border border-lime-500/20 p-8 lg:p-12">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-lime-500 text-white text-xs font-semibold rounded-full">
                Featured
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {featuredPost.category}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-500">
                {featuredPost.date}
              </span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {featuredPost.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-3xl">
              {featuredPost.description}
            </p>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 dark:text-gray-500">
                {featuredPost.readTime}
              </span>
              <span className="text-lime-600 dark:text-lime-400 font-medium text-sm hover:underline cursor-pointer">
                Read more →
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Latest Articles
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, idx) => (
              <article
                key={idx}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-lime-500/50 hover:shadow-lg transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                      {post.category}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {post.readTime}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {post.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {post.date}
                    </span>
                    <span className="text-lime-600 dark:text-lime-400 font-medium text-sm hover:underline cursor-pointer">
                      Read →
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Stay in the loop
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-10">
            Subscribe to our newsletter for the latest updates, tips, and insights.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            />
            <button className="w-full sm:w-auto px-6 py-3 bg-lime-500 text-white font-semibold rounded-xl hover:bg-lime-600 transition-colors whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
