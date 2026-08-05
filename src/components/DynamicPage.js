/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  DynamicPage.js  —  Public Page Engine Route Wrapper
 *  MyJourney CMS  |  Phase 5: Website Builder (Page Engine)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react';
import apiService from '../services/apiService';
import PageRenderer from './PageRenderer';
import Error from './Error';

export default function DynamicPage() {
  const { pageSlug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadPage() {
      try {
        setLoading(true);
        setNotFound(false);
        const slug = pageSlug || 'home';
        const res = await apiService.get(`/api/pages/slug/${slug}`);
        if (isMounted) {
          if (res?.data) {
            setPage(res.data);
          } else {
            setNotFound(true);
          }
        }
      } catch (err) {
        if (isMounted) setNotFound(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadPage();
    return () => {
      isMounted = false;
    };
  }, [pageSlug]);

  if (loading) {
    return <div style={{ padding: '80px', textAlign: 'center', color: '#888' }}>Loading page...</div>;
  }

  if (notFound || !page) {
    return <Error message={`Page '/${pageSlug}' not found.`} />;
  }

  return <PageRenderer page={page} />;
}
