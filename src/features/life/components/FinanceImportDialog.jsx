import React, { useState } from "react";
import { FiUploadCloud } from "react-icons/fi";
import lifeApi from "../api/lifeApi";
import { LifeDialog, LifeNotice } from "./LifeUI";

const fields = [["date", "Date", true], ["amount", "Amount", true], ["type", "Type"], ["currency", "Currency"], ["category", "Category"], ["payee", "Payee/source"], ["note", "Note"], ["id", "Stable transaction ID"]];
const normalize = (value) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

export default function FinanceImportDialog({ open, onClose, onImported }) {
  const [csvText, setCsvText] = useState("");
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [preview, setPreview] = useState(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const chooseFile = async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    if (file.size > 1024 * 1024) { setNotice("CSV preview is limited to 1 MB."); return; }
    const text = await file.text(); const nextHeaders = text.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0].split(",").map((item) => item.replace(/^"|"$/g, "").trim());
    const normalized = nextHeaders.map(normalize);
    setCsvText(text); setHeaders(nextHeaders); setPreview(null); setNotice("");
    setMapping(Object.fromEntries(fields.map(([key]) => [key, nextHeaders[normalized.indexOf(key)] || ""])));
  };
  const previewImport = async (event) => {
    event.preventDefault(); setBusy(true); setNotice("");
    try { const response = await lifeApi.financeImportPreview({ csvText, mapping }); setPreview(response.data || response); }
    catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };
  const confirm = async () => {
    setBusy(true); setNotice("");
    try { const response = await lifeApi.financeImportConfirm(preview.batchId); const result = response.data || response; setNotice(`${result.imported} transactions imported. ${result.duplicatesSkipped} duplicates and ${result.invalidSkipped} invalid rows were skipped.`); setPreview(null); setCsvText(""); setHeaders([]); await onImported?.(); }
    catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };
  return <LifeDialog open={open} title="Import transactions from CSV" onClose={onClose} wide><div className="life-finance-import"><p className="life-muted">Nothing changes until you review the counts and confirm. Files are parsed for this private import only.</p><LifeNotice tone={/limited|invalid|map|required|could/i.test(notice) ? "error" : "success"}>{notice}</LifeNotice>{!csvText && <label className="life-file-drop"><FiUploadCloud /><strong>Choose a CSV file</strong><span>Up to 1 MB and 1,000 transaction rows</span><input type="file" accept="text/csv,.csv" onChange={chooseFile} /></label>}{csvText && !preview && <form className="life-form" onSubmit={previewImport}><div className="life-form life-form--two">{fields.map(([key, label, required]) => <label key={key}>{label}{required && " *"}<select value={mapping[key] || ""} onChange={(event) => setMapping((current) => ({ ...current, [key]: event.target.value }))} required={required}><option value="">Not mapped</option>{headers.map((header, index) => <option value={header} key={`${header}-${index}`}>{header}</option>)}</select></label>)}</div><div className="life-dialog-actions"><button type="button" className="life-secondary-button" onClick={() => { setCsvText(""); setHeaders([]); }}>Choose another file</button><button className="life-primary-button" disabled={busy}>Preview import</button></div></form>}{preview && <div className="life-import-preview"><div className="life-stat-grid"><article><span>Rows detected</span><strong>{preview.rowsDetected}</strong></article><article><span>Ready</span><strong>{preview.importableRows}</strong></article><article><span>Duplicates</span><strong>{preview.duplicateRows}</strong></article><article><span>Invalid</span><strong>{preview.invalidRows.length}</strong></article></div>{preview.preview?.length > 0 && <div className="life-table-wrap"><table className="life-table"><thead><tr><th>Row</th><th>Date</th><th>What</th><th>Amount</th><th>Status</th></tr></thead><tbody>{preview.preview.map((row) => <tr key={`${row.rowNumber}-${row.externalId}`}><td>{row.rowNumber}</td><td>{row.localDate}</td><td>{row.payee || row.category}</td><td>{row.currency} {(row.amountMinor / 100).toFixed(2)}</td><td>{row.duplicate ? "Duplicate" : "Ready"}</td></tr>)}</tbody></table></div>}{preview.invalidRows?.length > 0 && <details className="life-advanced"><summary>Invalid row details</summary><ul>{preview.invalidRows.slice(0, 20).map((row) => <li key={row.rowNumber}>Row {row.rowNumber}: {row.reason}</li>)}</ul></details>}<div className="life-dialog-actions"><button type="button" className="life-secondary-button" onClick={() => setPreview(null)}>Back to mapping</button><button type="button" className="life-primary-button" disabled={busy || preview.importableRows === 0} onClick={confirm}>Confirm {preview.importableRows} imports</button></div></div>}</div></LifeDialog>;
}

