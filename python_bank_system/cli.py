"""Interactive terminal CLI for the Bank Account Management System."""

from __future__ import annotations

import sys
from pathlib import Path

if __package__ is None or __package__ == "":
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    __package__ = "python_bank_system"

from .exceptions import BankError
from .storage import BankStorage


def _prompt_float(label: str) -> float:
    raw = input(label).strip()
    try:
        return float(raw)
    except ValueError as exc:
        raise ValueError(f"'{raw}' is not a valid numeric amount.") from exc


def run_cli() -> None:
    storage = BankStorage(Path(__file__).resolve().parent / "data")
    manager = storage.load()
    storage.seed_sample_data_if_empty(manager)

    menu = (
        "\n==================================================\n"
        "  PROJECT 03 — BANK ACCOUNT MANAGEMENT SYSTEM\n"
        "==================================================\n"
        "1. Create Account (Savings / Checking)\n"
        "2. Deposit Money\n"
        "3. Withdraw Money\n"
        "4. Check Balance\n"
        "5. Transfer Funds\n"
        "6. View Transaction History\n"
        "7. Run Monthly Maintenance (Interest / Fees)\n"
        "8. Export Text Statement (.txt)\n"
        "9. Save Data to CSV\n"
        "0. Save & Exit\n"
    )

    while True:
        print(menu)
        choice = input("Select an option (0-9): ").strip()
        try:
            if choice == "1":
                name = input("Account holder name: ")
                acct_type = input("Account type (Savings/Checking): ")
                initial = _prompt_float("Initial deposit amount (₹): ")
                acct = manager.create_account(name, acct_type, initial)
                storage.save(manager)
                print(
                    f"Created {acct.account_type()} account {acct.account_number} "
                    f"for {acct.get_holder_name()} with balance ₹{acct.get_balance():,.2f}."
                )
            elif choice == "2":
                acct_no = input("Account number (e.g. ACC-1001): ")
                amount = _prompt_float("Deposit amount (₹): ")
                note = input("Note (optional): ")
                tx = manager.deposit(acct_no, amount, note)
                storage.save(manager)
                print(f"Deposited ₹{tx.amount:,.2f}. New balance: ₹{tx.balance_after:,.2f}")
            elif choice == "3":
                acct_no = input("Account number (e.g. ACC-1001): ")
                amount = _prompt_float("Withdrawal amount (₹): ")
                note = input("Note (optional): ")
                tx = manager.withdraw(acct_no, amount, note)
                storage.save(manager)
                print(f"Withdrew ₹{tx.amount:,.2f}. New balance: ₹{tx.balance_after:,.2f}")
            elif choice == "4":
                acct_no = input("Account number (e.g. ACC-1001): ")
                acct = manager.get_account(acct_no)
                print(
                    f"{acct.account_number} | {acct.get_holder_name()} ({acct.account_type()}) "
                    f"| Balance: ₹{acct.get_balance():,.2f}"
                )
            elif choice == "5":
                src = input("From account number: ")
                dst = input("To account number: ")
                amount = _prompt_float("Transfer amount (₹): ")
                note = input("Note (optional): ")
                debit_tx, credit_tx = manager.transfer(src, dst, amount, note)
                storage.save(manager)
                print(
                    f"Transferred ₹{amount:,.2f} from {src} (₹{debit_tx.balance_after:,.2f}) "
                    f"to {dst} (₹{credit_tx.balance_after:,.2f})."
                )
            elif choice == "6":
                acct_no = input("Account number (leave blank for all): ").strip() or None
                history = manager.get_transaction_history(acct_no)
                if not history:
                    print("No transactions found.")
                for tx in history:
                    print(
                        f"{tx.timestamp[:19]} | {tx.account_number} | {tx.tx_type:<10} "
                        f"| ₹{tx.amount:>9,.2f} | Bal: ₹{tx.balance_after:>9,.2f} | {tx.note}"
                    )
            elif choice == "7":
                generated = manager.run_monthly_maintenance()
                storage.save(manager)
                print(f"Applied monthly maintenance: {len(generated)} entries recorded.")
            elif choice == "8":
                acct_no = input("Account number: ")
                statement = storage.export_text_statement(manager, acct_no)
                print(statement)
            elif choice == "9":
                acct_csv, tx_csv = storage.save(manager)
                print(f"Saved data to {acct_csv} and {tx_csv}.")
            elif choice == "0":
                storage.save(manager)
                print("All changes saved to CSV. Goodbye.")
                break
            else:
                print("Please enter a valid option between 0 and 9.")
        except (BankError, ValueError) as exc:
            print(f"[Error - {type(exc).__name__}] {exc}")


if __name__ == "__main__":
    run_cli()
