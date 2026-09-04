import { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
import { articleApi, commentApi, testimonialApi, newsletterCampaignApi, contactMessageApi, subscriberApi } from "../services/apiService";
import { useAuth } from "../hooks/useAuth";

const EngagementCmsContext = createContext(null);
const STORAGE_KEY = "myjourney-engagement-data";

const runForActiveAdmin = async (activeAdminRef, operation) => {
  const ownerId = activeAdminRef.current;
  if (!ownerId) throw Object.assign(new Error("Administrator access is no longer active."), { code: "CMS_ADMIN_CONTEXT_REQUIRED" });
  const result = await operation();
  if (activeAdminRef.current !== ownerId) {
    throw Object.assign(new Error("This administrator response is no longer current."), { code: "CMS_STALE_ADMIN_RESPONSE" });
  }
  return result;
};

const withClientId = (item) => {
  if (!item || typeof item !== "object") return item;
  return { ...item, id: item._id || item.id };
};

export const EngagementCmsProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const isAdmin = isAuthenticated && user?.role === "Admin";
  const activeAdminId = isAdmin ? String(user?.id || user?._id || "") : "";
  const activeAdminRef = useRef(activeAdminId);
  activeAdminRef.current = activeAdminId;
  const requestVersionRef = useRef(0);
  const [syncStatus, setSyncStatus] = useState("loading");
  const [comments, setComments] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [dataOwnerId, setDataOwnerId] = useState("");

  useEffect(() => {
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const fetchEngagementData = async () => {
    const ownerId = activeAdminRef.current;
    if (!ownerId) return;
    const requestVersion = ++requestVersionRef.current;
    setSyncStatus("loading");
    try {
      const [commentsRes, testimonialsRes, subscribersRes] = await Promise.all([
        commentApi.list({ includeDeleted: true }),
        testimonialApi.list(),
        subscriberApi.list(),
      ]);

      if (requestVersion !== requestVersionRef.current || activeAdminRef.current !== ownerId) return;

      if (commentsRes && Array.isArray(commentsRes.comments)) {
        setComments(commentsRes.comments.map(withClientId));
      }
      if (testimonialsRes && Array.isArray(testimonialsRes.testimonials)) {
        setTestimonials(testimonialsRes.testimonials.map(withClientId));
      }
      if (subscribersRes && Array.isArray(subscribersRes.subscribers)) {
        setSubscribers(subscribersRes.subscribers.map(withClientId));
      }
      setDataOwnerId(ownerId);
      setSyncStatus("live");
    } catch (err) {
      if (requestVersion !== requestVersionRef.current || activeAdminRef.current !== ownerId) return;
      setComments([]);
      setTestimonials([]);
      setSubscribers([]);
      setDataOwnerId("");
      setSyncStatus("unavailable");
    }
  };

  useEffect(() => {
    requestVersionRef.current += 1;
    setComments([]);
    setTestimonials([]);
    setSubscribers([]);
    setDataOwnerId("");
    window.localStorage.removeItem(STORAGE_KEY);
    if (authLoading || !activeAdminId) {
      setSyncStatus("idle");
      return;
    }
    fetchEngagementData();
  }, [authLoading, activeAdminId]);

  const actions = useMemo(() => ({
    async refreshComments() {
      await fetchEngagementData();
    },
    async addComment(articleId, comment) {
      const data = await articleApi.addComment(articleId, comment.text || comment.body || "");
      if (activeAdminRef.current) await fetchEngagementData();
      return data;
    },
    async updateCommentStatus(articleId, commentId, status) {
      await runForActiveAdmin(activeAdminRef, () => commentApi.moderate(commentId, status));
      setComments((prev) => prev.map((c) => (c.id === commentId || c._id === commentId) ? { ...c, status } : c));
    },
    async moderateComment(commentId, status, updates = {}) {
      const res = await runForActiveAdmin(activeAdminRef, () => commentApi.moderate(commentId, status, updates));
      const normalized = withClientId(res.comment);
      setComments((prev) => prev.map((c) => (c.id === commentId || c._id === commentId) ? normalized : c));
      return res.comment;
    },
    async deleteComment(commentId) {
      await runForActiveAdmin(activeAdminRef, () => commentApi.delete(commentId));
      setComments((prev) => prev.filter((c) => c.id !== commentId && c._id !== commentId));
    },
    async restoreComment(commentId) {
      const res = await runForActiveAdmin(activeAdminRef, () => commentApi.restore(commentId));
      const normalized = withClientId(res.comment);
      setComments((prev) => [normalized, ...prev.filter((c) => c.id !== commentId && c._id !== commentId)]);
      return res.comment;
    },
    async saveTestimonial(testimonial) {
      const isEdit = !!(testimonial.id || testimonial._id);
      let res;
      if (isEdit) {
        res = await runForActiveAdmin(activeAdminRef, () => testimonialApi.update(testimonial.id || testimonial._id, testimonial));
      } else {
        res = await runForActiveAdmin(activeAdminRef, () => testimonialApi.create(testimonial));
      }
      const normalized = withClientId(res.testimonial);
      setTestimonials((prev) => {
        const filtered = prev.filter((t) => t.id !== normalized.id);
        return [normalized, ...filtered];
      });
      return normalized;
    },
    async deleteTestimonial(id) {
      await runForActiveAdmin(activeAdminRef, () => testimonialApi.delete(id));
      setTestimonials((prev) => prev.filter((t) => t.id !== id && t._id !== id));
    },
    async restoreTestimonial(id) {
      const res = await runForActiveAdmin(activeAdminRef, () => testimonialApi.restore(id));
      const normalized = withClientId(res.testimonial);
      setTestimonials((prev) => [normalized, ...prev.filter((t) => t.id !== id && t._id !== id)]);
      return res.testimonial;
    },
    async fetchTestimonials(params = {}) {
      return runForActiveAdmin(activeAdminRef, () => testimonialApi.list(params));
    },
    async addSubscriber(email) {
      const normalized = email.trim().toLowerCase();
      if (!normalized) return;
      try {
        return await subscriberApi.subscribe(normalized);
      } catch (err) {
        throw err;
      }
    },
    async deleteSubscriber(id) {
      await runForActiveAdmin(activeAdminRef, () => subscriberApi.delete(id));
      setSubscribers((prev) => prev.filter((s) => s.id !== id && s._id !== id));
    },
    async fetchCampaigns(params = {}) {
      return runForActiveAdmin(activeAdminRef, () => newsletterCampaignApi.list(params));
    },
    async saveCampaign(campaign) {
      const isEdit = !!(campaign.id || campaign._id);
      let res;
      if (isEdit) {
        res = await runForActiveAdmin(activeAdminRef, () => newsletterCampaignApi.update(campaign.id || campaign._id, campaign));
      } else {
        res = await runForActiveAdmin(activeAdminRef, () => newsletterCampaignApi.create(campaign));
      }
      return res.campaign;
    },
    async sendCampaign(id) {
      const res = await runForActiveAdmin(activeAdminRef, () => newsletterCampaignApi.send(id));
      return res.campaign;
    },
    async deleteCampaign(id) {
      await runForActiveAdmin(activeAdminRef, () => newsletterCampaignApi.delete(id));
    },
    async restoreCampaign(id) {
      const res = await runForActiveAdmin(activeAdminRef, () => newsletterCampaignApi.restore(id));
      return res.campaign;
    },
    async fetchContactMessages(params = {}) {
      return runForActiveAdmin(activeAdminRef, () => contactMessageApi.list(params));
    },
    async updateContactMessage(id, updates) {
      const res = await runForActiveAdmin(activeAdminRef, () => contactMessageApi.update(id, updates));
      return res.message;
    },
    async deleteContactMessage(id) {
      await runForActiveAdmin(activeAdminRef, () => contactMessageApi.delete(id));
    },
    async restoreContactMessage(id) {
      const res = await runForActiveAdmin(activeAdminRef, () => contactMessageApi.restore(id));
      return res.message;
    }
  }), [activeAdminId]);

  const ownsProtectedState = Boolean(activeAdminId && dataOwnerId === activeAdminId);

  const value = useMemo(() => ({
    comments: ownsProtectedState ? comments : [],
    testimonials: ownsProtectedState ? testimonials : [],
    subscribers: ownsProtectedState ? subscribers : [],
    syncStatus,
    ...actions
  }), [comments, testimonials, subscribers, ownsProtectedState, syncStatus, actions]);

  return <EngagementCmsContext.Provider value={value}>{children}</EngagementCmsContext.Provider>;
};

export const useEngagementCms = () => {
  const context = useContext(EngagementCmsContext);
  if (!context) throw new Error("useEngagementCms must be used inside EngagementCmsProvider");
  return context;
};
