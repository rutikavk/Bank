"""Unit tests verifying Abstraction, Encapsulation, Inheritance, File Handling, and Exceptions."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

# Support running from either workspace root or inside python_bank_system/
_PKG_PARENT = str(Path(__file__).resolve().parent.parent.parent)
if _PKG_PARENT not in sys.path:
    sys.path.insert(0, _PKG_PARENT)

from python_bank_system.exceptions import (
    AccountNotFoundError,
    DuplicateAccountError,
    InsufficientFundsError,
    InvalidAmountError,
    MinimumBalanceError,
    StorageError,
)
from python_bank_system.models import (
    AbstractBankAccount,
    BankManager,
    CheckingAccount,
    SavingsAccount,
)
from python_bank_system.storage import BankStorage


class TestBankOOPSystem(unittest.TestCase):
    def test_abstraction_prevents_direct_instantiation(self) -> None:
        with self.assertRaises(TypeError):
            AbstractBankAccount("ACC-000", "Test User", 100.0)  # type: ignore[abstract]

    def test_encapsulation_private_balance_and_setter_validation(self) -> None:
        savings = SavingsAccount("ACC-101", "Alice", 500.0, minimum_balance=100.0)
        self.assertEqual(savings.get_balance(), 500.0)
        self.assertEqual(savings.get_holder_name(), "Alice")
        savings.set_holder_name("Alice Mercer")
        self.assertEqual(savings.holder_name, "Alice Mercer")
        with self.assertRaises(AttributeError):
            _ = savings.__balance  # type: ignore[attr-defined]
        with self.assertRaises(AttributeError):
            savings.balance = 9999.0  # type: ignore[misc]
        with self.assertRaises(ValueError):
            savings.set_holder_name("A")

    def test_inheritance_and_polymorphic_rules(self) -> None:
        savings = SavingsAccount("ACC-201", "Bob", 300.0, minimum_balance=100.0)
        checking = CheckingAccount("ACC-202", "Carol", 100.0, overdraft_limit=250.0)

        with self.assertRaises(MinimumBalanceError):
            savings.withdraw(250.0)

        tx = checking.withdraw(250.0, "Rent payment")
        self.assertEqual(tx.balance_after, -150.0)

        with self.assertRaises(InsufficientFundsError):
            checking.withdraw(200.0)

    def test_transfer_and_exception_handling(self) -> None:
        manager = BankManager()
        manager.create_account("Diana", "Checking", 400.0, account_number="ACC-301")
        manager.create_account("Liam", "Savings", 200.0, account_number="ACC-302")

        manager.transfer("ACC-301", "ACC-302", 150.0, "Invoice split")
        self.assertEqual(manager.check_balance("ACC-301"), 250.0)
        self.assertEqual(manager.check_balance("ACC-302"), 350.0)

        updated = manager.update_holder_name("ACC-301", "Diana Prince")
        self.assertEqual(updated.get_holder_name(), "Diana Prince")
        with self.assertRaises(ValueError):
            manager.update_holder_name("ACC-301", "D")

        with self.assertRaises(DuplicateAccountError):
            manager.create_account("Diana", "Checking", 200.0, account_number="ACC-301")

        with self.assertRaises(InvalidAmountError):
            manager.deposit("ACC-301", -50.0)

        with self.assertRaises(AccountNotFoundError):
            manager.check_balance("ACC-999")

        with self.assertRaises(AccountNotFoundError):
            manager.delete_account("ACC-999")

        # Overdrawn checking account cannot be deleted until settled
        manager.withdraw("ACC-301", 300.0, "Overdraft draw")
        with self.assertRaises(InsufficientFundsError):
            manager.delete_account("ACC-301")

        # Positive/zero balance account deletes cleanly
        removed = manager.delete_account("ACC-302")
        self.assertEqual(removed.account_number, "ACC-302")
        with self.assertRaises(AccountNotFoundError):
            manager.get_account("ACC-302")

    def test_csv_file_handling_roundtrip_and_statement_export(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            storage = BankStorage(Path(tmpdir))
            manager = BankManager()
            manager.create_account("Evan", "Savings", 1000.0, account_number="ACC-401")
            manager.deposit("ACC-401", 250.0, "Bonus")
            manager.withdraw("ACC-401", 100.0, "Groceries")

            acct_csv, tx_csv = storage.save(manager)
            self.assertTrue(acct_csv.exists())
            self.assertTrue(tx_csv.exists())

            reloaded = storage.load()
            self.assertEqual(reloaded.check_balance("ACC-401"), 1150.0)
            self.assertEqual(len(reloaded.get_transaction_history("ACC-401")), 3)

            statement = storage.export_text_statement(reloaded, "ACC-401")
            self.assertIn("ACC-401", statement)
            self.assertIn("₹1,150.00", statement)

    def test_storage_raises_storage_error_on_corrupt_csv(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            storage = BankStorage(Path(tmpdir))
            storage.ensure_directory()
            storage.accounts_csv_path.write_text("bad,headers\n1,2\n", encoding="utf-8")
            with self.assertRaises(StorageError):
                storage.load()


if __name__ == "__main__":
    unittest.main()
