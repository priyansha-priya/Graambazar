import React, { useState } from 'react';
import { Seller } from '../../../types/merchant';
import { FoodProduct, GroceryProduct } from '../../../types/product';
import { formatINR } from '../../../utils/currency';
import { FoodDishCard } from '../../catalog/components/FoodDishCard';
import { GroceryItemCard } from '../../catalog/components/GroceryItemCard';
import { QuantitySelector } from '../../catalog/components/QuantitySelector';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useCart } from '../../../contexts/CartContext';
import {
  ArrowLeft,
  Star,
  Clock,
  MapPin,
  Truck,
  Search,
  ShieldCheck,
  Phone,
  Info,
} from 'lucide-react';

export interface StorefrontViewProps {
  seller: Seller;
  foodItems: FoodProduct[];
  groceryItems: GroceryProduct[];
  onBack: () => void;
  onAddToCart: (item: {
    productId: string;
    productName: string;
    sellerId: string;
    sellerName: string;
    catalogueType: 'FOOD' | 'GROCERY';
    unitLabel: string;
    unitPricePaise: number;
    quantity: number;
    lineTotalPaise: number;
    customerNote?: string;
  }) => void;
}

export const StorefrontView: React.FC<StorefrontViewProps> = ({
  seller,
  foodItems,
  groceryItems,
  onBack,
  onAddToCart,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Customization modal states
  const [activeFoodToCustomize, setActiveFoodToCustomize] = useState<FoodProduct | null>(null);
  const [selectedPortionId, setSelectedPortionId] = useState<string>('regular');
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [foodCookingNote, setFoodCookingNote] = useState<string>('');

  const { items: cartItems, updateQuantity } = useCart();

  // Grocery quantity selector modal states
  const [activeGroceryToSelect, setActiveGroceryToSelect] = useState<GroceryProduct | null>(null);

  const isFood = seller.primaryVertical === 'FOOD';

  // Filter items
  const filteredFood = foodItems
    .filter((f) => f.sellerId === seller.id)
    .filter((f) => (selectedCategory === 'ALL' ? true : f.categoryId === selectedCategory))
    .filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const filteredGrocery = groceryItems
    .filter((g) => g.sellerId === seller.id)
    .filter((g) => (selectedCategory === 'ALL' ? true : g.categoryId === selectedCategory))
    .filter((g) => g.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Extract unique categories for store filter (deduplicated by categoryId)
  const categoryMap = new Map<string, string>();
  if (isFood) {
    foodItems
      .filter((f) => f.sellerId === seller.id)
      .forEach((f) => categoryMap.set(f.categoryId, f.categoryName));
  } else {
    groceryItems
      .filter((g) => g.sellerId === seller.id)
      .forEach((g) => categoryMap.set(g.categoryId, g.categoryName));
  }

  const categoryOptions = [
    { id: 'ALL', label: 'All Items' },
    ...Array.from(categoryMap.entries()).map(([id, label]) => ({ id, label })),
  ];

  // Live cart lookup helpers for instant [ -  Qty  + ] stepper in List View
  const getProductCartSummary = (productId: string) => {
    const matched = cartItems.filter(
      (ci) => ci.productId === productId && ci.sellerId === seller.id
    );
    const totalQty = matched.reduce((sum, ci) => sum + ci.quantity, 0);
    const latestEntry = matched[matched.length - 1] || null;
    return { totalQty, latestEntry };
  };

  const handleQuickAddFood = (dish: FoodProduct) => {
    onAddToCart({
      productId: dish.id,
      productName: dish.name,
      sellerId: seller.id,
      sellerName: seller.publicName,
      catalogueType: 'FOOD',
      unitLabel: `1 ${dish.unitBasis}`,
      unitPricePaise: dish.pricePaise,
      quantity: 1,
      lineTotalPaise: dish.pricePaise,
    });
  };

  const handleQuickAddGrocery = (item: GroceryProduct) => {
    const defaultOpt = item.predefinedOptions?.[0];
    const unitLabel = defaultOpt ? defaultOpt.label : `1 ${item.unitBasis}`;
    const unitPricePaise = defaultOpt ? defaultOpt.pricePaise : item.pricePaise;

    onAddToCart({
      productId: item.id,
      productName: item.name,
      sellerId: seller.id,
      sellerName: seller.publicName,
      catalogueType: 'GROCERY',
      unitLabel,
      unitPricePaise,
      quantity: 1,
      lineTotalPaise: unitPricePaise,
    });
  };

  const handleIncrementProduct = (productId: string) => {
    const { latestEntry } = getProductCartSummary(productId);
    if (latestEntry) {
      updateQuantity(latestEntry.id, latestEntry.quantity + 1);
    }
  };

  const handleDecrementProduct = (productId: string) => {
    const { latestEntry } = getProductCartSummary(productId);
    if (latestEntry) {
      updateQuantity(latestEntry.id, latestEntry.quantity - 1);
    }
  };

  const handleConfirmCustomFood = () => {
    if (!activeFoodToCustomize) return;

    let deltaPaise = 0;
    let portionLabel = 'Regular';

    if (activeFoodToCustomize.portionOptions) {
      const p = activeFoodToCustomize.portionOptions.find((opt) => opt.id === selectedPortionId);
      if (p) {
        deltaPaise += p.priceDeltaPaise;
        portionLabel = p.label;
      }
    }

    if (activeFoodToCustomize.addons) {
      activeFoodToCustomize.addons.forEach((addon) => {
        if (selectedAddonIds.includes(addon.id)) {
          deltaPaise += addon.priceDeltaPaise;
        }
      });
    }

    const finalPrice = activeFoodToCustomize.pricePaise + deltaPaise;

    onAddToCart({
      productId: activeFoodToCustomize.id,
      productName: activeFoodToCustomize.name,
      sellerId: seller.id,
      sellerName: seller.publicName,
      catalogueType: 'FOOD',
      unitLabel: portionLabel,
      unitPricePaise: finalPrice,
      quantity: 1,
      lineTotalPaise: finalPrice,
      customerNote: foodCookingNote.trim() || undefined,
    });

    setActiveFoodToCustomize(null);
    setFoodCookingNote('');
    setSelectedAddonIds([]);
  };

  return (
    <div className="flex flex-col gap-5 pb-24 text-left animate-fade-in">
      {/* Back button */}
      <div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          onClick={onBack}
        >
          Back to All Stores
        </Button>
      </div>

      {/* Store Header Hero Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            {seller.bannerUrl && (
              <img
                src={seller.bannerUrl}
                alt={seller.publicName}
                referrerPolicy="no-referrer"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-[#E5E7EB] shrink-0 shadow-xs"
              />
            )}
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="primary" size="sm">
                  {seller.villageName}
                </Badge>
                <Badge variant="neutral" size="sm">
                  {seller.sellerType}
                </Badge>
                {seller.fssaiNumber && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    FSSAI Verified
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-[#1F2937]">{seller.publicName}</h1>
              <p className="text-xs text-[#6B7280] max-w-xl">{seller.description}</p>

              <div className="flex items-center gap-2 text-xs text-[#6B7280] pt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#218838] shrink-0" />
                <span>{seller.addressLine}</span>
              </div>
            </div>
          </div>

          {/* SLA, Min Order & Contact */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <div className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl flex items-center justify-between gap-4 text-xs">
              <span className="flex items-center gap-1.5 font-bold text-[#1F2937]">
                <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                {seller.rating} ({seller.reviewCount})
              </span>
              <span className="text-[#6B7280]">
                Min Order: <strong className="text-[#1F2937]">{formatINR(seller.minimumOrderPaise)}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#6B7280]">
              <Clock className="w-3.5 h-3.5 text-[#218838]" />
              <span>Hours: {seller.operatingHours.openingTime} – {seller.operatingHours.closingTime}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#218838] font-semibold">
              <Truck className="w-3.5 h-3.5" />
              <span>Seller Managed Delivery • {formatINR(seller.deliveryFeePaise)}</span>
            </div>
          </div>
        </div>

        {/* Search within store & Category filter chips */}
        <div className="mt-6 pt-5 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categoryOptions.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#218838] text-white'
                    : 'bg-[#F1F5F9] text-[#6B7280] hover:text-[#1F2937]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in this shop..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-full outline-none focus:border-[#218838]"
            />
          </div>
        </div>
      </div>

      {/* Catalog Items List View */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm sm:text-base font-bold text-[#1F2937]">
            {isFood ? 'Menu Items' : 'Available Products'} ({isFood ? filteredFood.length : filteredGrocery.length})
          </h2>
          <span className="text-[11px] font-medium text-[#6B7280]">
            Tap ADD to adjust quantity
          </span>
        </div>

        {isFood ? (
          filteredFood.length > 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden divide-y divide-[#E5E7EB]">
              {filteredFood.map((dish) => {
                const { totalQty } = getProductCartSummary(dish.id);
                return (
                  <FoodDishCard
                    key={dish.id}
                    dish={dish}
                    quantityInCart={totalQty}
                    onQuickAdd={handleQuickAddFood}
                    onIncrement={(d) => handleIncrementProduct(d.id)}
                    onDecrement={(d) => handleDecrementProduct(d.id)}
                    onCustomize={(d) => {
                      setActiveFoodToCustomize(d);
                      setSelectedPortionId(d.portionOptions ? d.portionOptions[0].id : 'regular');
                      setSelectedAddonIds([]);
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[#6B7280] py-8 text-center bg-white rounded-2xl border border-[#E5E7EB]">
              No dishes found matching your search.
            </p>
          )
        ) : filteredGrocery.length > 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden divide-y divide-[#E5E7EB]">
            {filteredGrocery.map((item) => {
              const { totalQty, latestEntry } = getProductCartSummary(item.id);
              return (
                <GroceryItemCard
                  key={item.id}
                  item={item}
                  quantityInCart={totalQty}
                  activeUnitLabel={latestEntry?.unitLabel}
                  onQuickAdd={handleQuickAddGrocery}
                  onIncrement={(g) => handleIncrementProduct(g.id)}
                  onDecrement={(g) => handleDecrementProduct(g.id)}
                  onSelectQuantity={(g) => setActiveGroceryToSelect(g)}
                />
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[#6B7280] py-8 text-center bg-white rounded-2xl border border-[#E5E7EB]">
            No grocery items found matching your search.
          </p>
        )}
      </div>

      {/* Food Customization Modal */}
      {activeFoodToCustomize && (
        <Modal
          isOpen={true}
          onClose={() => setActiveFoodToCustomize(null)}
          title={`Customise ${activeFoodToCustomize.name}`}
          description={`From ${seller.publicName}`}
          footer={
            <>
              <Button variant="secondary" size="md" onClick={() => setActiveFoodToCustomize(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleConfirmCustomFood}>
                Add to Cart
              </Button>
            </>
          }
        >
          <div className="space-y-5 text-left text-xs">
            {/* Portions */}
            {activeFoodToCustomize.portionOptions && (
              <div>
                <label className="font-semibold uppercase tracking-wider text-[#1F2937] block mb-2">
                  Select Portion
                </label>
                <div className="space-y-2">
                  {activeFoodToCustomize.portionOptions.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${
                        selectedPortionId === opt.id
                          ? 'border-[#218838] bg-[#E8F5E9]'
                          : 'border-[#E5E7EB] bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="portion"
                          checked={selectedPortionId === opt.id}
                          onChange={() => setSelectedPortionId(opt.id)}
                          className="text-[#218838]"
                        />
                        <span className="font-medium text-[#1F2937]">{opt.label}</span>
                      </div>
                      <span className="font-bold text-[#1F2937]">
                        {opt.priceDeltaPaise === 0
                          ? formatINR(activeFoodToCustomize.pricePaise)
                          : `${opt.priceDeltaPaise > 0 ? '+' : ''}${formatINR(opt.priceDeltaPaise)}`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Add-ons */}
            {activeFoodToCustomize.addons && activeFoodToCustomize.addons.length > 0 && (
              <div>
                <label className="font-semibold uppercase tracking-wider text-[#1F2937] block mb-2">
                  Optional Add-ons
                </label>
                <div className="space-y-2">
                  {activeFoodToCustomize.addons.map((addon) => {
                    const isChecked = selectedAddonIds.includes(addon.id);
                    return (
                      <label
                        key={addon.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${
                          isChecked ? 'border-[#218838] bg-[#E8F5E9]' : 'border-[#E5E7EB] bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedAddonIds((prev) =>
                                isChecked ? prev.filter((id) => id !== addon.id) : [...prev, addon.id]
                              );
                            }}
                            className="rounded text-[#218838]"
                          />
                          <span className="font-medium text-[#1F2937]">{addon.name}</span>
                        </div>
                        <span className="font-bold text-[#218838]">+{formatINR(addon.priceDeltaPaise)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cooking instructions note */}
            <div>
              <label className="font-semibold uppercase tracking-wider text-[#1F2937] block mb-1.5">
                Special Cooking Instructions (Optional)
              </label>
              <input
                type="text"
                value={foodCookingNote}
                onChange={(e) => setFoodCookingNote(e.target.value)}
                placeholder="e.g. Kam mirchi rakhna / extra salad"
                className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838]"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Grocery Quantity Selector Modal */}
      {activeGroceryToSelect && (
        <Modal
          isOpen={true}
          onClose={() => setActiveGroceryToSelect(null)}
          title={`Select Quantity for ${activeGroceryToSelect.name}`}
          description={`From ${seller.publicName}`}
        >
          <QuantitySelector
            basePricePaise={activeGroceryToSelect.pricePaise}
            unitBasis={activeGroceryToSelect.unitBasis}
            quantityMode={activeGroceryToSelect.quantityMode}
            predefinedOptions={activeGroceryToSelect.predefinedOptions}
            sellerLocalUnit={activeGroceryToSelect.sellerLocalUnit}
            minQuantity={activeGroceryToSelect.minQuantity}
            quantityStep={activeGroceryToSelect.quantityStep}
            onConfirmSelection={(res) => {
              onAddToCart({
                productId: activeGroceryToSelect.id,
                productName: activeGroceryToSelect.name,
                sellerId: seller.id,
                sellerName: seller.publicName,
                catalogueType: 'GROCERY',
                unitLabel: res.unitLabel,
                unitPricePaise: res.calculatedPricePaise,
                quantity: 1,
                lineTotalPaise: res.calculatedPricePaise,
                customerNote: res.customerNote,
              });
              setActiveGroceryToSelect(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
};
