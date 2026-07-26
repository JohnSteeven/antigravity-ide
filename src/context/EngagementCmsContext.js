import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { articleApi, commentApi, testimonialApi, newsletterCampaignApi, contactMessageApi, subscriberApi } from "../services/apiService";
import { useAuth } from "../hooks/useAuth";

const EngagementCmsContext = createContext(null);
const STORAGE_KEY = "myjourney-engagement-data";

const withClientId = (item) => {
  if (!item || typeof item !== "object") return item;
  return { ...item, id: item._id || item.id };
};

export const EngagementCmsProvider = ({ children }) => {
  const [syncStatus, setSyncStatus] = useState("loading");
  const [comments, setComments] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [subscribers, setSubscribers] = useState([]);

  // Load fallback from localStorage
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.comments) setComments(parsed.comments);
        if (parsed.testimonials) setTestimonials(parsed.testimonials);
        if (parsed.subscribers) setSubscribers(parsed.subscribers);
      }
    } catch (err) {
      console.warn("Failed to load local engagement cache", err);
    }
  }, []);

  // Debounced save
  useEffect(() => {
    const timer = setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ comments, testimonials, subscribers }));
    }, 1000);
    return () => clearTimeout(timer);
  }, [comments, testimonials, subscribers]);

  const fetchEngagementData = async () => {
    setSyncStatus("loading");
    try {
      const [commentsRes, testimonialsRes, subscribersRes] = await Promise.all([
        commentApi.list({ includeDeleted: true }).catch(() => ({ comments: [] })),
        testimonialApi.list().catch(() => ({ testimonials: [] })),
        subscriberApi.list().catch(() => ({ subscribers: [] })),
      ]);

      if (commentsRes && Array.isArray(commentsRes.comments)) {
        setComments(commentsRes.comments.map(withClientId));
      }
      if (testimonialsRes && Array.isArray(testimonialsRes.testimonials)) {
        setTestimonials(testimonialsRes.testimonials.map(withClientId));
      }
      if (subscribersRes && Array.isArray(subscribersRes.subscribers)) {
        setSubscribers(subscribersRes.subscribers.map(withClientId));
      }
      setSyncStatus("live");
    } catch (err) {
      console.warn("Failed to fetch live engagement, using stale fallback", err);
      setSyncStatus("stale-fallback");
    }
  };

  const { isAuthenticated, user } = useAuth();
  const isAdminOrEditor = isAuthenticated && (user?.role === "Admin" || user?.role === "Editor");

  useEffect(() => {
    if (isAdminOrEditor) {
      fetchEngagementData();
    }
  }, [isAdminOrEditor]);

  const actions = useMemo(() => ({
    async refreshComments() {
      await fetchEngagementData();
    },
    async addComment(articleId, comment) {
      const data = await articleApi.addComment(articleId, comment.text || comment.body || "");
      await fetchEngagementData();
      return data.comment;
    },
    async updateCommentStatus(articleId, commentId, status) {
      await commentApi.moderate(commentId, status);
      setComments((prev) => prev.map((c) => (c.id === commentId || c._id === commentId) ? { ...c, status } : c));
    },
    async moderateComment(commentId, status, updates = {}) {
      const res = await commentApi.moderate(commentId, status, updates);
      const normalized = withClientId(res.comment);
      setComments((prev) => prev.map((c) => (c.id === commentId || c._id === commentId) ? normalized : c));
      return res.comment;
    },
    async deleteComment(commentId) {
      await commentApi.delete(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId && c._id !== commentId));
    },
    async restoreComment(commentId) {
      const res = await commentApi.restore(commentId);
      const normalized = withClientId(res.comment);
      setComments((prev) => [normalized, ...prev.filter((c) => c.id !== commentId && c._id !== commentId)]);
      return res.comment;
    },
    async saveTestimonial(testimonial) {
      const isEdit = !!(testimonial.id || testimonial._id);
      let res;
      if (isEdit) {
        res = await testimonialApi.update(testimonial.id || testimonial._id, testimonial);
      } else {
        res = await testimonialApi.create(testimonial);
      }
      const normalized = withClientId(res.testimonial);
      setTestimonials((prev) => {
        const filtered = prev.filter((t) => t.id !== normalized.id);
        return [normalized, ...filtered];
      });
      return normalized;
    },
    async deleteTestimonial(id) {
      await testimonialApi.delete(id);
      setTestimonials((prev) => prev.filter((t) => t.id !== id && t._id !== id));
    },
    async restoreTestimonial(id) {
      const res = await testimonialApi.restore(id);
      const normalized = withClientId(res.testimonial);
      setTestimonials((prev) => [normalized, ...prev.filter((t) => t.id !== id && t._id !== id)]);
      return res.testimonial;
    },
    async fetchTestimonials(params = {}) {
      return testimonialApi.list(params);
    },
    async addSubscriber(email) {
      const normalized = email.trim().toLowerCase();
      if (!normalized) return;
      try {
        const res = await subscriberApi.subscribe(normalized);
        const sub = withClientId(res.subscriber);
        setSubscribers((prev) => {
          if (prev.some((s) => s.email.toLowerCase() === normalized)) return prev;
          return [...prev, sub];
        });
      } catch (err) {
        console.error("Failed to add subscriber", err);
      }
    },
    async deleteSubscriber(id) {
      await subscriberApi.delete(id);
      setSubscribers((prev) => prev.filter((s) => s.id !== id && s._id !== id));
    },
    async fetchCampaigns(params = {}) {
      return newsletterCampaignApi.list(params);
    },
    async saveCampaign(campaign) {
      const isEdit = !!(campaign.id || campaign._id);
      let res;
      if (isEdit) {
        res = await newsletterCampaignApi.update(campaign.id || campaign._id, campaign);
      } else {
        res = await newsletterCampaignApi.create(campaign);
      }
      return res.campaign;
    },
    async sendCampaign(id) {
      const res = await newsletterCampaignApi.send(id);
      return res.campaign;
    },
    async deleteCampaign(id) {
      await newsletterCampaignApi.delete(id);
    },
    async restoreCampaign(id) {
      const res = await newsletterCampaignApi.restore(id);
      return res.campaign;
    },
    async fetchContactMessages(params = {}) {
      return contactMessageApi.list(params);
    },
    async updateContactMessage(id, updates) {
      const res = await contactMessageApi.update(id, updates);
      return res.message;
    },
    async deleteContactMessage(id) {
      await contactMessageApi.delete(id);
    },
    async restoreContactMessage(id) {
      const res = await contactMessageApi.restore(id);
      return res.message;
    }
  }), [comments, testimonials, subscribers]);

  const value = useMemo(() => ({
    comments,
    testimonials,
    subscribers,
    syncStatus,
    ...actions
  }), [comments, testimonials, subscribers, syncStatus, actions]);

  return <EngagementCmsContext.Provider value={value}>{children}</EngagementCmsContext.Provider>;
};

export const useEngagementCms = () => {
  const context = useContext(EngagementCmsContext);
  if (!context) throw new Error("useEngagementCms must be used inside EngagementCmsProvider");
  return context;
};
