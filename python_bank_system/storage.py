"""CSV and plain-text persistence layer with robust file exception handling."""

from __future__ import annotations

import csv
from pathlib import Path
from typing import Tuple

from .exceptions import StorageError
from .models import (
    BankManager,
    CheckingAccount,
    SavingsAccount,
    Transaction,
)


class BankStorage:
    """Handles reading and writing bank accounts and transactions to CSV and TXT."""

    ACCOUNT_HEADERS = [
        "account_number",
        "holder_name",
        "account_type",
        "balance",
        "interest_rate",
        "minimum_balance",
        "overdraft_limit",
        "created_at",
    ]

    TRANSACTION_HEADERS = [
        "tx_id",
        "account_number",
        "tx_type",
        "amount",
        "balance_after",
        "note",
        "timestamp",
    ]

    def __init__(self, data_dir: str | Path = "python_bank_system/data") -> None:
        self._data_dir = Path(data_dir)
        self._accounts_csv = self._data_dir / "accounts.csv"
        self._transactions_csv = self._data_dir / "transactions.csv"

    @property
    def accounts_csv_path(self) -> Path:
        return self._accounts_csv

    @property
    def transactions_csv_path(self) -> Path:
        return self._transactions_csv

    def ensure_directory(self) -> None:
        try:
            self._data_dir.mkdir(parents=True, exist_ok=True)
        except OSError as exc:
            raise StorageError(f"Failed to create data directory: {exc}") from exc

    def save(self, manager: BankManager) -> Tuple[Path, Path]:
        """Persist all accounts and transactions to CSV files."""
        self.ensure_directory()
        try:
            with self._accounts_csv.open("w", newline="", encoding="utf-8") as acct_file:
                writer = csv.DictWriter(acct_file, fieldnames=self.ACCOUNT_HEADERS)
                writer.writeheader()
                for account in manager.accounts:
                    row = account.to_dict()
                    writer.writerow(
                        {key: row.get(key, "") for key in self.ACCOUNT_HEADERS}
                    )

            with self._transactions_csv.open("w", newline="", encoding="utf-8") as tx_file:
                writer = csv.DictWriter(tx_file, fieldnames=self.TRANSACTION_HEADERS)
                writer.writeheader()
                for account in manager.accounts:
                    for tx in account.transactions:
                        writer.writerow(tx.to_dict())
        except (OSError, csv.Error) as exc:
            raise StorageError(f"Unable to save bank data to CSV: {exc}") from exc

        return self._accounts_csv, self._transactions_csv

    def load(self) -> BankManager:
        """Load accounts and transaction history from CSV files into a BankManager."""
        manager = BankManager()
        if not self._accounts_csv.exists():
            return manager

        try:
            with self._accounts_csv.open("r", newline="", encoding="utf-8") as acct_file:
                reader = csv.DictReader(acct_file)
                for row in reader:
                    acct_type = (row.get("account_type") or "").strip().lower()
                    acct_no = row["account_number"].strip()
                    holder = row["holder_name"].strip()
                    balance = float(row["balance"])
                    created_at = row.get("created_at") or None

                    if acct_type == "savings":
                        account = SavingsAccount(
                            account_number=acct_no,
                            holder_name=holder,
                            initial_balance=balance,
                            interest_rate=float(row.get("interest_rate") or 0.035),
                            minimum_balance=float(row.get("minimum_balance") or 0.0),
                            created_at=created_at,
                        )
                    elif acct_type == "checking":
                        account = CheckingAccount(
                            account_number=acct_no,
                            holder_name=holder,
                            initial_balance=balance,
                            overdraft_limit=float(row.get("overdraft_limit") or 500.0),
                            created_at=created_at,
                        )
                    else:
                        raise StorageError(
                            f"Unknown account_type '{acct_type}' in {self._accounts_csv}"
                        )
                    manager.register_existing_account(account)

            if self._transactions_csv.exists():
                with self._transactions_csv.open("r", newline="", encoding="utf-8") as tx_file:
                    reader = csv.DictReader(tx_file)
                    for row in reader:
                        acct_no = row["account_number"].strip()
                        if acct_no not in {a.account_number for a in manager.accounts}:
                            continue
                        tx = Transaction(
                            tx_id=row["tx_id"].strip(),
                            account_number=acct_no,
                            tx_type=row["tx_type"].strip(),
                            amount=float(row["amount"]),
                            balance_after=float(row["balance_after"]),
                            note=row.get("note", ""),
                            timestamp=row["timestamp"].strip(),
                        )
                        manager.get_account(acct_no).attach_existing_transaction(tx)
        except (OSError, csv.Error, KeyError, ValueError) as exc:
            raise StorageError(f"Failed to load bank CSV data: {exc}") from exc

        return manager

    def export_text_statement(self, manager: BankManager, account_number: str) -> str:
        """Format and write a human-readable plain-text account statement."""
        account = manager.get_account(account_number)
        self.ensure_directory()
        statement_path = self._data_dir / f"statement_{account.account_number}.txt"

        lines = [
            "============================================================",
            "              BANK ACCOUNT STATEMENT (TEXT EXPORT)          ",
            "============================================================",
            f"Account Number : {account.account_number}",
            f"Holder Name    : {account.holder_name}",
            f"Account Type   : {account.account_type()}",
            f"Current Balance: ₹{account.balance:,.2f}",
            f"Opened At      : {account.created_at}",
            "------------------------------------------------------------",
            f"{'TIMESTAMP':<26} {'TYPE':<11} {'AMOUNT':>10} {'BALANCE':>10}",
            "------------------------------------------------------------",
        ]

        if not account.transactions:
            lines.append("No transactions recorded for this account.")
        else:
            for tx in account.transactions:
                lines.append(
                    f"{tx.timestamp[:19]:<26} {tx.tx_type:<11} "
                    f"₹{tx.amount:>9,.2f} ₹{tx.balance_after:>9,.2f}"
                )
                if tx.note:
                    lines.append(f"   Note: {tx.note}")

        lines.append("============================================================")
        content = "\n".join(lines) + "\n"

        try:
            statement_path.write_text(content, encoding="utf-8")
        except OSError as exc:
            raise StorageError(f"Unable to write text statement: {exc}") from exc

        return content

    def seed_sample_data_if_empty(self, manager: BankManager) -> BankManager:
        """Create realistic starter accounts if no CSV file exists yet."""
        if self._accounts_csv.exists():
            return manager

        a1 = manager.create_account(
            holder_name="Elena Rostova",
            account_type="Savings",
            initial_balance=4250.00,
            account_number="ACC-1001",
            interest_rate=0.04,
            minimum_balance=250.00,
        )
        a1.deposit(750.00, "Monthly payroll allocation")
        a1.withdraw(200.00, "Emergency reserve transfer")

        a2 = manager.create_account(
            holder_name="Marcus Vance",
            account_type="Checking",
            initial_balance=1840.50,
            account_number="ACC-1002",
            overdraft_limit=500.00,
        )
        a2.deposit(1200.00, "Client retainer settlement")
        a2.withdraw(385.25, "Cloud infrastructure invoice")

        a3 = manager.create_account(
            holder_name="Priya Nair",
            account_type="Savings",
            initial_balance=9600.00,
            account_number="ACC-1003",
            interest_rate=0.045,
            minimum_balance=500.00,
        )
        a3.monthly_maintenance()

        self.save(manager)
        return manager
