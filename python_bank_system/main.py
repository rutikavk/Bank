"""Standalone entry point for Project 03 — Bank Account Management System."""

from __future__ import annotations

import sys
from pathlib import Path

if __package__ is None or __package__ == "":
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    __package__ = "python_bank_system"

from .cli import run_cli


if __name__ == "__main__":
    run_cli()
