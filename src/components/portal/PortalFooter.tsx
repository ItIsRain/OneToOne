interface PortalFooterProps {
  footerText?: string | null;
  showFooter?: boolean;
  accentColor?: string | null;
}

export default function PortalFooter({ footerText, showFooter = true, accentColor }: PortalFooterProps) {
  if (!showFooter) return null;
  const color = accentColor || "#84cc16";

  return (
    <footer className="relative border-t border-gray-200 dark:border-gray-800">
      {/* Accent top line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}25, transparent)`,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {footerText && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
              {footerText}
            </p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500">
            &copy; {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
