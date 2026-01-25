"use client";

import React from "react";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const data = [42000, 58000, 45000, 72000, 68000, 84000];
const maxValue = Math.max(...data);

export function RevenueChart() {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Revenue Overview
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monthly revenue for 2024
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            $369K
          </p>
          <p className="text-sm text-brand-500 font-medium">+18% from last year</p>
        </div>
      </div>

      {/* Simple Bar Chart */}
      <div className="flex items-end gap-4 h-48 mt-8">
        {data.map((value, index) => (
          <div key={months[index]} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex flex-col items-center">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                ${(value / 1000).toFixed(0)}K
              </span>
              <div
                className="w-full max-w-[40px] rounded-t-lg bg-brand-500 transition-all hover:bg-brand-600"
                style={{
                  height: `${(value / maxValue) * 140}px`,
                }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {months[index]}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-brand-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Target</span>
        </div>
      </div>
    </div>
  );
}
