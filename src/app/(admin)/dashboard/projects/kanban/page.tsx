"use client";
import React, { useState } from "react";
import { AddTaskModal } from "@/components/agency/modals";

const columns = [
  {
    name: "To Do",
    tasks: [
      { id: 1, title: "Design homepage mockup", project: "Website Redesign", priority: "High" },
      { id: 2, title: "Write API documentation", project: "Mobile App", priority: "Medium" },
    ],
  },
  {
    name: "In Progress",
    tasks: [
      { id: 3, title: "Develop user authentication", project: "Mobile App", priority: "High" },
      { id: 4, title: "Create brand guidelines", project: "Brand Identity", priority: "Medium" },
      { id: 5, title: "Set up CI/CD pipeline", project: "E-commerce", priority: "Low" },
    ],
  },
  {
    name: "Review",
    tasks: [
      { id: 6, title: "Review landing page copy", project: "Marketing Campaign", priority: "Medium" },
    ],
  },
  {
    name: "Done",
    tasks: [
      { id: 7, title: "Setup project repository", project: "Mobile App", priority: "High" },
      { id: 8, title: "Initial client meeting", project: "Website Redesign", priority: "High" },
    ],
  },
];

const priorityColors = {
  High: "bg-error-100 text-error-600 dark:bg-error-500/20 dark:text-error-400",
  Medium: "bg-warning-100 text-warning-600 dark:bg-warning-500/20 dark:text-warning-400",
  Low: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
};

export default function KanbanPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Kanban Board</h1>
            <p className="text-gray-500 dark:text-gray-400">Drag and drop tasks to update status</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Add Task
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <div key={column.name} className="min-w-[300px] flex-shrink-0">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white/90">{column.name}</h3>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                    {column.tasks.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {column.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm cursor-move hover:shadow-md transition-shadow dark:border-gray-700 dark:bg-gray-800"
                    >
                      <h4 className="font-medium text-gray-800 dark:text-white/90 mb-2">{task.title}</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{task.project}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AddTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
