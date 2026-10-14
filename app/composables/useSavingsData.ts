export function useSavingsData() {
  const { accounts, transactions, valuations } = useAccounts()
  const { get } = useSettings()
  return async () => {
    const [accountList, txs, vals, settings] = await Promise.all([accounts(), transactions(), valuations(), get()])
    const active = accountList.filter((a) => !a.archived)
    const ids = new Set(active.map((a) => a.id))
    return {
      accounts: active,
      txs: txs.filter((t) => ids.has(t.accountId)),
      vals: vals.filter((v) => ids.has(v.accountId)),
      settings,
    }
  }
}
