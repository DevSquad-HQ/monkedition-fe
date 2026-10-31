// The home page slides, from /api/v2/sliders.
import { api } from "../api/client";

const track = (sliderId, type) =>
  api.post(`/api/v2/sliders/${sliderId}/events`, { type }, { auth: false }).catch((error) => {
    console.error(`Error tracking ${type}:`, error);
  });

const sliderService = {
  // In the shape the Hero component reads.
  getActiveSliders: async () => {
    const { items = [] } = (await api.get("/api/v2/sliders/active", { auth: false })) ?? {};
    return {
      success: true,
      data: items.map((slider) => ({
        id: slider.id,
        desktop: slider.images?.desktop,
        mobile: slider.images?.mobile,
        title: slider.title,
        subtitle: slider.subtitle,
        cta: slider.cta,
        ctaLink: slider.ctaLink,
      })),
    };
  },
  trackImpression: (sliderId) => track(sliderId, "impression"),
  trackClick: (sliderId) => track(sliderId, "click"),
};

export default sliderService;
