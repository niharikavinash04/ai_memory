import React from 'react';
import { Settings, Server, Cpu, CheckCircle2, XCircle, Info, FileCode } from 'lucide-react';
import type { SystemHealthResponse } from '../api/types';

interface SettingsPageProps {
  health: SystemHealthResponse | null;
  rootInfo: SystemHealthResponse | null;
  isBackendHealthy: boolean | null;
  onRefreshHealth: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  health: _health,
  rootInfo,
  isBackendHealthy,
  onRefreshHealth,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center">
            <Settings className="w-5 h-5 mr-2 text-indigo-400" />
            System Status & Remote MCP Parameters
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Inspect backend connectivity, remote MCP Streamable HTTP configuration, and API specifications
          </p>
        </div>
        <button
          onClick={onRefreshHealth}
          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 font-medium transition-colors"
        >
          Ping Health Endpoint
        </button>
      </div>

      {/* Grid: Health Status & MCP Setup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend Status Card */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center">
              <Server className="w-4 h-4 mr-2 text-indigo-400" />
              FastAPI Backend Service
            </h3>
            {isBackendHealthy === true ? (
              <span className="inline-flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Connected (200 OK)
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                <XCircle className="w-3.5 h-3.5 mr-1" />
                Unreachable
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
              <span className="text-slate-400">Base API URL:</span>
              <code className="text-indigo-300 font-mono">
                {import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}
              </code>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
              <span className="text-slate-400">Application Name:</span>
              <span className="text-white font-medium">{rootInfo?.app || 'AI Work Memory'}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
              <span className="text-slate-400">Environment:</span>
              <span className="text-emerald-400 font-medium">{rootInfo?.environment || 'development'}</span>
            </div>
          </div>
        </div>

        {/* MCP Status Card */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center">
              <Cpu className="w-4 h-4 mr-2 text-indigo-400" />
              Streamable HTTP MCP Server
            </h3>
            <span className="inline-flex items-center text-xs font-semibold text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              Protocol v2.0.0
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
              <span className="text-slate-400">MCP Streamable Path:</span>
              <code className="text-indigo-300 font-mono">/mcp</code>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
              <span className="text-slate-400">Supported Transports:</span>
              <span className="text-slate-200">Streamable HTTP + Stdio</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
              <span className="text-slate-400">Claude.ai Tunnel URL:</span>
              <span className="text-slate-400 font-mono text-[11px]">ngrok / cloudflared required</span>
            </div>
          </div>
        </div>
      </div>

      {/* API Endpoint Capabilities Specification */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4 text-xs">
        <h3 className="text-sm font-bold text-white flex items-center">
          <FileCode className="w-4 h-4 mr-2 text-indigo-400" />
          Backend API Capabilities Breakdown
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Supported Endpoints */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="font-semibold text-emerald-400 flex items-center text-xs">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Supported Backend Endpoints (100% Functional)
            </span>
            <ul className="space-y-1.5 font-mono text-[11px] text-slate-300">
              <li className="p-1.5 rounded bg-slate-900 border border-slate-800/80">
                <strong className="text-emerald-400">POST</strong> /api/v1/knowledge/publish
              </li>
              <li className="p-1.5 rounded bg-slate-900 border border-slate-800/80">
                <strong className="text-indigo-400">GET</strong> /api/v1/knowledge/search?q=...
              </li>
              <li className="p-1.5 rounded bg-slate-900 border border-slate-800/80">
                <strong className="text-indigo-400">GET</strong> /api/v1/inbox
              </li>
              <li className="p-1.5 rounded bg-slate-900 border border-slate-800/80">
                <strong className="text-indigo-400">GET</strong> /api/v1/inbox/{'{id}'}
              </li>
              <li className="p-1.5 rounded bg-slate-900 border border-slate-800/80">
                <strong className="text-emerald-400">POST</strong> /api/v1/inbox/{'{id}'}/approve
              </li>
              <li className="p-1.5 rounded bg-slate-900 border border-slate-800/80">
                <strong className="text-rose-400">POST</strong> /api/v1/inbox/{'{id}'}/reject
              </li>
              <li className="p-1.5 rounded bg-slate-900 border border-slate-800/80">
                <strong className="text-indigo-400">GET</strong> /health & /mcp
              </li>
            </ul>
          </div>

          {/* Missing Endpoints Analysis */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="font-semibold text-amber-400 flex items-center text-xs">
              <Info className="w-4 h-4 mr-1.5" />
              Future Endpoint Requirements (Not Yet Implemented)
            </span>
            <ul className="space-y-1.5 font-mono text-[11px] text-slate-400">
              <li className="p-1.5 rounded bg-slate-900 border border-slate-800/80">
                <strong className="text-amber-400">PUT</strong> /api/v1/knowledge/{'{id}'}
                <span className="block text-[10px] text-slate-500">Required to edit existing title, context, or output.</span>
              </li>
              <li className="p-1.5 rounded bg-slate-900 border border-slate-800/80">
                <strong className="text-amber-400">DELETE</strong> /api/v1/knowledge/{'{id}'}
                <span className="block text-[10px] text-slate-500">Required to purge/archive knowledge records.</span>
              </li>
              <li className="p-1.5 rounded bg-slate-900 border border-slate-800/80">
                <strong className="text-amber-400">GET</strong> /api/v1/knowledge (List All)
                <span className="block text-[10px] text-slate-500">Required to list all approved items with pagination without search query.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
