<template>
  <button
    class="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
    :title="buttonTitle"
    :disabled="!teamsLink"
    @click="openTeamsChat"
  >
    <svg
      class="h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M8 10h.01M12 10h.01M16 10h.01M21 16.5a2.5 2.5 0 01-2.5 2.5H8l-4 3v-3H3a2 2 0 01-2-2V5a2 2 0 012-2h15.5a2.5 2.5 0 012.5 2.5z"
      />
    </svg>
    <span>Need help?</span>
  </button>
</template>

<script setup lang="ts">
const runtimeConfig = useRuntimeConfig()

const teamsUser = computed(() => runtimeConfig.public?.teamsSupportUser?.trim() ?? '')
const teamsLink = computed(() => {
  if (runtimeConfig.public?.teamsSupportLink) {
    return runtimeConfig.public.teamsSupportLink
  }
  if (!teamsUser.value) {
    return ''
  }
  const base = 'https://teams.microsoft.com/l/chat/0/0?users='
  return `${base}${encodeURIComponent(teamsUser.value)}`
})

const buttonTitle = computed(() =>
  teamsLink.value
    ? 'Open a Microsoft Teams chat'
    : 'Configure NUXT_PUBLIC_TEAMS_SUPPORT_USER to enable help chat'
)

const openTeamsChat = () => {
  if (!teamsLink.value) return
  if (typeof window === 'undefined') return
  window.open(teamsLink.value, '_blank', 'noopener,noreferrer')
}
</script>
