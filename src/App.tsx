import React, { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Landmark, Save } from "lucide-react";
import { AccountsView } from "./components/AccountsView";
import { OperationsDesk } from "./components/OperationsDesk";
import { TransactionHistoryView } from "./components/TransactionHistoryView";
import type { BankAccount, BankStateResponse, BankTransaction } from "./types/bank";

type ActiveSection = "accounts" | "operations" | "history";

interface BannerNotice {
  kind: "success" | "error";
  title: string;
  detail: string;
}

export default function App() {
  const [section, setSection] = useState<ActiveSection>("accounts");
  const [selectedOpAccount, setSelectedOpAccount] = useState<string>("");
  const [selectedOpMode, setSelectedOpMode] = useState<"deposit" | "withdraw" | "transfer">("deposit");
  const [historyFilter, setHistoryFilter] = useState<string>("ALL");

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<BannerNotice | null>(null);
  const [statementPreview, setStatementPreview] = useState<string | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/bank/state");
      const data: BankStateResponse = await res.json();
      if (data.ok) {
        setAccounts(data.accounts);
        setTransactions(data.transactions);
      } else {
        setNotice({
          kind: "error",
          title: data.error_type ?? "BankError",
          detail: data.error ?? "Unable to load account records.",
        });
      }
    } catch (err) {
      setNotice({
        kind: "error",
        title: "ConnectionError",
        detail: err instanceof Error ? err.message : "Unable to reach banking server.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const handleAction = async (payload: Record<string, unknown>) => {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/bank/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: BankStateResponse = await res.json();

      if (!res.ok || data.ok === false) {
        setNotice({
          kind: "error",
          title: data.error_type ?? "Validation Error",
          detail: data.error ?? "Operation could not be completed.",
        });
        return;
      }

      setAccounts(data.accounts);
      setTransactions(data.transactions);

      if (data.statement) {
        setStatementPreview(data.statement);
      }

      if (data.message) {
        setNotice({
          kind: "success",
          title: "Success",
          detail: data.message,
        });
      }
    } catch (err) {
      setNotice({
        kind: "error",
        title: "Request Error",
        detail: err instanceof Error ? err.message : "Failed to complete operation.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Bar Contract: 3 zones (Wordmark — Nav Links — 1 Primary Action) */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#accounts"
            onClick={(e) => {
              e.preventDefault();
              setSection("accounts");
            }}
            className="inline-flex items-center gap-2.5 text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            <Landmark className="w-5 h-5 text-slate-900" />
            <span>Meridian Bank</span>
          </a>

          <nav className="flex items-center gap-6 text-sm font-medium text-slate-600" aria-label="Main Navigation">
            <button
              type="button"
              onClick={() => setSection("accounts")}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                section === "accounts"
                  ? "text-slate-900 border-b-2 border-slate-900"
                  : "hover:text-slate-900"
              }`}
            >
              Accounts
            </button>
            <button
              type="button"
              onClick={() => setSection("operations")}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                section === "operations"
                  ? "text-slate-900 border-b-2 border-slate-900"
                  : "hover:text-slate-900"
              }`}
            >
              Deposit &amp; Withdraw
            </button>
            <button
              type="button"
              onClick={() => {
                setHistoryFilter("ALL");
                setSection("history");
              }}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                section === "history"
                  ? "text-slate-900 border-b-2 border-slate-900"
                  : "hover:text-slate-900"
              }`}
            >
              Transaction History
            </button>
          </nav>

          <button
            type="button"
            disabled={busy}
            onClick={() => handleAction({ action: "save_data" })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Save Data
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Bank Account Management System
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Create accounts, deposit or withdraw funds, check balances, maintain transaction history, and save records.
            </p>
          </div>
        </div>

        {notice && (
          <div
            role="status"
            className={`flex items-start justify-between gap-4 px-4 py-3.5 rounded-xl border text-sm ${
              notice.kind === "error"
                ? "bg-red-50 border-red-200 text-red-900"
                : "bg-emerald-50 border-emerald-200 text-emerald-900"
            }`}
          >
            <div className="flex items-start gap-3">
              {notice.kind === "error" ? (
                <AlertCircle className="w-4 h-4 text-red-700 mt-0.5 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
              )}
              <div>
                <span className="font-semibold">{notice.title}</span>
                <span className="mx-2" aria-hidden="true">·</span>
                <span>{notice.detail}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-xs font-medium underline opacity-75 hover:opacity-100 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-4">
            <div className="h-6 w-48 bg-slate-100 rounded" />
            <div className="h-10 w-full bg-slate-100 rounded" />
            <div className="h-10 w-full bg-slate-100 rounded" />
          </div>
        ) : (
          <>
            {section === "accounts" && (
              <AccountsView
                accounts={accounts}
                busy={busy}
                onAction={handleAction}
                onOpenOperations={(acctNo, mode) => {
                  setSelectedOpAccount(acctNo);
                  setSelectedOpMode(mode);
                  setSection("operations");
                }}
                onViewHistory={(acctNo) => {
                  setHistoryFilter(acctNo);
                  setSection("history");
                }}
              />
            )}

            {section === "operations" && (
              <OperationsDesk
                accounts={accounts}
                initialAccountNumber={selectedOpAccount}
                initialMode={selectedOpMode}
                busy={busy}
                onAction={handleAction}
                statementPreview={statementPreview}
                onCloseStatement={() => setStatementPreview(null)}
              />
            )}

            {section === "history" && (
              <TransactionHistoryView
                key={historyFilter}
                accounts={accounts}
                transactions={transactions}
                initialAccountFilter={historyFilter}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
