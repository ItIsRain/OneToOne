export interface Testimonial {
  name: string;
  quote: string;
  role: string;
}

export interface ServiceItem {
  icon: string;
  title: string;
  description: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface StatItem {
  value: string;
  label: string;
  suffix: string;
}

export interface PartnerItem {
  name: string;
  logo_url: string;
  url: string;
}

export interface PortalSettings {
  id: string | null;
  hero_headline: string | null;
  hero_subtitle: string | null;
  banner_image_url: string | null;
  show_events: boolean;
  featured_event_ids: string[];
  custom_cta_text: string | null;
  custom_cta_url: string | null;
  hero_layout: string;
  show_about_section: boolean;
  about_heading: string | null;
  about_body: string | null;
  show_testimonials: boolean;
  testimonials: Testimonial[];
  secondary_cta_text: string | null;
  secondary_cta_url: string | null;
  show_footer: boolean;
  footer_text: string | null;
  section_order: string[];
  portal_accent_color: string | null;
  // Services
  show_services: boolean;
  services_heading: string | null;
  services_subheading: string | null;
  services: ServiceItem[];
  // FAQ
  show_faq: boolean;
  faq_heading: string | null;
  faq_items: FaqItem[];
  // CTA Banner
  show_cta_banner: boolean;
  cta_banner_heading: string | null;
  cta_banner_body: string | null;
  cta_banner_button_text: string | null;
  cta_banner_button_url: string | null;
  // Stats
  show_stats: boolean;
  stats_heading: string | null;
  stats: StatItem[];
  // Partners
  show_partners: boolean;
  partners_heading: string | null;
  partners: PartnerItem[];
  // Client Login
  login_methods: ("password" | "magic_link")[];
  login_welcome_message: string | null;
  // Approvals
  require_approval_comment: boolean;
  approval_notification_email: string | null;
}
