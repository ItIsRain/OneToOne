import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Your Account - Start Free Trial",
  description: "Sign up for OneToOne and start managing your business in one platform. CRM, projects, events, invoicing, and more. No credit card required.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function SignUp() {
  return <SignUpForm />;
}
