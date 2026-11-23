import React, { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, FileText, SearchCheck, Sparkles } from "lucide-react";
import type { BankAccount } from "../types/bank";

interface OperationsDeskProps {
  accounts: BankAccount[];
  initialAccountNumber?: string;
  initialMode?: "deposit" | "withdraw" | "transfer";
  busy: boolean;
  onAction: (payload: Record<string, unknown>) => Promise<void>;
  statementPreview: string | null;
  onCloseStatement: () => void;
}

export const OperationsDesk: React.FC<OperationsDeskProps> = ({
  accounts,
  initialAccountNumber,
  initialMode = "deposit",
  busy,
  onAction,
  statementPreview,
  onCloseStatement,
}) => {
  const [selectedAccount, setSelectedAccount] = useState<string>(
    initialAccountNumber || accounts[0]?.account_number || ""
  );
  const [destinationAccount, setDestinationAccount] = useState<string>(
    accounts[1]?.account_number || accounts[0]?.account_number || ""
  );
  const [txMode, setTxMode] = useState<"deposit" | "withdraw" | "transfer">(initialMode);
  const [txAmount, setTxAmount] = useState<string>("250.00");
  const [txNote, setTxNote] = useState<string>("");

  useEffect(() => {
    if (initialAccountNumber && accounts.some((a) => a.account_number === initialAccountNumber)) {
      setSelectedAccount(initialAccountNumber);
    }
  }, [initialAccountNumber, accounts]);

  useEffect(() => {
    setTxMode(initialMode);
  }, [initialMode]);

  const activeAccountNumber =
    accounts.some((a) => a.account_number === selectedAccount)
      ? selectedAccount
      : accounts[0]?.account_number ?? "";

  const targetDestinationNumber =
    accounts.some(
      (a) => a.account_number === destinationAccount && a.account_number !== activeAccountNumber
    )
      ? destinationAccount
      : accounts.find((a) => a.account_number !== activeAccountNumber)?.account_number ??
        activeAccountNumber;

  const activeAccount = accounts.find((a) => a.account_number === activeAccountNumber);

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccountNumber) return;

    if (txMode === "transfer") {
      await onAction({
        action: "transfer",
        from_account_number: activeAccountNumber,
        to_account_number: targetDestinationNumber,
        amount: txAmount,
        note: txNote.trim() || "Account transfer",
      });
    } else {
      await onAction({
        action: txMode,
        account_number: activeAccountNumber,
        amount: txAmount,
        note: txNote.trim() || (txMode === "deposit" ? "Cash deposit" : "Cash withdrawal"),
      });
    }
    setTxNote("");
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Deposit &amp; Withdraw Money
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Process deposits, withdrawals, or transfers with real-time balance validation.
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setTxMode("deposit")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  txMode === "deposit"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Deposit
              </button>
              <button
                type="button"
                onClick={() => setTxMode("withdraw")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  txMode === "withdraw"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Withdraw
              </button>
              <button
                type="button"
                onClick={() => setTxMode("transfer")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  txMode === "transfer"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Transfer
              </button>
            </div>
          </div>

          <form onSubmit={handleTransactionSubmit} className="mt-5 space-y-5">
            <div className={txMode === "transfer" ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : ""}>
              <div>
                <label
                  htmlFor="op-account-select"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  {txMode === "transfer" ? "From Account" : "Select Account"}
                </label>
                <select
                  id="op-account-select"
                  value={activeAccountNumber}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {accounts.map((acct) => (
                    <option key={acct.account_number} value={acct.account_number}>
                      {acct.account_number} — {acct.holder_name} ({acct.account_type}) · ₹
                      {acct.balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </option>
                  ))}
                </select>
              </div>

              {txMode === "transfer" && (
                <div>
                  <label
                    htmlFor="op-dest-select"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    To Account
                  </label>
                  <select
                    id="op-dest-select"
                    value={targetDestinationNumber}
                    onChange={(e) => setDestinationAccount(e.target.value)}
                    className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    {accounts.map((acct) => (
                      <option key={acct.account_number} value={acct.account_number}>
                        {acct.account_number} — {acct.holder_name} ({acct.account_type}) · ₹
                        {acct.balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="op-amount"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Amount (₹)
                </label>
                <input
                  id="op-amount"
                  type="text"
                  inputMode="decimal"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="250.00"
                  className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-lg text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label
                  htmlFor="op-note"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Description / Note
                </label>
                <input
                  id="op-note"
                  type="text"
                  value={txNote}
                  onChange={(e) => setTxNote(e.target.value)}
                  placeholder={
                    txMode === "deposit"
                      ? "Payroll deposit"
                      : txMode === "withdraw"
                        ? "ATM withdrawal"
                        : "Account transfer"
                  }
                  className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={busy || !activeAccountNumber}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {txMode === "deposit" && <ArrowDownLeft className="w-4 h-4" />}
                {txMode === "withdraw" && <ArrowUpRight className="w-4 h-4" />}
                {txMode === "transfer" && <ArrowLeftRight className="w-4 h-4" />}
                {txMode === "deposit"
                  ? "Deposit Money"
                  : txMode === "withdraw"
                    ? "Withdraw Money"
                    : "Transfer Funds"}
              </button>

              <button
                type="button"
                disabled={busy || !activeAccountNumber}
                onClick={() =>
                  onAction({
                    action: "check_balance",
                    account_number: activeAccountNumber,
                  })
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <SearchCheck className="w-4 h-4" />
                Check Balance
              </button>

              <button
                type="button"
                disabled={busy || !activeAccountNumber}
                onClick={() =>
                  onAction({
                    action: "export_statement",
                    account_number: activeAccountNumber,
                  })
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                View Statement
              </button>
            </div>
          </form>
        </section>

        {/* Right: Selected Account Snapshot & Monthly Interest */}
        <aside className="lg:col-span-4 space-y-6">
          {activeAccount && (
            <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="pb-3 border-b border-slate-200">
                <div className="text-xs text-slate-500">
                  {activeAccount.account_number}
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  {activeAccount.account_type} Account
                </div>
                <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                  {activeAccount.holder_name}
                </h3>
              </div>

              <div>
                <div className="text-xs text-slate-500">Available Balance</div>
                <div
                  className={`text-3xl font-semibold font-mono tabular-nums mt-1 ${
                    activeAccount.balance < 0 ? "text-red-700" : "text-slate-900"
                  }`}
                >
                  ₹{activeAccount.balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 text-xs text-slate-600 space-y-1.5">
                {activeAccount.account_type === "Savings" ? (
                  <>
                    <div className="flex justify-between">
                      <span>Minimum Balance Rule</span>
                      <span className="font-mono tabular-nums font-medium text-slate-900">
                        ₹{activeAccount.minimum_balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Annual Interest Rate</span>
                      <span className="font-mono tabular-nums font-medium text-slate-900">
                        {(activeAccount.interest_rate * 100).toFixed(2)}%
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span>Overdraft Protection</span>
                    <span className="font-mono tabular-nums font-medium text-slate-900">
                      ₹{activeAccount.overdraft_limit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Monthly Interest &amp; Fees</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Apply monthly interest to Savings accounts and check overdraft fees on Checking accounts.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => onAction({ action: "monthly_maintenance" })}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 text-white text-xs font-medium rounded-lg hover:bg-emerald-800 disabled:opacity-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Run Monthly Maintenance
            </button>
          </section>
        </aside>
      </div>

      {statementPreview && (
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Account Statement</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Formatted statement for the selected account.
              </p>
            </div>
            <button
              type="button"
              onClick={onCloseStatement}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Close Statement
            </button>
          </div>
          <pre className="mt-4 p-4 bg-slate-950 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
            {statementPreview}
          </pre>
        </section>
      )}
    </div>
  );
};
