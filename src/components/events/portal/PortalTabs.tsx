"use client";

import React from "react";
import { PortalIcons } from "./PortalIcons";
import type { TabType } from "./types";

interface TabConfig {
  id: TabType;
  label: string;
}

interface PortalTabsProps {
  tabs: TabConfig[];
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  eventColor: string;
}

const tabIcons: Record<TabType, React.ReactNode> = {
  dashboard: PortalIcons.home,
  teams: PortalIcons.users,
  submissions: PortalIcons.upload,
  profile: PortalIcons.user,
  schedule: PortalIcons.schedule,
  challenges: PortalIcons.challenges,
  prizes: PortalIcons.prizes,
  info: PortalIcons.info,
};

export const PortalTabs: React.FC<PortalTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  eventColor,
}) => {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-xl">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === tab.id
              ? "border-current text-gray-900 dark:text-white"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
          style={{
            color: activeTab === tab.id ? eventColor : undefined,
            borderColor: activeTab === tab.id ? eventColor : undefined
          }}
        >
          {tabIcons[tab.id]}
          {tab.label}
        </button>
      ))}
    </div>
  );
};
