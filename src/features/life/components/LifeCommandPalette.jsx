import React, { useEffect, useRef, useState } from "react";
import { FiCommand, FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import lifeApi from "../api/lifeApi";
import { LifeDialog, LifeNotice } from "./LifeUI";

export default function LifeCommandPalette({ open, onClose, onCapture }) {
  const navigate = useNavigate();
  const requestId = useRef(0);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!open) return undefined;
    const current = ++requestId.current;
    const timer = setTimeout(() => lifeApi.search(query).then((response) => { if (current === requestId.current) setResults((response.data || response).results || []); }).catch((error) => setNotice(error.message)), 140);
    return () => clearTimeout(timer);
  }, [open, query]);
  const choose = (item) => {
    onClose();
    if (item.action === "capture") onCapture(item.capture);
    else if (item.path) navigate(item.path);
  };
  return <LifeDialog open={open} title="Search Life" onClose={onClose} wide><div className="life-command"><label className="life-command-input"><FiSearch /><span className="life-sr-only">Search private Life records and commands</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a habit, goal, note, expense, or command…" autoFocus /></label><p><FiCommand /> Private to your account · Ctrl/Cmd + K</p><LifeNotice tone="error">{notice}</LifeNotice><div className="life-command-results" role="listbox" aria-label="Life search results">{results.map((item) => <button type="button" key={`${item.type}-${item.id}`} onClick={() => choose(item)}><span>{item.title}<small>{item.detail || item.type}</small></span><em>{item.type}</em></button>)}</div>{!results.length && <p className="life-muted">No matching Life records. Try a shorter phrase.</p>}</div></LifeDialog>;
}

