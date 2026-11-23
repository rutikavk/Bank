export interface BankAccount {
  account_number: string;
  holder_name: string;
  account_type: "Savings" | "Checking";
  balance: number;
  created_at: string;
  transaction_count: number;
  interest_rate: number;
  minimum_balance: number;
  overdraft_limit: number;
}

export interface BankTransaction {
  tx_id: string;
  account_number: string;
  tx_type: "OPENING" | "DEPOSIT" | "WITHDRAWAL" | "INTEREST" | "FEE" | string;
  amount: number;
  balance_after: number;
  note: string;
  timestamp: string;
}

export interface BankStateResponse {
  ok: boolean;
  accounts: BankAccount[];
  transactions: BankTransaction[];
  message?: string;
  statement?: string;
  account?: BankAccount;
  error_type?: string;
  error?: string;
}
