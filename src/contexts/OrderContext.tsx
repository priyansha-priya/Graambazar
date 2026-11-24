import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Order,
  OrderStatus,
  OrderEvent,
  CancelledByActor,
  ReturnStatus,
  OrderReturnItem,
  RefundMethod,
  RefundStatus,
  SellerOrderNotification,
} from '../types/order';

const DEFAULT_ACCEPT_WINDOW_SECONDS = 300; // 5 minutes to accept incoming order

function playOrderNotificationChime(): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    [880, 1174.66].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);
      gain.gain.setValueAtTime(0.001, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.14, now + idx * 0.14 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.3);
    });
  } catch {
    // Ignore browser autoplay restrictions silently
  }
}

export interface AdminCancelOrderPayload {
  reason: string;
  cancelledBy: CancelledByActor;
  refundEligible: boolean;
  notes?: string;
}

export interface RecordOrderReturnPayload {
  reason: string;
  status: ReturnStatus;
  returnedItems: OrderReturnItem[];
  notes?: string;
}

export interface ProcessOrderRefundPayload {
  amountPaise: number;
  method: RefundMethod;
  status: RefundStatus;
  reason: string;
  referenceId?: string;
  initiatedBy: string;
  failureReason?: string;
}

export interface TransitionOrderMetadata {
  estimatedDeliveryMinutes?: number;
  assignedRunnerName?: string;
  assignedRunnerPhone?: string;
}

interface OrderContextType {
  orders: Order[];
  activeOrders: Order[];
  pastOrders: Order[];
  sellerNotifications: SellerOrderNotification[];
  latestIncomingNotification: SellerOrderNotification | null;
  getOrderById: (orderId: string) => Order | undefined;
  createOrder: (
    orderData: Omit<Order, 'id' | 'orderNumber' | 'status' | 'statusHistory' | 'createdAt' | 'updatedAt'>
  ) => Order;
  cancelOrder: (orderId: string, reason: string) => { success: boolean; message: string };
  transitionOrder: (
    orderId: string,
    nextStatus: OrderStatus,
    reason?: string,
    actorRole?: string,
    metadata?: TransitionOrderMetadata
  ) => void;
  extendAcceptWindow: (orderId: string, extraMinutes?: number) => void;
  markNotificationRead: (notificationId: string) => void;
  markSellerNotificationsRead: (sellerId: string) => void;
  dismissLatestNotification: () => void;
  adminCancelOrder: (orderId: string, payload: AdminCancelOrderPayload) => void;
  recordOrderReturn: (orderId: string, payload: RecordOrderReturnPayload) => void;
  processOrderRefund: (orderId: string, payload: ProcessOrderRefundPayload) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const TERMINAL_ORDER_STATUSES: OrderStatus[] = [
  'completed',
  'cancelled',
  'rejected',
  'delivery_failed',
  'returned',
  'refunded',
];

const getInitialMockOrders = (): Order[] => {
  const now = Date.now();
  const secsAgo = (s: number) => new Date(now - s * 1000).toISOString();
  const secsFromNow = (s: number) => new Date(now + s * 1000).toISOString();
  const minsAgo = (m: number) => new Date(now - m * 60 * 1000).toISOString();
  const hoursAgo = (h: number) => new Date(now - h * 60 * 60 * 1000).toISOString();
  const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: 'ord_gupta_live_incoming_01',
      orderNumber: 'GB-2026-0099',
      customerId: 'user_cust_1',
      customerName: 'Sunita Devi',
      customerPhone: '9876543210',
      sellerId: 'seller_gupta_kirana',
      sellerName: 'Gupta Kirana & General Store',
      sellerPhone: '9876543211',
      villageId: 'rampur',
      fulfilmentMode: 'DELIVERY',
      status: 'placed',
      paymentMethod: 'COD',
      paymentStatus: 'pending',
      itemSubtotalPaise: 40000,
      deliveryFeePaise: 1500,
      packagingFeePaise: 0,
      platformFeePaise: 0,
      totalPaise: 41500,
      estimatedDeliveryMinutes: 30,
      acceptWindowSeconds: DEFAULT_ACCEPT_WINDOW_SECONDS,
      acceptDeadlineAt: secsFromNow(255), // 4 min 15 sec live countdown ready for demo
      deliveryNote: 'Atta fresh chakki wala bhejna, gate par pahunch kar call karein.',
      deliveryAddress: {
        id: 'addr_sunita_rampur',
        userId: 'user_cust_1',
        recipientName: 'Sunita Devi',
        recipientPhone: '9876543210',
        villageId: 'rampur',
        villageName: 'Rampur',
        addressLine1: 'House No. 24, Purani Basti',
        landmark: 'Near Kali Mandir Chowk',
        addressLabel: 'Home',
        isDefault: true,
        createdAt: daysAgo(15),
      },
      items: [
        {
          id: 'item_gupta_live_1',
          productId: 'groc_1',
          productName: 'Chakki Fresh Wheat Atta (MP Sharbati)',
          catalogueType: 'GROCERY',
          unitPricePaise: 19500,
          requestedQuantity: 1,
          requestedUnitLabel: '5 kg Pack',
          lineTotalPaise: 19500,
        },
        {
          id: 'item_gupta_live_2',
          productId: 'groc_2',
          productName: 'Desi Kala Chana (Brown Chickpeas)',
          catalogueType: 'GROCERY',
          unitPricePaise: 3000,
          requestedQuantity: 2,
          requestedUnitLabel: '500 g (2 Pav)',
          lineTotalPaise: 6000,
        },
        {
          id: 'item_gupta_live_3',
          productId: 'groc_4',
          productName: 'Kachi Ghani Mustard Oil (1 Litre Bottle)',
          catalogueType: 'GROCERY',
          unitPricePaise: 14500,
          requestedQuantity: 1,
          requestedUnitLabel: '1 Litre Bottle',
          lineTotalPaise: 14500,
        },
      ],
      statusHistory: [
        {
          id: 'ev_gupta_live_1',
          orderId: 'ord_gupta_live_incoming_01',
          fromStatus: 'placed',
          toStatus: 'placed',
          actorRole: 'CUSTOMER',
          reason: 'Order placed by customer via GramBazaar Checkout',
          timestamp: secsAgo(45),
        },
      ],
      createdAt: secsAgo(45),
      updatedAt: secsAgo(45),
    },
    {
      id: 'ord_demo_pending_01',
      orderNumber: 'GB-2026-0033',
      customerId: 'cust_meena',
      customerName: 'Meena Kumari',
      customerPhone: '9837441100',
      sellerId: 'seller_kisan_dairy',
      sellerName: 'Kisan Fresh Dairy & Agro',
      sellerPhone: '9876543215',
      villageId: 'keshavpur',
      fulfilmentMode: 'DELIVERY',
      status: 'pending',
      paymentMethod: 'SELLER_UPI',
      paymentStatus: 'pending',
      itemSubtotalPaise: 29000,
      itemDiscountPaise: 1000,
      deliveryFeePaise: 1500,
      packagingFeePaise: 500,
      taxPaise: 0,
      platformFeePaise: 0,
      totalPaise: 30000,
      estimatedDeliveryMinutes: 30,
      deliveryAddress: {
        id: 'addr_meena_1',
        userId: 'cust_meena',
        recipientName: 'Meena Kumari',
        recipientPhone: '9837441100',
        villageId: 'keshavpur',
        villageName: 'Keshavpur',
        addressLine1: 'Bazar Tola, Near Primary Health Center',
        landmark: 'PHC Main Gate',
        addressLabel: 'Home',
        isDefault: true,
        createdAt: minsAgo(11),
      },
      createdAt: minsAgo(11),
      updatedAt: minsAgo(9),
      items: [
        {
          id: 'item_pend_1',
          productId: 'prod_a2_ghee',
          productName: 'Desi Cow A2 Milk (2L Can)',
          catalogueType: 'GROCERY',
          sku: 'DY-MLK-2L',
          variantLabel: '2 Litre Fresh Can',
          unitPricePaise: 17000,
          mrpUnitPricePaise: 18000,
          itemDiscountPaise: 1000,
          requestedQuantity: 1,
          requestedUnitLabel: '2 L',
          lineTotalPaise: 17000,
        },
        {
          id: 'item_pend_2',
          productId: 'prod_buffalo_curd',
          productName: 'Farm Fresh Buffalo Curd',
          catalogueType: 'GROCERY',
          sku: 'DY-CRD-1KG',
          unitPricePaise: 12000,
          requestedQuantity: 1,
          requestedUnitLabel: '1 kg',
          lineTotalPaise: 12000,
        },
      ],
      statusHistory: [
        {
          id: 'ev_pend_1',
          orderId: 'ord_demo_pending_01',
          fromStatus: 'placed',
          toStatus: 'placed',
          actorRole: 'CUSTOMER',
          reason: 'Order submitted via checkout',
          timestamp: minsAgo(11),
        },
        {
          id: 'ev_pend_2',
          orderId: 'ord_demo_pending_01',
          fromStatus: 'placed',
          toStatus: 'pending',
          actorRole: 'ADMIN',
          reason: 'Pending UPI payment confirmation before merchant acceptance',
          timestamp: minsAgo(9),
        },
      ],
    },
    {
      id: 'ord_demo_new_01',
      orderNumber: 'GB-2026-0032',
      customerId: 'cust_sunita',
      customerName: 'Sunita Devi',
      customerPhone: '9835011223',
      sellerId: 'seller_sharma_dhaba',
      sellerName: 'Sharma Shuddh Shakahari Dhaba',
      sellerPhone: '9876543210',
      villageId: 'rampur',
      fulfilmentMode: 'DELIVERY',
      status: 'placed',
      paymentMethod: 'SELLER_UPI',
      paymentStatus: 'collected',
      paymentReferenceId: 'UPI432891004512',
      paidAt: minsAgo(6),
      itemSubtotalPaise: 36000,
      itemDiscountPaise: 2000,
      couponCode: 'GRAM20',
      couponDiscountPaise: 2000,
      deliveryFeePaise: 2000,
      packagingFeePaise: 1500,
      taxPaise: 1600,
      taxLabel: 'GST (5%)',
      platformFeePaise: 500,
      totalPaise: 37600,
      estimatedDeliveryMinutes: 30,
      deliveryAddress: {
        id: 'addr_sunita_1',
        userId: 'cust_sunita',
        recipientName: 'Sunita Devi',
        recipientPhone: '9835011223',
        villageId: 'rampur',
        villageName: 'Rampur',
        addressLine1: 'Ward No. 4, Behind Post Office',
        landmark: 'Gramin Bank Chowk',
        addressLabel: 'Home',
        isDefault: true,
        createdAt: minsAgo(6),
      },
      createdAt: minsAgo(6),
      updatedAt: minsAgo(6),
      items: [
        {
          id: 'item_new_1',
          productId: 'prod_dal_makhani',
          productName: 'Special Dal Makhani Combo',
          catalogueType: 'FOOD',
          sku: 'FD-DLM-01',
          variantLabel: 'Family Pack',
          selectedOptions: [
            { groupName: 'Spice Level', optionLabel: 'Medium Tadka', priceDeltaPaise: 0 },
            { groupName: 'Extras', optionLabel: 'Extra Butter', priceDeltaPaise: 2000 },
          ],
          unitPricePaise: 22000,
          mrpUnitPricePaise: 24000,
          itemDiscountPaise: 2000,
          requestedQuantity: 1,
          requestedUnitLabel: '1 Combo',
          lineTotalPaise: 24000,
        },
        {
          id: 'item_new_2',
          productId: 'prod_jeera_rice',
          productName: 'Basmati Jeera Rice',
          catalogueType: 'FOOD',
          sku: 'FD-JRC-02',
          unitPricePaise: 12000,
          requestedQuantity: 1,
          requestedUnitLabel: 'Full Bowl',
          lineTotalPaise: 12000,
        },
      ],
      statusHistory: [
        {
          id: 'ev_new_1',
          orderId: 'ord_demo_new_01',
          fromStatus: 'placed',
          toStatus: 'placed',
          actorRole: 'CUSTOMER',
          reason: 'Order placed online with Seller UPI payment verified',
          timestamp: minsAgo(6),
        },
      ],
    },
    {
      id: 'ord_demo_confirmed_01',
      orderNumber: 'GB-2026-0031',
      customerId: 'cust_vikas',
      customerName: 'Vikas Yadav',
      customerPhone: '9798445566',
      sellerId: 'seller_gupta_kirana',
      sellerName: 'Gupta Kirana & General Store',
      sellerPhone: '9876543211',
      villageId: 'keshavpur',
      fulfilmentMode: 'PICKUP',
      status: 'accepted',
      paymentMethod: 'SELLER_UPI',
      paymentStatus: 'collected',
      paymentReferenceId: 'UPI432890118923',
      paidAt: minsAgo(28),
      itemSubtotalPaise: 54000,
      itemDiscountPaise: 3000,
      couponCode: 'KIRANA5',
      couponDiscountPaise: 2500,
      deliveryFeePaise: 0,
      packagingFeePaise: 500,
      taxPaise: 0,
      platformFeePaise: 0,
      totalPaise: 49000,
      estimatedDeliveryMinutes: 15,
      createdAt: minsAgo(28),
      updatedAt: minsAgo(20),
      items: [
        {
          id: 'item_conf_1',
          productId: 'prod_toor_dal',
          productName: 'Unpolished Arhar Toor Dal',
          catalogueType: 'GROCERY',
          sku: 'GR-DAL-2KG',
          variantLabel: '2 kg Pack',
          unitPricePaise: 32000,
          mrpUnitPricePaise: 35000,
          itemDiscountPaise: 3000,
          requestedQuantity: 1,
          requestedUnitLabel: '2 kg',
          lineTotalPaise: 32000,
        },
        {
          id: 'item_conf_2',
          productId: 'prod_sugar',
          productName: 'Refined Sulphurless Sugar',
          catalogueType: 'GROCERY',
          sku: 'GR-SUG-5KG',
          unitPricePaise: 22000,
          requestedQuantity: 1,
          requestedUnitLabel: '5 kg',
          lineTotalPaise: 22000,
        },
      ],
      statusHistory: [
        {
          id: 'ev_conf_1',
          orderId: 'ord_demo_confirmed_01',
          fromStatus: 'placed',
          toStatus: 'placed',
          actorRole: 'CUSTOMER',
          reason: 'Self-pickup order placed by customer',
          timestamp: minsAgo(28),
        },
        {
          id: 'ev_conf_2',
          orderId: 'ord_demo_confirmed_01',
          fromStatus: 'placed',
          toStatus: 'accepted',
          actorRole: 'SELLER',
          reason: 'Order confirmed; packing started for counter pickup',
          timestamp: minsAgo(20),
        },
      ],
    },
    {
      id: 'ord_demo_pickup_01',
      orderNumber: 'GB-2026-0030',
      customerId: 'cust_anita',
      customerName: 'Anita Verma',
      customerPhone: '9826100455',
      sellerId: 'seller_chaudhary_sweets',
      sellerName: 'Chaudhary Mishthan Bhandar',
      sellerPhone: '9876543212',
      villageId: 'rampur',
      fulfilmentMode: 'PICKUP',
      status: 'ready_for_pickup',
      paymentMethod: 'COD',
      paymentStatus: 'pending',
      itemSubtotalPaise: 42000,
      itemDiscountPaise: 0,
      deliveryFeePaise: 0,
      packagingFeePaise: 1500,
      taxPaise: 2100,
      taxLabel: 'GST (5%)',
      platformFeePaise: 0,
      totalPaise: 45600,
      createdAt: minsAgo(48),
      updatedAt: minsAgo(10),
      items: [
        {
          id: 'item_pick_1',
          productId: 'prod_kaju_katli',
          productName: 'Pure Kaju Katli Gift Box',
          catalogueType: 'FOOD',
          sku: 'SW-KJK-500G',
          variantLabel: '500g Festive Box',
          unitPricePaise: 42000,
          requestedQuantity: 1,
          requestedUnitLabel: '500g Box',
          lineTotalPaise: 42000,
        },
      ],
      statusHistory: [
        {
          id: 'ev_pick_1',
          orderId: 'ord_demo_pickup_01',
          fromStatus: 'placed',
          toStatus: 'placed',
          actorRole: 'CUSTOMER',
          reason: 'Store pickup order placed',
          timestamp: minsAgo(48),
        },
        {
          id: 'ev_pick_2',
          orderId: 'ord_demo_pickup_01',
          fromStatus: 'placed',
          toStatus: 'accepted',
          actorRole: 'SELLER',
          reason: 'Accepted by sweet shop',
          timestamp: minsAgo(42),
        },
        {
          id: 'ev_pick_3',
          orderId: 'ord_demo_pickup_01',
          fromStatus: 'accepted',
          toStatus: 'preparing',
          actorRole: 'SELLER',
          reason: 'Packing fresh silver-leaf box',
          timestamp: minsAgo(30),
        },
        {
          id: 'ev_pick_4',
          orderId: 'ord_demo_pickup_01',
          fromStatus: 'preparing',
          toStatus: 'ready_for_pickup',
          actorRole: 'SELLER',
          reason: 'Ready at billing counter for customer collection',
          timestamp: minsAgo(10),
        },
      ],
    },
    {
      id: 'ord_demo_active_01',
      orderNumber: 'GB-2026-0024',
      customerId: 'cust_ramesh',
      customerName: 'Priyansha Priya',
      customerPhone: '9876543210',
      sellerId: 'seller_sharma_dhaba',
      sellerName: 'Sharma Shuddh Shakahari Dhaba',
      sellerPhone: '9876543210',
      villageId: 'rampur',
      fulfilmentMode: 'DELIVERY',
      status: 'out_for_delivery',
      paymentMethod: 'COD',
      paymentStatus: 'pending',
      itemSubtotalPaise: 24000,
      deliveryFeePaise: 2000,
      packagingFeePaise: 1500,
      platformFeePaise: 0,
      totalPaise: 27500,
      estimatedDeliveryMinutes: 20,
      assignedRunnerName: 'Ramesh Kumar (Shop Runner)',
      assignedRunnerPhone: '9812345678',
      deliveryAddress: {
        id: 'addr_demo_1',
        userId: 'cust_ramesh',
        recipientName: 'Priyansha Priya',
        recipientPhone: '9876543210',
        villageId: 'rampur',
        villageName: 'Rampur',
        addressLine1: 'Near Primary School',
        landmark: 'Panchayat Bhawan Chauraha',
        addressLabel: 'Home',
        isDefault: true,
        createdAt: minsAgo(25),
      },
      createdAt: minsAgo(25),
      updatedAt: minsAgo(3),
      items: [
        {
          id: 'item_snap_1',
          productId: 'prod_paneer_butter',
          productName: 'Special Shahi Paneer',
          catalogueType: 'FOOD',
          unitPricePaise: 18000,
          requestedQuantity: 1,
          requestedUnitLabel: 'Full Plate',
          lineTotalPaise: 18000,
        },
        {
          id: 'item_snap_2',
          productId: 'prod_tandoori_roti',
          productName: 'Tandoori Butter Roti',
          catalogueType: 'FOOD',
          unitPricePaise: 1500,
          requestedQuantity: 4,
          requestedUnitLabel: '4 pcs',
          lineTotalPaise: 6000,
        },
      ],
      statusHistory: [
        {
          id: 'ev_1',
          orderId: 'ord_demo_active_01',
          fromStatus: 'placed',
          toStatus: 'placed',
          actorRole: 'CUSTOMER',
          reason: 'Order placed by customer via checkout',
          timestamp: minsAgo(25),
        },
        {
          id: 'ev_2',
          orderId: 'ord_demo_active_01',
          fromStatus: 'placed',
          toStatus: 'accepted',
          actorRole: 'SELLER',
          reason: 'Shopkeeper accepted order and estimated 25 mins',
          timestamp: minsAgo(22),
        },
        {
          id: 'ev_3',
          orderId: 'ord_demo_active_01',
          fromStatus: 'accepted',
          toStatus: 'preparing',
          actorRole: 'SELLER',
          reason: 'Kitchen started tandoori preparation',
          timestamp: minsAgo(18),
        },
        {
          id: 'ev_4',
          orderId: 'ord_demo_active_01',
          fromStatus: 'preparing',
          toStatus: 'ready_for_delivery',
          actorRole: 'SELLER',
          reason: 'Order packed hot in foil boxes',
          timestamp: minsAgo(8),
        },
        {
          id: 'ev_5',
          orderId: 'ord_demo_active_01',
          fromStatus: 'ready_for_delivery',
          toStatus: 'out_for_delivery',
          actorRole: 'SELLER',
          reason: 'Runner Ramesh Kumar departed on motorcycle towards Panchayat Bhawan',
          timestamp: minsAgo(4),
        },
      ],
    },
    {
      id: 'ord_demo_active_02',
      orderNumber: 'GB-2026-0021',
      customerId: 'cust_ramesh',
      customerName: 'Priyansha Priya',
      customerPhone: '9876543210',
      sellerId: 'seller_gupta_kirana',
      sellerName: 'Gupta Kirana & General Store',
      sellerPhone: '9876543211',
      villageId: 'rampur',
      fulfilmentMode: 'DELIVERY',
      status: 'preparing',
      paymentMethod: 'UDHAR',
      paymentStatus: 'pending',
      itemSubtotalPaise: 32000,
      deliveryFeePaise: 1500,
      packagingFeePaise: 0,
      platformFeePaise: 0,
      totalPaise: 33500,
      estimatedDeliveryMinutes: 30,
      deliveryAddress: {
        id: 'addr_demo_2',
        userId: 'cust_ramesh',
        recipientName: 'Priyansha Priya',
        recipientPhone: '9876543210',
        villageId: 'rampur',
        villageName: 'Rampur',
        addressLine1: 'Main Market Road',
        landmark: 'Shiv Mandir Gate',
        addressLabel: 'Home',
        isDefault: false,
        createdAt: minsAgo(15),
      },
      createdAt: minsAgo(15),
      updatedAt: minsAgo(8),
      items: [
        {
          id: 'item_snap_3',
          productId: 'prod_chakki_atta',
          productName: 'Shuddh Chakki Fresh Atta',
          catalogueType: 'GROCERY',
          unitPricePaise: 21000,
          requestedQuantity: 1,
          requestedUnitLabel: '5 kg bag',
          lineTotalPaise: 21000,
        },
        {
          id: 'item_snap_4',
          productId: 'prod_mustard_oil',
          productName: 'Kachhi Ghani Mustard Oil (Pouch)',
          catalogueType: 'GROCERY',
          unitPricePaise: 11000,
          requestedQuantity: 1,
          requestedUnitLabel: '1 Litre',
          lineTotalPaise: 11000,
        },
      ],
      statusHistory: [
        {
          id: 'ev_11',
          orderId: 'ord_demo_active_02',
          fromStatus: 'placed',
          toStatus: 'placed',
          actorRole: 'CUSTOMER',
          reason: 'Order placed with Udhari Khata payment',
          timestamp: minsAgo(15),
        },
        {
          id: 'ev_12',
          orderId: 'ord_demo_active_02',
          fromStatus: 'placed',
          toStatus: 'accepted',
          actorRole: 'SELLER',
          reason: 'Gupta ji approved udhari order and confirmed stock',
          timestamp: minsAgo(12),
        },
        {
          id: 'ev_13',
          orderId: 'ord_demo_active_02',
          fromStatus: 'accepted',
          toStatus: 'preparing',
          actorRole: 'SELLER',
          reason: 'Packing atta bag and weighing oil pack',
          timestamp: minsAgo(8),
        },
      ],
    },
    {
      id: 'ord_demo_returned_01',
      orderNumber: 'GB-2026-0029',
      customerId: 'cust_manoj',
      customerName: 'Manoj Tiwari',
      customerPhone: '9911223344',
      sellerId: 'seller_gupta_kirana',
      sellerName: 'Gupta Kirana & General Store',
      sellerPhone: '9876543211',
      villageId: 'sitapur',
      fulfilmentMode: 'DELIVERY',
      status: 'returned',
      paymentMethod: 'SELLER_UPI',
      paymentStatus: 'collected',
      paymentReferenceId: 'UPI432811229001',
      paidAt: hoursAgo(9),
      itemSubtotalPaise: 62000,
      itemDiscountPaise: 4000,
      couponCode: 'FRESH40',
      couponDiscountPaise: 4000,
      deliveryFeePaise: 2500,
      packagingFeePaise: 1000,
      taxPaise: 1500,
      taxLabel: 'GST (Incl.)',
      platformFeePaise: 500,
      totalPaise: 59500,
      assignedRunnerName: 'Sandeep Maurya',
      assignedRunnerPhone: '9811998877',
      deliveryAddress: {
        id: 'addr_manoj_1',
        userId: 'cust_manoj',
        recipientName: 'Manoj Tiwari',
        recipientPhone: '9911223344',
        villageId: 'sitapur',
        villageName: 'Sitapur',
        addressLine1: 'Nehru Gali, House No. 18',
        landmark: 'Water Tank Chauraha',
        addressLabel: 'Home',
        isDefault: true,
        createdAt: hoursAgo(9),
      },
      returnInfo: {
        returnId: 'RET-2026-0118',
        status: 'RECEIVED',
        reason: 'Oil pouch leaked during transit & damaged outer seal',
        requestedAt: hoursAgo(5),
        updatedAt: hoursAgo(2),
        notes: 'Runner collected damaged 2L mustard oil pouch and returned to Gupta Kirana.',
        returnedItems: [
          {
            orderItemId: 'item_ret_1',
            productName: 'Kachhi Ghani Mustard Oil',
            variantLabel: '2 Litre Bottle',
            quantity: 1,
            unitLabel: '2 L',
            refundValuePaise: 34000,
            conditionNote: 'Damaged seal / leakage verified by runner',
          },
        ],
      },
      refundInfo: {
        refundId: 'RFD-2026-0092',
        amountPaise: 34000,
        status: 'PENDING',
        method: 'ORIGINAL_UPI',
        reason: 'Partial return refund for damaged 2L Mustard Oil bottle',
        initiatedAt: hoursAgo(2),
        initiatedBy: 'Support Desk',
      },
      createdAt: hoursAgo(9),
      updatedAt: hoursAgo(2),
      items: [
        {
          id: 'item_ret_1',
          productId: 'prod_mustard_oil_2l',
          productName: 'Kachhi Ghani Mustard Oil',
          catalogueType: 'GROCERY',
          sku: 'GR-OIL-2L',
          variantLabel: '2 Litre Bottle',
          unitPricePaise: 34000,
          mrpUnitPricePaise: 38000,
          itemDiscountPaise: 4000,
          requestedQuantity: 1,
          requestedUnitLabel: '2 L',
          lineTotalPaise: 34000,
          returnedQuantity: 1,
        },
        {
          id: 'item_ret_2',
          productId: 'prod_basmati_rice_5kg',
          productName: 'Shahi Basmati Rice',
          catalogueType: 'GROCERY',
          sku: 'GR-RICE-2KG',
          variantLabel: '2 kg Pack',
          unitPricePaise: 28000,
          requestedQuantity: 1,
          requestedUnitLabel: '2 kg',
          lineTotalPaise: 28000,
        },
      ],
      statusHistory: [
        {
          id: 'ev_ret_1',
          orderId: 'ord_demo_returned_01',
          fromStatus: 'placed',
          toStatus: 'placed',
          actorRole: 'CUSTOMER',
          reason: 'Order placed via Seller UPI',
          timestamp: hoursAgo(9),
        },
        {
          id: 'ev_ret_2',
          orderId: 'ord_demo_returned_01',
          fromStatus: 'placed',
          toStatus: 'accepted',
          actorRole: 'SELLER',
          reason: 'Accepted by Gupta Kirana',
          timestamp: hoursAgo(8.8),
        },
        {
          id: 'ev_ret_3',
          orderId: 'ord_demo_returned_01',
          fromStatus: 'accepted',
          toStatus: 'preparing',
          actorRole: 'SELLER',
          reason: 'Packed items for Sitapur delivery',
          timestamp: hoursAgo(8.3),
        },
        {
          id: 'ev_ret_4',
          orderId: 'ord_demo_returned_01',
          fromStatus: 'preparing',
          toStatus: 'out_for_delivery',
          actorRole: 'SELLER',
          reason: 'Runner Sandeep Maurya dispatched',
          timestamp: hoursAgo(7.5),
        },
        {
          id: 'ev_ret_5',
          orderId: 'ord_demo_returned_01',
          fromStatus: 'out_for_delivery',
          toStatus: 'completed',
          actorRole: 'SELLER',
          reason: 'Delivered at Water Tank Chauraha',
          timestamp: hoursAgo(6.8),
        },
        {
          id: 'ev_ret_6',
          orderId: 'ord_demo_returned_01',
          fromStatus: 'completed',
          toStatus: 'returned',
          actorRole: 'ADMIN',
          reason: 'Return received at store: oil pouch leaked in transit',
          timestamp: hoursAgo(2),
        },
      ],
    },
    {
      id: 'ord_demo_refunded_01',
      orderNumber: 'GB-2026-0028',
      customerId: 'cust_kavita',
      customerName: 'Kavita Singh',
      customerPhone: '9839007788',
      sellerId: 'seller_kisan_dairy',
      sellerName: 'Kisan Fresh Dairy & Agro',
      sellerPhone: '9876543215',
      villageId: 'rampur',
      fulfilmentMode: 'DELIVERY',
      status: 'refunded',
      paymentMethod: 'SELLER_UPI',
      paymentStatus: 'refunded',
      paymentReferenceId: 'UPI432776543210',
      paidAt: daysAgo(1),
      itemSubtotalPaise: 46000,
      itemDiscountPaise: 2000,
      couponCode: 'DAIRY10',
      couponDiscountPaise: 3000,
      deliveryFeePaise: 1500,
      packagingFeePaise: 1000,
      taxPaise: 0,
      platformFeePaise: 500,
      totalPaise: 44000,
      deliveryAddress: {
        id: 'addr_kavita_1',
        userId: 'cust_kavita',
        recipientName: 'Kavita Singh',
        recipientPhone: '9839007788',
        villageId: 'rampur',
        villageName: 'Rampur',
        addressLine1: 'School Road, Near Handpump',
        landmark: 'Kanya Vidyalaya Gate',
        addressLabel: 'Home',
        isDefault: true,
        createdAt: daysAgo(1),
      },
      returnInfo: {
        returnId: 'RET-2026-0114',
        status: 'RECEIVED',
        reason: 'Paneer batch curdled / sour upon delivery',
        requestedAt: hoursAgo(21),
        updatedAt: hoursAgo(19),
        notes: 'Seller confirmed quality issue and approved full refund.',
        returnedItems: [
          {
            orderItemId: 'item_rfd_1',
            productName: 'Fresh Malai Paneer',
            variantLabel: '1 kg Pack',
            quantity: 1,
            unitLabel: '1 kg',
            refundValuePaise: 34000,
            conditionNote: 'Quality spoilage verified',
          },
          {
            orderItemId: 'item_rfd_2',
            productName: 'Farm Fresh Buffalo Curd',
            variantLabel: '1 kg Matka',
            quantity: 1,
            unitLabel: '1 kg',
            refundValuePaise: 12000,
            conditionNote: 'Returned unopened with order',
          },
        ],
      },
      refundInfo: {
        refundId: 'RFD-2026-0089',
        amountPaise: 44000,
        status: 'COMPLETED',
        method: 'ORIGINAL_UPI',
        reason: 'Full order refund approved due to spoiled dairy batch',
        initiatedAt: hoursAgo(19),
        completedAt: hoursAgo(18),
        referenceId: 'UTR2026112299481',
        initiatedBy: 'Super Admin',
      },
      createdAt: daysAgo(1),
      updatedAt: hoursAgo(18),
      items: [
        {
          id: 'item_rfd_1',
          productId: 'prod_fresh_paneer',
          productName: 'Fresh Malai Paneer',
          catalogueType: 'GROCERY',
          sku: 'DY-PNR-1KG',
          variantLabel: '1 kg Pack',
          unitPricePaise: 34000,
          mrpUnitPricePaise: 36000,
          itemDiscountPaise: 2000,
          requestedQuantity: 1,
          requestedUnitLabel: '1 kg',
          lineTotalPaise: 34000,
          returnedQuantity: 1,
        },
        {
          id: 'item_rfd_2',
          productId: 'prod_buffalo_curd',
          productName: 'Farm Fresh Buffalo Curd',
          catalogueType: 'GROCERY',
          sku: 'DY-CRD-1KG',
          variantLabel: '1 kg Matka',
          unitPricePaise: 12000,
          requestedQuantity: 1,
          requestedUnitLabel: '1 kg',
          lineTotalPaise: 12000,
          returnedQuantity: 1,
        },
      ],
      statusHistory: [
        {
          id: 'ev_rfd_1',
          orderId: 'ord_demo_refunded_01',
          fromStatus: 'placed',
          toStatus: 'placed',
          actorRole: 'CUSTOMER',
          reason: 'Order placed via Seller UPI',
          timestamp: daysAgo(1),
        },
        {
          id: 'ev_rfd_2',
          orderId: 'ord_demo_refunded_01',
          fromStatus: 'placed',
          toStatus: 'accepted',
          actorRole: 'SELLER',
          reason: 'Accepted by Kisan Fresh Dairy',
          timestamp: hoursAgo(23.5),
        },
        {
          id: 'ev_rfd_3',
          orderId: 'ord_demo_refunded_01',
          fromStatus: 'accepted',
          toStatus: 'preparing',
          actorRole: 'SELLER',
          reason: 'Packed chilled dairy items',
          timestamp: hoursAgo(23),
        },
        {
          id: 'ev_rfd_4',
          orderId: 'ord_demo_refunded_01',
          fromStatus: 'preparing',
          toStatus: 'out_for_delivery',
          actorRole: 'SELLER',
          reason: 'Out for doorstep delivery',
          timestamp: hoursAgo(22.5),
        },
        {
          id: 'ev_rfd_5',
          orderId: 'ord_demo_refunded_01',
          fromStatus: 'out_for_delivery',
          toStatus: 'completed',
          actorRole: 'SELLER',
          reason: 'Delivered at Kanya Vidyalaya Gate',
          timestamp: hoursAgo(22),
        },
        {
          id: 'ev_rfd_6',
          orderId: 'ord_demo_refunded_01',
          fromStatus: 'completed',
          toStatus: 'returned',
          actorRole: 'ADMIN',
          reason: 'Return verified & received due to curdled paneer batch',
          timestamp: hoursAgo(19),
        },
        {
          id: 'ev_rfd_7',
          orderId: 'ord_demo_refunded_01',
          fromStatus: 'returned',
          toStatus: 'refunded',
          actorRole: 'ADMIN',
          reason: 'Full refund ₹440.00 completed to Original UPI (UTR2026112299481)',
          timestamp: hoursAgo(18),
        },
      ],
    },
    {
      id: 'ord_demo_cancelled_01',
      orderNumber: 'GB-2026-0027',
      customerId: 'cust_rajesh',
      customerName: 'Rajesh Patel',
      customerPhone: '9829012345',
      sellerId: 'seller_sharma_dhaba',
      sellerName: 'Sharma Shuddh Shakahari Dhaba',
      sellerPhone: '9876543210',
      villageId: 'madhavpur',
      fulfilmentMode: 'DELIVERY',
      status: 'cancelled',
      paymentMethod: 'SELLER_UPI',
      paymentStatus: 'collected',
      paymentReferenceId: 'UPI432844551100',
      paidAt: hoursAgo(4),
      itemSubtotalPaise: 31000,
      itemDiscountPaise: 0,
      couponCode: 'WELCOME25',
      couponDiscountPaise: 2500,
      deliveryFeePaise: 2500,
      packagingFeePaise: 1500,
      taxPaise: 1425,
      taxLabel: 'GST (5%)',
      platformFeePaise: 0,
      totalPaise: 33925,
      deliveryAddress: {
        id: 'addr_rajesh_1',
        userId: 'cust_rajesh',
        recipientName: 'Rajesh Patel',
        recipientPhone: '9829012345',
        villageId: 'madhavpur',
        villageName: 'Madhavpur',
        addressLine1: 'Chauk Bazar Lane 2',
        landmark: 'Old Peepal Tree',
        addressLabel: 'Home',
        isDefault: true,
        createdAt: hoursAgo(4),
      },
      cancellation: {
        cancelledBy: 'CUSTOMER',
        reason: 'Ordered wrong delivery address; requested immediate cancellation before kitchen prep',
        cancelledAt: hoursAgo(3.8),
        refundEligible: true,
        notes: 'Prepaid UPI order eligible for 100% refund.',
      },
      refundInfo: {
        refundId: 'RFD-2026-0094',
        amountPaise: 33925,
        status: 'PROCESSING',
        method: 'ORIGINAL_UPI',
        reason: 'Customer pre-prep cancellation on prepaid UPI order',
        initiatedAt: hoursAgo(3.5),
        initiatedBy: 'Ops Admin',
      },
      createdAt: hoursAgo(4),
      updatedAt: hoursAgo(3.5),
      items: [
        {
          id: 'item_canc_1',
          productId: 'prod_thali_deluxe',
          productName: 'Maharaja Shakahari Thali',
          catalogueType: 'FOOD',
          sku: 'FD-THL-DLX',
          unitPricePaise: 22000,
          requestedQuantity: 1,
          requestedUnitLabel: '1 Thali',
          lineTotalPaise: 22000,
        },
        {
          id: 'item_canc_2',
          productId: 'prod_lassi',
          productName: 'Punjabi Sweet Lassi',
          catalogueType: 'FOOD',
          sku: 'FD-LAS-01',
          unitPricePaise: 4500,
          requestedQuantity: 2,
          requestedUnitLabel: '2 Kulhad',
          lineTotalPaise: 9000,
        },
      ],
      statusHistory: [
        {
          id: 'ev_canc_1',
          orderId: 'ord_demo_cancelled_01',
          fromStatus: 'placed',
          toStatus: 'placed',
          actorRole: 'CUSTOMER',
          reason: 'Order placed with Seller UPI payment',
          timestamp: hoursAgo(4),
        },
        {
          id: 'ev_canc_2',
          orderId: 'ord_demo_cancelled_01',
          fromStatus: 'placed',
          toStatus: 'cancelled',
          actorRole: 'CUSTOMER',
          reason: 'Ordered wrong delivery address; requested immediate cancellation before kitchen prep',
          timestamp: hoursAgo(3.8),
        },
      ],
    },
    {
      id: 'ord_demo_cancelled_02',
      orderNumber: 'GB-2026-0026',
      customerId: 'cust_deepak',
      customerName: 'Deepak Kumar',
      customerPhone: '9871122009',
      sellerId: 'seller_gupta_kirana',
      sellerName: 'Gupta Kirana & General Store',
      sellerPhone: '9876543211',
      villageId: 'rampur',
      fulfilmentMode: 'DELIVERY',
      status: 'cancelled',
      paymentMethod: 'COD',
      paymentStatus: 'reversed',
      itemSubtotalPaise: 19500,
      deliveryFeePaise: 1500,
      packagingFeePaise: 0,
      platformFeePaise: 0,
      totalPaise: 21000,
      deliveryAddress: {
        id: 'addr_deepak_1',
        userId: 'cust_deepak',
        recipientName: 'Deepak Kumar',
        recipientPhone: '9871122009',
        villageId: 'rampur',
        villageName: 'Rampur',
        addressLine1: 'Bazar Road East',
        landmark: 'Cooperative Society Gate',
        addressLabel: 'Work',
        isDefault: true,
        createdAt: daysAgo(2),
      },
      cancellation: {
        cancelledBy: 'SELLER',
        reason: 'Item out of stock in evening shift',
        cancelledAt: daysAgo(2),
        refundEligible: false,
        notes: 'COD order — no payment collected, no refund required.',
      },
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
      items: [
        {
          id: 'item_canc2_1',
          productId: 'prod_besan',
          productName: 'Chana Dal Besan',
          catalogueType: 'GROCERY',
          sku: 'GR-BSN-2KG',
          unitPricePaise: 19500,
          requestedQuantity: 1,
          requestedUnitLabel: '2 kg',
          lineTotalPaise: 19500,
        },
      ],
      statusHistory: [
        {
          id: 'ev_canc2_1',
          orderId: 'ord_demo_cancelled_02',
          fromStatus: 'placed',
          toStatus: 'placed',
          actorRole: 'CUSTOMER',
          reason: 'COD order placed',
          timestamp: daysAgo(2),
        },
        {
          id: 'ev_canc2_2',
          orderId: 'ord_demo_cancelled_02',
          fromStatus: 'placed',
          toStatus: 'cancelled',
          actorRole: 'SELLER',
          reason: 'Item out of stock in evening shift',
          timestamp: daysAgo(2),
        },
      ],
    },
    {
      id: 'ord_demo_failed_01',
      orderNumber: 'GB-2026-0025',
      customerId: 'cust_suresh',
      customerName: 'Suresh Nishad',
      customerPhone: '9838776655',
      sellerId: 'seller_sharma_dhaba',
      sellerName: 'Sharma Shuddh Shakahari Dhaba',
      sellerPhone: '9876543210',
      villageId: 'sitapur',
      fulfilmentMode: 'DELIVERY',
      status: 'delivery_failed',
      paymentMethod: 'COD',
      paymentStatus: 'failed',
      itemSubtotalPaise: 16500,
      deliveryFeePaise: 2500,
      packagingFeePaise: 1000,
      platformFeePaise: 0,
      totalPaise: 20000,
      assignedRunnerName: 'Ramesh Kumar (Shop Runner)',
      assignedRunnerPhone: '9812345678',
      deliveryAddress: {
        id: 'addr_suresh_1',
        userId: 'cust_suresh',
        recipientName: 'Suresh Nishad',
        recipientPhone: '9838776655',
        villageId: 'sitapur',
        villageName: 'Sitapur',
        addressLine1: 'Canal Bridge Colony',
        landmark: 'Neher Pulia',
        addressLabel: 'Home',
        isDefault: true,
        createdAt: daysAgo(3),
      },
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
      items: [
        {
          id: 'item_fail_1',
          productId: 'prod_veg_biryani',
          productName: 'Handi Veg Biryani',
          catalogueType: 'FOOD',
          sku: 'FD-BIR-01',
          unitPricePaise: 16500,
          requestedQuantity: 1,
          requestedUnitLabel: 'Full Handi',
          lineTotalPaise: 16500,
        },
      ],
      statusHistory: [
        {
          id: 'ev_fail_1',
          orderId: 'ord_demo_failed_01',
          fromStatus: 'placed',
          toStatus: 'placed',
          actorRole: 'CUSTOMER',
          reason: 'Order placed with COD',
          timestamp: daysAgo(3),
        },
        {
          id: 'ev_fail_2',
          orderId: 'ord_demo_failed_01',
          fromStatus: 'placed',
          toStatus: 'accepted',
          actorRole: 'SELLER',
          reason: 'Accepted by dhaba',
          timestamp: daysAgo(3),
        },
        {
          id: 'ev_fail_3',
          orderId: 'ord_demo_failed_01',
          fromStatus: 'accepted',
          toStatus: 'out_for_delivery',
          actorRole: 'SELLER',
          reason: 'Dispatched with runner Ramesh Kumar',
          timestamp: daysAgo(3),
        },
        {
          id: 'ev_fail_4',
          orderId: 'ord_demo_failed_01',
          fromStatus: 'out_for_delivery',
          toStatus: 'delivery_failed',
          actorRole: 'SELLER',
          reason: 'Customer phone unreachable after 3 attempts at Neher Pulia',
          timestamp: daysAgo(3),
        },
      ],
    },
    {
      id: 'ord_demo_past_01',
      orderNumber: 'GB-2026-0016',
      customerId: 'cust_ramesh',
      customerName: 'Priyansha Priya',
      customerPhone: '9876543210',
      sellerId: 'seller_chaudhary_sweets',
      sellerName: 'Chaudhary Mishthan Bhandar',
      sellerPhone: '9876543212',
      villageId: 'rampur',
      fulfilmentMode: 'DELIVERY',
      status: 'completed',
      paymentMethod: 'SELLER_UPI',
      paymentStatus: 'collected',
      paymentReferenceId: 'UPI432698771234',
      paidAt: minsAgo(180),
      itemSubtotalPaise: 18000,
      deliveryFeePaise: 1500,
      packagingFeePaise: 1000,
      platformFeePaise: 0,
      totalPaise: 20500,
      estimatedDeliveryMinutes: 25,
      deliveryAddress: {
        id: 'addr_demo_3',
        userId: 'cust_ramesh',
        recipientName: 'Priyansha Priya',
        recipientPhone: '9876543210',
        villageId: 'rampur',
        villageName: 'Rampur',
        addressLine1: 'Station Road',
        landmark: 'Panchayat Bhawan Chauraha',
        addressLabel: 'Home',
        isDefault: false,
        createdAt: minsAgo(180),
      },
      createdAt: minsAgo(180),
      updatedAt: minsAgo(140),
      items: [
        {
          id: 'item_snap_5',
          productId: 'prod_gulab_jamun',
          productName: 'Desi Ghee Gulab Jamun',
          catalogueType: 'FOOD',
          unitPricePaise: 18000,
          requestedQuantity: 1,
          requestedUnitLabel: '500g box (8 pcs)',
          lineTotalPaise: 18000,
        },
      ],
      statusHistory: [
        {
          id: 'ev_21',
          orderId: 'ord_demo_past_01',
          fromStatus: 'placed',
          toStatus: 'placed',
          actorRole: 'CUSTOMER',
          reason: 'Order placed with UPI payment',
          timestamp: minsAgo(180),
        },
        {
          id: 'ev_22',
          orderId: 'ord_demo_past_01',
          fromStatus: 'placed',
          toStatus: 'accepted',
          actorRole: 'SELLER',
          reason: 'Accepted by sweet shop owner',
          timestamp: minsAgo(175),
        },
        {
          id: 'ev_23',
          orderId: 'ord_demo_past_01',
          fromStatus: 'accepted',
          toStatus: 'preparing',
          actorRole: 'SELLER',
          reason: 'Fresh batch packed in sweet box',
          timestamp: minsAgo(165),
        },
        {
          id: 'ev_24',
          orderId: 'ord_demo_past_01',
          fromStatus: 'preparing',
          toStatus: 'out_for_delivery',
          actorRole: 'SELLER',
          reason: 'Runner out for delivery',
          timestamp: minsAgo(155),
        },
        {
          id: 'ev_25',
          orderId: 'ord_demo_past_01',
          fromStatus: 'out_for_delivery',
          toStatus: 'completed',
          actorRole: 'SELLER',
          reason: 'Delivered at Panchayat Bhawan and UPI payment verified',
          timestamp: minsAgo(140),
        },
      ],
    },
  ];
};

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(() => {
    const seedOrders = getInitialMockOrders();
    const saved = localStorage.getItem('grambazaar_orders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Preserve existing user/session orders while ensuring newly added Phase 1 demo scenarios are available
          const existingIds = new Set(parsed.map((o: Order) => o.id));
          const missingSeedOrders = seedOrders.filter((so) => !existingIds.has(so.id));
          return missingSeedOrders.length > 0 ? [...parsed, ...missingSeedOrders] : parsed;
        }
      } catch {
        // Fallback to initial mock orders
      }
    }
    return seedOrders;
  });

  const [sellerNotifications, setSellerNotifications] = useState<SellerOrderNotification[]>(() => {
    const incoming = orders.filter((o) => o.status === 'placed' || o.status === 'pending');
    return incoming.map((o) => ({
      id: `notif_${o.id}`,
      orderId: o.id,
      orderNumber: o.orderNumber,
      sellerId: o.sellerId,
      sellerName: o.sellerName,
      customerName: o.customerName,
      villageName: o.deliveryAddress?.villageName || o.villageId,
      itemsCount: o.items.reduce((sum, i) => sum + i.requestedQuantity, 0),
      totalPaise: o.totalPaise,
      paymentMethod: o.paymentMethod,
      createdAt: o.createdAt,
      acceptDeadlineAt:
        o.acceptDeadlineAt ||
        new Date(new Date(o.createdAt).getTime() + DEFAULT_ACCEPT_WINDOW_SECONDS * 1000).toISOString(),
      read: false,
    }));
  });

  const [latestIncomingNotification, setLatestIncomingNotification] =
    useState<SellerOrderNotification | null>(null);

  useEffect(() => {
    localStorage.setItem('grambazaar_orders', JSON.stringify(orders));
  }, [orders]);

  const activeOrders = orders.filter((o) => !TERMINAL_ORDER_STATUSES.includes(o.status));

  const pastOrders = orders.filter((o) => TERMINAL_ORDER_STATUSES.includes(o.status));

  const getOrderById = (orderId: string) => {
    return orders.find((o) => o.id === orderId);
  };

  const markNotificationRead = (notificationId: string) => {
    setSellerNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const markSellerNotificationsRead = (sellerId: string) => {
    setSellerNotifications((prev) =>
      prev.map((n) => (n.sellerId === sellerId ? { ...n, read: true } : n))
    );
  };

  const dismissLatestNotification = () => {
    setLatestIncomingNotification(null);
  };

  const createOrder = (
    orderData: Omit<Order, 'id' | 'orderNumber' | 'status' | 'statusHistory' | 'createdAt' | 'updatedAt'>
  ): Order => {
    const nowMs = Date.now();
    const timestamp = new Date(nowMs).toISOString();
    const acceptDeadlineAt = new Date(
      nowMs + DEFAULT_ACCEPT_WINDOW_SECONDS * 1000
    ).toISOString();
    const orderSeq = (orders.length + 1).toString().padStart(4, '0');
    const orderNumber = `GB-2026-${orderSeq}`;
    const orderId = `ord_${nowMs}_${Math.random().toString(36).substring(2, 6)}`;

    const initialEvent: OrderEvent = {
      id: `ev_${nowMs}`,
      orderId,
      fromStatus: 'placed',
      toStatus: 'placed',
      actorRole: 'CUSTOMER',
      reason: 'Order placed by customer via checkout — sent to Seller Terminal with 5 min accept timer',
      timestamp,
    };

    const newOrder: Order = {
      ...orderData,
      id: orderId,
      orderNumber,
      status: 'placed',
      statusHistory: [initialEvent],
      estimatedDeliveryMinutes: orderData.estimatedDeliveryMinutes || 30,
      acceptWindowSeconds: DEFAULT_ACCEPT_WINDOW_SECONDS,
      acceptDeadlineAt,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const notification: SellerOrderNotification = {
      id: `notif_${orderId}`,
      orderId,
      orderNumber,
      sellerId: newOrder.sellerId,
      sellerName: newOrder.sellerName,
      customerName: newOrder.customerName,
      villageName: newOrder.deliveryAddress?.villageName || newOrder.villageId,
      itemsCount: newOrder.items.reduce((sum, i) => sum + i.requestedQuantity, 0),
      totalPaise: newOrder.totalPaise,
      paymentMethod: newOrder.paymentMethod,
      createdAt: timestamp,
      acceptDeadlineAt,
      read: false,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setSellerNotifications((prev) => [notification, ...prev]);
    setLatestIncomingNotification(notification);
    playOrderNotificationChime();

    return newOrder;
  };

  const extendAcceptWindow = (orderId: string, extraMinutes: number = 2) => {
    const baseTime = Date.now();
    const nextDeadline = new Date(baseTime + extraMinutes * 60 * 1000).toISOString();

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const currentDeadlineMs = o.acceptDeadlineAt ? new Date(o.acceptDeadlineAt).getTime() : 0;
        const targetMs = Math.max(currentDeadlineMs, baseTime) + extraMinutes * 60 * 1000;
        const updatedDeadline = new Date(targetMs).toISOString();
        return {
          ...o,
          acceptDeadlineAt: updatedDeadline,
          acceptWindowSeconds: (o.acceptWindowSeconds || DEFAULT_ACCEPT_WINDOW_SECONDS) + extraMinutes * 60,
          updatedAt: new Date(baseTime).toISOString(),
        };
      })
    );

    setSellerNotifications((prev) =>
      prev.map((n) =>
        n.orderId === orderId ? { ...n, acceptDeadlineAt: nextDeadline } : n
      )
    );
  };

  const cancelOrder = (orderId: string, reason: string) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) {
      return { success: false, message: 'Order not found' };
    }

    // Customer self-cancellation is strictly allowed ONLY while order is in 'placed' state
    if (target.status !== 'placed') {
      return {
        success: false,
        message: 'Order has already been accepted by the seller and cannot be self-cancelled.',
      };
    }

    const timestamp = new Date().toISOString();
    const cancelReason = reason || 'Customer requested pre-acceptance cancellation';
    const isPrepaid =
      target.paymentStatus === 'collected' || target.paymentStatus === 'settled';

    const cancelEvent: OrderEvent = {
      id: `ev_${Date.now()}`,
      orderId,
      fromStatus: target.status,
      toStatus: 'cancelled',
      actorRole: 'CUSTOMER',
      reason: cancelReason,
      timestamp,
    };

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'cancelled',
              cancellation: {
                cancelledBy: 'CUSTOMER',
                reason: cancelReason,
                cancelledAt: timestamp,
                refundEligible: isPrepaid,
              },
              statusHistory: [...o.statusHistory, cancelEvent],
              updatedAt: timestamp,
            }
          : o
      )
    );

    return { success: true, message: 'Order cancelled successfully.' };
  };

  const transitionOrder = (
    orderId: string,
    nextStatus: OrderStatus,
    reason?: string,
    actorRole: string = 'SELLER',
    metadata?: TransitionOrderMetadata
  ) => {
    const timestamp = new Date().toISOString();
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const newEvent: OrderEvent = {
            id: `ev_${Date.now()}`,
            orderId,
            fromStatus: o.status,
            toStatus: nextStatus,
            actorRole,
            reason: reason || `Status advanced to ${nextStatus}`,
            timestamp,
          };

          const isNowCancelled = nextStatus === 'cancelled';
          const isPrepaid = o.paymentStatus === 'collected' || o.paymentStatus === 'settled';

          return {
            ...o,
            status: nextStatus,
            acceptedAt: nextStatus === 'accepted' ? timestamp : o.acceptedAt,
            estimatedDeliveryMinutes:
              metadata?.estimatedDeliveryMinutes ?? o.estimatedDeliveryMinutes,
            assignedRunnerName:
              metadata?.assignedRunnerName ?? o.assignedRunnerName,
            assignedRunnerPhone:
              metadata?.assignedRunnerPhone ?? o.assignedRunnerPhone,
            paymentStatus:
              nextStatus === 'completed' && o.paymentMethod === 'COD'
                ? 'collected'
                : o.paymentStatus,
            cancellation:
              isNowCancelled && !o.cancellation
                ? {
                    cancelledBy:
                      actorRole === 'ADMIN'
                        ? 'ADMIN'
                        : actorRole === 'CUSTOMER'
                        ? 'CUSTOMER'
                        : 'SELLER',
                    reason: reason || 'Cancelled via status update',
                    cancelledAt: timestamp,
                    refundEligible: isPrepaid,
                  }
                : o.cancellation,
            statusHistory: [...o.statusHistory, newEvent],
            updatedAt: timestamp,
          };
        }
        return o;
      })
    );

    if (nextStatus !== 'placed' && nextStatus !== 'pending') {
      setSellerNotifications((prev) =>
        prev.map((n) => (n.orderId === orderId ? { ...n, read: true } : n))
      );
      setLatestIncomingNotification((prev) => (prev?.orderId === orderId ? null : prev));
    }
  };

  const adminCancelOrder = (orderId: string, payload: AdminCancelOrderPayload) => {
    const timestamp = new Date().toISOString();
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const cancelEvent: OrderEvent = {
          id: `ev_admin_cancel_${Date.now()}`,
          orderId,
          fromStatus: o.status,
          toStatus: 'cancelled',
          actorRole: payload.cancelledBy,
          reason: payload.reason,
          timestamp,
        };
        return {
          ...o,
          status: 'cancelled',
          paymentStatus:
            !payload.refundEligible && o.paymentStatus === 'pending'
              ? 'reversed'
              : o.paymentStatus,
          cancellation: {
            cancelledBy: payload.cancelledBy,
            reason: payload.reason,
            cancelledAt: timestamp,
            refundEligible: payload.refundEligible,
            notes: payload.notes,
          },
          statusHistory: [...o.statusHistory, cancelEvent],
          updatedAt: timestamp,
        };
      })
    );
  };

  const recordOrderReturn = (orderId: string, payload: RecordOrderReturnPayload) => {
    const timestamp = new Date().toISOString();
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;

        const returnedQtyMap = new Map<string, number>();
        payload.returnedItems.forEach((ri) => {
          returnedQtyMap.set(ri.orderItemId, ri.quantity);
        });

        const updatedItems = o.items.map((item) => {
          const rQty = returnedQtyMap.get(item.id);
          return rQty !== undefined ? { ...item, returnedQuantity: rQty } : item;
        });

        const nextStatus: OrderStatus =
          payload.status === 'REJECTED' ? o.status : 'returned';

        const returnEvent: OrderEvent = {
          id: `ev_admin_return_${Date.now()}`,
          orderId,
          fromStatus: o.status,
          toStatus: nextStatus,
          actorRole: 'ADMIN',
          reason: `Return ${payload.status.toLowerCase().replace(/_/g, ' ')}: ${payload.reason}`,
          timestamp,
        };

        return {
          ...o,
          status: nextStatus,
          items: updatedItems,
          returnInfo: {
            returnId: o.returnInfo?.returnId || `RET-2026-${String(Date.now()).slice(-4)}`,
            status: payload.status,
            reason: payload.reason,
            requestedAt: o.returnInfo?.requestedAt || timestamp,
            updatedAt: timestamp,
            returnedItems: payload.returnedItems,
            notes: payload.notes,
          },
          statusHistory: [...o.statusHistory, returnEvent],
          updatedAt: timestamp,
        };
      })
    );
  };

  const processOrderRefund = (orderId: string, payload: ProcessOrderRefundPayload) => {
    const timestamp = new Date().toISOString();
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;

        const isCompleted = payload.status === 'COMPLETED';
        const isFullRefund = payload.amountPaise >= o.totalPaise;
        const nextOrderStatus: OrderStatus = isCompleted ? 'refunded' : o.status;
        const nextPaymentStatus = isCompleted
          ? isFullRefund
            ? 'refunded'
            : 'partially_refunded'
          : o.paymentStatus;

        const refundId =
          o.refundInfo?.refundId || `RFD-2026-${String(Date.now()).slice(-4)}`;
        const referenceId =
          payload.referenceId?.trim() ||
          o.refundInfo?.referenceId ||
          (isCompleted ? `SIM-UTR-${String(Date.now()).slice(-8)}` : undefined);

        const refundEvent: OrderEvent = {
          id: `ev_admin_refund_${Date.now()}`,
          orderId,
          fromStatus: o.status,
          toStatus: nextOrderStatus,
          actorRole: 'ADMIN',
          reason:
            payload.status === 'FAILED'
              ? `Refund ${refundId} failed: ${payload.failureReason || payload.reason}`
              : `Refund ${refundId} marked ${payload.status} (₹${(
                  payload.amountPaise / 100
                ).toFixed(2)} via ${payload.method.replace(/_/g, ' ')}) — ${payload.reason}`,
          timestamp,
        };

        return {
          ...o,
          status: nextOrderStatus,
          paymentStatus: nextPaymentStatus,
          refundInfo: {
            refundId,
            amountPaise: payload.amountPaise,
            status: payload.status,
            method: payload.method,
            reason: payload.reason,
            initiatedAt: o.refundInfo?.initiatedAt || timestamp,
            completedAt: isCompleted ? timestamp : o.refundInfo?.completedAt,
            referenceId,
            initiatedBy: payload.initiatedBy,
            failureReason: payload.status === 'FAILED' ? payload.failureReason : undefined,
          },
          statusHistory: [...o.statusHistory, refundEvent],
          updatedAt: timestamp,
        };
      })
    );
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        activeOrders,
        pastOrders,
        sellerNotifications,
        latestIncomingNotification,
        getOrderById,
        createOrder,
        cancelOrder,
        transitionOrder,
        extendAcceptWindow,
        markNotificationRead,
        markSellerNotificationsRead,
        dismissLatestNotification,
        adminCancelOrder,
        recordOrderReturn,
        processOrderRefund,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export function useOrders(): OrderContextType {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}
