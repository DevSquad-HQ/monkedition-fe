// Sign-in and profile calls against /api/v2/auth and /api/v2/me (P1-23).
import { api, clearSession, getRefreshToken, storeTokens, storeUser } from "./client";
import { toLegacyUser } from "./adapters";

/**
 * The signed-in user in the shape the pages read. The saved address still
 * lives on the v1 user record until the address book moves to v2, so it is
 * merged in when available; failing that is not fatal.
 */
export const loadUser = async (profile) => {
  const me = profile ?? (await api.get("/api/v2/me"));
  let v1User = null;
  try {
    v1User = (await api.get(`/api/v1/user/${me.id}`)).user ?? null;
  } catch {
    /* the profile is enough to stay signed in */
  }
  const user = toLegacyUser(me, v1User);
  storeUser(user);
  return user;
};

const startSession = async (data) => {
  storeTokens(data);
  return loadUser(data.user);
};

export const login = async (email, password) =>
  startSession(await api.post("/api/v2/auth/login", { email, password }, { auth: false }));

export const register = async ({ firstName, lastName, email, password, phone }) =>
  startSession(
    await api.post("/api/v2/auth/register", { firstName, lastName, email, password, phone }, { auth: false }),
  );

/** @param {string} idToken the credential from Google's sign-in button */
export const loginWithGoogle = async (idToken) =>
  startSession(await api.post("/api/v2/auth/google", { idToken }, { auth: false }));

/** Ends this device's session on the server too, when it has a v2 token. */
export const logout = async () => {
  const refreshToken = getRefreshToken();
  clearSession();
  if (refreshToken && refreshToken.includes(".") && refreshToken.length < 100) {
    await api.post("/api/v2/auth/logout", { refreshToken }, { auth: false }).catch(() => {});
  }
};

/** Profile and address edits still go to v1 until the address book moves. */
export const updateUser = async (userId, updates) =>
  (await api.put(`/api/v1/user/update/${userId}`, updates)).user;
