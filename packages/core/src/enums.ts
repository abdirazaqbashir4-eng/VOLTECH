// Central source of truth for every "enum-like" string field in the schema.
// SQLite has no native enum type (see prisma/schema.prisma header), so these
// are enforced here instead. Keep this file in sync with schema.prisma.

export const USER_ROLES = ["CUSTOMER", "SELLER", "ADMIN", "SUPER_ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["ACTIVE", "SUSPENDED", "BANNED"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const SELLER_APPLICATION_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
] as const;
export type SellerApplicationStatus = (typeof SELLER_APPLICATION_STATUSES)[number];

export const SELLER_STATUSES = ["APPROVED", "SUSPENDED"] as const;
export type SellerStatus = (typeof SELLER_STATUSES)[number];

export const PRODUCT_STATUSES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const VARIANT_STATUSES = ["ACTIVE", "OUT_OF_STOCK", "DISCONTINUED"] as const;
export type VariantStatus = (typeof VARIANT_STATUSES)[number];

export const ORDER_STATUSES = ["PENDING_PAYMENT", "PAID", "PROCESSING", "CANCELLED", "REFUNDED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const SELLER_ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "READY_FOR_FULFILLMENT",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
  "REFUNDED",
] as const;
export type SellerOrderStatus = (typeof SELLER_ORDER_STATUSES)[number];

// Statuses a seller may transition an order into manually from the seller
// center, in order. Terminal/negative statuses (CANCELLED etc.) are handled
// by dedicated actions, not this forward progression.
export const SELLER_ORDER_FORWARD_FLOW: SellerOrderStatus[] = [
  "PAID",
  "PROCESSING",
  "READY_FOR_FULFILLMENT",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export const PAYMENT_PROVIDERS = ["MPESA", "CARD", "MOCK"] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const PAYMENT_STATUSES = [
  "PENDING",
  "PROCESSING",
  "PAID",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const REFUND_STATUSES = ["PENDING", "PROCESSING", "COMPLETED", "FAILED"] as const;
export type RefundStatus = (typeof REFUND_STATUSES)[number];

export const PAYOUT_STATUSES = ["PENDING", "PROCESSING", "PAID", "FAILED", "CANCELLED"] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

export const COMMISSION_SCOPES = ["GLOBAL", "CATEGORY", "SELLER"] as const;
export type CommissionScope = (typeof COMMISSION_SCOPES)[number];

export const INVENTORY_TXN_TYPES = ["RESTOCK", "RESERVE", "RELEASE", "FULFILL", "RETURN", "ADJUSTMENT"] as const;
export type InventoryTxnType = (typeof INVENTORY_TXN_TYPES)[number];

export const LEDGER_ENTRY_TYPES = ["SALE", "COMMISSION", "REFUND", "ADJUSTMENT", "PAYOUT"] as const;
export type LedgerEntryType = (typeof LEDGER_ENTRY_TYPES)[number];

export const LEDGER_BALANCE_TYPES = ["PENDING", "AVAILABLE"] as const;
export type LedgerBalanceType = (typeof LEDGER_BALANCE_TYPES)[number];

export const REVIEW_STATUSES = ["PUBLISHED", "HIDDEN", "FLAGGED"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const COUPON_SCOPES = ["PLATFORM", "SELLER"] as const;
export type CouponScope = (typeof COUPON_SCOPES)[number];

export const PROMOTION_SCOPES = ["PLATFORM", "SELLER", "CATEGORY", "FLASH_SALE"] as const;
export type PromotionScope = (typeof PROMOTION_SCOPES)[number];

export const DISCOUNT_TYPES = ["PERCENTAGE", "FIXED"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const RETURN_STATUSES = ["REQUESTED", "APPROVED", "REJECTED", "RECEIVED", "REFUNDED"] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];

export const NOTIFICATION_TYPES = [
  "ORDER_CONFIRMED",
  "PAYMENT_CONFIRMED",
  "ORDER_PROCESSING",
  "ORDER_SHIPPED",
  "ORDER_OUT_FOR_DELIVERY",
  "ORDER_DELIVERED",
  "ORDER_CANCELLED",
  "ORDER_REFUNDED",
  "PROMOTION",
  "NEW_ORDER",
  "LOW_STOCK",
  "PRODUCT_APPROVED",
  "PRODUCT_REJECTED",
  "PAYOUT_UPDATE",
  "SELLER_APPLICATION_SUBMITTED",
  "SELLER_APPLICATION_DECIDED",
  "PRODUCT_PENDING_APPROVAL",
  "DISPUTE_OPENED",
  "RETURN_REQUESTED",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const ADMIN_PERMISSIONS = [
  "MANAGE_SELLERS",
  "MANAGE_PRODUCTS",
  "MANAGE_CATEGORIES",
  "MANAGE_ORDERS",
  "MANAGE_FINANCE",
  "MANAGE_PROMOTIONS",
  "MANAGE_REVIEWS",
  "MANAGE_SETTINGS",
  "MANAGE_ADMINS",
] as const;
export type AdminPermissionKey = (typeof ADMIN_PERMISSIONS)[number];
