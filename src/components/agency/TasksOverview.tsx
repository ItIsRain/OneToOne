"use client";
import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import { AddTaskModal } from "./modals";

interface Task {
  id: number;
  title: string;
  client: string;
  event: string;
  priority: "High" | "Medium" | "Low";
  status: "To Do" | "In Progress" | "Done";
  dueDate: string;
}

const tasksData: Task[] = [
  {
    id: 1,
    title: "Finalize venue contract",
    client: "TechStart Inc.",
    event: "Product Launch",
    priority: "High",
    status: "In Progress",
    dueDate: "2025-02-10",
  },
  {
    id: 2,
    title: "Send invitations",
    client: "Metro Events",
    event: "Annual Gala",
    priority: "High",
    status: "To Do",
    dueDate: "2025-02-08",
  },
  {
    id: 3,
    title: "Design event materials",
    client: "GlobalTech Solutions",
    event: "Tech Conference",
    priority: "Medium",
    status: "In Progress",
    dueDate: "2025-02-05",
  },
  {
    id: 4,
    title: "Coordinate catering",
    client: "Acme Corporation",
    event: "Team Building",
    priority: "Medium",
    status: "Done",
    dueDate: "2025-01-28",
  },
  {
    id: 5,
    title: "Review audio/visual setup",
    client: "Creative Co.",
    event: "Brand Workshop",
    priority: "Low",
    status: "Done",
    dueDate: "2025-02-03",
  },
];

export const TasksOverview = () => {
  const [filter, setFilter] = useState<"all" | "To Do" | "In Progress" | "Done">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredTasks = filter === "all"
    ? tasksData
    : tasksData.filter((task) => task.status === filter);

  return (
    <>
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Tasks
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track and manage all tasks
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
          >
            <option value="all">All Status</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            Add Task
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className={`flex flex-col gap-4 p-4 rounded-xl border sm:flex-row sm:items-center sm:justify-between ${
              task.status === "Done"
                ? "border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h4
                  className={`font-medium text-theme-sm ${
                    task.status === "Done"
                      ? "text-gray-400 line-through"
                      : "text-gray-800 dark:text-white/90"
                  }`}
                >
                  {task.title}
                </h4>
                <Badge
                  size="sm"
                  color={
                    task.priority === "High"
                      ? "error"
                      : task.priority === "Medium"
                      ? "warning"
                      : "light"
                  }
                >
                  {task.priority}
                </Badge>
              </div>
              <p className="text-gray-500 text-theme-xs dark:text-gray-400">
                {task.client} • {task.event}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Badge
                size="sm"
                color={
                  task.status === "To Do"
                    ? "light"
                    : task.status === "In Progress"
                    ? "primary"
                    : "success"
                }
              >
                {task.status}
              </Badge>
              <div className="text-right">
                <p className="text-gray-500 text-theme-xs dark:text-gray-400">
                  Due{" "}
                  {new Date(task.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <button className="text-brand-500 hover:text-brand-600 dark:text-brand-400 text-theme-sm font-medium">
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>

    <AddTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
