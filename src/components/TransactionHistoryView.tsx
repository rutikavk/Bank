import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { BankAccount, BankTransaction } from "../types/bank";

interface TransactionHistoryViewProps {
  accounts: BankAccount[];
  transactions: BankTransaction[];
  initialAccountFilter?: string;
}

export const TransactionHistoryView: React.FC<TransactionHistoryViewProps> = ({
  accounts,
  transactions,
  initialAccountFilter = "ALL",
}) => {
  const [accountFilter, setAccountFilter] = useState<string>(initialAccountFilter);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (accountFilter !== "ALL" && tx.account_number !== accountFilter) return false;
      if (typeFilter !== "ALL" && tx.tx_type !== typeFilter) return false;
      if (!q) return true;
      return (
        tx.account_number.toLowerCase().includes(q) ||
        tx.note.toLowerCase().includes(q) ||
        tx.tx_id.toLowerCase().includes(q) ||
        tx.tx_type.toLowerCase().includes(q)
      );
    });
  }, [transactions, accountFilter, typeFilter, searchQuery]);

  const formatMoney = (value: number) =>
    `${value < 0 ? "-" : ""}₹${Math.abs(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Transaction History</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete record of deposits, withdrawals, interest postings, and account openings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Filter by account"
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="ALL">All Accounts</option>
            {accounts.map((acct) => (
              <option key={acct.account_number} value={acct.account_number}>
                {acct.account_number} · {acct.holder_name}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search note or ID..."
              className="h-9 pl-9 pr-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {["ALL", "DEPOSIT", "WITHDRAWAL", "INTEREST", "OPENING"].map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => setTypeFilter(kind)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  typeFilter === kind
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {kind === "ALL" ? "All" : kind.charAt(0) + kind.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
              <th className="py-3 px-6">Date &amp; Time (UTC)</th>
              <th className="py-3 px-4">Transaction ID</th>
              <th className="py-3 px-4">Account</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-6 text-right">Balance After</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {filteredTransactions.map((tx) => {
              const isDebit = tx.tx_type === "WITHDRAWAL" || tx.tx_type === "FEE";
              return (
                <tr key={tx.tx_id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-6 font-mono text-xs tabular-nums text-slate-500">
                    {tx.timestamp.slice(0, 19).replace("T", " ")}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-500">{tx.tx_id}</td>
                  <td className="py-3 px-4 font-mono text-xs font-medium text-slate-900">
                    {tx.account_number}
                  </td>
                  <td className="py-3 px-4 text-xs font-medium text-slate-700">{tx.tx_type}</td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                    {tx.note || "—"}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono tabular-nums font-medium ${
                      isDebit ? "text-amber-700" : "text-emerald-700"
                    }`}
                  >
                    {isDebit ? "-" : "+"}
                    {formatMoney(tx.amount)}
                  </td>
                  <td className="py-3 px-6 text-right font-mono tabular-nums text-slate-900">
                    {formatMoney(tx.balance_after)}
                  </td>
                </tr>
              );
            })}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-slate-500">
                  No matching transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
