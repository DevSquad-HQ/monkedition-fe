// The customer's orders from v2 (/api/v2/orders), in the shape the Orders
// page was written against (v1). Includes orders placed on v1, which the
// backend copied into v2 (migration 006).
import { api } from "./client";
import { rupees } from "./adapters";

const STATUS = {
  PENDING_PAYMENT: "payment_pending",
  PAYMENT_CONFIRMED: "confirmed",
  FULFILMENT_REQUESTED: "processing",
  RETURN_REQUESTED: "delivered",
  RETURNED: "refunded",
};

/** A v2 order detail as a v1 order. */
export const toLegacyOrder = (order) => ({
  _id: order.orderNumber,
  orderId: order.orderNumber,
  createdAt: order.placedAt,
  status: (STATUS[order.status] ?? order.status).toLowerCase(),
  paymentMethod: order.paymentMethod === "PREPAID" ? "RAZORPAY" : "COD",
  paymentStatus: order.paymentStatus,
  totalAmount: rupees(order.grandTotal),
  codFee: rupees(order.codFee) ?? 0,
  items: (order.lines ?? []).map((line) => ({
    _id: line.sku,
    productName: line.name ?? line.sku,
    sku: line.sku,
    quantity: line.quantity,
    price: rupees(line.total),
  })),
  deliveryAddress: {
    fullName: order.deliveryAddress?.fullName,
    doorNo: order.deliveryAddress?.line1,
    street: [order.deliveryAddress?.line2, order.deliveryAddress?.landmark].filter(Boolean).join(", "),
    city: order.deliveryAddress?.city,
    state: order.deliveryAddress?.state,
    pincode: order.deliveryAddress?.pincode,
    phone: order.deliveryAddress?.phone,
    email: order.deliveryAddress?.email,
  },
  cancelReason: order.cancelReason,
  canCancel: order.canCancel ?? false,
  canPay: order.status === "PENDING_PAYMENT" && order.paymentMethod === "PREPAID",
  subtotal: rupees(order.subtotal),
  discount: rupees(order.discount) ?? 0,
});

const PAYMENT_LABELS = {
  PENDING: "Not paid yet",
  AUTHORIZED: "Authorised",
  PAID: "Paid",
  FAILED: "Failed",
  PARTIALLY_REFUNDED: "Partly refunded",
  REFUNDED: "Refunded",
};

/** The payment state in words. A COD order is paid when it is delivered. */
export const paymentLabel = (order) =>
  order.paymentMethod === "COD" && order.paymentStatus === "PENDING"
    ? "Pay on delivery"
    : PAYMENT_LABELS[order.paymentStatus] ?? order.paymentStatus;

const SHIPPED = new Set(["shipped", "delivered"]);

/** Courier details exist once the parcel has shipped. Missing ones are not fatal. */
const withTracking = async (order) => {
  if (!SHIPPED.has(order.status)) return order;
  try {
    const { shipment } = await api.get(
      `/api/v2/orders/${encodeURIComponent(order.orderId)}/tracking`,
    );
    return {
      ...order,
      awbNo: shipment?.awb ?? null,
      courier: shipment?.courier ?? null,
      trackingUrl: shipment?.trackingUrl ?? null,
    };
  } catch {
    return order;
  }
};

/** Every order of the signed-in customer, with details. The server sends newest first; the page, written for v1's order, shows the list reversed. */
export const fetchMyOrders = async () => {
  const page = await api.get("/api/v2/orders?size=50");
  const details = await Promise.all(
    (page?.items ?? []).map((summary) =>
      api.get(`/api/v2/orders/${encodeURIComponent(summary.orderNumber)}`),
    ),
  );
  return Promise.all(details.map(toLegacyOrder).reverse().map(withTracking));
};

/** Cancels the signed-in customer's order; a paid one is refunded by the server. */
export const cancelOrder = (orderNumber) =>
  api.post(
    `/api/v2/orders/${encodeURIComponent(orderNumber)}/cancel`,
    {},
    { headers: { "Idempotency-Key": crypto.randomUUID() } },
  );
