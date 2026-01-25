import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next.js SignIn Page | One to One by Lunar Labs - Next.js Dashboard Template",
  description: "This is Next.js Signin Page One to One by Lunar Labs Dashboard Template",
};

export default function SignIn() {
  return <SignInForm />;
}
