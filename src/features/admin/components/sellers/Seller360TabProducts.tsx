/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  Package,
  Power,
  Search,
  ShoppingBasket,
  UtensilsCrossed,
  XCircle,
} from 'lucide-react';
import {
  CategoryRecord,
  ProductModerationStatus,
  UniversalProductRecord,
} from '../../../../types/admin';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Modal } from '../../../../components/ui/Modal';
import { Pagination } from '../../../../components/data-display/Pagination';
import { EmptyState } from '../../../../components/feedback/EmptyState';
import { formatINR } from '../../../../utils/currency';

const PAGE_SIZE = 5;

const MODERATION_META: Record<
  ProductModerationStatus,
  { label: string; variant: 'success' | 'warning' | 'error' | 'info' }
> = {
  APPROVED: { label: 'Approved', variant: 'success' },
  PENDING_REVIEW: { label: 'Pending Review', variant: 'warning' },
  CHANGES_REQUESTED: { label: 'Changes Requested', variant: 'info' },
  REJECTED: { label: 'Rejected', variant: 'error' },
};

export interface Seller360TabProductsProps {
  products: UniversalProductRecord[];
  categories: CategoryRecord[];
  canManageProducts: boolean;
  canApproveProducts: boolean;
  onToggleAvailability: (productId: string) => void;
  onModerateProduct: (productId: string, status: ProductModerationStatus, notes: string) => void;
}

export const Seller360TabProducts: React.FC<Seller360TabProductsProps> = ({
  products,
  categories,
  canManageProducts,
  canApproveProducts,
  onToggleAvailability,
  onModerateProduct,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [viewingProduct, setViewingProduct] = useState<UniversalProductRecord | null>(null);
  const [rejectingProduct, setRejectingProduct] = useState<UniversalProductRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const catNameById = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  const sellerCategories = useMemo(() => {
    const ids = Array.from(new Set(products.map((p) => p.categoryId)));
    return ids.map((id) => ({ id, name: catNameById.get(id) || id }));
  }, [products, catNameById]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter !== 'ALL' && p.categoryId !== categoryFilter) return false;
      if (statusFilter === 'AVAILABLE' && !p.isAvailable) return false;
      if (statusFilter === 'UNAVAILABLE' && p.isAvailable) return false;
      if (
        ['APPROVED', 'PENDING_REVIEW', 'REJECTED', 'CHANGES_REQUESTED'].includes(statusFilter) &&
        p.moderationStatus !== statusFilter
      ) {
        return false;
      }
      if (q) {
        const hay = `${p.name} ${p.sku} ${p.hindiName || ''} ${catNameById.get(p.categoryId) || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, search, categoryFilter, statusFilter, catNameById]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage]
  );

  const getStockLabel = (p: UniversalProductRecord) => {
    if (p.inventoryMode === 'PREPARED_FOOD' || p.inventoryMode === 'MADE_TO_ORDER') {
      return p.prepTimeMinutes ? `Fresh (${p.prepTimeMinutes}m)` : 'Made to Order';
    }
    if (p.variants.length > 0) {
      const total = p.variants.reduce((s, v) => s + v.stockQuantity, 0);
      return `${total} (${p.variants.length} variants)`;
    }
    return `${p.stockQuantity ?? 0} in stock`;
  };

  return (
    <div className="space-y-4 text-left text-xs">
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#E5E7EB]">
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search product name or SKU..."
            className="w-full h-9 pl-9 pr-3 bg-white border border-[#E5E7EB] rounded-xl text-xs outline-none focus:border-[#218838]"
          />
        </div>
        <div className="sm:col-span-4">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="w-full h-9 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1F2937] outline-none focus:border-[#218838]"
          >
            <option value="ALL">All Categories</option>
            {sellerCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full h-9 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1F2937] outline-none focus:border-[#218838]"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available / Active</option>
            <option value="UNAVAILABLE">Inactive / Unavailable</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="w-6 h-6" />}
          title={products.length === 0 ? 'No products listed yet' : 'No matching seller products'}
          description={
            products.length === 0
              ? 'This seller has not added any catalog items yet.'
              : 'Adjust search or category/status filters to inspect seller inventory.'
          }
          actionText={products.length > 0 ? 'Reset Filters' : undefined}
          onAction={
            products.length > 0
              ? () => {
                  setSearch('');
                  setCategoryFilter('ALL');
                  setStatusFilter('ALL');
                  setPage(1);
                }
              : undefined
          }
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F8FAFC] text-[#6B7280] uppercase tracking-wider font-semibold border-b border-[#E5E7EB] text-[11px]">
                  <tr>
                    <th className="py-3 px-3.5">Product</th>
                    <th className="py-3 px-3.5">Category</th>
                    <th className="py-3 px-3.5">SKU</th>
                    <th className="py-3 px-3.5 text-right">Price</th>
                    <th className="py-3 px-3.5">Stock</th>
                    <th className="py-3 px-3.5">Availability</th>
                    <th className="py-3 px-3.5">Approval</th>
                    <th className="py-3 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {paginated.map((p) => {
                    const modMeta = MODERATION_META[p.moderationStatus];
                    return (
                      <tr key={p.id} className="hover:bg-[#F8FAFC]/80">
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-[#E8F5E9] text-[#218838] flex items-center justify-center shrink-0">
                              {p.vertical === 'FOOD' ? (
                                <UtensilsCrossed className="w-4 h-4" />
                              ) : (
                                <ShoppingBasket className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-[#1F2937]">{p.name}</p>
                              {p.hindiName && (
                                <p className="text-[10px] text-[#6B7280]">{p.hindiName}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-[#475569]">
                          {catNameById.get(p.categoryId) || p.vertical}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-[11px] text-[#475569]">
                          {p.sku}
                        </td>
                        <td className="py-3 px-3.5 text-right font-bold text-[#1F2937] whitespace-nowrap">
                          {formatINR(p.pricePaise)}
                        </td>
                        <td className="py-3 px-3.5 text-[#475569] whitespace-nowrap">
                          {getStockLabel(p)}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <Badge variant={p.isAvailable ? 'success' : 'neutral'} size="sm" dot>
                            {p.isAvailable ? 'Available' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <Badge variant={modMeta.variant} size="sm">
                            {modMeta.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingProduct(p)}
                              leftIcon={<Eye className="w-3.5 h-3.5" />}
                            >
                              View
                            </Button>
                            {canManageProducts && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => onToggleAvailability(p.id)}
                                leftIcon={<Power className="w-3.5 h-3.5" />}
                              >
                                {p.isAvailable ? 'Deactivate' : 'Activate'}
                              </Button>
                            )}
                            {canApproveProducts && p.moderationStatus !== 'APPROVED' && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() =>
                                  onModerateProduct(p.id, 'APPROVED', 'Approved from Seller 360°')
                                }
                              >
                                Approve
                              </Button>
                            )}
                            {canApproveProducts && p.moderationStatus === 'PENDING_REVIEW' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setRejectingProduct(p);
                                  setRejectReason('');
                                  setRejectError('');
                                }}
                              >
                                Reject
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2.5">
            {paginated.map((p) => {
              const modMeta = MODERATION_META[p.moderationStatus];
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-[#1F2937]">{p.name}</p>
                      <p className="font-mono text-[11px] text-[#6B7280]">
                        {p.sku} • {catNameById.get(p.categoryId) || p.vertical}
                      </p>
                    </div>
                    <p className="font-black text-[#1F2937]">{formatINR(p.pricePaise)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={p.isAvailable ? 'success' : 'neutral'} size="sm" dot>
                      {p.isAvailable ? 'Available' : 'Inactive'}
                    </Badge>
                    <Badge variant={modMeta.variant} size="sm">
                      {modMeta.label}
                    </Badge>
                    <span className="text-[11px] text-[#6B7280]">• {getStockLabel(p)}</span>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5 pt-1">
                    <Button variant="ghost" size="sm" onClick={() => setViewingProduct(p)}>
                      View
                    </Button>
                    {canManageProducts && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onToggleAvailability(p.id)}
                      >
                        {p.isAvailable ? 'Deactivate' : 'Activate'}
                      </Button>
                    )}
                    {canApproveProducts && p.moderationStatus !== 'APPROVED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          onModerateProduct(p.id, 'APPROVED', 'Approved from Seller 360°')
                        }
                      >
                        Approve
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            totalRecords={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Product Detail Quick Modal */}
      <Modal
        isOpen={Boolean(viewingProduct)}
        onClose={() => setViewingProduct(null)}
        title={viewingProduct?.name || 'Product Details'}
        description={viewingProduct ? `SKU ${viewingProduct.sku} • ${viewingProduct.vertical}` : undefined}
        size="md"
        footer={
          <Button variant="secondary" size="sm" onClick={() => setViewingProduct(null)}>
            Close
          </Button>
        }
      >
        {viewingProduct && (
          <div className="space-y-3 text-left text-xs">
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl">
              <div>
                <p className="text-[11px] text-[#6B7280]">Selling Price / MRP</p>
                <p className="font-black text-[#1F2937]">
                  {formatINR(viewingProduct.pricePaise)}{' '}
                  <span className="line-through text-[#6B7280] font-normal">
                    {formatINR(viewingProduct.mrpPaise)}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Inventory / Stock</p>
                <p className="font-bold text-[#1F2937]">{getStockLabel(viewingProduct)}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Category</p>
                <p className="font-semibold text-[#1F2937]">
                  {catNameById.get(viewingProduct.categoryId) || viewingProduct.categoryId}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Status</p>
                <Badge variant={MODERATION_META[viewingProduct.moderationStatus].variant} size="sm">
                  {MODERATION_META[viewingProduct.moderationStatus].label}
                </Badge>
              </div>
            </div>
            {viewingProduct.description && (
              <p className="text-[#475569] leading-relaxed">{viewingProduct.description}</p>
            )}
            {viewingProduct.variants.length > 0 && (
              <div className="space-y-1.5">
                <p className="font-bold text-[#1F2937]">Variants ({viewingProduct.variants.length})</p>
                <div className="divide-y divide-[#E5E7EB] border border-[#E5E7EB] rounded-xl">
                  {viewingProduct.variants.map((v) => (
                    <div key={v.id} className="px-3 py-2 flex justify-between">
                      <span className="font-semibold text-[#1F2937]">
                        {v.label} <span className="font-mono text-[#6B7280]">({v.sku})</span>
                      </span>
                      <span className="font-bold text-[#1F2937]">
                        {formatINR(v.pricePaise)} • Stock {v.stockQuantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Product Confirmation Modal */}
      <Modal
        isOpen={Boolean(rejectingProduct)}
        onClose={() => setRejectingProduct(null)}
        title={`Reject Product: ${rejectingProduct?.name || ''}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setRejectingProduct(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              leftIcon={<XCircle className="w-3.5 h-3.5" />}
              onClick={() => {
                if (!rejectingProduct) return;
                if (!rejectReason.trim()) {
                  setRejectError('Provide a reason for rejecting this listing.');
                  return;
                }
                onModerateProduct(rejectingProduct.id, 'REJECTED', rejectReason.trim());
                setRejectingProduct(null);
              }}
            >
              Confirm Reject
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-left text-xs">
          {rejectError && (
            <p className="p-2 rounded-lg bg-[#FEE2E2] text-[#DC2626] font-semibold">{rejectError}</p>
          )}
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => {
              setRejectReason(e.target.value);
              setRejectError('');
            }}
            placeholder="Reason for rejecting this product listing..."
            className="w-full p-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#DC2626]"
          />
        </div>
      </Modal>
    </div>
  );
};
