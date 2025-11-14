<template>
  <div>
    <NuxtPage />
    <ClientOnly>
      <HelpButton />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import HelpButton from '~/components/HelpButton.vue'
</script>
