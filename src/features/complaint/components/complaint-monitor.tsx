import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import {
  ChevronDown,
  Clock,
  CheckCircle2,
  MapPin,
  Loader2,
  Trophy,
  Download,
  FileSpreadsheet,
  FileDown,
  X,
  UserCheck,
  Trash2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { useComplaints, complaintKeys } from '@/features/complaint/api/use-complaints';
import { grievanceKeys } from '@/features/auth/grievance/api/use-grievances';
import { leaderboardKeys } from '@/features/gamification/api/use-leaderboard';
import { profileKeys } from '@/features/gamification/api/use-user-profile';
import { communityKeys } from '@/features/community/api/use-community-feed';
import { ImageLightbox } from '@/features/auth/grievance/components/image-lightbox';
import { Pagination } from '@/components/ui/pagination';
import {
  URGENCY_BADGE,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  STATUS_LABELS,
  URGENCY_LABELS,
} from '@/features/complaint/constants';
import type { Complaint, ComplaintUrgency, ComplaintStatus } from '@/features/complaint/types';
import { useApproveComplaint } from '@/features/complaint/api/use-approve-complaint';
import { useDisapproveComplaint } from '@/features/complaint/api/use-disapprove-complaint';
import { awardPointsForStatus } from '@/features/complaint/utils/award-points';

type ActiveTab = 'total' | 'unapproved' | ComplaintStatus;

export const ComplaintMonitor = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [activeTab, setActiveTab] = useState<ActiveTab>('total');
  const [urgencyFilter, setUrgencyFilter] = useState<ComplaintUrgency | 'all'>('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [previewComplaint, setPreviewComplaint] = useState<Complaint | null>(null);
  const [disapproveConfirmId, setDisapproveConfirmId] = useState<string | null>(null);
  const [bulkDisapprove, setBulkDisapprove] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const { data: complaints = [], isLoading, error: queryError } = useComplaints();
  const approveComplaint = useApproveComplaint();
  const disapproveComplaint = useDisapproveComplaint();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusChange = async (id: string, newStatus: ComplaintStatus) => {
    const current = complaints.find((c) => c.id === id);
    if (!current || current.status === newStatus) return;

    const updates: Record<string, unknown> = {
      status: newStatus,
    };
    if (newStatus === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }

    const childUpdates: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'resolved') {
      childUpdates.resolved_at = new Date().toISOString();
    }

    // Capture children before optimistic update
    const children = !current.parent_id ? complaints.filter((c) => c.parent_id === id) : [];

    // Optimistic update for master and all children
    queryClient.setQueryData<Complaint[]>(complaintKeys.all, (old) =>
      (old ?? []).map((c) => {
        if (c.id === id) return { ...c, ...updates } as Complaint;
        if (c.parent_id === id) return { ...c, ...childUpdates } as Complaint;
        return c;
      }),
    );

    try {
      // Update master complaint
      const { error: supabaseError } = await supabase
        .from('grievances')
        .update(updates)
        .eq('id', id);

      if (supabaseError) throw supabaseError;

      // Award points for master (master rules)
      await awardPointsForStatus(current.reporter_id, id, current.status, newStatus);

      // Cascade to children
      if (children.length > 0) {
        const { error: childrenError } = await supabase
          .from('grievances')
          .update(childUpdates)
          .eq('parent_id', id);

        if (childrenError) throw childrenError;

        await Promise.all(
          children.map((child) =>
            awardPointsForStatus(child.reporter_id, child.id, child.status, newStatus, true),
          ),
        );
      }

      queryClient.invalidateQueries({ queryKey: grievanceKeys.all });
      queryClient.invalidateQueries({ queryKey: leaderboardKeys.all() });
      queryClient.invalidateQueries({ queryKey: profileKeys.current() });
      queryClient.invalidateQueries({ queryKey: complaintKeys.all });
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    } catch (err: unknown) {
      queryClient.invalidateQueries({ queryKey: complaintKeys.all });
      const message =
        err instanceof Error
          ? err.message
          : ((err as { message?: string })?.message ?? 'Unknown error');
      alert(`Failed to update status: ${message}`);
    }
  };

  useEffect(() => {
    startTransition(() => {
      setSelectedIds(new Set());
    });
  }, [activeTab]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((c) => c.id)));
    }
  };

  const handleBulkApprove = async () => {
    const ids = Array.from(selectedIds);
    setSelectedIds(new Set());
    await Promise.all(ids.map((id) => approveComplaint.mutateAsync(id)));
  };

  const handleBulkReject = async () => {
    const ids = Array.from(selectedIds);
    setSelectedIds(new Set());
    setBulkDisapprove(false);
    await Promise.all(ids.map((id) => disapproveComplaint.mutateAsync(id)));
  };

  const handleUrgencyChange = async (id: string, newUrgency: ComplaintUrgency) => {
    const current = complaints.find((c) => c.id === id);
    if (!current || current.urgency === newUrgency) return;

    queryClient.setQueryData<Complaint[]>(complaintKeys.all, (old) =>
      (old ?? []).map((c) => (c.id === id ? { ...c, urgency: newUrgency } : c)),
    );

    try {
      const { error: supabaseError } = await supabase
        .from('grievances')
        .update({ urgency: newUrgency })
        .eq('id', id);

      if (supabaseError) throw supabaseError;

      queryClient.invalidateQueries({ queryKey: grievanceKeys.all });
    } catch (err: unknown) {
      queryClient.invalidateQueries({ queryKey: complaintKeys.all });
      const message =
        err instanceof Error
          ? err.message
          : ((err as { message?: string })?.message ?? 'Unknown error');
      alert(`Failed to update urgency: ${message}`);
    }
  };

  const filtered = complaints
    .filter((c): c is NonNullable<typeof c> => c != null)
    .filter((c) => {
      if (activeTab === 'total') return true;
      if (activeTab === 'unapproved') return !c.approved;
      return c.status === activeTab;
    })
    .filter((c) => urgencyFilter === 'all' || c.urgency === urgencyFilter);

  const colCount = activeTab === 'unapproved' ? 5 : 6;
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedIds.size > 0 && selectedIds.size < paginated.length;
    }
  }, [selectedIds, paginated.length]);

  const summary = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === 'pending').length,
    inProgress: complaints.filter((c) => c.status === 'in-progress').length,
    resolved: complaints.filter((c) => c.status === 'resolved').length,
    unapproved: complaints.filter((c) => !c.approved).length,
  };

  const handleTabClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const buildExportData = useCallback(() => {
    const headers = [
      'Title',
      'Description',
      'Category',
      'Urgency',
      'Status',
      'Points',
      'Location',
      'Image URL',
      'Date Created',
    ];
    const rows = complaints.map((c) => ({
      Title: c.title,
      Description: c.description,
      Category: CATEGORY_LABELS[c.category] || c.category,
      Urgency: URGENCY_LABELS[c.urgency] || c.urgency,
      Status: STATUS_LABELS[c.status] || c.status,
      Points: (() => {
        const statusPoints: Record<string, number> = { pending: 1, 'in-progress': 2, resolved: 4 };
        return statusPoints[c.status] ?? 1;
      })(),
      Location: c.location || '',
      'Image URL': c.image_url || '',
      'Date Created': c.created_at?.split('T')[0] || '',
    }));
    return { headers, rows };
  }, [complaints]);

  const downloadCSV = useCallback(() => {
    const { headers, rows } = buildExportData();
    const csvContent = [
      headers.join(','),
      ...rows.map((r) =>
        headers.map((h) => `"${String(r[h as keyof typeof r]).replace(/"/g, '""')}"`).join(','),
      ),
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `complaint-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDropdownOpen(false);
  }, [buildExportData]);

  const downloadExcel = useCallback(() => {
    const { rows } = buildExportData();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Complaints');
    XLSX.writeFile(wb, `complaint-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    setDropdownOpen(false);
  }, [buildExportData]);

  const tabCard = (
    tab: ActiveTab,
    label: string,
    count: number,
    bgColor: string,
    borderColor: string,
    icon: React.ReactNode,
    textColor: string,
    ringColor: string,
  ) => {
    const isActive = activeTab === tab;
    return (
      <button
        type="button"
        onClick={() => handleTabClick(tab)}
        className="group relative cursor-pointer rounded-xl border p-3.5 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
        style={{
          backgroundColor: isActive ? bgColor : '#ffffff',
          borderColor: isActive ? ringColor : borderColor,
        }}
      >
        {isActive && (
          <span
            className="absolute top-2.5 right-2.5 h-1 w-1 rounded-full"
            style={{ backgroundColor: ringColor }}
          />
        )}
        <div className="flex items-center justify-between">
          <p
            className={`text-[10px] font-bold tracking-wide uppercase transition-colors duration-200 ${
              isActive ? '' : 'group-hover:text-gray-700'
            }`}
            style={{ color: isActive ? textColor : '#72796e' }}
          >
            {label}
          </p>
          {icon && (
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200 ${
                isActive ? 'scale-110 shadow-xs' : 'group-hover:scale-105'
              }`}
              style={{
                backgroundColor: isActive ? `${textColor}15` : '#f5f5f4',
              }}
            >
              {icon}
            </div>
          )}
        </div>
        <p
          className={`mt-1 text-xl font-bold tracking-tight transition-all duration-200 ${
            isActive ? '' : 'group-hover:scale-105'
          }`}
          style={{ color: isActive ? textColor : '#1c1b1b' }}
        >
          {count}
        </p>
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: '#154212' }}
          >
            <MapPin className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-bold tracking-tight" style={{ color: '#1c1b1b' }}>
            Complaint Monitoring
          </h2>
        </div>
        <div className="relative self-start" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all hover:scale-105"
            style={{ backgroundColor: '#154212', color: '#ffffff' }}
          >
            <Download className="h-4 w-4" />
            Download Report
            <ChevronDown className="h-3 w-3" />
          </button>
          {dropdownOpen && (
            <div
              className="absolute right-0 z-50 mt-1 w-48 overflow-hidden rounded-xl border shadow-lg"
              style={{ backgroundColor: '#ffffff', borderColor: '#e5e2e1' }}
            >
              <button
                type="button"
                onClick={downloadExcel}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-semibold transition-all hover:bg-gray-50"
                style={{ color: '#42493e' }}
              >
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                Download as Excel (.xlsx)
              </button>
              <div className="border-t" style={{ borderColor: '#e5e2e1' }} />
              <button
                type="button"
                onClick={downloadCSV}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-semibold transition-all hover:bg-gray-50"
                style={{ color: '#42493e' }}
              >
                <FileDown className="h-4 w-4 text-blue-600" />
                Download as CSV (.csv)
              </button>
            </div>
          )}
        </div>
      </div>

      {queryError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-600">
          Error:{' '}
          {queryError instanceof Error
            ? queryError.message
            : 'An error occurred while loading complaints.'}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tabCard('total', 'Total', summary.total, '#ffffff', '#e5e2e1', null, '#1c1b1b', '#1c1b1b')}
        {tabCard(
          'pending',
          'Pending',
          summary.pending,
          '#fffbeb',
          '#fde68a',
          <Clock className="h-4 w-4 text-orange-500" />,
          '#d97706',
          '#d97706',
        )}
        {tabCard(
          'in-progress',
          'In Progress',
          summary.inProgress,
          '#eff6ff',
          '#93c5fd',
          <MapPin className="h-4 w-4 text-blue-500" />,
          '#2563eb',
          '#2563eb',
        )}
        {tabCard(
          'resolved',
          'Resolved',
          summary.resolved,
          '#f0fdf4',
          '#86efac',
          <CheckCircle2 className="h-4 w-4 text-green-500" />,
          '#16a34a',
          '#16a34a',
        )}
        {tabCard(
          'unapproved',
          'Unapproved',
          summary.unapproved,
          '#fef2f2',
          '#fca5a5',
          <UserCheck className="h-4 w-4 text-red-500" />,
          '#dc2626',
          '#dc2626',
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-bold tracking-wide uppercase"
            style={{ color: '#72796e' }}
          >
            Urgency:
          </span>
          <select
            value={urgencyFilter}
            onChange={(e) => {
              setUrgencyFilter(e.target.value as ComplaintUrgency | 'all');
              setCurrentPage(1);
            }}
            className="rounded-md border px-2 py-1 text-[11px] transition-all outline-none"
            style={{ borderColor: '#c2c9bb', color: '#42493e' }}
          >
            <option value="all">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        {activeTab !== 'total' || urgencyFilter !== 'all' ? (
          <button
            onClick={() => {
              setActiveTab('total');
              setUrgencyFilter('all');
              setCurrentPage(1);
            }}
            className="rounded-md px-2 py-1 text-[11px] font-semibold transition-all hover:scale-105"
            style={{ color: '#72796e' }}
          >
            Clear
          </button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {activeTab === 'unapproved' && (
                  <th className="w-12 bg-slate-50/75 px-4 py-3.5">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={paginated.length > 0 && selectedIds.size === paginated.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 cursor-pointer rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                  </th>
                )}
                <th className="bg-slate-50/75 px-4 py-3.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  Complaint
                </th>
                <th className="bg-slate-50/75 px-4 py-3.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  Category
                </th>
                {activeTab !== 'unapproved' && (
                  <>
                    <th className="bg-slate-50/75 px-4 py-3.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Urgency
                    </th>
                    <th className="bg-slate-50/75 px-4 py-3.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Status
                    </th>
                    <th className="bg-slate-50/75 px-4 py-3.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Points
                    </th>
                  </>
                )}
                <th className="bg-slate-50/75 px-4 py-3.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  Image
                </th>
                {activeTab === 'unapproved' ? (
                  <th className="bg-slate-50/75 px-4 py-3.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                    Actions
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-xs">Loading grievances...</span>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-16 text-center text-sm text-slate-300">
                    No complaints match the selected filters
                  </td>
                </tr>
              ) : (
                paginated.map((complaint) => (
                  <tr
                    key={complaint.id}
                    className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/50"
                  >
                    {activeTab === 'unapproved' && (
                      <td className="w-12 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(complaint.id)}
                          onChange={() => toggleSelect(complaint.id)}
                          className="h-4 w-4 cursor-pointer rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div
                        className="max-w-[220px] cursor-pointer"
                        onClick={() => setPreviewComplaint(complaint)}
                      >
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {complaint.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-400">
                          {complaint.description}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full ring-1 ring-slate-900/5"
                          style={{
                            backgroundColor: CATEGORY_COLORS[complaint.category] || '#6b7280',
                          }}
                        />
                        <span className="text-xs font-medium text-slate-600">
                          {CATEGORY_LABELS[complaint.category] || complaint.category}
                        </span>
                      </div>
                    </td>
                    {activeTab !== 'unapproved' && (
                      <>
                        <td className="px-4 py-3">
                          <select
                            value={complaint.urgency}
                            onChange={(e) =>
                              handleUrgencyChange(complaint.id, e.target.value as ComplaintUrgency)
                            }
                            className="cursor-pointer appearance-none rounded-lg border bg-white px-2 py-1 pr-2 text-xs font-bold tracking-wide uppercase transition-all outline-none"
                            style={{
                              borderColor: URGENCY_BADGE[complaint.urgency]?.text || '#c2c9bb',
                              backgroundColor: URGENCY_BADGE[complaint.urgency]?.bg || '#f3f4f6',
                              color: URGENCY_BADGE[complaint.urgency]?.text || '#1f2937',
                            }}
                          >
                            {Object.entries(URGENCY_LABELS).map(([key, label]) => (
                              <option key={key} value={key} className="bg-white text-slate-800">
                                {label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={complaint.status}
                            onChange={(e) =>
                              handleStatusChange(complaint.id, e.target.value as ComplaintStatus)
                            }
                            className={`cursor-pointer appearance-none rounded-lg border px-2 py-1 pr-2 text-xs font-bold tracking-wide uppercase transition-all outline-none ${
                              complaint.status === 'resolved'
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-500'
                                : complaint.status === 'in-progress'
                                  ? 'border-blue-500 bg-blue-50 text-blue-500'
                                  : 'border-orange-500 bg-orange-50 text-orange-500'
                            }`}
                          >
                            {Object.entries(STATUS_LABELS).map(([key, label]) => (
                              <option key={key} value={key} className="bg-white text-slate-800">
                                {label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Trophy className="h-3.5 w-3.5 text-amber-500" />
                            <span className="text-sm font-bold text-slate-700">
                              {(() => {
                                const statusPoints: Record<string, number> = {
                                  pending: 1,
                                  'in-progress': 2,
                                  resolved: 4,
                                };
                                return statusPoints[complaint.status] ?? 1;
                              })()}
                            </span>
                            <span className="text-[10px] text-slate-400">/ 4 pts</span>
                          </div>
                        </td>
                      </>
                    )}
                    <td className="px-4 py-3">
                      {complaint.image_url ? (
                        activeTab === 'unapproved' ? (
                          <ImageLightbox
                            src={complaint.image_url}
                            alt={complaint.title}
                            className="h-14 w-28 rounded-lg border border-slate-200/60 object-cover shadow-xs transition-all hover:scale-105 hover:ring-2 hover:ring-slate-300"
                          />
                        ) : (
                          <div className="relative">
                            <img
                              src={complaint.image_url}
                              alt={complaint.title}
                              onClick={() => setPreviewComplaint(complaint)}
                              className="h-14 w-28 cursor-pointer rounded-lg border border-slate-200/60 object-cover shadow-xs transition-all hover:scale-105 hover:ring-2 hover:ring-slate-300"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="absolute inset-0 flex hidden items-center justify-center rounded-lg border border-slate-200/60 bg-slate-50">
                              <div className="flex flex-col items-center gap-1 text-slate-300">
                                <svg
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={1.5}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 0 0 1.5-1.5V5.25a1.5 1.5 0 0 0-1.5-1.5H3.75a1.5 1.5 0 0 0-1.5 1.5v14.25c0 .828.672 1.5 1.5 1.5Z"
                                  />
                                </svg>
                                <span className="text-[10px]">No image</span>
                              </div>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="flex h-14 w-28 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50">
                          <svg
                            className="h-5 w-5 text-slate-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 0 0 1.5-1.5V5.25a1.5 1.5 0 0 0-1.5-1.5H3.75a1.5 1.5 0 0 0-1.5 1.5v14.25c0 .828.672 1.5 1.5 1.5Z"
                            />
                          </svg>
                        </div>
                      )}
                    </td>
                    {activeTab === 'unapproved' ? (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => approveComplaint.mutate(complaint.id)}
                            disabled={
                              approveComplaint.isPending &&
                              approveComplaint.variables === complaint.id
                            }
                            className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-amber-600 px-3 py-1 text-xs font-bold text-white transition-all hover:bg-amber-700 disabled:opacity-50"
                          >
                            <UserCheck className="h-3 w-3" />
                            {approveComplaint.isPending &&
                            approveComplaint.variables === complaint.id
                              ? '...'
                              : 'Approve'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDisapproveConfirmId(complaint.id)}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white transition-all hover:bg-red-700"
                            title="Permanently delete this report"
                          >
                            <Trash2 className="h-3 w-3" />
                            Reject
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {activeTab === 'unapproved' && selectedIds.size > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-amber-50/50 px-4 py-2.5">
            <span className="text-xs font-semibold text-amber-800">
              {selectedIds.size} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBulkApprove}
                disabled={approveComplaint.isPending}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-amber-600 px-3 py-1 text-xs font-bold text-white transition-all hover:bg-amber-700 disabled:opacity-50"
              >
                <UserCheck className="h-3 w-3" />
                {approveComplaint.isPending ? 'Approving...' : 'Approve All'}
              </button>
              <button
                type="button"
                onClick={() => setBulkDisapprove(true)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white transition-all hover:bg-red-700"
              >
                <Trash2 className="h-3 w-3" />
                Reject All
              </button>
            </div>
          </div>
        )}
        <div className="px-4 py-3">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(count) => {
              setItemsPerPage(count);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {previewComplaint &&
        (() => {
          const statusPoints: Record<string, number> = {
            pending: 1,
            'in-progress': 2,
            resolved: 4,
          };
          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
              onClick={() => setPreviewComplaint(null)}
            >
              <div
                className="mx-4 w-full max-w-lg rounded-xl border bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
                style={{ borderColor: '#e5e2e1' }}
              >
                <div className="mb-4 flex items-start justify-between">
                  <h3 className="text-sm font-bold" style={{ color: '#1c1b1b' }}>
                    Complaint Details
                  </h3>
                  <button
                    type="button"
                    onClick={() => setPreviewComplaint(null)}
                    className="rounded-lg p-1 transition-all hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" style={{ color: '#72796e' }} />
                  </button>
                </div>
                {previewComplaint.image_url && (
                  <div className="mb-4 overflow-hidden rounded-lg">
                    <ImageLightbox
                      src={previewComplaint.image_url}
                      alt={previewComplaint.title}
                      className="max-h-64 w-full rounded-lg object-cover"
                    />
                  </div>
                )}
                <div className="space-y-2 text-xs">
                  <p className="text-sm font-bold" style={{ color: '#1c1b1b' }}>
                    {previewComplaint.title}
                  </p>
                  <p style={{ color: '#72796e' }}>{previewComplaint.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                      style={{
                        backgroundColor: CATEGORY_COLORS[previewComplaint.category]
                          ? `${CATEGORY_COLORS[previewComplaint.category]}1a`
                          : '#f3f4f6',
                        color: CATEGORY_COLORS[previewComplaint.category] || '#6b7280',
                      }}
                    >
                      {CATEGORY_LABELS[previewComplaint.category] || previewComplaint.category}
                    </span>
                    <select
                      value={previewComplaint.urgency}
                      onChange={(e) => {
                        handleUrgencyChange(
                          previewComplaint.id,
                          e.target.value as ComplaintUrgency,
                        );
                        setPreviewComplaint(
                          (prev) =>
                            prev && { ...prev, urgency: e.target.value as ComplaintUrgency },
                        );
                      }}
                      className="cursor-pointer rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase outline-none"
                      style={{
                        backgroundColor: URGENCY_BADGE[previewComplaint.urgency]?.bg || '#f3f4f6',
                        color: URGENCY_BADGE[previewComplaint.urgency]?.text || '#6b7280',
                        borderColor: 'transparent',
                      }}
                    >
                      {(Object.keys(URGENCY_LABELS) as ComplaintUrgency[]).map((key) => (
                        <option key={key} value={key}>
                          {URGENCY_LABELS[key]}
                        </option>
                      ))}
                    </select>
                    <select
                      value={previewComplaint.status}
                      onChange={(e) => {
                        handleStatusChange(previewComplaint.id, e.target.value as ComplaintStatus);
                        setPreviewComplaint(
                          (prev) => prev && { ...prev, status: e.target.value as ComplaintStatus },
                        );
                      }}
                      className={`cursor-pointer rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase outline-none ${
                        previewComplaint.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-500'
                          : previewComplaint.status === 'in-progress'
                            ? 'bg-blue-50 text-blue-500'
                            : 'bg-orange-50 text-orange-500'
                      }`}
                    >
                      {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {previewComplaint.location && (
                    <p style={{ color: '#72796e' }}>
                      <span className="font-medium">Location:</span> {previewComplaint.location}
                    </p>
                  )}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div>
                      <p className="text-[10px] font-bold tracking-wide text-gray-400 uppercase">
                        Latitude
                      </p>
                      <p className="font-mono text-[11px]" style={{ color: '#42493e' }}>
                        {previewComplaint.latitude}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-wide text-gray-400 uppercase">
                        Longitude
                      </p>
                      <p className="font-mono text-[11px]" style={{ color: '#42493e' }}>
                        {previewComplaint.longitude}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-wide text-gray-400 uppercase">
                        Reporter
                      </p>
                      <p className="truncate font-mono text-[11px]" style={{ color: '#42493e' }}>
                        {previewComplaint.reporter_id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <p className="text-[10px] font-bold tracking-wide text-gray-400 uppercase">
                        Resolved At
                      </p>
                      <p style={{ color: '#42493e' }}>
                        {previewComplaint.resolved_at
                          ? new Date(previewComplaint.resolved_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-wide text-gray-400 uppercase">
                        Bonus
                      </p>
                      <p style={{ color: '#42493e' }}>{previewComplaint.bonus_awarded}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-wide text-gray-400 uppercase">
                        Approved
                      </p>
                      {previewComplaint.approved ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600">
                          <X className="h-3 w-3" />
                          No
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="h-3 w-3 text-amber-500" />
                      <span className="text-sm font-bold" style={{ color: '#42493e' }}>
                        {statusPoints[previewComplaint.status] ?? 1}
                      </span>
                      <span className="text-[10px]" style={{ color: '#c2c9bb' }}>
                        / 4
                      </span>
                    </div>
                  </div>
                </div>
                {previewComplaint.resolved_image_url && (
                  <div className="mt-3">
                    <p className="text-[10px] font-bold tracking-wide text-gray-400 uppercase">
                      Resolved Image
                    </p>
                    <ImageLightbox
                      src={previewComplaint.resolved_image_url}
                      alt="Resolved"
                      className="mt-1 max-h-40 w-full rounded-lg object-contain shadow-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      {bulkDisapprove && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setBulkDisapprove(false)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-xl border bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-sm font-bold" style={{ color: '#1c1b1b' }}>
              Reject {selectedIds.size} Complaints?
            </h3>
            <p className="mb-1 text-xs" style={{ color: '#72796e' }}>
              This will permanently delete all {selectedIds.size} selected grievances. Any points
              awarded will be revoked. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBulkDisapprove(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                style={{ color: '#72796e' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkReject}
                disabled={disapproveComplaint.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {disapproveComplaint.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                {disapproveComplaint.isPending ? 'Removing...' : `Yes, Delete All`}
              </button>
            </div>
          </div>
        </div>
      )}
      {disapproveConfirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setDisapproveConfirmId(null)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-xl border bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-sm font-bold" style={{ color: '#1c1b1b' }}>
              Disapprove Complaint?
            </h3>
            <p className="mb-1 text-xs" style={{ color: '#72796e' }}>
              This will permanently delete the grievance. Any points awarded will be revoked. This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDisapproveConfirmId(null)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                style={{ color: '#72796e' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  disapproveComplaint.mutate(disapproveConfirmId);
                  setDisapproveConfirmId(null);
                }}
                disabled={disapproveComplaint.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {disapproveComplaint.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                {disapproveComplaint.isPending ? 'Removing...' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
