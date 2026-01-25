"use client";
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { AddClientModal } from "./modals";

interface Client {
  id: number;
  name: string;
  email: string;
  company: string;
  status: "Active" | "Inactive" | "Pending";
  totalEvents: number;
  revenue: string;
}

const clientsData: Client[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah@acmecorp.com",
    company: "Acme Corporation",
    status: "Active",
    totalEvents: 12,
    revenue: "$45,200",
  },
  {
    id: 2,
    name: "Michael Chen",
    email: "m.chen@techstart.io",
    company: "TechStart Inc.",
    status: "Active",
    totalEvents: 8,
    revenue: "$32,800",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    email: "emily@globaltech.com",
    company: "GlobalTech Solutions",
    status: "Pending",
    totalEvents: 3,
    revenue: "$12,500",
  },
  {
    id: 4,
    name: "James Wilson",
    email: "j.wilson@metro.events",
    company: "Metro Events",
    status: "Active",
    totalEvents: 15,
    revenue: "$67,300",
  },
  {
    id: 5,
    name: "Lisa Thompson",
    email: "lisa@creativeco.com",
    company: "Creative Co.",
    status: "Inactive",
    totalEvents: 5,
    revenue: "$18,900",
  },
];

export const ClientsTable = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Clients
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage your client relationships
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
              Filter
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            >
              Add Client
            </button>
          </div>
        </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Client
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Company
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Status
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Events
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Revenue
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {clientsData.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="py-3">
                  <div>
                    <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {client.name}
                    </p>
                    <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                      {client.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {client.company}
                </TableCell>
                <TableCell className="py-3">
                  <Badge
                    size="sm"
                    color={
                      client.status === "Active"
                        ? "success"
                        : client.status === "Pending"
                        ? "warning"
                        : "error"
                    }
                  >
                    {client.status}
                  </Badge>
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {client.totalEvents}
                </TableCell>
                <TableCell className="py-3 font-medium text-gray-800 text-theme-sm dark:text-white/90">
                  {client.revenue}
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-2">
                    <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                      Edit
                    </button>
                    <button className="text-error-500 hover:text-error-600">
                      Delete
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>

    <AddClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
  </>
  );
};
