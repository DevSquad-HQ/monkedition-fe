// The staff dashboard's calls to /api/v2/admin.
import { api } from "../api/client";

const BASE = "/api/v2/admin";

export const admin = {
  get: (path) => api.get(`${BASE}${path}`),
  post: (path, body = {}) => api.post(`${BASE}${path}`, body),
  put: (path, body) => api.put(`${BASE}${path}`, body),
  patch: (path, body) => api.patch(`${BASE}${path}`, body),
  delete: (path) => api.delete(`${BASE}${path}`),
};

/** A query string from the set values of an object. */
export const query = (params) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, value);
  }
  const text = search.toString();
  return text ? `?${text}` : "";
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

/**
 * Uploads one image straight to Cloudinary, using a signature the server issues
 * for the right folder. The server never handles the file itself.
 * @param {File} file
 * @param {object} target what the image belongs to, which decides its folder
 * @returns {Promise<string>} the image's URL
 */
export const uploadImage = async (file, target) => {
  if (!IMAGE_TYPES.has(file.type)) throw new Error(`${file.name}: use a JPG, PNG, WebP or AVIF image`);
  if (file.size > MAX_IMAGE_BYTES) throw new Error(`${file.name}: images must be 10 MB or smaller`);
  const { uploadUrl, fields } = await admin.post("/media/sign", target);
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  form.append("file", file);
  const response = await fetch(uploadUrl, { method: "POST", body: form });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${file.name}: ${data?.error?.message ?? "upload failed"}`);
  return data.secure_url;
};

/** The reason an API call failed, naming the fields when the server does. */
export const errorText = (error) => {
  const details = (error?.body?.errors ?? [])
    .map?.(({ path, message }) => (path ? `${path}: ${message}` : message))
    .join("; ");
  return details || error?.message || "Something went wrong. Please try again.";
};
