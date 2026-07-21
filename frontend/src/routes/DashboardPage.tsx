import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FileText, Sparkles, Users, TrendingUp, AlertTriangle, Target, DollarSign, Activity } from "lucide-react";
import { Link } from "react-router-dom";

import { listReports } from "#/api/reports";
import { AppShell } from "#/components/layout/AppShell";
import { HealthScoreGauge } from "#/components/dashboard/HealthScoreGauge";
import { AGENTS } from "#/types";
import { useAuthStore } from "#/stores/authStore";

export function DashboardPage() {
  const { data: reports } = useQuery({ queryKey: ["reports"], queryFn: listReports });
  const user = useAuthStore((s) => s.user);
  const latestReport = reports?.[0];

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <AppShell title="Executive Dashboard">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full"
      >
        <div className="mb-8 flex flex-col md:flex-row items-start justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back, {user?.full_name?.split(' ')[0] || 'Executive'}</h2>
            <p className="mt-2 text-lg text-gray-500">
              Here is what your AI executive team has been analyzing today.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <Link to="/documents" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md">
                Upload Documents
             </Link>
             <Link to="/reports" className="rounded-xl bg-[#6C5CE7] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#6C5CE7]/20 transition-all hover:bg-[#5a4cdb] hover:shadow-lg hover:shadow-[#6C5CE7]/30">
                Generate Report
             </Link>
          </div>
        </div>

        {/* Top KPI Row */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
           <motion.div variants={item} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm shadow-gray-200/50 relative overflow-hidden group">
              <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-green-500/5 transition-transform group-hover:scale-110" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                 <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Revenue (Est)</h3>
                 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
                    <DollarSign className="h-4 w-4" />
                 </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 relative z-10">$1.24M</p>
              <div className="mt-2 flex items-center gap-2 text-sm relative z-10">
                 <span className="flex items-center text-green-600 font-medium"><TrendingUp className="h-3 w-3 mr-1" /> +12%</span>
                 <span className="text-gray-400">vs last quarter</span>
              </div>
           </motion.div>

           <motion.div variants={item} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm shadow-gray-200/50 relative overflow-hidden group">
              <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-red-500/5 transition-transform group-hover:scale-110" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                 <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Identified Risks</h3>
                 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                 </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 relative z-10">3</p>
              <div className="mt-2 flex items-center gap-2 text-sm relative z-10">
                 <span className="text-red-600 font-medium">Critical attention required</span>
              </div>
           </motion.div>

           <motion.div variants={item} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm shadow-gray-200/50 relative overflow-hidden group">
              <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-[#6C5CE7]/5 transition-transform group-hover:scale-110" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                 <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Opportunities</h3>
                 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6C5CE7]/10 text-[#6C5CE7]">
                    <Target className="h-4 w-4" />
                 </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 relative z-10">12</p>
              <div className="mt-2 flex items-center gap-2 text-sm relative z-10">
                 <span className="flex items-center text-[#6C5CE7] font-medium"><TrendingUp className="h-3 w-3 mr-1" /> +2</span>
                 <span className="text-gray-400">new this week</span>
              </div>
           </motion.div>

           <motion.div variants={item} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm shadow-gray-200/50 relative overflow-hidden group">
              <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-blue-500/5 transition-transform group-hover:scale-110" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                 <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Active Agents</h3>
                 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                    <Activity className="h-4 w-4" />
                 </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 relative z-10">5/5</p>
              <div className="mt-2 flex items-center gap-2 text-sm relative z-10">
                 <span className="text-blue-600 font-medium">All systems nominal</span>
              </div>
           </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
           
           {/* Left Column (2 spans wide) */}
           <div className="lg:col-span-2 space-y-6">
              
              {/* Executive Summary */}
              <motion.div variants={item} className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm shadow-gray-200/50">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6C5CE7]/10 text-[#6C5CE7]">
                       <Sparkles className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Executive Summary</h3>
                 </div>
                 
                 {latestReport ? (
                    <div className="prose prose-sm max-w-none text-gray-600">
                       <p className="line-clamp-4 leading-relaxed text-base">
                          {latestReport.summary || "Based on recent financial and operational data, the company is showing strong growth in Q3. However, there are emerging supply chain risks that the Operations Agent has flagged for review. Legal compliance is up to date, and the Strategy Agent recommends focusing on market expansion in the EU sector."}
                       </p>
                       <Link to={`/reports/${latestReport.id}`} className="mt-4 inline-flex font-semibold text-[#6C5CE7] hover:text-[#5a4cdb]">
                          Read full report &rarr;
                       </Link>
                    </div>
                 ) : (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                       <p className="mb-4 text-gray-500">No reports generated yet.</p>
                       <Link to="/reports" className="inline-flex rounded-lg bg-white border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
                          Generate your first report
                       </Link>
                    </div>
                 )}
              </motion.div>

              {/* Agent Status */}
              <motion.div variants={item} className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm shadow-gray-200/50">
                 <h3 className="text-xl font-bold text-gray-900 mb-6">Agent Status</h3>
                 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {AGENTS.map((agent) => (
                       <div key={agent.key} className="group rounded-2xl border border-gray-100 bg-gray-50/50 p-4 transition-all hover:bg-white hover:shadow-md hover:border-gray-200">
                          <div className="flex items-start justify-between mb-3">
                             <div className="flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm" style={{ backgroundColor: agent.color }}>
                                {agent.name[0]}
                             </div>
                             <div className="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                          </div>
                          <h4 className="font-bold text-gray-900">{agent.name}</h4>
                          <p className="text-xs text-gray-500 mb-3">{agent.title}</p>
                          <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                             <div className="h-full bg-green-500 rounded-full" style={{ width: "100%" }} />
                          </div>
                       </div>
                    ))}
                 </div>
              </motion.div>

           </div>

           {/* Right Column */}
           <div className="space-y-6">
              
              {/* Business Health Score */}
              <motion.div variants={item} className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm shadow-gray-200/50 flex flex-col items-center justify-center text-center">
                 <h3 className="text-lg font-bold text-gray-900 mb-2">Business Health Score</h3>
                 <p className="text-sm text-gray-500 mb-8">Overall operational and financial stability.</p>
                 <div className="scale-125 mb-4">
                    <HealthScoreGauge score={latestReport?.business_health_score || 85} size={140} compact />
                 </div>
                 <p className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full mt-4">
                    Healthy & Stable
                 </p>
              </motion.div>

              {/* Quick Actions */}
              <motion.div variants={item} className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm shadow-gray-200/50">
                 <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                 <div className="flex flex-col gap-3">
                    <Link to="/documents" className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 transition-all hover:border-gray-200 hover:bg-white hover:shadow-sm">
                       <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                          <FileText className="h-5 w-5" />
                       </div>
                       <div>
                          <p className="font-bold text-gray-900 text-sm">Upload Documents</p>
                          <p className="text-xs text-gray-500">Financials, contracts, etc.</p>
                       </div>
                    </Link>
                    <Link to="/chat" className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 transition-all hover:border-gray-200 hover:bg-white hover:shadow-sm">
                       <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                          <Users className="h-5 w-5" />
                       </div>
                       <div>
                          <p className="font-bold text-gray-900 text-sm">Consult Agents</p>
                          <p className="text-xs text-gray-500">Start a new strategy chat</p>
                       </div>
                    </Link>
                 </div>
              </motion.div>

           </div>
        </div>
      </motion.div>
    </AppShell>
  );
}
