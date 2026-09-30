import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { FiUploadCloud, FiCheck, FiPlus, FiAlertCircle } from "react-icons/fi";
import lifeApi from "../api/lifeApi";
import { formatMoney, localDateInput } from "../utils/lifeFormat";
import { LifeEmpty, LifeError, LifeLoading, LifeNotice, LifePageHeader } from "../components/LifeUI";
import FinanceImportDialog from "../components/FinanceImportDialog";
import {
  LifeBarChart,
  LifeMetricSummaryCard,
  LifeDataSourceBadge,
  LifeEmptyChartState,
} from "../components/charts";
import "../lifeExpansion.css";

export default function MoneyPage() {
  const [tab, setTab] = useState("overview"); // overview, cashflow, accounts, bills
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // Data states
  const [summaryData, setSummaryData] = useState(null);
  const [entries, setEntries] = useState([]);
  const [plans, setPlans] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [cashflowData, setCashflowData] = useState(null);

  // Forms
  const [mode, setMode] = useState("entry"); // entry, plan
  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    currency: "USD",
    category: "Food & Dining",
    payee: "",
    localDate: localDateInput(),
    planType: "bill",
    name: "",
    period: "monthly",
    dueDate: "",
  });

  // Account form modal
  const [accountFormOpen, setAccountFormOpen] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState("bank");
  const [accountBalance, setAccountBalance] = useState("");
  const [accountCurrency, setAccountCurrency] = useState("USD");
  const [accountInstitution, setAccountInstitution] = useState("");

  // Pay bill confirmation modal
  const [payingBill, setPayingBill] = useState(null);
  const [payCreateTx, setPayCreateTx] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumRes, entRes, planRes, accRes, cfRes] = await Promise.all([
        lifeApi.moneySummary(),
        lifeApi.moneyEntries({ limit: 50 }),
        lifeApi.moneyPlans({ status: "active" }),
        lifeApi.accounts(),
        lifeApi.cashflow({ days: 90 }),
      ]);
      setSummaryData(sumRes?.data || sumRes);
      setEntries(entRes?.data?.items || entRes?.items || []);
      setPlans(planRes?.data?.items || planRes?.items || []);
      setAccounts(accRes?.data?.items || accRes?.items || []);
      setCashflowData(cfRes?.data || cfRes);
    } catch (err) {
      setError(err?.message || "Failed to load financial records");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateForm = (key, val) => setForm((curr) => ({ ...curr, [key]: val }));

  const handleSaveEntryOrPlan = async (e) => {
    e.preventDefault();
    if (!form.amount) return;
    try {
      setBusy(true);
      setNotice("");
      if (mode === "entry") {
        await lifeApi.createMoneyEntry({
          type: form.type,
          amount: Number(form.amount),
          currency: form.currency.toUpperCase(),
          category: form.category,
          payee: form.payee,
          localDate: form.localDate,
        });
        setNotice("Transaction recorded successfully.");
      } else {
        await lifeApi.createMoneyPlan({
          type: form.planType,
          name: form.name,
          amount: Number(form.amount),
          currency: form.currency.toUpperCase(),
          category: form.category,
          period: form.period,
          dueDate: form.dueDate || null,
        });
        setNotice("Financial plan created successfully.");
      }
      setForm((curr) => ({ ...curr, amount: "", payee: "", name: "" }));
      await fetchData();
    } catch (err) {
      setError(err?.message || "Failed to save record");
    } finally {
      setBusy(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!accountName) return;
    try {
      setBusy(true);
      await lifeApi.createAccount({
        name: accountName,
        type: accountType,
        balance: accountBalance ? Number(accountBalance) : 0,
        currency: accountCurrency.toUpperCase(),
        institution: accountInstitution,
      });
      setAccountName("");
      setAccountBalance("");
      setAccountInstitution("");
      setAccountFormOpen(false);
      setNotice("Account created in tracking ledger.");
      await fetchData();
    } catch (err) {
      setError(err?.message || "Failed to create account");
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmPayBill = async () => {
    if (!payingBill) return;
    try {
      setBusy(true);
      await lifeApi.payBill(payingBill._id, {
        createTransaction: payCreateTx,
      });
      setNotice(`Recorded payment for ${payingBill.name}. Due date updated.`);
      setPayingBill(null);
      await fetchData();
    } catch (err) {
      setError(err?.message || "Failed to record bill payment");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm("Remove this transaction record?")) return;
    try {
      await lifeApi.deleteMoneyEntry(id);
      await fetchData();
    } catch (err) {
      setError(err?.message || "Failed to delete transaction");
    }
  };

  if (loading) return <LifeLoading label="Balancing your financial viewâ€¦" />;
  if (error && !summaryData) return <LifeError message={error} onRetry={fetchData} />;

  const currencies = summaryData?.currencies || {};
  const recurring = summaryData?.recurring || {};
  const billsAndSubs = plans.filter((p) => ["bill", "subscription"].includes(p.type));

  const chartSeries = (cashflowData?.series || []).map((pt) => ({
    label: pt.date.slice(5),
    value: pt.expense,
    secondaryValue: pt.income,
    date: pt.date,
  }));

  return (
    <div className="life-expansion-page">
      <div className="life-header">
        <div className="life-header-top">
          <div>
            <h1 className="life-page-title">Money OS & Cashflow</h1>
            <p className="life-page-subtitle">Track net cashflow, recurring bills, multi-currency accounts, and budgets.</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" className="life-btn life-btn-secondary" onClick={() => setImportOpen(true)}>
              <FiUploadCloud /> Import CSV
            </button>
          </div>
        </div>

        <div className="life-safety-note">This is a personal record and planning aid, not financial advice. Currency totals stay separate unless you explicitly convert them elsewhere.</div>
        {notice && <LifeNotice tone={notice.toLowerCase().includes("fail") || notice.toLowerCase().includes("error") ? "error" : "success"}>{notice}</LifeNotice>}

        <div className="life-subnav">
          <button
            type="button"
            className={`life-subnav-link ${tab === "overview" ? "active" : ""}`}
            onClick={() => setTab("overview")}
          >
            Overview
          </button>
          <button
            type="button"
            className={`life-subnav-link ${tab === "cashflow" ? "active" : ""}`}
            onClick={() => setTab("cashflow")}
          >
            Cashflow
          </button>
          <button
            type="button"
            className={`life-subnav-link ${tab === "accounts" ? "active" : ""}`}
            onClick={() => setTab("accounts")}
          >
            Accounts ({accounts.length})
          </button>
          <button
            type="button"
            className={`life-subnav-link ${tab === "bills" ? "active" : ""}`}
            onClick={() => setTab("bills")}
          >
            Bills & Subscriptions ({billsAndSubs.length})
          </button>
        </div>
      </div>

      <div className="life-disclaimer">
        <span className="life-disclaimer-icon">â„¹</span>
        <span>
          Personal Ledger & Tracking Aid: Money OS is a private self-managed tracking tool. It does not connect to external banking payment rails, initiate bank transfers, or provide licensed financial advice.
        </span>
      </div>

      {notice && <div className="life-notice life-notice--neutral" style={{ marginBottom: "1.5rem" }}>{notice}</div>}
      {error && <div className="life-error-banner" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#f87171", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1.5rem" }}>{error}</div>}

      {/* MULTI-CURRENCY SUMMARY CARDS */}
      <div className="life-kpi-grid">
        {Object.entries(currencies).length === 0 ? (
          <LifeMetricSummaryCard title="Cashflow" value="â€”" secondaryValue="No transactions in this period" status="neutral" />
        ) : (
          Object.entries(currencies).map(([curr, val]) => (
            <LifeMetricSummaryCard
              key={curr}
              title={`${curr} Net Balance`}
              value={formatMoney(val.incomeMinor - val.expenseMinor, curr)}
              secondaryValue={`Income: ${formatMoney(val.incomeMinor, curr)} Â· Spent: ${formatMoney(val.expenseMinor, curr)}`}
              status={(val.incomeMinor - val.expenseMinor) >= 0 ? "success" : "danger"}
            />
          ))
        )}
        <LifeMetricSummaryCard
          title="Known Recurring"
          value={Object.entries(recurring).length ? formatMoney(Object.values(recurring)[0]?.knownMonthlyMinor || 0, Object.keys(recurring)[0]) : "â€”"}
          secondaryValue={`${billsAndSubs.length} active bills & subscriptions`}
          status="info"
        />
        <LifeMetricSummaryCard
          title="Savings Rate"
          value={cashflowData?.savingsRate != null ? `${cashflowData.savingsRate}%` : "â€”"}
          secondaryValue="Past 90 days income retained"
          status={cashflowData?.savingsRate >= 20 ? "success" : "neutral"}
        />
      </div>

      {/* TAB 1: OVERVIEW */}
      {tab === "overview" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
            <div className="life-card" style={{ marginBottom: 0 }}>
              <div className="life-card-header">
                <h2 className="life-card-title">Record Transaction or Plan</h2>
                <div style={{ display: "flex", gap: "0.25rem", background: "#0f172a", padding: "0.2rem", borderRadius: "6px" }}>
                  <button
                    type="button"
                    onClick={() => setMode("entry")}
                    style={{ background: mode === "entry" ? "#334155" : "transparent", border: "none", color: "#f8fafc", padding: "0.25rem 0.6rem", borderRadius: "4px", fontSize: "0.8rem", cursor: "pointer" }}
                  >
                    Entry
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("plan")}
                    style={{ background: mode === "plan" ? "#334155" : "transparent", border: "none", color: "#f8fafc", padding: "0.25rem 0.6rem", borderRadius: "4px", fontSize: "0.8rem", cursor: "pointer" }}
                  >
                    Plan
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveEntryOrPlan}>
                <div className="life-form-grid">
                  {mode === "entry" ? (
                    <div className="life-form-group">
                      <label className="life-form-label">Type *</label>
                      <select className="life-select" value={form.type} onChange={(e) => updateForm("type", e.target.value)}>
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                        <option value="savings_contribution">Savings Contribution</option>
                      </select>
                    </div>
                  ) : (
                    <>
                      <div className="life-form-group">
                        <label className="life-form-label">Plan Type *</label>
                        <select className="life-select" value={form.planType} onChange={(e) => updateForm("planType", e.target.value)}>
                          <option value="bill">Bill</option>
                          <option value="subscription">Subscription</option>
                          <option value="budget">Budget</option>
                          <option value="savings_goal">Savings Goal</option>
                        </select>
                      </div>
                      <div className="life-form-group">
                        <label className="life-form-label">Plan Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Internet Broadband"
                          className="life-input"
                          value={form.name}
                          onChange={(e) => updateForm("name", e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <div className="life-form-group">
                    <label className="life-form-label">Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 45.00"
                      className="life-input"
                      value={form.amount}
                      onChange={(e) => updateForm("amount", e.target.value)}
                    />
                  </div>

                  <div className="life-form-group">
                    <label className="life-form-label">Currency *</label>
                    <input
                      type="text"
                      maxLength="3"
                      required
                      className="life-input"
                      value={form.currency}
                      onChange={(e) => updateForm("currency", e.target.value.toUpperCase())}
                    />
                  </div>

                  <div className="life-form-group">
                    <label className="life-form-label">Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Groceries"
                      className="life-input"
                      value={form.category}
                      onChange={(e) => updateForm("category", e.target.value)}
                    />
                  </div>

                  {mode === "entry" ? (
                    <>
                      <div className="life-form-group">
                        <label className="life-form-label">Payee / Merchant</label>
                        <input
                          type="text"
                          placeholder="e.g. Trader Joe's"
                          className="life-input"
                          value={form.payee}
                          onChange={(e) => updateForm("payee", e.target.value)}
                        />
                      </div>
                      <div className="life-form-group">
                        <label className="life-form-label">Date</label>
                        <input
                          type="date"
                          className="life-input"
                          value={form.localDate}
                          onChange={(e) => updateForm("localDate", e.target.value)}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="life-form-group">
                      <label className="life-form-label">Due Date (optional)</label>
                      <input
                        type="date"
                        className="life-input"
                        value={form.dueDate}
                        onChange={(e) => updateForm("dueDate", e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <button type="submit" disabled={busy} className="life-btn life-btn-primary" style={{ width: "100%", marginTop: "0.5rem" }}>
                  {busy ? "Saving..." : mode === "entry" ? "Record Transaction" : "Create Plan"}
                </button>
              </form>
            </div>

            <div className="life-card" style={{ marginBottom: 0 }}>
              <div className="life-card-header">
                <h2 className="life-card-title">Recurring Obligations</h2>
              </div>
              {billsAndSubs.length === 0 ? (
                <LifeEmptyChartState message="No recurring bills or subscriptions tracked yet." />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {billsAndSubs.slice(0, 5).map((p) => (
                    <div key={p._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid #334155" }}>
                      <div>
                        <strong style={{ color: "#f8fafc" }}>{p.name}</strong>
                        <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{p.category} Â· {p.period}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: "#f8fafc", fontWeight: 700 }}>{formatMoney(p.amountMinor, p.currency)}</div>
                        {p.dueDate && <div style={{ fontSize: "0.75rem", color: "#38bdf8" }}>Due {p.dueDate}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="life-card">
            <div className="life-card-header">
              <h2 className="life-card-title">Recent Transactions</h2>
            </div>
            {entries.length === 0 ? (
              <LifeEmptyChartState message="No transactions recorded yet." />
            ) : (
              <div className="life-table-container">
                <table className="life-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Payee / Description</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry._id}>
                        <td>{entry.localDate}</td>
                        <td><strong>{entry.payee || entry.label || entry.type}</strong></td>
                        <td>{entry.category}</td>
                        <td>
                          <span style={{ color: entry.type === "income" ? "#34d399" : "#f87171", fontWeight: 700 }}>
                            {entry.type === "income" ? "+" : "-"}{formatMoney(entry.amountMinor, entry.currency)}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleDeleteEntry(entry._id)}
                            className="life-btn life-btn-danger"
                            style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB 2: CASHFLOW */}
      {tab === "cashflow" && (
        <>
          <div className="life-card">
            <div className="life-card-header">
              <div>
                <h2 className="life-card-title">Net Cashflow & Spending Over Time</h2>
                <p className="life-card-subtitle">Daily expense tracking over the past 90 days</p>
              </div>
            </div>
            {chartSeries.length > 0 ? (
              <LifeBarChart data={chartSeries} color="#ef4444" height={260} />
            ) : (
              <LifeEmptyChartState message="No cashflow records found in this timeframe." />
            )}
          </div>

          <div className="life-card">
            <div className="life-card-header">
              <h2 className="life-card-title">Expenses by Category</h2>
            </div>
            {cashflowData?.byCategory && Object.keys(cashflowData.byCategory).length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                {Object.entries(cashflowData.byCategory).map(([cat, total]) => (
                  <div key={cat} style={{ background: "#0f172a", padding: "1rem", borderRadius: "8px", border: "1px solid #334155" }}>
                    <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{cat}</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f8fafc", marginTop: "0.25rem" }}>
                      ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <LifeEmptyChartState message="No categorized expenses logged yet." />
            )}
          </div>
        </>
      )}

      {/* TAB 3: ACCOUNTS */}
      {tab === "accounts" && (
        <div className="life-card">
          <div className="life-card-header">
            <div>
              <h2 className="life-card-title">Manual Financial Accounts</h2>
              <p className="life-card-subtitle">Maintain ledger balances for bank, cash, savings, or investment accounts</p>
            </div>
            <button type="button" onClick={() => setAccountFormOpen(true)} className="life-btn life-btn-primary">
              <FiPlus /> New Account
            </button>
          </div>

          {accountFormOpen && (
            <form onSubmit={handleCreateAccount} style={{ background: "#0f172a", padding: "1.25rem", borderRadius: "8px", border: "1px solid #334155", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", color: "#f8fafc", marginTop: 0, marginBottom: "1rem" }}>Create Tracked Account</h3>
              <div className="life-form-grid">
                <div className="life-form-group">
                  <label className="life-form-label">Account Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Primary Checking"
                    className="life-input"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                  />
                </div>
                <div className="life-form-group">
                  <label className="life-form-label">Type</label>
                  <select className="life-select" value={accountType} onChange={(e) => setAccountType(e.target.value)}>
                    <option value="bank">Checking / Bank</option>
                    <option value="savings">Savings</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="cash">Cash / Wallet</option>
                    <option value="investment">Investment / Brokerage</option>
                  </select>
                </div>
                <div className="life-form-group">
                  <label className="life-form-label">Initial Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="life-input"
                    value={accountBalance}
                    onChange={(e) => setAccountBalance(e.target.value)}
                  />
                </div>
                <div className="life-form-group">
                  <label className="life-form-label">Currency</label>
                  <input
                    type="text"
                    maxLength="3"
                    className="life-input"
                    value={accountCurrency}
                    onChange={(e) => setAccountCurrency(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="life-form-group">
                  <label className="life-form-label">Institution</label>
                  <input
                    type="text"
                    placeholder="e.g. Chase, Vanguard"
                    className="life-input"
                    value={accountInstitution}
                    onChange={(e) => setAccountInstitution(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                <button type="submit" disabled={busy} className="life-btn life-btn-primary">Save Account</button>
                <button type="button" onClick={() => setAccountFormOpen(false)} className="life-btn life-btn-secondary">Cancel</button>
              </div>
            </form>
          )}

          {accounts.length === 0 ? (
            <LifeEmptyChartState message="No accounts registered. Click + New Account to start tracking." />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
              {accounts.map((acc) => (
                <div key={acc._id} style={{ background: "#0f172a", padding: "1.25rem", borderRadius: "10px", border: "1px solid #334155" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <span style={{ fontSize: "0.75rem", textTransform: "uppercase", background: "rgba(56,189,248,0.12)", color: "#38bdf8", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>
                        {acc.type}
                      </span>
                      <h4 style={{ fontSize: "1.1rem", color: "#f8fafc", margin: "0.5rem 0 0.25rem 0" }}>{acc.name}</h4>
                      {acc.institution && <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{acc.institution}</div>}
                    </div>
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#f8fafc", marginTop: "1rem" }}>
                    {formatMoney(acc.balanceMinor || 0, acc.currency)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: BILLS & SUBSCRIPTIONS */}
      {tab === "bills" && (
        <div className="life-card">
          <div className="life-card-header">
            <div>
              <h2 className="life-card-title">Bills & Subscriptions Tracker</h2>
              <p className="life-card-subtitle">Manage upcoming due dates and record periodic payments</p>
            </div>
          </div>

          {billsAndSubs.length === 0 ? (
            <LifeEmptyChartState message="No recurring bills or subscriptions added. Add them from Overview." />
          ) : (
            <div className="life-table-container">
              <table className="life-table">
                <thead>
                  <tr>
                    <th>Obligation</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Cadence</th>
                    <th>Next Due</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {billsAndSubs.map((item) => (
                    <tr key={item._id}>
                      <td><strong>{item.name}</strong></td>
                      <td><span style={{ textTransform: "capitalize", background: "rgba(56,189,248,0.12)", color: "#38bdf8", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem" }}>{item.type}</span></td>
                      <td>{formatMoney(item.amountMinor, item.currency)}</td>
                      <td style={{ textTransform: "capitalize" }}>{item.period}</td>
                      <td>{item.dueDate ? <strong style={{ color: "#38bdf8" }}>{item.dueDate}</strong> : "â€”"}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => setPayingBill(item)}
                          className="life-btn life-btn-secondary"
                          style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}
                        >
                          <FiCheck /> Mark as Paid
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MARK AS PAID CONFIRMATION MODAL */}
      {payingBill && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", maxWidth: "480px", width: "100%", padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.25rem", color: "#f8fafc", margin: "0 0 0.5rem 0" }}>
              Mark {payingBill.name} as Paid?
            </h3>
            <p style={{ fontSize: "0.9rem", color: "#94a3b8", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
              Amount: <strong>{formatMoney(payingBill.amountMinor, payingBill.currency)}</strong>. Marking as paid advances the due date for the next billing cycle.
            </p>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", background: "#0f172a", padding: "0.75rem", borderRadius: "8px", borderLeft: "3px solid #f59e0b", marginBottom: "1.25rem" }}>
              <FiAlertCircle style={{ color: "#f59e0b", flexShrink: 0, marginTop: "2px" }} />
              <span style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>
                This updates your tracking records; it does not transfer money or trigger external bank transactions.
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
              <input
                type="checkbox"
                id="createTxCheck"
                checked={payCreateTx}
                onChange={(e) => setPayCreateTx(e.target.checked)}
              />
              <label htmlFor="createTxCheck" style={{ fontSize: "0.85rem", color: "#f8fafc", cursor: "pointer", margin: 0 }}>
                Also record as an expense transaction in your ledger
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button type="button" onClick={() => setPayingBill(null)} className="life-btn life-btn-secondary">
                Cancel
              </button>
              <button type="button" disabled={busy} onClick={handleConfirmPayBill} className="life-btn life-btn-primary">
                {busy ? "Updating..." : "Confirm & Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      <FinanceImportDialog open={importOpen} onClose={() => setImportOpen(false)} onImported={fetchData} />
    </div>
  );
}
