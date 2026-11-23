"""JSON stdin/stdout bridge connecting the Bank Account Management UI to the Python OOP engine."""

from __future__ import annotations

import json
import sys
from typing import Any, Dict

from .exceptions import BankError
from .storage import BankStorage


def _build_state_payload(storage: BankStorage) -> Dict[str, Any]:
    manager = storage.load()
    storage.seed_sample_data_if_empty(manager)

    accounts = [acct.to_dict() for acct in manager.accounts]
    transactions = [tx.to_dict() for tx in manager.get_transaction_history()]

    return {
        "accounts": accounts,
        "transactions": transactions,
    }


def main() -> None:
    raw_input = sys.stdin.read().strip() or "{}"
    try:
        payload = json.loads(raw_input)
        action = payload.get("action", "state")
        storage = BankStorage()
        manager = storage.load()
        storage.seed_sample_data_if_empty(manager)

        result: Dict[str, Any] = {}

        if action == "state":
            pass
        elif action == "create_account":
            acct = manager.create_account(
                holder_name=str(payload.get("holder_name", "")),
                account_type=str(payload.get("account_type", "Savings")),
                initial_balance=payload.get("initial_balance", 0),
                interest_rate=float(payload.get("interest_rate", 0.035)),
                minimum_balance=float(payload.get("minimum_balance", 100.0)),
                overdraft_limit=float(payload.get("overdraft_limit", 500.0)),
            )
            storage.save(manager)
            result["created_account"] = acct.to_dict()
            result["message"] = (
                f"Created {acct.account_type()} account {acct.account_number} "
                f"for {acct.holder_name} with balance ₹{acct.balance:,.2f}."
            )
        elif action == "deposit":
            tx = manager.deposit(
                account_number=str(payload.get("account_number", "")),
                amount=payload.get("amount", 0),
                note=str(payload.get("note", "Cash deposit")),
            )
            storage.save(manager)
            result["transaction"] = tx.to_dict()
            result["message"] = (
                f"Deposited ₹{tx.amount:,.2f} into {tx.account_number}. "
                f"New balance: ₹{tx.balance_after:,.2f}."
            )
        elif action == "withdraw":
            tx = manager.withdraw(
                account_number=str(payload.get("account_number", "")),
                amount=payload.get("amount", 0),
                note=str(payload.get("note", "Cash withdrawal")),
            )
            storage.save(manager)
            result["transaction"] = tx.to_dict()
            result["message"] = (
                f"Withdrew ₹{tx.amount:,.2f} from {tx.account_number}. "
                f"New balance: ₹{tx.balance_after:,.2f}."
            )
        elif action == "transfer":
            from_acct = str(payload.get("from_account_number", ""))
            to_acct = str(payload.get("to_account_number", ""))
            debit_tx, credit_tx = manager.transfer(
                from_account_number=from_acct,
                to_account_number=to_acct,
                amount=payload.get("amount", 0),
                note=str(payload.get("note", "Account transfer")),
            )
            storage.save(manager)
            result["message"] = (
                f"Transferred ₹{debit_tx.amount:,.2f} from {debit_tx.account_number} "
                f"to {credit_tx.account_number}."
            )
        elif action == "check_balance":
            acct = manager.get_account(str(payload.get("account_number", "")))
            result["account"] = acct.to_dict()
            result["message"] = (
                f"{acct.account_number} ({acct.holder_name} · {acct.account_type()}) "
                f"current balance: ₹{acct.balance:,.2f}."
            )
        elif action == "update_holder_name":
            acct = manager.update_holder_name(
                account_number=str(payload.get("account_number", "")),
                new_holder_name=str(payload.get("holder_name", "")),
            )
            storage.save(manager)
            result["account"] = acct.to_dict()
            result["message"] = (
                f"Updated account holder name for {acct.account_number} to {acct.holder_name}."
            )
        elif action == "delete_account":
            deleted = manager.delete_account(str(payload.get("account_number", "")))
            storage.save(manager)
            result["deleted_account"] = deleted.to_dict()
            result["message"] = (
                f"Deleted account {deleted.account_number} ({deleted.holder_name})."
            )
        elif action == "monthly_maintenance":
            generated = manager.run_monthly_maintenance()
            storage.save(manager)
            result["generated_count"] = len(generated)
            result["message"] = (
                f"Applied monthly interest and account maintenance: "
                f"{len(generated)} transaction(s) posted."
            )
        elif action == "save_data":
            storage.save(manager)
            result["message"] = "All account records and transaction history have been saved."
        elif action == "export_statement":
            acct_no = str(payload.get("account_number", ""))
            statement = storage.export_text_statement(manager, acct_no)
            result["statement"] = statement
            result["message"] = f"Generated account statement for {acct_no}."
        elif action == "reset_demo":
            if storage.accounts_csv_path.exists():
                storage.accounts_csv_path.unlink()
            if storage.transactions_csv_path.exists():
                storage.transactions_csv_path.unlink()
            fresh_manager = storage.load()
            storage.seed_sample_data_if_empty(fresh_manager)
            result["message"] = "Restored sample bank accounts."
        else:
            raise ValueError(f"Unsupported action: {action}")

        state = _build_state_payload(storage)
        print(json.dumps({"ok": True, **result, **state}))
    except (BankError, ValueError, KeyError, TypeError) as exc:
        print(
            json.dumps(
                {
                    "ok": False,
                    "error_type": type(exc).__name__,
                    "error": str(exc),
                }
            )
        )


if __name__ == "__main__":
    main()
