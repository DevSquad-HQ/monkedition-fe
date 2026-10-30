// Checkout v2 (P3-11/P3-12): the server prices the order from a quote and
// takes payment against its own amount. The browser sends only what is
// being bought, where to, and how the customer pays.
import { api, ApiError } from "./client";
import { getFlags } from "./cart";
import { rupees } from "./adapters";

const uuid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
        (c ^ (Math.random() * 16) >> (c / 4)).toString(16),
      );

/** Whether this customer checks out on v2. */
export const checkoutV2Enabled = async () => (await getFlags()).checkoutV2 === true;

const lastTen = (phone) => String(phone ?? "").replace(/\D/g, "").slice(-10);
const same = (a, b) => String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();

/**
 * The address-book entry for this delivery address: an identical saved one,
 * or a new one. v2 checkout ships to a saved address, never to free text.
 * @param {{ firstName: string, lastName: string, phone: string, doorNo: string, address: string, city: string, state: string, pincode: string }} form
 */
export const ensureAddress = async (form) => {
  const wanted = {
    fullName: `${form.firstName} ${form.lastName}`.trim(),
    phone: lastTen(form.phone),
    line1: [form.doorNo, form.address].map((part) => part.trim()).filter(Boolean).join(", "),
    city: form.city.trim(),
    state: form.state.trim(),
    pincode: form.pincode.trim(),
  };
  const { items = [] } = (await api.get("/api/v2/me/addresses")) ?? {};
  const saved = items.find(
    (a) =>
      same(a.fullName, wanted.fullName) &&
      lastTen(a.phone) === wanted.phone &&
      same(a.line1, wanted.line1) &&
      same(a.city, wanted.city) &&
      same(a.state, wanted.state) &&
      a.pincode === wanted.pincode,
  );
  if (saved) return saved.id;
  const created = await api.post("/api/v2/me/addresses", { ...wanted, isDefault: items.length === 0 });
  return created.id;
};

/**
 * Prices exactly these items for this customer. Items carry a product,
 * colour and size (or a SKU); the server resolves and prices them.
 * @param {Array<{ id?: string, sku?: string, color?: string, size?: string, quantity: number }>} items
 * @param {"COD" | "PREPAID"} paymentMethod
 * @param {{ pincode: string, state: string }} destination
 */
export const quoteItems = (items, paymentMethod, destination) =>
  api.post("/api/v2/quotes", {
    items: items.map((item) =>
      item.id && item.color && item.size
        ? { productId: item.id, color: item.color, size: item.size, quantity: Number(item.quantity) }
        : { sku: item.sku, quantity: Number(item.quantity) },
    ),
    paymentMethod,
    destination,
  });

/** Places the order. One key per attempt, so a double click cannot order twice. */
export const placeOrder = ({ quoteId, addressId, paymentMethod }, idempotencyKey = uuid()) =>
  api.post(
    "/api/v2/checkout",
    { quoteId, addressId, paymentMethod },
    { headers: { "Idempotency-Key": idempotencyKey } },
  );

/** The browser's fast path after paying; the webhook does the same work. */
export const confirmPayment = ({ orderNumber, gatewayOrderId, gatewayPaymentId, signature }) =>
  api.post("/api/v2/payments/confirm", { orderNumber, gatewayOrderId, gatewayPaymentId, signature });

/** Why checkout failed, in words for the customer. */
export const checkoutErrorMessage = (error) => {
  if (!(error instanceof ApiError)) return error?.message || "Something went wrong. Please try again.";
  switch (error.code) {
    case "PRICE_CHANGED": {
      const now = rupees(error.body?.errors?.currentTotal);
      return now
        ? `Prices changed since you opened checkout. The new total is ₹${now}. Please place the order again.`
        : "Some items are no longer available at this price. Please review your cart.";
    }
    case "OUT_OF_STOCK":
      return "Sorry, some items just sold out. Please update your cart and try again.";
    case "VARIANT_NOT_FOUND":
      return "Some items in your cart are no longer sold. Please remove them and try again.";
    case "QUOTE_EXPIRED":
    case "QUOTE_USED":
    case "QUOTE_STALE":
      return "Your checkout timed out. Please place the order again.";
    case "PAYMENT_UNAVAILABLE":
      return "Online payment is unavailable right now. Please try again in a few minutes, or choose Cash on Delivery.";
    case "CHECKOUT_V2_DISABLED":
      return "Checkout is being updated. Please refresh the page and try again.";
    default:
      return error.message;
  }
};
