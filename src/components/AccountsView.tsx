import React, { useMemo, useState } from "react";
import { Check, Pencil, Plus, Search, SearchCheck, Trash2, Wallet, X } from "lucide-react";
import type { BankAccount } from "../types/bank";

interface AccountsViewProps {
  accounts: BankAccount[];
  busy: boolean;
  onAction: (payload: Record<string, unknown>) => Promise<void>;
  onOpenOperations: (accountNumber: string, mode: "deposit" | "withdraw") => void;
  onViewHistory: (accountNumber: string) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  busy,
  onAction,
  onOpenOperations,
  onViewHistory,
}) => {
  const [holderName, setHolderName] = useState("");
  const [accountType, setAccountType] = useState<"Savings" | "Checking">("Savings");
  const [initialDeposit, setInitialDeposit] = useState("500.00");
  const [minimumBalance, setMinimumBalance] = useState("100.00");
  const [overdraftLimit, setOverdraftLimit] = useState("500.00");

  const [lookupNumber, setLookupNumber] = useState("");
  const [checkedAccountNumber, setCheckedAccountNumber] = useState<string | null>(null);

  const [accountSearch, setAccountSearch] = useState("");
  const [editingAccountNumber, setEditingAccountNumber] = useState<string | null>(null);
  const [editingHolderName, setEditingHolderName] = useState("");
  const [confirmingDeleteNumber, setConfirmingDeleteNumber] = useState<string | null>(null);

  const checkedAccount = useMemo(
    () =>
      checkedAccountNumber
        ? accounts.find((a) => a.account_number === checkedAccountNumber) ?? null
        : null,
    [accounts, checkedAccountNumber]
  );

  const filteredAccounts = useMemo(() => {
    const q = accountSearch.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (acct) =>
        acct.holder_name.toLowerCase().includes(q) ||
        acct.account_number.toLowerCase().includes(q)
    );
  }, [accounts, accountSearch]);

  const totalBalance = useMemo(
    () => accounts.reduce((sum, acct) => sum + acct.balance, 0),
    [accounts]
  );

  const formatMoney = (value: number) =>
    `${value < 0 ? "-" : ""}₹${Math.abs(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAction({
      action: "create_account",
      holder_name: holderName,
      account_type: accountType,
      initial_balance: initialDeposit,
      minimum_balance: Number(minimumBalance) || 100,
      overdraft_limit: Number(overdraftLimit) || 500,
    });
    setHolderName("");
  };

  const handleCheckBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = lookupNumber.trim();
    const matched = accounts.find(
      (a) => a.account_number.toLowerCase() === target.toLowerCase()
    );
    setCheckedAccountNumber(matched ? matched.account_number : null);
    await onAction({
      action: "check_balance",
      account_number: target,
    });
  };

  const startEditingHolder = (acct: BankAccount) => {
    setEditingAccountNumber(acct.account_number);
    setEditingHolderName(acct.holder_name);
  };

  const cancelEditingHolder = () => {
    setEditingAccountNumber(null);
    setEditingHolderName("");
  };

  const saveEditingHolder = async (accountNumber: string) => {
    await onAction({
      action: "update_holder_name",
      account_number: accountNumber,
      holder_name: editingHolderName,
    });
    setEditingAccountNumber(null);
    setEditingHolderName("");
  };

  const handleConfirmDelete = async (accountNumber: string) => {
    await onAction({
      action: "delete_account",
      account_number: accountNumber,
    });
    setConfirmingDeleteNumber(null);
    if (editingAccountNumber === accountNumber) {
      cancelEditingHolder();
    }
    if (checkedAccountNumber === accountNumber) {
      setCheckedAccountNumber(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Total Bank Balance</div>
          <div className="mt-1.5 text-2xl font-semibold font-mono tabular-nums text-slate-900">
            {formatMoney(totalBalance)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Across {accounts.length} active account{accounts.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Savings Accounts</div>
          <div className="mt-1.5 text-2xl font-semibold font-mono tabular-nums text-slate-900">
            {accounts.filter((a) => a.account_type === "Savings").length}
          </div>
          <div className="mt-1 text-xs text-slate-500">Interest-bearing · Min balance</div>
        </div>
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Checking Accounts</div>
          <div className="mt-1.5 text-2xl font-semibold font-mono tabular-nums text-slate-900">
            {accounts.filter((a) => a.account_type === "Checking").length}
          </div>
          <div className="mt-1 text-xs text-slate-500">Overdraft-protected</div>
        </div>
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Total Transactions</div>
          <div className="mt-1.5 text-2xl font-semibold font-mono tabular-nums text-slate-900">
            {accounts.reduce((sum, a) => sum + a.transaction_count, 0)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Maintained in account ledger</div>
        </div>
      </div>

      {/* Create Account + Check Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
          <div className="pb-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">Create New Account</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Open a Savings or Checking account with validated opening deposit and policy rules.
            </p>
          </div>

          <form onSubmit={handleCreateAccount} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="create-holder"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Account Holder Name
                </label>
                <input
                  id="create-holder"
                  type="text"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  placeholder="e.g. Jordan Patel"
                  className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <span className="block text-sm font-medium text-slate-700 mb-1.5">
                  Account Type
                </span>
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg h-11">
                  <button
                    type="button"
                    onClick={() => setAccountType("Savings")}
                    className={`text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      accountType === "Savings"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Savings
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType("Checking")}
                    className={`text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      accountType === "Checking"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Checking
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="create-initial"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Initial Deposit (₹)
                </label>
                <input
                  id="create-initial"
                  type="text"
                  inputMode="decimal"
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(e.target.value)}
                  className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-lg text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {accountType === "Savings" ? (
                <div>
                  <label
                    htmlFor="create-min-balance"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Minimum Balance (₹)
                  </label>
                  <input
                    id="create-min-balance"
                    type="text"
                    inputMode="decimal"
                    value={minimumBalance}
                    onChange={(e) => setMinimumBalance(e.target.value)}
                    className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-lg text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="create-overdraft"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Overdraft Limit (₹)
                  </label>
                  <input
                    id="create-overdraft"
                    type="text"
                    inputMode="decimal"
                    value={overdraftLimit}
                    onChange={(e) => setOverdraftLimit(e.target.value)}
                    className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-lg text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Account
            </button>
          </form>
        </section>

        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
          <div className="pb-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">Check Balance</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter an account number (e.g. ACC-1001) or click Check on any row below.
            </p>
          </div>

          <form onSubmit={handleCheckBalance} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="lookup-acct"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Account Number
              </label>
              <div className="flex gap-2">
                <input
                  id="lookup-acct"
                  type="text"
                  value={lookupNumber}
                  onChange={(e) => setLookupNumber(e.target.value)}
                  placeholder="ACC-1001"
                  className="flex-1 h-11 px-3.5 bg-white border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-4 h-11 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <SearchCheck className="w-4 h-4" />
                  Check
                </button>
              </div>
            </div>

            {checkedAccount ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono">{checkedAccount.account_number}</span>
                  <span>{checkedAccount.account_type} Account</span>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <div className="text-sm font-medium text-slate-900">
                    {checkedAccount.holder_name}
                  </div>
                  <div className="text-2xl font-semibold font-mono tabular-nums text-slate-900">
                    {formatMoney(checkedAccount.balance)}
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  {checkedAccount.account_type === "Savings"
                    ? `Minimum balance: ₹${checkedAccount.minimum_balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · APR: ${(checkedAccount.interest_rate * 100).toFixed(1)}%`
                    : `Overdraft protection: ₹${checkedAccount.overdraft_limit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3 text-xs text-slate-500">
                <Wallet className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Verified account balance details appear here.</span>
              </div>
            )}
          </form>
        </section>
      </div>

      {/* All Accounts Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Bank Accounts</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filteredAccounts.length} of {accounts.length} account
              {accounts.length === 1 ? "" : "s"} · Search by owner name or account number, or edit holder details.
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              aria-label="Search accounts by owner name or account number"
              value={accountSearch}
              onChange={(e) => setAccountSearch(e.target.value)}
              placeholder="Search owner name or ACC-1001..."
              className="w-full h-10 pl-9 pr-9 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            {accountSearch && (
              <button
                type="button"
                onClick={() => setAccountSearch("")}
                aria-label="Clear account search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                <th className="py-3 px-6">Account No.</th>
                <th className="py-3 px-4">Holder Name</th>
                <th className="py-3 px-4">Account Type</th>
                <th className="py-3 px-4">Account Terms</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredAccounts.map((acct) => {
                const isEditing = editingAccountNumber === acct.account_number;
                return (
                  <tr key={acct.account_number} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-6 font-mono text-xs font-medium text-slate-900">
                      {acct.account_number}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            aria-label={`Edit holder name for ${acct.account_number}`}
                            value={editingHolderName}
                            onChange={(e) => setEditingHolderName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                saveEditingHolder(acct.account_number);
                              } else if (e.key === "Escape") {
                                cancelEditingHolder();
                              }
                            }}
                            autoFocus
                            className="h-8 px-2.5 bg-white border border-slate-400 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 w-44"
                          />
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => saveEditingHolder(acct.account_number)}
                            aria-label="Save holder name"
                            className="inline-flex items-center gap-1 px-2.5 h-8 bg-slate-900 text-white text-xs font-medium rounded-md hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditingHolder}
                            aria-label="Cancel editing holder name"
                            className="inline-flex items-center px-2 h-8 bg-white border border-slate-300 text-slate-600 text-xs font-medium rounded-md hover:bg-slate-100 whitespace-nowrap cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2">
                          <span>{acct.holder_name}</span>
                          <button
                            type="button"
                            onClick={() => startEditingHolder(acct)}
                            aria-label={`Edit name for ${acct.holder_name}`}
                            title="Edit account holder name"
                            className="p-1 text-slate-400 hover:text-slate-800 rounded transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{acct.account_type}</td>
                    <td className="py-3 px-4 text-xs text-slate-500 font-mono tabular-nums">
                      {acct.account_type === "Savings"
                        ? `Min ₹${acct.minimum_balance.toLocaleString("en-IN")} · ${(acct.interest_rate * 100).toFixed(1)}% APR`
                        : `Overdraft ₹${acct.overdraft_limit.toLocaleString("en-IN")}`}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono tabular-nums font-semibold ${
                        acct.balance < 0 ? "text-red-700" : "text-slate-900"
                      }`}
                    >
                      {formatMoney(acct.balance)}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {confirmingDeleteNumber === acct.account_number ? (
                        <div className="inline-flex items-center gap-2 text-xs font-medium">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleConfirmDelete(acct.account_number)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-700 text-white rounded-md hover:bg-red-800 disabled:opacity-50 whitespace-nowrap cursor-pointer"
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setConfirmingDeleteNumber(null)}
                            className="px-2 py-1 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 whitespace-nowrap cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-3 text-xs font-medium">
                          <button
                            type="button"
                            onClick={() => {
                              setLookupNumber(acct.account_number);
                              setCheckedAccountNumber(acct.account_number);
                              onAction({
                                action: "check_balance",
                                account_number: acct.account_number,
                              });
                            }}
                            className="text-slate-700 hover:text-slate-900 underline whitespace-nowrap cursor-pointer"
                          >
                            Check
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenOperations(acct.account_number, "deposit")}
                            className="text-emerald-700 hover:text-emerald-900 underline whitespace-nowrap cursor-pointer"
                          >
                            Deposit
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenOperations(acct.account_number, "withdraw")}
                            className="text-amber-700 hover:text-amber-900 underline whitespace-nowrap cursor-pointer"
                          >
                            Withdraw
                          </button>
                          <button
                            type="button"
                            onClick={() => onViewHistory(acct.account_number)}
                            className="text-slate-600 hover:text-slate-900 underline whitespace-nowrap cursor-pointer"
                          >
                            History
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setConfirmingDeleteNumber(acct.account_number)}
                            aria-label={`Delete account ${acct.account_number}`}
                            className="inline-flex items-center gap-1 text-red-700 hover:text-red-900 underline whitespace-nowrap cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                    {accountSearch ? (
                      <div className="space-y-2">
                        <div>No accounts match &ldquo;{accountSearch}&rdquo;.</div>
                        <button
                          type="button"
                          onClick={() => setAccountSearch("")}
                          className="text-xs font-medium text-slate-900 underline cursor-pointer"
                        >
                          Clear search
                        </button>
                      </div>
                    ) : (
                      "No accounts yet. Use Create New Account above to open an account."
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
