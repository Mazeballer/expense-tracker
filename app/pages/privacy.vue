<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Privacy | Wallet Wyse' })
</script>

<template>
  <main class="mx-auto flex min-h-dvh w-full max-w-[640px] flex-col gap-6 bg-ground px-6 py-10 text-ink">
    <NuxtLink to="/login" class="t-secondary text-muted-foreground underline">Wallet Wyse</NuxtLink>
    <h1 class="t-title">Privacy</h1>
    <p class="text-muted-foreground">Wallet Wyse is a private money tracker for two people. It is invite only. This page explains what it stores.</p>

    <section class="flex flex-col gap-2">
      <h2 class="t-heading">What we collect</h2>
      <p>When you sign in with Google, we receive your email address, name and profile picture. We use them only to recognise you and greet you.</p>
      <p>Everything you enter is stored in your account: expenses, budgets, income and fixed costs, savings and investment amounts, and your settings.</p>
    </section>

    <section class="flex flex-col gap-2">
      <h2 class="t-heading">Who can see it</h2>
      <p>Only you. Each person's data is locked to their own account. We do not sell your data, share it, or use it for advertising.</p>
    </section>

    <section class="flex flex-col gap-2">
      <h2 class="t-heading">Where it is kept</h2>
      <p>Your data is stored with Supabase, and the app is hosted on Vercel. Face ID and your PIN stay on your device. Your PIN is never sent anywhere.</p>
    </section>

    <section class="flex flex-col gap-2">
      <h2 class="t-heading">Your choices</h2>
      <p>You can export all your data from Settings at any time. To delete your account and data, ask the person who invited you.</p>
    </section>
  </main>
</template>
