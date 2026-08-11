import { useCallback, useEffect, useRef, useState } from "react";

export default function useLifeQuery(loader, dependencies = []) {
  const mounted = useRef(true);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    setError("");
    try {
      const response = await loader();
      if (mounted.current) setData(response?.data ?? response);
      return response?.data ?? response;
    } catch (requestError) {
      if (mounted.current) setError(requestError.message || "Couldn't load Life right now. Try again.");
      throw requestError;
    } finally {
      if (mounted.current && !quiet) setLoading(false);
    }
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mounted.current = true;
    refresh().catch(() => {});
    return () => { mounted.current = false; };
  }, [refresh]);

  return { data, error, loading, refresh, setData, setError };
}
