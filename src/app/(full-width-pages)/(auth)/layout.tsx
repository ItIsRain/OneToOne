import GridShape from "@/components/common/GridShape";
import { ThemeProvider } from "@/context/ThemeContext";
import Image from "next/image";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <ThemeProvider>
        <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col  dark:bg-gray-900 sm:p-0">
          {children}
          <div className="lg:w-1/2 w-full h-full bg-gray-50 lg:grid items-center hidden">
            <div className="relative items-center justify-center flex z-1">
              {/* <!-- ===== Common Grid Shape Start ===== --> */}
              <div className="opacity-30">
                <GridShape />
              </div>
              <div className="flex flex-col items-center max-w-sm">
                <div className="block mb-6">
                  <Image
                    width={180}
                    height={48}
                    src="/Logo.svg"
                    alt="Logo"
                    className="dark:brightness-0 dark:invert"
                  />
                </div>
                <p className="text-center text-gray-700 text-lg font-medium">
                  Manage. Automate. Grow.
                </p>
                <p className="text-center text-gray-500 text-sm mt-2">
                  Your all-in-one business management platform
                </p>
              </div>
            </div>
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}
