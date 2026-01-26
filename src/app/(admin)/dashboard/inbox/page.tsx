import type { Metadata } from "next";
import { MessagesChat } from "@/components/agency";

export const metadata: Metadata = {
  title: "Messages | Inbox",
  description: "Manage your team messages",
};

export default function InboxPage() {
  return <MessagesChat />;
}
