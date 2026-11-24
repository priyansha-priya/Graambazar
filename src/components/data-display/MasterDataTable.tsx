/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  Search,
  X,
  RotateCcw,
  Eye,
  Edit3,
  Power,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Pagination } from './Pagination';
import { EmptyState } from '../feedback/EmptyState';
import { Spinner } from '../feedback/Loader';

export interface MasterTableColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  cellClassName?: string;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  render: (row: T, index: number) => React.ReactNode;
}

export interface MasterTableFilterOption {
  value: string;
  label: string;
}

export interface MasterTableFilterConfig<T> {
  id: string;
  label: string;
  allLabel: string;
  options: MasterTableFilterOption[];
  defaultValue?: string;
  predicate: (row: T, selectedValue: string) => boolean;
}

export interface MasterTableExtraAction<T> {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: (row: T) => void;
  visible?: (row: T) => boolean;
  variant?: 'default' | 'primary' | 'danger';
}

export interface MasterTableActionsConfig<T> {
  canManage: boolean;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onToggleStatus?: (row: T) => void;
  onDelete?: (row: T) => void;
  extraActions?: MasterTableExtraAction<T>[];
  getRowLabel?: (row: T) => string;
}

export interface MasterDataTableProps<T extends { id: string; isActive?: boolean }> {
  data: T[];
  columns: MasterTableColumn<T>[];
  searchMatcher: (row: T, query: string) => boolean;
  searchPlaceholder?: string;
  filters?: MasterTableFilterConfig<T>[];
  enableStatusFilter?: boolean;
  showStatusColumn?: boolean;
  statusAccessor?: (row: T) => boolean;
  actions?: MasterTableActionsConfig<T>;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  defaultSort?: { key: string; direction: 'asc' | 'desc' };
  onFilterStateChange?: (filterValues: Record<string, string>) => void;
  isLoading?: boolean;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  toolbarRight?: React.ReactNode;
  rowClassName?: (row: T) => string;
  className?: string;
}

const ALIGN_CLASSES: Record<'left' | 'center' | 'right', string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

const EXTRA_ACTION_STYLES: Record<'default' | 'primary' | 'danger', string> = {
  default:
    'border-[#E5E7EB] bg-white text-[#475569] hover:text-[#218838] hover:border-[#218838] hover:bg-[#E8F5E9]/40',
  primary:
    'border-[#E5E7EB] bg-white text-[#475569] hover:text-[#2563EB] hover:border-[#2563EB] hover:bg-blue-50',
  danger:
    'border-[#E5E7EB] bg-white text-[#475569] hover:text-[#DC2626] hover:border-red-300 hover:bg-red-50',
};

export function MasterDataTable<T extends { id: string; isActive?: boolean }>({
  data,
  columns,
  searchMatcher,
  searchPlaceholder = 'Search records...',
  filters = [],
  enableStatusFilter = true,
  showStatusColumn = true,
  statusAccessor,
  actions,
  defaultPageSize = 8,
  pageSizeOptions = [8, 15, 25],
  defaultSort,
  onFilterStateChange,
  isLoading = false,
  emptyIcon,
  emptyTitle = 'No records found',
  emptyDescription = 'No records match your current search or filter criteria.',
  emptyActionLabel,
  onEmptyAction,
  toolbarRight,
  rowClassName,
  className = '',
}: MasterDataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [filterValues, setFilterValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    filters.forEach((f) => {
      initial[f.id] = f.defaultValue ?? 'ALL';
    });
    return initial;
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    defaultSort ?? null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const resolveStatus = (row: T): boolean =>
    statusAccessor ? statusAccessor(row) : Boolean(row.isActive);

  const handleFilterChange = (filterId: string, value: string) => {
    setFilterValues((prev) => {
      const next = { ...prev, [filterId]: value };
      if (onFilterStateChange) {
        onFilterStateChange(next);
      }
      return next;
    });
    setCurrentPage(1);
  };

  const activeCustomFilterCount = filters.reduce((count, f) => {
    const val = filterValues[f.id] ?? 'ALL';
    return val !== 'ALL' ? count + 1 : count;
  }, 0);

  const activeFilterCount =
    activeCustomFilterCount +
    (searchQuery.trim() !== '' ? 1 : 0) +
    (enableStatusFilter && statusFilter !== 'ALL' ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    const resetMap: Record<string, string> = {};
    filters.forEach((f) => {
      resetMap[f.id] = 'ALL';
    });
    setFilterValues(resetMap);
    if (onFilterStateChange) {
      onFilterStateChange(resetMap);
    }
    setCurrentPage(1);
  };

  const handleToggleSort = (columnKey: string) => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== columnKey) {
        return { key: columnKey, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { key: columnKey, direction: 'desc' };
      }
      return null;
    });
    setCurrentPage(1);
  };

  const filteredAndSortedData = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filtered = data.filter((row) => {
      if (normalizedQuery && !searchMatcher(row, normalizedQuery)) {
        return false;
      }

      if (enableStatusFilter && statusFilter !== 'ALL') {
        const isRowActive = resolveStatus(row);
        if (statusFilter === 'ACTIVE' && !isRowActive) return false;
        if (statusFilter === 'INACTIVE' && isRowActive) return false;
      }

      for (const filter of filters) {
        const selectedVal = filterValues[filter.id] ?? 'ALL';
        if (selectedVal !== 'ALL' && !filter.predicate(row, selectedVal)) {
          return false;
        }
      }

      return true;
    });

    if (!sortConfig) {
      return filtered;
    }

    const targetCol = columns.find((col) => col.key === sortConfig.key);
    if (!targetCol || !targetCol.sortValue) {
      return filtered;
    }

    const getVal = targetCol.sortValue;
    return [...filtered].sort((a, b) => {
      const aVal = getVal(a);
      const bVal = getVal(b);

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const comparison = String(aVal).localeCompare(String(bVal), undefined, {
        numeric: true,
        sensitivity: 'base',
      });
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [
    data,
    searchQuery,
    searchMatcher,
    enableStatusFilter,
    statusFilter,
    filters,
    filterValues,
    sortConfig,
    columns,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedData.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRows = useMemo(
    () => filteredAndSortedData.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredAndSortedData, safePage, pageSize]
  );

  const hasActionsColumn = Boolean(
    actions &&
      (actions.onView ||
        (actions.canManage &&
          (actions.onEdit ||
            actions.onToggleStatus ||
            actions.onDelete ||
            (actions.extraActions && actions.extraActions.length > 0))) ||
        (actions.extraActions && actions.extraActions.length > 0))
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Standardized Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search
              className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="w-full h-10 pl-10 pr-9 bg-[#F8FAFC] border border-[#E5E7EB] rounded-full text-xs text-[#1F2937] placeholder:text-[#6B7280] outline-none focus:border-[#218838] focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                aria-label="Clear search"
                title="Clear search"
                className="w-6 h-6 rounded-full text-[#6B7280] hover:text-[#1F2937] hover:bg-slate-200/70 flex items-center justify-center absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns & Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {filters.map((filter) => (
              <select
                key={filter.id}
                value={filterValues[filter.id] ?? 'ALL'}
                onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                aria-label={filter.label}
                className="h-10 px-3.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-full text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838] focus:bg-white transition-colors cursor-pointer"
              >
                <option value="ALL">{filter.allLabel}</option>
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ))}

            {enableStatusFilter && (
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE');
                  setCurrentPage(1);
                }}
                aria-label="Filter by status"
                className="h-10 px-3.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-full text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838] focus:bg-white transition-colors cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
            )}

            {toolbarRight}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset ({activeFilterCount})
              </Button>
            )}
          </div>
        </div>

        {/* Subtle Result Meta & Rows-Per-Page Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#E5E7EB]/70 text-[11px] text-[#6B7280]">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#218838]" />
            <span>
              <strong className="text-[#1F2937]">{filteredAndSortedData.length}</strong> of{' '}
              <strong className="text-[#1F2937]">{data.length}</strong> records matched
              {hasActiveFilters ? ' (filtered)' : ''}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="master-table-page-size" className="text-[11px] text-[#6B7280]">
              Rows per page:
            </label>
            <select
              id="master-table-page-size"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-7 px-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-[11px] font-semibold text-[#1F2937] outline-none focus:border-[#218838] cursor-pointer"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading, Empty, or Data Table View */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 flex justify-center shadow-xs">
          <Spinner size="lg" message="Loading master records..." />
        </div>
      ) : paginatedRows.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={
            hasActiveFilters
              ? 'No records match your current search or filters. Clear filters to view all items.'
              : emptyDescription
          }
          actionText={hasActiveFilters ? 'Reset Filters' : emptyActionLabel}
          onAction={hasActiveFilters ? resetFilters : onEmptyAction}
        />
      ) : (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#F8FAFC] text-[#6B7280] uppercase tracking-wider font-semibold border-b border-[#E5E7EB]">
                  <tr>
                    {columns.map((col) => {
                      const isSorted = sortConfig?.key === col.key;
                      const alignClass = ALIGN_CLASSES[col.align || 'left'];
                      return (
                        <th
                          key={col.key}
                          style={col.width ? { width: col.width } : undefined}
                          className={`py-3.5 px-4 whitespace-nowrap select-none ${alignClass}`}
                        >
                          {col.sortable && col.sortValue ? (
                            <button
                              type="button"
                              onClick={() => handleToggleSort(col.key)}
                              className={`inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider hover:text-[#1F2937] transition-colors cursor-pointer ${
                                isSorted ? 'text-[#218838]' : 'text-[#6B7280]'
                              }`}
                            >
                              <span>{col.header}</span>
                              {isSorted ? (
                                sortConfig.direction === 'asc' ? (
                                  <ArrowUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ArrowDown className="w-3.5 h-3.5" />
                                )
                              ) : (
                                <ArrowUpDown className="w-3 h-3 opacity-60" />
                              )}
                            </button>
                          ) : (
                            col.header
                          )}
                        </th>
                      );
                    })}

                    {showStatusColumn && (
                      <th className="py-3.5 px-4 whitespace-nowrap select-none">Status</th>
                    )}

                    {hasActionsColumn && (
                      <th className="py-3.5 px-4 text-right whitespace-nowrap select-none">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E5E7EB]">
                  {paginatedRows.map((row, idx) => {
                    const isRowActive = resolveStatus(row);
                    const rowLabel = actions?.getRowLabel ? actions.getRowLabel(row) : 'record';

                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-[#F8FAFC]/80 transition-colors ${
                          rowClassName ? rowClassName(row) : ''
                        }`}
                      >
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className={`py-3.5 px-4 ${ALIGN_CLASSES[col.align || 'left']} ${
                              col.cellClassName || ''
                            }`}
                          >
                            {col.render(row, idx)}
                          </td>
                        ))}

                        {showStatusColumn && (
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <Badge variant={isRowActive ? 'success' : 'neutral'} size="sm" dot>
                              {isRowActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                        )}

                        {hasActionsColumn && actions && (
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              {actions.extraActions?.map((extra) => {
                                if (extra.visible && !extra.visible(row)) return null;
                                const styleClass =
                                  EXTRA_ACTION_STYLES[extra.variant || 'default'];
                                return (
                                  <button
                                    key={extra.id}
                                    type="button"
                                    onClick={() => extra.onClick(row)}
                                    title={extra.label}
                                    aria-label={`${extra.label}: ${rowLabel}`}
                                    className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#218838] ${styleClass}`}
                                  >
                                    {extra.icon}
                                  </button>
                                );
                              })}

                              {actions.onView && (
                                <button
                                  type="button"
                                  onClick={() => actions.onView!(row)}
                                  title="View Details"
                                  aria-label={`View ${rowLabel}`}
                                  className="w-8 h-8 rounded-full border border-[#E5E7EB] bg-white text-[#475569] hover:text-[#218838] hover:border-[#218838] hover:bg-[#E8F5E9]/40 flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#218838]"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {actions.canManage && actions.onEdit && (
                                <button
                                  type="button"
                                  onClick={() => actions.onEdit!(row)}
                                  title="Edit"
                                  aria-label={`Edit ${rowLabel}`}
                                  className="w-8 h-8 rounded-full border border-[#E5E7EB] bg-white text-[#475569] hover:text-[#2563EB] hover:border-[#2563EB] hover:bg-blue-50 flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {actions.canManage && actions.onToggleStatus && (
                                <button
                                  type="button"
                                  onClick={() => actions.onToggleStatus!(row)}
                                  title={isRowActive ? 'Mark Inactive' : 'Mark Active'}
                                  aria-label={`${
                                    isRowActive ? 'Deactivate' : 'Activate'
                                  } ${rowLabel}`}
                                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#218838] ${
                                    isRowActive
                                      ? 'border-emerald-200 bg-emerald-50 text-[#16A34A] hover:bg-amber-50 hover:text-[#D97706] hover:border-amber-200'
                                      : 'border-slate-200 bg-slate-100 text-[#6B7280] hover:bg-emerald-50 hover:text-[#16A34A] hover:border-emerald-200'
                                  }`}
                                >
                                  <Power className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {actions.canManage && actions.onDelete && (
                                <button
                                  type="button"
                                  onClick={() => actions.onDelete!(row)}
                                  title="Delete"
                                  aria-label={`Delete ${rowLabel}`}
                                  className="w-8 h-8 rounded-full border border-[#E5E7EB] bg-white text-[#475569] hover:text-[#DC2626] hover:border-red-300 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            totalRecords={filteredAndSortedData.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
