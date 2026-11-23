"""Custom exception hierarchy for the Bank Account Management System."""


class BankError(Exception):
    """Base exception for all banking domain errors."""


class InvalidAmountError(BankError):
    """Raised when a deposit, withdrawal, or opening amount is invalid."""


class InsufficientFundsError(BankError):
    """Raised when an account lacks sufficient balance or overdraft capacity."""


class MinimumBalanceError(BankError):
    """Raised when a SavingsAccount withdrawal violates its minimum balance."""


class AccountNotFoundError(BankError):
    """Raised when an operation references a non-existent account number."""


class DuplicateAccountError(BankError):
    """Raised when attempting to create an account with an existing number."""


class StorageError(BankError):
    """Raised when reading or writing CSV/text persistence files fails."""
