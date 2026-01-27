import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing & Plans - Choose Your Plan",
  description: "Choose the perfect OneToOne plan for your business. From free to enterprise, we have plans for agencies, freelancers, and large organizations. Start your free trial today.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function SubscribeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
