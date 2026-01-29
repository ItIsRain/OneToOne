import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your OneToOne account password. Enter your email to receive a password reset link.",
};

export default function ResetPassword() {
  return <ResetPasswordForm />;
}
