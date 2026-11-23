"""Core OOP models: Abstraction, Encapsulation, Inheritance, and Polymorphism."""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Dict, List, Optional

from .exceptions import (
    AccountNotFoundError,
    DuplicateAccountError,
    InsufficientFundsError,
    InvalidAmountError,
    MinimumBalanceError,
)


class Transaction:
    """Represents a single immutable ledger entry on a bank account."""

    def __init__(
        self,
        account_number: str,
        tx_type: str,
        amount: float,
        balance_after: float,
        note: str = "",
        timestamp: Optional[str] = None,
        tx_id: Optional[str] = None,
    ) -> None:
        self._tx_id = tx_id or f"TX-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')[:18]}"
        self._account_number = account_number
        self._tx_type = tx_type.upper()
        self._amount = round(float(amount), 2)
        self._balance_after = round(float(balance_after), 2)
        self._note = note.strip()
        self._timestamp = timestamp or datetime.now(timezone.utc).isoformat()

    @property
    def tx_id(self) -> str:
        return self._tx_id

    @property
    def account_number(self) -> str:
        return self._account_number

    @property
    def tx_type(self) -> str:
        return self._tx_type

    @property
    def amount(self) -> float:
        return self._amount

    @property
    def balance_after(self) -> float:
        return self._balance_after

    @property
    def note(self) -> str:
        return self._note

    @property
    def timestamp(self) -> str:
        return self._timestamp

    def to_dict(self) -> Dict[str, object]:
        return {
            "tx_id": self._tx_id,
            "account_number": self._account_number,
            "tx_type": self._tx_type,
            "amount": self._amount,
            "balance_after": self._balance_after,
            "note": self._note,
            "timestamp": self._timestamp,
        }


class AbstractBankAccount(ABC):
    """Abstract base class defining the contract for all bank account types."""

    def __init__(
        self,
        account_number: str,
        holder_name: str,
        initial_balance: float = 0.0,
        created_at: Optional[str] = None,
    ) -> None:
        if not account_number or not account_number.strip():
            raise ValueError("Account number cannot be empty.")
        self._account_number: str = account_number.strip()
        self._holder_name: str = ""
        self.holder_name = holder_name  # Validates via property setter
        self.__balance: float = 0.0  # Private attribute (Encapsulation)
        self._transactions: List[Transaction] = []
        self._created_at: str = created_at or datetime.now(timezone.utc).isoformat()

        validated_initial = self._validate_non_negative_amount(
            initial_balance, "Initial balance"
        )
        self.__balance = validated_initial

    @property
    def account_number(self) -> str:
        return self._account_number

    @property
    def holder_name(self) -> str:
        return self._holder_name

    @holder_name.setter
    def holder_name(self, value: str) -> None:
        cleaned = (value or "").strip()
        if len(cleaned) < 2:
            raise ValueError("Account holder name must be at least 2 characters.")
        self._holder_name = cleaned

    def get_holder_name(self) -> str:
        """Explicit getter method for holder_name (Encapsulation)."""
        return self._holder_name

    def set_holder_name(self, value: str) -> None:
        """Explicit validated setter method for holder_name (Encapsulation)."""
        self.holder_name = value

    @property
    def balance(self) -> float:
        """Read-only public access to private __balance."""
        return round(self.__balance, 2)

    def get_balance(self) -> float:
        """Explicit getter method for private __balance (Encapsulation)."""
        return self.balance

    @property
    def created_at(self) -> str:
        return self._created_at

    @property
    def transactions(self) -> List[Transaction]:
        """Returns a shallow copy to preserve encapsulation of internal history."""
        return list(self._transactions)

    def _set_balance(self, new_balance: float) -> None:
        """Protected mutator for subclasses to update private __balance safely."""
        self.__balance = round(float(new_balance), 2)

    def _record_transaction(
        self, tx_type: str, amount: float, note: str = ""
    ) -> Transaction:
        tx = Transaction(
            account_number=self._account_number,
            tx_type=tx_type,
            amount=amount,
            balance_after=self.balance,
            note=note,
        )
        self._transactions.append(tx)
        return tx

    def attach_existing_transaction(self, tx: Transaction) -> None:
        """Used when hydrating persisted transaction history from CSV storage."""
        self._transactions.append(tx)

    @staticmethod
    def _validate_positive_amount(amount: float, label: str = "Amount") -> float:
        try:
            numeric = float(amount)
        except (TypeError, ValueError) as exc:
            raise InvalidAmountError(f"{label} must be a valid number.") from exc
        if numeric <= 0:
            raise InvalidAmountError(f"{label} must be greater than zero.")
        return round(numeric, 2)

    @staticmethod
    def _validate_non_negative_amount(amount: float, label: str = "Amount") -> float:
        try:
            numeric = float(amount)
        except (TypeError, ValueError) as exc:
            raise InvalidAmountError(f"{label} must be a valid number.") from exc
        if numeric < 0:
            raise InvalidAmountError(f"{label} cannot be negative.")
        return round(numeric, 2)

    @abstractmethod
    def account_type(self) -> str:
        """Return the concrete account classification label."""

    @abstractmethod
    def deposit(self, amount: float, note: str = "Cash deposit") -> Transaction:
        """Deposit funds into the account."""

    @abstractmethod
    def withdraw(self, amount: float, note: str = "Cash withdrawal") -> Transaction:
        """Withdraw funds from the account according to subclass rules."""

    @abstractmethod
    def monthly_maintenance(self) -> Optional[Transaction]:
        """Apply monthly interest or maintenance rules."""

    def to_dict(self) -> Dict[str, object]:
        return {
            "account_number": self._account_number,
            "holder_name": self._holder_name,
            "account_type": self.account_type(),
            "balance": self.balance,
            "created_at": self._created_at,
            "transaction_count": len(self._transactions),
        }


class SavingsAccount(AbstractBankAccount):
    """Derived class enforcing minimum balance and earning monthly interest."""

    def __init__(
        self,
        account_number: str,
        holder_name: str,
        initial_balance: float = 0.0,
        interest_rate: float = 0.035,
        minimum_balance: float = 100.0,
        created_at: Optional[str] = None,
    ) -> None:
        min_bal = self._validate_non_negative_amount(minimum_balance, "Minimum balance")
        init_bal = self._validate_non_negative_amount(initial_balance, "Initial deposit")
        if init_bal < min_bal:
            raise MinimumBalanceError(
                f"Savings account requires at least ₹{min_bal:,.2f} opening balance."
            )
        super().__init__(account_number, holder_name, init_bal, created_at=created_at)
        self._interest_rate = float(interest_rate)
        self._minimum_balance = min_bal

    @property
    def interest_rate(self) -> float:
        return self._interest_rate

    @interest_rate.setter
    def interest_rate(self, rate: float) -> None:
        if rate < 0 or rate > 0.25:
            raise ValueError("Annual interest rate must be between 0% and 25%.")
        self._interest_rate = float(rate)

    @property
    def minimum_balance(self) -> float:
        return self._minimum_balance

    def account_type(self) -> str:
        return "Savings"

    def deposit(self, amount: float, note: str = "Cash deposit") -> Transaction:
        valid_amount = self._validate_positive_amount(amount, "Deposit amount")
        self._set_balance(self.balance + valid_amount)
        return self._record_transaction("DEPOSIT", valid_amount, note or "Cash deposit")

    def withdraw(self, amount: float, note: str = "Cash withdrawal") -> Transaction:
        valid_amount = self._validate_positive_amount(amount, "Withdrawal amount")
        projected = round(self.balance - valid_amount, 2)
        if projected < 0:
            raise InsufficientFundsError(
                f"Insufficient funds: available balance is ₹{self.balance:,.2f}."
            )
        if projected < self._minimum_balance:
            raise MinimumBalanceError(
                f"Withdrawal denied: balance cannot drop below ₹{self._minimum_balance:,.2f} minimum."
            )
        self._set_balance(projected)
        return self._record_transaction("WITHDRAWAL", valid_amount, note or "Cash withdrawal")

    def monthly_maintenance(self) -> Optional[Transaction]:
        if self.balance <= 0:
            return None
        monthly_interest = round(self.balance * (self._interest_rate / 12.0), 2)
        if monthly_interest <= 0:
            return None
        self._set_balance(self.balance + monthly_interest)
        return self._record_transaction(
            "INTEREST",
            monthly_interest,
            f"Monthly interest ({self._interest_rate * 100:.2f}% APR)",
        )

    def to_dict(self) -> Dict[str, object]:
        data = super().to_dict()
        data.update(
            {
                "interest_rate": self._interest_rate,
                "minimum_balance": self._minimum_balance,
                "overdraft_limit": 0.0,
            }
        )
        return data


class CheckingAccount(AbstractBankAccount):
    """Derived class supporting controlled overdraft protection."""

    def __init__(
        self,
        account_number: str,
        holder_name: str,
        initial_balance: float = 0.0,
        overdraft_limit: float = 500.0,
        created_at: Optional[str] = None,
    ) -> None:
        super().__init__(account_number, holder_name, initial_balance, created_at=created_at)
        self._overdraft_limit = self._validate_non_negative_amount(
            overdraft_limit, "Overdraft limit"
        )

    @property
    def overdraft_limit(self) -> float:
        return self._overdraft_limit

    @overdraft_limit.setter
    def overdraft_limit(self, limit: float) -> None:
        self._overdraft_limit = self._validate_non_negative_amount(
            limit, "Overdraft limit"
        )

    def account_type(self) -> str:
        return "Checking"

    def deposit(self, amount: float, note: str = "Cash deposit") -> Transaction:
        valid_amount = self._validate_positive_amount(amount, "Deposit amount")
        self._set_balance(self.balance + valid_amount)
        return self._record_transaction("DEPOSIT", valid_amount, note or "Cash deposit")

    def withdraw(self, amount: float, note: str = "Cash withdrawal") -> Transaction:
        valid_amount = self._validate_positive_amount(amount, "Withdrawal amount")
        projected = round(self.balance - valid_amount, 2)
        if projected < -self._overdraft_limit:
            available = round(self.balance + self._overdraft_limit, 2)
            raise InsufficientFundsError(
                f"Exceeds overdraft limit. Maximum withdrawable is ₹{available:,.2f}."
            )
        self._set_balance(projected)
        return self._record_transaction("WITHDRAWAL", valid_amount, note or "Cash withdrawal")

    def monthly_maintenance(self) -> Optional[Transaction]:
        if self.balance < 0:
            fee = 15.00
            self._set_balance(self.balance - fee)
            return self._record_transaction(
                "FEE", fee, "Monthly overdraft maintenance fee"
            )
        return None

    def to_dict(self) -> Dict[str, object]:
        data = super().to_dict()
        data.update(
            {
                "interest_rate": 0.0,
                "minimum_balance": 0.0,
                "overdraft_limit": self._overdraft_limit,
            }
        )
        return data


class BankManager:
    """Orchestrates account lifecycle, transactions, and persistence."""

    def __init__(self) -> None:
        self._accounts: Dict[str, AbstractBankAccount] = {}

    @property
    def accounts(self) -> List[AbstractBankAccount]:
        return list(self._accounts.values())

    def _generate_account_number(self) -> str:
        seq = 1001 + len(self._accounts)
        while f"ACC-{seq}" in self._accounts:
            seq += 1
        return f"ACC-{seq}"

    def create_account(
        self,
        holder_name: str,
        account_type: str,
        initial_balance: float = 0.0,
        account_number: Optional[str] = None,
        interest_rate: float = 0.035,
        minimum_balance: float = 100.0,
        overdraft_limit: float = 500.0,
    ) -> AbstractBankAccount:
        acct_no = (account_number or self._generate_account_number()).strip()
        if acct_no in self._accounts:
            raise DuplicateAccountError(f"Account {acct_no} already exists.")

        kind = account_type.strip().lower()
        if kind == "savings":
            account: AbstractBankAccount = SavingsAccount(
                account_number=acct_no,
                holder_name=holder_name,
                initial_balance=initial_balance,
                interest_rate=interest_rate,
                minimum_balance=minimum_balance,
            )
        elif kind == "checking":
            account = CheckingAccount(
                account_number=acct_no,
                holder_name=holder_name,
                initial_balance=initial_balance,
                overdraft_limit=overdraft_limit,
            )
        else:
            raise ValueError("Account type must be 'Savings' or 'Checking'.")

        if account.balance > 0:
            account._record_transaction(
                "OPENING", account.balance, f"Opened {account.account_type()} account"
            )

        self._accounts[acct_no] = account
        return account

    def register_existing_account(self, account: AbstractBankAccount) -> None:
        self._accounts[account.account_number] = account

    def get_account(self, account_number: str) -> AbstractBankAccount:
        acct = self._accounts.get(account_number.strip())
        if not acct:
            raise AccountNotFoundError(f"Account '{account_number}' was not found.")
        return acct

    def deposit(
        self, account_number: str, amount: float, note: str = "Cash deposit"
    ) -> Transaction:
        account = self.get_account(account_number)
        return account.deposit(amount, note)

    def withdraw(
        self, account_number: str, amount: float, note: str = "Cash withdrawal"
    ) -> Transaction:
        account = self.get_account(account_number)
        return account.withdraw(amount, note)

    def check_balance(self, account_number: str) -> float:
        return self.get_account(account_number).balance

    def update_holder_name(
        self, account_number: str, new_holder_name: str
    ) -> AbstractBankAccount:
        account = self.get_account(account_number)
        account.set_holder_name(new_holder_name)
        return account

    def delete_account(self, account_number: str) -> AbstractBankAccount:
        account = self.get_account(account_number)
        if account.balance < 0:
            raise InsufficientFundsError(
                f"Cannot delete overdrawn account {account.account_number} "
                f"with negative balance -₹{abs(account.balance):,.2f}. Settle overdraft first."
            )
        return self._accounts.pop(account.account_number)

    def transfer(
        self,
        from_account_number: str,
        to_account_number: str,
        amount: float,
        note: str = "Account transfer",
    ) -> tuple[Transaction, Transaction]:
        source = self.get_account(from_account_number)
        target = self.get_account(to_account_number)
        if source.account_number == target.account_number:
            raise ValueError("Source and destination accounts must be different.")
        debit_tx = source.withdraw(
            amount, f"Transfer to {target.account_number}: {note}".strip(": ")
        )
        credit_tx = target.deposit(
            amount, f"Transfer from {source.account_number}: {note}".strip(": ")
        )
        return debit_tx, credit_tx

    def get_transaction_history(
        self, account_number: Optional[str] = None
    ) -> List[Transaction]:
        if account_number:
            return self.get_account(account_number).transactions
        all_tx: List[Transaction] = []
        for account in self._accounts.values():
            all_tx.extend(account.transactions)
        all_tx.sort(key=lambda tx: tx.timestamp, reverse=True)
        return all_tx

    def run_monthly_maintenance(self) -> List[Transaction]:
        generated: List[Transaction] = []
        for account in self._accounts.values():
            tx = account.monthly_maintenance()
            if tx is not None:
                generated.append(tx)
        return generated
