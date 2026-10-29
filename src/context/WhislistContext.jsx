import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./NewAuthContext";
import * as catalog from "../api/catalog";

const WishlistContext = createContext();

// The wishlist always belongs to the signed-in user: the API reads it from
// the token, so no user id is ever sent (#30).
export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchWishlist = useCallback(async () => {
    if (!user?._id) {
      setWishlistItems([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setWishlistItems(await catalog.getWishlist());
    } catch (err) {
      setError(err.message);
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = async (productId) => {
    if (!user) throw new Error("Please log in to add to wishlist");
    try {
      setLoading(true);
      setWishlistItems(await catalog.addToWishlist(productId));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!user?._id) throw new Error("Please log in to remove from wishlist");
    const previousItems = [...wishlistItems];
    setWishlistItems((items) => items.filter((item) => item?.product?._id !== productId));
    try {
      await catalog.removeFromWishlist(productId);
    } catch (err) {
      setWishlistItems(previousItems);
      setError(err.message);
      throw err;
    }
  };

  const clearWishlist = async () => {
    try {
      setLoading(true);
      await catalog.clearWishlist();
      setWishlistItems([]);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const isInWishlist = (productId) => wishlistItems.some((item) => item?.product?._id === productId);

  const value = {
    wishlistItems,
    loading,
    error,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    isInWishlist,
    fetchWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
