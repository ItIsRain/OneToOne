"use client";
import React from "react";

interface DetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl";
}

const widthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export const DetailsSidebar: React.FC<DetailsSidebarProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  headerActions,
  children,
  footer,
  width = "lg",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`relative w-full ${widthClasses[width]} bg-white shadow-2xl dark:bg-gray-900 overflow-hidden flex flex-col animate-slide-in-right`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex-1 min-w-0">
            {title && (
              <h2 className="text-lg font-bold text-gray-800 dark:text-white truncate">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4">
            {headerActions}
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Info Row Component for consistent display
interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export const InfoRow: React.FC<InfoRowProps> = ({ label, value, className = "" }) => (
  <div className={`flex items-start justify-between py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0 ${className}`}>
    <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
    <span className="text-sm font-medium text-gray-800 dark:text-white text-right max-w-[60%]">
      {value || "-"}
    </span>
  </div>
);

// Section Component for grouping info
interface SectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export const Section: React.FC<SectionProps> = ({
  title,
  children,
  className = "",
  collapsible = false,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className={`${className}`}>
      {collapsible ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between mb-3"
        >
          <h4 className="text-sm font-semibold text-gray-800 dark:text-white">{title}</h4>
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      ) : (
        <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">{title}</h4>
      )}
      {(!collapsible || isOpen) && (
        <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
          {children}
        </div>
      )}
    </div>
  );
};

// Stats Grid Component
interface StatItemProps {
  label: string;
  value: React.ReactNode;
  color?: string;
}

export const StatItem: React.FC<StatItemProps> = ({ label, value, color = "text-gray-800 dark:text-white" }) => (
  <div className="text-center">
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
  </div>
);

interface StatsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ children, columns = 3 }) => (
  <div className={`grid gap-4 ${columns === 2 ? "grid-cols-2" : columns === 3 ? "grid-cols-3" : "grid-cols-4"}`}>
    {children}
  </div>
);

export default DetailsSidebar;
