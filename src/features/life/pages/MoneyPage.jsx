import React, { useState } from "react";
import lifeApi from "../api/lifeApi";
import useLifeQuery from "../hooks/useLifeQuery";
import { formatMoney, localDateInput } from "../utils/lifeFormat";
import { LifeEmpty, LifeError, LifeLoading, LifeNotice, LifePageHeader } from "../components/LifeUI";
import FinanceImportDialog from "../components/FinanceImportDialog";
import { FiUploadCloud } from "react-icons/fi";

export default function MoneyPage() {
  const query = useLifeQuery(async () => {
    const [entries, summary, plans] = await Promise.all([lifeApi.moneyEntries({ limit: 50 }), lifeApi.moneySummary(), lifeApi.moneyPlans({ status: "active" })]);
    return { entries: entries.data, summary: summary.data, plans: plans.data };
  }, []);
  const [mode, setMode] = useState("entry");
  const [form, setForm] = useState({ type: "expense", amount: "", currency: "USD", category: "Other", payee: "", localDate: localDateInput(), planType: "budget", name: "", period: "monthly", dueDate: "" });
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      if (mode === "entry") await lifeApi.createMoneyEntry({ type: form.type, amount: Number(form.amount), currency: form.currency.toUpperCase(), category: form.category, payee: form.payee, localDate: form.localDate });
      else await lifeApi.createMoneyPlan({ type: form.planType, name: form.name, amount: Number(form.amount), currency: form.currency.toUpperCase(), category: form.category, period: form.period, dueDate: form.dueDate || null });
      setNotice(mode === "entry" ? "Money entry recorded." : "Money plan created."); setForm((current) => ({ ...current, amount: "", payee: "", name: "" })); await query.refresh({ quiet: true });
    } catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };
  const remove = async (id) => {
    setBusy(true); try { await lifeApi.deleteMoneyEntry(id); setNotice("Entry removed from active records."); await query.refresh({ quiet: true }); } catch (error) { setNotice(error.message); } finally { setBusy(false); }
  };
  if (query.loading) return <LifeLoading label="Balancing your money view…" />;
  if (query.error && !query.data) return <LifeError message={query.error} onRetry={query.refresh} />;
  const entries = query.data?.entries?.items || [];
  const plans = query.data?.plans?.items || [];
  const currencies = query.data?.summary?.currencies || {};
  const recurring = query.data?.summary?.recurring || {};
  const upcomingBills = query.data?.summary?.upcomingBills || [];
  return <div>
    <LifePageHeader eyebrow="Clarity without shame" title="Money" description="Track what comes in, what goes out, and what you are planning—without silently converting currencies." actions={<button type="button" className="life-secondary-button" onClick={() => setImportOpen(true)}><FiUploadCloud /> Import CSV</button>} />
    <div className="life-safety-note">This is a personal record and planning aid, not financial advice. Currency totals stay separate unless you explicitly convert them elsewhere.</div>
    <LifeNotice tone={notice.toLowerCase().includes("could") ? "error" : "success"}>{notice}</LifeNotice>
    <section className="life-money-summary">{Object.keys(currencies).length === 0 ? <p>No money entries in the current summary period.</p> : Object.entries(currencies).map(([currency, values]) => <article key={currency}><span>{currency}</span><div><small>Income</small><strong>{formatMoney(values.incomeMinor, currency)}</strong></div><div><small>Spent</small><strong>{formatMoney(values.expenseMinor, currency)}</strong></div><div><small>Saved</small><strong>{formatMoney(values.savingsMinor, currency)}</strong></div></article>)}</section>
    <div className="life-two-panel">
      <section className="life-card"><div className="life-card-heading"><h2>Add to your record</h2><div className="life-segmented"><button type="button" className={mode === "entry" ? "is-active" : ""} onClick={() => setMode("entry")}>Entry</button><button type="button" className={mode === "plan" ? "is-active" : ""} onClick={() => setMode("plan")}>Plan</button></div></div>
        <form className="life-form life-form--two" onSubmit={save}>
          {mode === "entry" ? <label>Entry type<select value={form.type} onChange={(event) => update("type", event.target.value)}><option value="expense">Expense</option><option value="income">Income</option><option value="savings_contribution">Savings contribution</option></select></label> : <><label>Plan type<select value={form.planType} onChange={(event) => update("planType", event.target.value)}><option value="budget">Budget</option><option value="bill">Bill</option><option value="subscription">Subscription</option><option value="savings_goal">Savings goal</option></select></label><label>Name<input value={form.name} onChange={(event) => update("name", event.target.value)} required /></label></>}
          <label>Amount<input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => update("amount", event.target.value)} required /></label><label>Currency<input value={form.currency} minLength="3" maxLength="3" onChange={(event) => update("currency", event.target.value)} required /></label><label>Category<input value={form.category} onChange={(event) => update("category", event.target.value)} /></label>
          {mode === "entry" ? <><label>Payee or source<input value={form.payee} onChange={(event) => update("payee", event.target.value)} /></label><label>Date<input type="date" value={form.localDate} onChange={(event) => update("localDate", event.target.value)} /></label></> : <><label>Period<select value={form.period} onChange={(event) => update("period", event.target.value)}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="recurring">Recurring</option><option value="custom">Custom</option></select></label>{["bill", "subscription"].includes(form.planType) && <label>Next due date<input type="date" value={form.dueDate} onChange={(event) => update("dueDate", event.target.value)} /></label>}</>}
          <button className="life-primary-button life-field-span" disabled={busy}>{mode === "entry" ? "Save entry" : "Create plan"}</button>
        </form>
      </section>
      <section className="life-card"><h2>Plans</h2>{Object.entries(recurring).map(([currency, value]) => <p className="life-recurring-total" key={currency}><strong>{formatMoney(value.knownMonthlyMinor, currency)}</strong> known monthly recurring · {value.subscriptions} subscriptions · {value.bills} bills{value.unknownCadence ? ` · ${value.unknownCadence} with another cadence` : ""}</p>)}{upcomingBills.length > 0 && <details className="life-advanced"><summary>Due in the next 30 days</summary>{upcomingBills.map((item) => <p key={item.id}>{item.dueDate} · {item.name} · {formatMoney(item.amountMinor, item.currency)}</p>)}</details>}{plans.length === 0 ? <LifeEmpty title="No active plans" message="Budgets, bills, subscriptions, and savings goals can live here." /> : <div className="life-record-list">{plans.map((plan) => <article key={plan._id}><div><strong>{plan.name}</strong><span>{plan.type.replace("_", " ")} · {formatMoney(plan.amountMinor, plan.currency)}</span></div></article>)}</div>}</section>
    </div>
    <section className="life-card life-card--spaced"><h2>Recent entries</h2>{entries.length === 0 ? <LifeEmpty title="Your record is empty" message="Add an entry only when it helps you see your money more clearly." /> : <div className="life-table-wrap"><table className="life-table"><thead><tr><th>Date</th><th>What</th><th>Category</th><th>Amount</th><th><span className="life-sr-only">Actions</span></th></tr></thead><tbody>{entries.map((entry) => <tr key={entry._id}><td>{entry.localDate}</td><td>{entry.payee || entry.type.replace("_", " ")}</td><td>{entry.category}</td><td className={`life-money--${entry.type}`}>{formatMoney(entry.amountMinor, entry.currency)}</td><td><button type="button" className="life-link-button" disabled={busy} onClick={() => remove(entry._id)}>Remove</button></td></tr>)}</tbody></table></div>}</section>
    <FinanceImportDialog open={importOpen} onClose={() => setImportOpen(false)} onImported={() => query.refresh({ quiet: true })} />
  </div>;
}
