/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  History,
  Search,
  Eye,
  Lock,
  Download,
  Archive,
  RotateCcw,
  Code2,
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { AuditLogRecord } from '../../types/admin';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { exportToCsv } from '../../utils/exportCsv';

export const AdminAuditLogsView: React.FC = () => {
  const { auditLogs, clearAuditLogs, hasPermission } = useAdmin();

  const canManage = hasPermission('AUDIT_LOGS', 'manage');
  const canExport = hasPermission('AUDIT_LOGS', 'export');

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);

  const actorRoles = useMemo(() => {
    const roles = new Set<string>();
    auditLogs.forEach((l) => roles.add(l.actorRole));
    return Array.from(roles).sort();
  }, [auditLogs]);

  const targetEntities = useMemo(() => {
    const entities = new Set<string>();
    auditLogs.forEach((l) => entities.add(l.targetEntity));
    return Array.from(entities).sort();
  }, [auditLogs]);

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return auditLogs.filter((log) => {
      const matchesSearch =
        !q ||
        log.actionType.toLowerCase().includes(q) ||
        log.actor.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.targetEntity.toLowerCase().includes(q) ||
        log.targetId.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'ALL' || log.actorRole === roleFilter;
      const matchesEntity = entityFilter === 'ALL' || log.targetEntity === entityFilter;
      return matchesSearch && matchesRole && matchesEntity;
    });
  }, [auditLogs, searchQuery, roleFilter, entityFilter]);

  const hasActiveFilters =
    searchQuery.trim() !== '' || roleFilter !== 'ALL' || entityFilter !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setRoleFilter('ALL');
    setEntityFilter('ALL');
  };

  const handleExportAuditCsv = () => {
    exportToCsv(
      `grambazaar_audit_trail_${new Date().toISOString().split('T')[0]}`,
      [
        { header: 'Event ID', accessor: (l) => l.id },
        { header: 'Exact Timestamp', accessor: (l) => l.timestamp },
        { header: 'Actor Name', accessor: (l) => l.actor },
        { header: 'Actor Role', accessor: (l) => l.actorRole },
        { header: 'Action Event', accessor: (l) => l.actionType },
        { header: 'Target Entity', accessor: (l) => l.targetEntity },
        { header: 'Target ID', accessor: (l) => l.targetId },
        { header: 'IP Address', accessor: (l) => l.ipAddress },
        { header: 'Audit Details', accessor: (l) => l.details },
        { header: 'Compliance Reason', accessor: (l) => l.reason || 'N/A' },
      ],
      filteredLogs
    );
  };

  const handleConfirmArchive = () => {
    clearAuditLogs();
    setIsArchiveConfirmOpen(false);
    setSelectedLog(null);
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl font-black text-[#1F2937]">
              Immutable Security & Operations Audit Trail
            </h1>
            <Badge variant="primary">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3" /> Append-Only
              </span>
            </Badge>
          </div>
          <p className="text-xs text-[#6B7280]">
            Every privileged action, RBAC change, catalog moderation, seller status change, fee rule update, and KYC decision is immutably timestamped.
          </p>
        </div>

        {/* Search, Export & Archive */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search action, actor, entity..."
              className="w-full h-10 pl-10 pr-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-full text-xs text-[#1F2937] outline-none focus:border-[#218838]"
            />
          </div>
          {canExport && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportAuditCsv}
              disabled={filteredLogs.length === 0}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export CSV
            </Button>
          )}
          {canManage && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsArchiveConfirmOpen(true)}
              leftIcon={<Archive className="w-3.5 h-3.5" />}
            >
              Archive Trail
            </Button>
          )}
        </div>
      </div>

      {/* Role & Entity Filters */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#6B7280]">Actor Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838]"
            >
              <option value="ALL">All Roles</option>
              {actorRoles.map((role) => (
                <option key={role} value={role}>
                  {role.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#6B7280]">Target Entity:</span>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="h-9 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838]"
            >
              <option value="ALL">All Entities</option>
              {targetEntities.map((entity) => (
                <option key={entity} value={entity}>
                  {entity}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#6B7280]">
          <span>
            Showing <strong className="text-[#1F2937]">{filteredLogs.length}</strong> of{' '}
            {auditLogs.length} events
          </span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        {filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8FAFC] text-[#6B7280] uppercase tracking-wider font-semibold border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Actor & Role</th>
                  <th className="py-3.5 px-4">Action Event</th>
                  <th className="py-3.5 px-4">Target Entity</th>
                  <th className="py-3.5 px-4">Audit Details</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[#6B7280] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-[#1F2937]">{log.actor}</p>
                      <span className="text-[10px] text-[#218838] font-semibold">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#1F2937]">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[#6B7280]">{log.targetEntity}</span>
                      <span className="text-[10px] text-[#9CA3AF] block font-mono">
                        #{log.targetId}
                      </span>
                    </td>
                    <td
                      className="py-3.5 px-4 text-[#1F2937] max-w-xs truncate"
                      title={log.details}
                    >
                      {log.details}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8">
            <EmptyState
              icon={<History className="w-6 h-6" />}
              title="No audit events match your filter"
              description="Clear search terms or role/entity filters to inspect the full governance trail."
              actionText={hasActiveFilters ? 'Reset Filters' : undefined}
              onAction={hasActiveFilters ? resetFilters : undefined}
            />
          </div>
        )}
      </div>

      {/* Archive Trail Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isArchiveConfirmOpen}
        onClose={() => setIsArchiveConfirmOpen(false)}
        onConfirm={handleConfirmArchive}
        title="Archive Current Audit Trail?"
        message="This will clear historical entries from the active view and write a new append-only AUDIT_LOG_ARCHIVED checkpoint event."
        confirmText="Archive Trail"
        cancelText="Cancel"
        isDestructive={true}
      />

      {/* Audit Detail Drawer */}
      <Drawer
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={selectedLog ? `Audit Event Record: ${selectedLog.id}` : 'Event Record'}
      >
        {selectedLog && (
          <div className="space-y-5 text-left text-xs">
            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] space-y-2">
              <div className="flex justify-between gap-2">
                <span className="text-[#6B7280]">Event ID:</span>
                <span className="font-mono font-bold text-[#1F2937]">{selectedLog.id}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#6B7280]">Exact Timestamp:</span>
                <span className="font-mono text-[#1F2937]">{selectedLog.timestamp}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#6B7280]">Network IP Address:</span>
                <span className="font-mono text-[#1F2937]">{selectedLog.ipAddress}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#6B7280]">Actor Identity:</span>
                <span className="font-bold text-[#1F2937]">
                  {selectedLog.actor} ({selectedLog.actorRole})
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-[#6B7280] uppercase tracking-wider">
                Action Type & Target
              </span>
              <div className="p-3 bg-white rounded-xl border border-[#E5E7EB] space-y-1">
                <p className="font-mono font-bold text-[#1F2937] text-sm">
                  {selectedLog.actionType}
                </p>
                <p className="text-[#6B7280]">
                  Target Entity:{' '}
                  <strong className="text-[#1F2937]">{selectedLog.targetEntity}</strong> • ID:{' '}
                  <span className="font-mono">{selectedLog.targetId}</span>
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-[#6B7280] uppercase tracking-wider">
                Full Event Description
              </span>
              <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] text-[#1F2937] leading-relaxed">
                {selectedLog.details}
              </div>
            </div>

            {selectedLog.reason && (
              <div className="space-y-1">
                <span className="font-bold text-[#6B7280] uppercase tracking-wider">
                  Mandatory Justification / Compliance Reason
                </span>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 leading-relaxed italic">
                  "{selectedLog.reason}"
                </div>
              </div>
            )}

            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <div className="space-y-1">
                <span className="font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Structured Event Payload (Metadata)</span>
                </span>
                <pre className="p-3.5 bg-slate-900 text-emerald-300 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};
