import { defineStore } from 'pinia'
import type { DiffMode, DiffOptions } from '~/composables/usePdfDiff'
import type { NormalizationStrategy } from '~/composables/usePdfNormalization'

export interface DiffStats {
  differenceCount: number
  totalPixels: number
  percentDiff: number
}

export interface DimensionInfo {
  canvas1: { width: number; height: number }
  canvas2: { width: number; height: number }
  targetWidth: number
  targetHeight: number
}

export const useDiffStore = defineStore('diff', () => {
  // State - Diff Options
  const diffOptions = ref<DiffOptions>({
    mode: 'pixel' as DiffMode,
    threshold: 10,
    overlayOpacity: 0.5,
    useGrayscale: false,
  })

  // State - Normalization
  const normalizationStrategy = ref<NormalizationStrategy>({
    type: 'largest',
    alignment: 'top-left',
    backgroundColor: '#ffffff',
    scaleToFit: false,
  })

  // State - Results
  const stats = ref<DiffStats | null>(null)
  const dimensionInfo = ref<DimensionInfo | null>(null)
  const isComputing = ref(false)
  const isRecomputingDiff = ref(false)

  // State - Zoom
  const sourceZoom = ref(100) // Synced zoom for both source PDFs
  const diffZoom = ref(100) // Independent zoom for difference view
  const diffRenderZoom = ref(100) // Actual rendered zoom of diff canvas

  // State - Animation
  const originalImageData = ref<Uint8ClampedArray | null>(null)

  // Getters
  const hasResults = computed(() => stats.value !== null)

  const diffPercentage = computed(() => {
    if (!stats.value) return 0
    return stats.value.percentDiff
  })

  const isDifferent = computed(() => {
    if (!stats.value) return false
    return stats.value.differenceCount > 0
  })

  // Actions - Options
  function setDiffMode(mode: DiffMode) {
    diffOptions.value.mode = mode
  }

  function setThreshold(threshold: number) {
    diffOptions.value.threshold = threshold
  }

  function setOverlayOpacity(opacity: number) {
    diffOptions.value.overlayOpacity = opacity
  }

  function setUseGrayscale(useGrayscale: boolean) {
    diffOptions.value.useGrayscale = useGrayscale
  }

  function setNormalizationStrategy(strategy: Partial<NormalizationStrategy>) {
    normalizationStrategy.value = { ...normalizationStrategy.value, ...strategy }
  }

  // Actions - Results
  function setStats(newStats: DiffStats) {
    stats.value = newStats
  }

  function setDimensionInfo(info: DimensionInfo) {
    dimensionInfo.value = info
  }

  function setOriginalImageData(data: Uint8ClampedArray) {
    originalImageData.value = data
  }

  // Actions - Zoom
  function setSourceZoom(zoom: number) {
    sourceZoom.value = zoom
  }

  function setDiffZoom(zoom: number) {
    diffZoom.value = zoom
  }

  function setDiffRenderZoom(zoom: number) {
    diffRenderZoom.value = zoom
  }

  // Actions - State
  function setIsComputing(computing: boolean) {
    isComputing.value = computing
  }

  function setIsRecomputingDiff(recomputing: boolean) {
    isRecomputingDiff.value = recomputing
  }

  function reset() {
    stats.value = null
    dimensionInfo.value = null
    isComputing.value = false
    isRecomputingDiff.value = false
    originalImageData.value = null
  }

  return {
    // State - Options
    diffOptions,
    normalizationStrategy,

    // State - Results
    stats,
    dimensionInfo,
    isComputing,
    isRecomputingDiff,
    originalImageData,

    // State - Zoom
    sourceZoom,
    diffZoom,
    diffRenderZoom,

    // Getters
    hasResults,
    diffPercentage,
    isDifferent,

    // Actions
    setDiffMode,
    setThreshold,
    setOverlayOpacity,
    setUseGrayscale,
    setNormalizationStrategy,
    setStats,
    setDimensionInfo,
    setOriginalImageData,
    setSourceZoom,
    setDiffZoom,
    setDiffRenderZoom,
    setIsComputing,
    setIsRecomputingDiff,
    reset,
  }
})
