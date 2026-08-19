const STYLES: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-700",
  PENDING_PAYMENT: "bg-slate-100 text-slate-700",
  PAID: "bg-blue-50 text-blue-700",
  PROCESSING: "bg-blue-50 text-blue-700",
  READY_FOR_FULFILLMENT: "bg-blue-50 text-blue-700",
  SHIPPED: "bg-amber-50 text-amber-700",
  OUT_FOR_DELIVERY: "bg-amber-50 text-amber-700",
  DELIVERED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
  FAILED: "bg-red-50 text-red-700",
  RETURNED: "bg-red-50 text-red-700",
  REFUNDED: "bg-red-50 text-red-700",
  PARTIALLY_REFUNDED: "bg-red-50 text-red-700",
};

function label(status: string) {
  return status.replaceAll("_", " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());
}

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status] ?? "bg-slate-100 text-slate-700"}`}>
      {label(status)}
    </span>
  );
}
