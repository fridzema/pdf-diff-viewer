import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', () => {
  // State - Sections Visibility
  const uploadSectionExpanded = ref(true)
  const sourcePdfsExpanded = ref(true)
  const advancedSettingsExpanded = ref(false)
  const exportExpanded = ref(false)

  // State - Active Tab (0 = Settings, 1 = Results, 2 = Metadata)
  const activeTab = ref(0)

  // State - Feature Toggles
  const syncPanningEnabled = ref(true)
  const swipeModeEnabled = ref(false)
  const magnifierEnabled = ref(false)
  const animationEnabled = ref(false)

  // State - Magnifier Settings
  const magnifierZoom = ref(2.5)
  const magnifierSize = ref(200)

  // State - Animation Settings
  const animationSpeed = ref(500) // milliseconds
  const showingDiff = ref(true) // For animation toggle

  // State - Export Settings
  const exportFormat = ref<'png' | 'jpeg'>('png')
  const exportQuality = ref(0.95) // JPEG quality
  const exportIncludeMetadata = ref(true)
  const isExporting = ref(false)
  const exportSuccess = ref(false)
  const copySuccess = ref(false)

  // Actions - Sections
  function toggleUploadSection() {
    uploadSectionExpanded.value = !uploadSectionExpanded.value
  }

  function toggleSourcePdfs() {
    sourcePdfsExpanded.value = !sourcePdfsExpanded.value
  }

  function toggleAdvancedSettings() {
    advancedSettingsExpanded.value = !advancedSettingsExpanded.value
  }

  function toggleExportSection() {
    exportExpanded.value = !exportExpanded.value
  }

  function collapseUploadSection() {
    uploadSectionExpanded.value = false
  }

  // Actions - Tabs
  function setActiveTab(tab: number) {
    activeTab.value = tab
  }

  // Actions - Features
  function setSyncPanning(enabled: boolean) {
    syncPanningEnabled.value = enabled
  }

  function setSwipeMode(enabled: boolean) {
    swipeModeEnabled.value = enabled
  }

  function setMagnifier(enabled: boolean) {
    magnifierEnabled.value = enabled
  }

  function setAnimation(enabled: boolean) {
    animationEnabled.value = enabled
  }

  function setMagnifierZoom(zoom: number) {
    magnifierZoom.value = zoom
  }

  function setMagnifierSize(size: number) {
    magnifierSize.value = size
  }

  function setAnimationSpeed(speed: number) {
    animationSpeed.value = speed
  }

  function toggleShowingDiff() {
    showingDiff.value = !showingDiff.value
  }

  // Actions - Export
  function setExportFormat(format: 'png' | 'jpeg') {
    exportFormat.value = format
  }

  function setExportQuality(quality: number) {
    exportQuality.value = quality
  }

  function setExportIncludeMetadata(include: boolean) {
    exportIncludeMetadata.value = include
  }

  function setIsExporting(exporting: boolean) {
    isExporting.value = exporting
  }

  function setExportSuccess(success: boolean) {
    exportSuccess.value = success
  }

  function setCopySuccess(success: boolean) {
    copySuccess.value = success
  }

  return {
    // State - Sections
    uploadSectionExpanded,
    sourcePdfsExpanded,
    advancedSettingsExpanded,
    exportExpanded,

    // State - Tabs
    activeTab,

    // State - Features
    syncPanningEnabled,
    swipeModeEnabled,
    magnifierEnabled,
    animationEnabled,
    magnifierZoom,
    magnifierSize,
    animationSpeed,
    showingDiff,

    // State - Export
    exportFormat,
    exportQuality,
    exportIncludeMetadata,
    isExporting,
    exportSuccess,
    copySuccess,

    // Actions - Sections
    toggleUploadSection,
    toggleSourcePdfs,
    toggleAdvancedSettings,
    toggleExportSection,
    collapseUploadSection,

    // Actions - Tabs
    setActiveTab,

    // Actions - Features
    setSyncPanning,
    setSwipeMode,
    setMagnifier,
    setAnimation,
    setMagnifierZoom,
    setMagnifierSize,
    setAnimationSpeed,
    toggleShowingDiff,

    // Actions - Export
    setExportFormat,
    setExportQuality,
    setExportIncludeMetadata,
    setIsExporting,
    setExportSuccess,
    setCopySuccess,
  }
})
