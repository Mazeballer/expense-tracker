<script setup lang="ts">
import { PhCreditCard } from "@phosphor-icons/vue";
import {
  addMonths,
  formatMonthShort,
  monthName,
  monthOf,
  klDate,
} from "~/lib/date";
import { formatMoney, round2 } from "~/lib/format";
import type { Expense } from "~/types";

const props = defineProps<{ month: string; expenses: Expense[] }>();
const { paymentMethods } = useLookups();

const kindOf = (e: Expense) =>
  paymentMethods.value.find((m) => m.id === e.paymentMethodId)?.kind;
const totalFor = (month: string, kind: "credit_card" | "debit") =>
  round2(
    props.expenses
      .filter((e) => monthOf(klDate(e.spentAt)) === month && kindOf(e) === kind)
      .reduce((t, e) => t + e.amount, 0),
  );

const credit = computed(() => totalFor(props.month, "credit_card"));
const debit = computed(() => totalFor(props.month, "debit"));
// Everything spent this month, including expenses with no card (for example the ones imported from the old sheet).
const all = computed(() =>
  round2(
    props.expenses
      .filter((e) => monthOf(klDate(e.spentAt)) === props.month)
      .reduce((t, e) => t + e.amount, 0),
  ),
);
const noCard = computed(() => round2(all.value - credit.value - debit.value));
const history = computed(() => {
  const rows = Array.from({ length: 6 }, (_, i) =>
    addMonths(props.month, -i),
  ).map((m) => ({ month: m, total: totalFor(m, "credit_card") }));
  const max = Math.max(...rows.map((r) => r.total), 1);
  return rows.map((r) => ({ ...r, width: (r.total / max) * 100 }));
});
</script>

<template>
  <section
    aria-label="Card spending"
    class="relative isolate transform-gpu overflow-hidden rounded-3xl p-6 text-white"
  >
    <div
      class="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[#1F54D4]"
      aria-hidden="true"
    >
      <div class="absolute right-[46px] top-[46px]">
        <span
          v-for="d in [88, 168, 248, 328, 408, 488]"
          :key="d"
          class="absolute rounded-full border border-white/15"
          :style="{
            width: `${d}px`,
            height: `${d}px`,
            left: `${-d / 2}px`,
            top: `${-d / 2}px`,
          }"
        />
        <span
          class="absolute left-[-44px] top-[-44px] size-[88px] rounded-full bg-white/10"
        />
      </div>
    </div>
    <div class="flex flex-col gap-5">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="t-secondary text-white">Credit card to pay</p>
          <p class="t-hero mt-1 text-white">{{ formatMoney(credit) }}</p>
          <p class="t-caption mt-1 text-white/85">
            Charged in {{ monthName(month) }}
          </p>
        </div>
        <span
          class="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/20 text-white"
          ><PhCreditCard :size="22" weight="fill"
        /></span>
      </div>
      <dl
        class="grid divide-x divide-white/25 border-t border-white/25 pt-4"
        :class="noCard > 0 ? 'grid-cols-3' : 'grid-cols-2'"
      >
        <div class="pr-3">
          <dt class="t-secondary text-white/85">Total spent</dt>
          <dd class="t-heading mt-1">{{ formatMoney(all) }}</dd>
        </div>
        <div class="px-3">
          <dt class="t-secondary text-white/85">Debit card</dt>
          <dd class="t-heading mt-1">{{ formatMoney(debit) }}</dd>
        </div>
        <div v-if="noCard > 0" class="pl-3">
          <dt class="t-secondary text-white/85">No card</dt>
          <dd class="t-heading mt-1">{{ formatMoney(noCard) }}</dd>
        </div>
      </dl>
      <div class="border-t border-white/25 pt-4">
        <p class="t-secondary mb-3 font-medium text-white/85">
          Credit card by month
        </p>
        <ul class="flex flex-col gap-3">
          <li
            v-for="r in history"
            :key="r.month"
            class="grid grid-cols-[3rem_1fr_5.5rem] items-center gap-2"
          >
            <span class="t-caption text-white/85">{{
              formatMonthShort(r.month)
            }}</span>
            <span class="h-2 rounded-full bg-white/20"
              ><span
                class="block h-full rounded-full bg-white shadow-[0_0_10px_2px_rgba(255,255,255,0.55)]"
                :style="{ width: `${r.width}%` }"
            /></span>
            <span class="t-secondary text-right font-medium tabular-nums">{{
              formatMoney(r.total)
            }}</span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
