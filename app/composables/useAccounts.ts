export function useAccounts() {
  const backend = useBackend()
  return {
    accounts: backend.listAccounts,
    addAccount: backend.addAccount,
    updateAccount: backend.updateAccount,
    removeAccount: backend.removeAccount,
    transactions: backend.listTransactions,
    addTransaction: backend.addTransaction,
    updateTransaction: backend.updateTransaction,
    removeTransaction: backend.removeTransaction,
    valuations: backend.listValuations,
    addValuation: backend.addValuation,
    updateValuation: backend.updateValuation,
    removeValuation: backend.removeValuation,
  }
}
