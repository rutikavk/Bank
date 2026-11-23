# Project 03 — Bank Account Management System (Python OOP)

A complete Object-Oriented Python banking application built using Python's Standard Library (`abc`, `csv`, `pathlib`, `datetime`, `unittest`) with zero third-party dependencies.

## Features Implemented
- **Create Accounts**: Open `SavingsAccount` (minimum balance + monthly APR interest) or `CheckingAccount` (configurable overdraft protection)
- **Deposit Money**: Validated positive deposits recorded in the transaction ledger
- **Withdraw Money**: Subclass-enforced minimum balance and overdraft limit checks
- **Check Balance**: Encapsulated balance lookup via `@property` and `get_balance()`
- **Maintain Transaction History**: Immutable `Transaction` audit log per account
- **Save Data**: Automatic and manual persistence to `data/accounts.csv` and `data/transactions.csv`, plus plain-text statement export (`.txt`)

## OOP Concepts Implemented

| Concept | Implementation | File |
| --- | --- | --- |
| 01. Classes & Objects | `AbstractBankAccount`, `SavingsAccount`, `CheckingAccount`, `Transaction`, `BankManager`, `BankStorage` | `models.py`, `storage.py` |
| 02. Encapsulation | Private `__balance`, protected `_account_number` / `_holder_name` / `_transactions`, `@property` + `get_balance()` / `set_holder_name()` | `models.py` |
| 03. Inheritance | `SavingsAccount` and `CheckingAccount` derive from `AbstractBankAccount` | `models.py` |
| 04. Abstraction | `AbstractBankAccount(ABC)` defines `@abstractmethod` contracts (`deposit`, `withdraw`, `account_type`, `monthly_maintenance`) | `models.py` |
| 05. File Handling | `BankStorage` reads/writes `accounts.csv`, `transactions.csv`, and `statement_<acct>.txt` | `storage.py` |
| 06. Exception Handling | Custom `BankError` hierarchy (`InvalidAmountError`, `InsufficientFundsError`, `MinimumBalanceError`, `AccountNotFoundError`, `DuplicateAccountError`, `StorageError`) | `exceptions.py` |

## How to Run Locally

```bash
# Option A: Run directly from inside python_bank_system/
cd python_bank_system
python3 main.py

# Option B: Run as a Python module from the parent directory
python3 -m python_bank_system.main

# Run automated unit tests
python3 -m unittest discover -s python_bank_system/tests -v
```
