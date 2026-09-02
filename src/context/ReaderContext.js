import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { readerApi } from "../services/apiService";

const EMPTY_LIBRARY = Object.freeze({ saved: [], liked: [], bookmarked: [] });
const EMPTY_CONTRACTS = Object.freeze({ dailyQuoteTimeSlots: [] });
const EMPTY_LIST = Object.freeze([]);
const LIBRARY_COLLECTIONS = new Set(Object.keys(EMPTY_LIBRARY));
const ReaderContext = createContext(null);

export const ReaderProvider = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [continueReading, setContinueReading] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dataOwnerId, setDataOwnerId] = useState(null);
  const refreshInFlight = useRef(null);
  const refreshUserId = useRef(null);
  const refreshGeneration = useRef(0);
  const libraryMutationVersion = useRef(0);
  const activeUserIdRef = useRef(null);
  const dataOwnerIdRef = useRef(null);
  const activeUserId = user?.id ? String(user.id) : null;
  activeUserIdRef.current = activeUserId;

  const clear = useCallback(() => {
    refreshGeneration.current += 1;
    libraryMutationVersion.current += 1;
    refreshInFlight.current = null;
    refreshUserId.current = null;
    dataOwnerIdRef.current = null;
    setDataOwnerId(null);
    setProfile(null);
    setContinueReading([]);
    setCompleted([]);
    setLoading(false);
    setError("");
  }, []);

  const refreshReader = useCallback(() => {
    if (!user?.id) {
      clear();
      return Promise.resolve(null);
    }
    const requestUserId = String(user.id);
    if (refreshInFlight.current && refreshUserId.current === requestUserId) return refreshInFlight.current;
    if (dataOwnerIdRef.current !== requestUserId) {
      dataOwnerIdRef.current = requestUserId;
      setDataOwnerId(requestUserId);
      setProfile(null);
      setContinueReading([]);
      setCompleted([]);
      setError("");
    }
    const generation = refreshGeneration.current + 1;
    const libraryVersionAtRequest = libraryMutationVersion.current;
    refreshGeneration.current = generation;
    refreshUserId.current = requestUserId;
    setLoading(true);
    const request = Promise.all([
      readerApi.profile(),
      readerApi.continueReading(),
      readerApi.completed(),
    ]).then(([profileResponse, continueResponse, completedResponse]) => {
      if (refreshGeneration.current !== generation) return null;
      const nextProfile = profileResponse?.data || null;
      dataOwnerIdRef.current = requestUserId;
      setDataOwnerId(requestUserId);
      setProfile((current) => (
        libraryMutationVersion.current !== libraryVersionAtRequest && current?.library && nextProfile
          ? { ...nextProfile, library: current.library }
          : nextProfile
      ));
      setContinueReading(continueResponse?.data || []);
      setCompleted(completedResponse?.data || []);
      setError("");
      return profileResponse?.data || null;
    }).catch((requestError) => {
      if (refreshGeneration.current !== generation) return null;
      setError(requestError.message || "Reader data is unavailable.");
      return null;
    }).finally(() => {
      if (refreshGeneration.current === generation) {
        refreshInFlight.current = null;
        refreshUserId.current = null;
        setLoading(false);
      }
    });
    refreshInFlight.current = request;
    return request;
  }, [clear, user?.id]);

  useEffect(() => {
    refreshReader();
  }, [refreshReader]);

  const updateReaderProfile = useCallback(async (updates) => {
    const response = await readerApi.updateProfile(updates);
    setProfile(response?.data || null);
    setError("");
    return response?.data || null;
  }, []);

  const applyAuthoritativeLibraryState = useCallback(({ collection, isActive, article, userId }) => {
    const mutationUserId = userId ? String(userId) : null;
    if (!LIBRARY_COLLECTIONS.has(collection) || typeof isActive !== "boolean" || !article?.id || !mutationUserId) {
      throw new Error("Invalid authoritative Reader library update.");
    }
    if (activeUserIdRef.current !== mutationUserId) return false;
    if (dataOwnerIdRef.current !== mutationUserId) {
      dataOwnerIdRef.current = mutationUserId;
      setDataOwnerId(mutationUserId);
      setContinueReading([]);
      setCompleted([]);
    }
    libraryMutationVersion.current += 1;
    setProfile((current) => {
      const currentLibrary = current?.library || EMPTY_LIBRARY;
      const withoutArticle = (currentLibrary[collection] || [])
        .filter((item) => String(item.id) !== String(article.id));
      return {
        ...(current || {}),
        library: {
          ...currentLibrary,
          [collection]: isActive ? [...withoutArticle, article] : withoutArticle,
        },
      };
    });
    return true;
  }, []);

  const recordProgress = useCallback(async (payload) => {
    const response = await readerApi.updateProgress(payload);
    const item = response?.data || null;
    if (!item) return null;
    if (item.isCompleted && item.completedAt) {
      setContinueReading((current) => current.filter((entry) => entry.id !== item.id));
      setCompleted((current) => [item, ...current.filter((entry) => entry.id !== item.id)]);
    } else {
      setContinueReading((current) => [item, ...current.filter((entry) => entry.id !== item.id)]);
    }
    const activeDelta = Number(payload.activeReadingSeconds) || 0;
    if (activeDelta > 0) {
      setProfile((current) => current ? {
        ...current,
        reader: {
          ...current.reader,
          readingSummary: {
            ...current.reader.readingSummary,
            activeReadingSeconds: (current.reader.readingSummary.activeReadingSeconds || 0) + activeDelta,
          },
        },
      } : current);
    }
    return item;
  }, []);

  const ownsReaderData = Boolean(activeUserId && dataOwnerId === activeUserId);
  const ownedProfile = ownsReaderData ? profile : null;

  const value = useMemo(() => ({
    account: ownedProfile?.account || null,
    reader: ownedProfile?.reader || null,
    library: ownedProfile?.library || EMPTY_LIBRARY,
    contracts: ownedProfile?.contracts || EMPTY_CONTRACTS,
    continueReading: ownsReaderData ? continueReading : EMPTY_LIST,
    completed: ownsReaderData ? completed : EMPTY_LIST,
    loading,
    error,
    refreshReader,
    applyAuthoritativeLibraryState,
    updateReaderProfile,
    recordProgress,
  }), [applyAuthoritativeLibraryState, completed, continueReading, error, loading, ownedProfile, ownsReaderData, recordProgress, refreshReader, updateReaderProfile]);

  return <ReaderContext.Provider value={value}>{children}</ReaderContext.Provider>;
};

export const useReaderContext = () => {
  const context = useContext(ReaderContext);
  if (!context) throw new Error("useReader must be used inside ReaderProvider");
  return context;
};
