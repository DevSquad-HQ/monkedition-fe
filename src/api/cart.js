// The server-side cart, /api/v2/cart (P2-10). Totals, prices and stock come
// from the server; the browser only says which SKU and how many.
import { api, getAccessToken } from "./client";
import { rupees } from "./adapters";

const GUEST_KEY = "cartGuestId";

const newGuestId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
        (c ^ (Math.random() * 16) >> (c / 4)).toString(16),
      );

/** The guest's cart id, made once and kept, so a guest cart survives reloads. */
export const guestId = () => {
  let id = localStorage.getItem(GUEST_KEY);
  if (!id) {
    id = newGuestId();
    localStorage.setItem(GUEST_KEY, id);
  }
  return id;
};

// Signed in, the token says whose cart it is; a guest sends their id.
const owner = () => (getAccessToken() ? {} : { "X-Anonymous-Id": guestId() });

/** Which v2 features are on for this visitor. Off when the API cannot say. */
export const getFlags = () =>
  api.get("/api/v2/flags").catch(() => ({ cartV2: false, checkoutV2: false }));

export const fetchCart = () => api.get("/api/v2/cart", { headers: owner() });

export const addLine = (sku, quantity = 1) =>
  api.post("/api/v2/cart/lines", { sku, quantity }, { headers: owner() });

export const setLineQuantity = (sku, quantity) =>
  api.patch(`/api/v2/cart/lines/${encodeURIComponent(sku)}`, { quantity }, { headers: owner() });

export const removeLine = (sku) =>
  api.delete(`/api/v2/cart/lines/${encodeURIComponent(sku)}`, { headers: owner() });

export const clearCart = () => api.delete("/api/v2/cart", { headers: owner() });

/** After login: fold the guest cart into the user's. A no-op without one. */
export const mergeGuestCart = async () => {
  const id = localStorage.getItem(GUEST_KEY);
  if (!id) return null;
  return api.post("/api/v2/cart/merge", { anonymousId: id });
};

/**
 * The server cart in the shape the pages were written against:
 * { [productId]: [{ size, color, quantity, product: { _id, name, price, mrp, image, weight, sku } }] }
 */
export const toLegacyCart = (view) => {
  const cart = {};
  for (const line of view?.lines ?? []) {
    const price = rupees(line.unitPrice);
    const key = line.productId ?? `unknown:${line.sku}`;
    (cart[key] ??= []).push({
      size: line.size,
      color: line.colour?.code,
      quantity: line.quantity,
      sku: line.sku,
      issue: line.issue,
      product: {
        _id: line.productId,
        slug: line.slug,
        name: line.name ?? line.sku,
        price,
        mrp: rupees(line.listPrice) ?? price,
        image: line.image,
        weight: line.weightGrams ?? 0,
        sku: line.sku,
      },
    });
  }
  return cart;
};

const ISSUE_TEXT = {
  UNAVAILABLE: "is no longer available",
  OUT_OF_STOCK: "is out of stock",
  NOT_ENOUGH_STOCK: "has fewer left than in your cart",
};

/** Why the cart cannot go to checkout yet, or null. */
export const checkoutBlockedReason = (view) => {
  const problems = (view?.lines ?? []).filter((line) => line.issue);
  if (!problems.length) return null;
  return problems
    .map((line) => {
      const name = [line.name ?? line.sku, line.size].filter(Boolean).join(" ");
      const extra = line.issue.code === "NOT_ENOUGH_STOCK" ? ` (${line.issue.available} left)` : "";
      return `${name} ${ISSUE_TEXT[line.issue.code] ?? "needs attention"}${extra}`;
    })
    .join(". ") + ". Update your cart to continue.";
};
