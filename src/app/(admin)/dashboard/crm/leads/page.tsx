"use client";
import React, { useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddLeadModal } from "@/components/agency/modals";

interface Lead {
  id: number;
  name: string;
  email: string;
  company: string;
  source: string;
  status: "New" | "Contacted" | "Qualified" | "Proposal" | "Won" | "Lost";
  value: string;
  createdAt: string;
}

const leadsData: Lead[] = [
  { id: 1, name: "Alex Thompson", email: "alex@startup.io", company: "StartupIO", source: "Website", status: "New", value: "$15,000", createdAt: "2025-01-20" },
  { id: 2, name: "Maria Garcia", email: "maria@techcorp.com", company: "TechCorp", source: "Referral", status: "Contacted", value: "$25,000", createdAt: "2025-01-18" },
  { id: 3, name: "James Lee", email: "james@innovate.co", company: "Innovate Co", source: "LinkedIn", status: "Qualified", value: "$40,000", createdAt: "2025-01-15" },
  { id: 4, name: "Sarah Wilson", email: "sarah@enterprise.com", company: "Enterprise Ltd", source: "Conference", status: "Proposal", value: "$80,000", createdAt: "2025-01-10" },
  { id: 5, name: "Mike Chen", email: "mike@growth.io", company: "GrowthIO", source: "Cold Email", status: "Won", value: "$32,000", createdAt: "2025-01-05" },
];

export default function LeadsPage() {
  const [filter, setFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredLeads = filter === "all" ? leadsData : leadsData.filter(lead => lead.status === filter);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Leads</h1>
            <p className="text-gray-500 dark:text-gray-400">Track and convert potential clients</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="all">All Leads</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Proposal">Proposal</option>
            </select>
            <button
              onClick={() => setIsModalOpen(true)}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              Add Lead
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="py-3 px-6 text-left text-xs font-medium text-gray-500">Lead</TableCell>
                <TableCell isHeader className="py-3 px-6 text-left text-xs font-medium text-gray-500">Company</TableCell>
                <TableCell isHeader className="py-3 px-6 text-left text-xs font-medium text-gray-500">Source</TableCell>
                <TableCell isHeader className="py-3 px-6 text-left text-xs font-medium text-gray-500">Value</TableCell>
                <TableCell isHeader className="py-3 px-6 text-left text-xs font-medium text-gray-500">Status</TableCell>
                <TableCell isHeader className="py-3 px-6 text-left text-xs font-medium text-gray-500">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white/90">{lead.name}</p>
                      <p className="text-xs text-gray-500">{lead.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6 text-gray-500">{lead.company}</TableCell>
                  <TableCell className="py-4 px-6 text-gray-500">{lead.source}</TableCell>
                  <TableCell className="py-4 px-6 font-medium text-gray-800 dark:text-white/90">{lead.value}</TableCell>
                  <TableCell className="py-4 px-6">
                    <Badge size="sm" color={
                      lead.status === "Won" ? "success" :
                      lead.status === "Lost" ? "error" :
                      lead.status === "Proposal" ? "primary" :
                      lead.status === "Qualified" ? "warning" : "light"
                    }>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <button className="text-brand-500 hover:text-brand-600 text-sm font-medium">View</button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <AddLeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
