import React, { useEffect, useState } from "react";
import { creatorStudioApi } from "../../services/apiService";

export default function CourseVideoManager({ courseId, editable = true }) {
  const [lessons, setLessons] = useState([]);
  const [uploads, setUploads] = useState({});
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    creatorStudioApi.courseVideoLessons(courseId).then((result) => { if (active) {
      const items = result.data || [];
      setLessons(items);
      setUploads(Object.fromEntries(items.filter((item) => item.latestVideoAsset).map((item) => [item.id, { assetId: item.latestVideoAsset.id, status: item.latestVideoAsset.deliveryStatus === "pending" ? "processing" : item.latestVideoAsset.deliveryStatus, polls: 0 }])));
    } }).catch((cause) => { if (active) setError(cause.message); });
    return () => { active = false; };
  }, [courseId]);

  useEffect(() => {
    const pending = Object.entries(uploads).filter(([, value]) => value.status === "processing" && value.polls < 180);
    if (!pending.length) return undefined;
    const timer = setTimeout(async () => {
      await Promise.all(pending.map(async ([lessonId, value]) => {
        try {
          const result = await creatorStudioApi.courseVideoStatus(courseId, lessonId, value.assetId);
          setUploads((current) => ({ ...current, [lessonId]: { ...current[lessonId], status: result.data.deliveryStatus === "ready" ? "ready" : result.data.deliveryStatus === "failed" || (current[lessonId]?.polls || 0) >= 179 ? "failed" : "processing", polls: (current[lessonId]?.polls || 0) + 1 } }));
        } catch (cause) { setUploads((current) => ({ ...current, [lessonId]: { ...current[lessonId], status: "failed", error: cause.message } })); }
      }));
    }, 5000);
    return () => clearTimeout(timer);
  }, [courseId, uploads]);

  const uploadVideo = async (lesson, file) => {
    if (!file) return;
    setError("");
    if (!rightsConfirmed) return setError("Confirm that you hold the rights to this video first.");
    if (!["video/mp4", "video/webm"].includes(file.type) || file.size < 1 || file.size > 2 * 1024 * 1024 * 1024) return setError("Choose an MP4 or WebM video under 2 GB.");
    setUploads((current) => ({ ...current, [lesson.id]: { status: "authorizing", assetId: null, polls: 0 } }));
    try {
      const result = await creatorStudioApi.createCourseVideoUpload(courseId, lesson.id, { originalName: file.name, mimeType: file.type, sizeBytes: file.size, confirmContentRights: true });
      const { asset, uploadUrl } = result.data;
      setUploads((current) => ({ ...current, [lesson.id]: { status: "uploading", assetId: asset.id, polls: 0 } }));
      const transfer = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!transfer.ok) throw new Error("Video transfer failed. Please retry with a new upload.");
      setUploads((current) => ({ ...current, [lesson.id]: { status: "processing", assetId: asset.id, polls: 0 } }));
    } catch (cause) {
      setUploads((current) => ({ ...current, [lesson.id]: { status: "failed", assetId: null, polls: 0, error: cause.message } }));
    }
  };

  const attach = async (lesson, assetId) => {
    setError("");
    try {
      await creatorStudioApi.attachCourseVideo(courseId, lesson.id, assetId);
      setLessons((current) => current.map((item) => item.id === lesson.id ? { ...item, mediaAssetId: assetId } : item));
    } catch (cause) { setError(cause.message); }
  };

  const videoLessons = lessons.filter((lesson) => ["video", "mixed"].includes(lesson.lessonType));
  return <section className="creator-curriculum" aria-label="Course video management">
    <h3>Lesson videos</h3>
    <p>Upload directly to Mux. A signed video is playable only after Mux confirms it is ready and you attach it to its Lesson.</p>
    {error && <p className="creator-notice" role="alert">{error}</p>}
    {editable && <label className="creator-check"><input type="checkbox" checked={rightsConfirmed} onChange={(event) => setRightsConfirmed(event.target.checked)} /> I confirm I hold the rights to the videos I upload.</label>}
    {!videoLessons.length && <p role="status">This Course has no video or mixed lessons.</p>}
    {videoLessons.map((lesson) => {
      const upload = uploads[lesson.id];
      return <div className="creator-lesson-draft" key={lesson.id}>
        <h4>{lesson.title}</h4>
        <p>{lesson.mediaAssetId ? "Video attached" : "No ready video attached"}{upload?.status ? ` · ${upload.status}` : ""}</p>
        {upload?.error && <p className="creator-notice" role="alert">{upload.error}</p>}
        {upload?.status === "ready" && upload.assetId !== lesson.mediaAssetId && editable && <button type="button" onClick={() => attach(lesson, upload.assetId)}>Attach ready video</button>}
        {editable && <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <label> {lesson.mediaAssetId ? "Replace video" : "Upload video"} <input type="file" accept="video/mp4,video/webm" disabled={!rightsConfirmed || ["authorizing", "uploading", "processing"].includes(upload?.status)} onChange={(event) => { uploadVideo(lesson, event.target.files?.[0]); event.target.value = ""; }} /></label>
          {lesson.mediaAssetId && <button type="button" onClick={() => attach(lesson, null)}>Detach video</button>}
        </div>}
      </div>;
    })}
  </section>;
}
