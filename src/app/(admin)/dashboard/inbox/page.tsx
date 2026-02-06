"use client";
import { MessagesChat } from "@/components/agency";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default function InboxPage() {
  return (
    <ProtectedPage permission={PERMISSIONS.SETTINGS_VIEW}>
      <MessagesChat />
    </ProtectedPage>
  );
}
