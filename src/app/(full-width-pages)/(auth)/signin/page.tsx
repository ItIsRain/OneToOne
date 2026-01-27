import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your OneToOne account. Access your CRM, projects, events, and business management tools.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function SignIn() {
  return <SignInForm />;
}
