import UpdatePasswordForm from "@/components/auth/UpdatePasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Update Password",
  description: "Set a new password for your OneToOne account.",
};

export default function UpdatePassword() {
  return <UpdatePasswordForm />;
}
