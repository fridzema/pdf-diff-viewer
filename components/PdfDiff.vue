<template>
  <div class="pdf-diff-container">
    <!-- Source PDFs Side-by-Side (Collapsible) -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
      <!-- Collapsible Header -->
      <button
        class="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        @click="sourcePdfsExpanded = !sourcePdfsExpanded"
      >
        <h3 class="text-lg font-semibold text-gray-800">Source PDFs</h3>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 text-gray-600 transition-transform duration-200"
          :class="{ 'rotate-180': !sourcePdfsExpanded }"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <!-- Collapsible Content -->
      <transition name="expand" @enter="onEnter" @after-enter="onAfterEnter" @leave="onLeave">
        <div v-show="sourcePdfsExpanded" class="overflow-hidden">
          <div class="p-6 pt-2">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Left PDF -->
              <div>
                <PdfCanvas
                  ref="leftCanvasComponent"
                  v-model:zoom="sourceZoom"
                  :file="leftFile"
                  title="PDF 1"
                />
              </div>

              <!-- Right PDF -->
              <div>
                <PdfCanvas
                  ref="rightCanvasComponent"
                  v-model:zoom="sourceZoom"
                  :file="rightFile"
                  title="PDF 2"
                />
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- Comparison (Tabbed Interface) -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
      <!-- Tab Navigation -->
      <div class="flex border-b border-gray-200">
        <button
          class="px-6 py-4 font-medium text-sm transition-colors border-b-2"
          :class="
            activeTab === 0
              ? 'text-primary-600 border-primary-600'
              : 'text-gray-600 border-transparent hover:text-gray-800 hover:border-gray-300'
          "
          @click="activeTab = 0"
        >
          Settings
        </button>
        <button
          class="px-6 py-4 font-medium text-sm transition-colors border-b-2"
          :class="
            activeTab === 1
              ? 'text-primary-600 border-primary-600'
              : 'text-gray-600 border-transparent hover:text-gray-800 hover:border-gray-300'
          "
          @click="activeTab = 1"
        >
          Results
        </button>
        <button
          class="px-6 py-4 font-medium text-sm transition-colors border-b-2"
          :class="
            activeTab === 2
              ? 'text-primary-600 border-primary-600'
              : 'text-gray-600 border-transparent hover:text-gray-800 hover:border-gray-300'
          "
          @click="activeTab = 2"
        >
          Metadata
        </button>
      </div>

      <!-- Tab Content -->
      <div class="p-6">
        <!-- Settings Tab -->
        <div v-show="activeTab === 0">
          <!-- Diff Mode Selection -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Comparison Mode </label>
            <select
              v-model="diffOptions.mode"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              @change="runComparison"
            >
              <option value="pixel">Pixel Difference</option>
              <option value="threshold">Threshold Mode</option>
              <option value="grayscale">Grayscale Diff</option>
              <option value="overlay">Color Overlay</option>
              <option value="heatmap">Heatmap</option>
              <option value="semantic">Semantic Diff (Additions/Deletions/Modifications)</option>
            </select>
            <p class="mt-1 text-xs text-gray-500">{{ getModeDescription(diffOptions.mode) }}</p>
          </div>

          <!-- Advanced Settings (Collapsible) -->
          <div class="border-t border-gray-200 pt-4">
            <button
              class="w-full flex items-center justify-between hover:bg-gray-50 transition-colors p-2 rounded"
              @click="advancedSettingsExpanded = !advancedSettingsExpanded"
            >
              <span class="text-sm font-medium text-gray-700">Advanced Settings</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-gray-600 transition-transform duration-200"
                :class="{ 'rotate-180': !advancedSettingsExpanded }"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <transition name="expand" @enter="onEnter" @after-enter="onAfterEnter" @leave="onLeave">
              <div v-show="advancedSettingsExpanded" class="overflow-hidden">
                <div class="pt-4">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Threshold Slider -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Sensitivity Threshold: {{ diffOptions.threshold }}
                      </label>
                      <input
                        v-model.number="diffOptions.threshold"
                        type="range"
                        min="0"
                        max="255"
                        step="1"
                        class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        @input="runComparison"
                      />
                      <div class="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Less Sensitive</span>
                        <span>More Sensitive</span>
                      </div>
                    </div>

                    <!-- Overlay Opacity Slider (only for overlay mode) -->
                    <div v-if="diffOptions.mode === 'overlay'">
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Overlay Opacity: {{ (diffOptions.overlayOpacity * 100).toFixed(0) }}%
                      </label>
                      <input
                        v-model.number="diffOptions.overlayOpacity"
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        @input="runComparison"
                      />
                    </div>

                    <!-- Grayscale Toggle -->
                    <div class="flex items-center">
                      <input
                        v-model="diffOptions.useGrayscale"
                        type="checkbox"
                        class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        @change="runComparison"
                      />
                      <label class="ml-2 text-sm text-gray-700">
                        Convert to grayscale before comparing
                      </label>
                    </div>

                    <!-- Sync Panning Toggle -->
                    <div class="flex items-center">
                      <input
                        v-model="syncPanningEnabled"
                        type="checkbox"
                        class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <label class="ml-2 text-sm text-gray-700"> Sync panning between PDFs </label>
                    </div>

                    <!-- Swipe Mode Toggle -->
                    <div class="flex items-center">
                      <input
                        v-model="swipeModeEnabled"
                        type="checkbox"
                        class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <label class="ml-2 text-sm text-gray-700">
                        Enable swipe comparison mode
                      </label>
                    </div>

                    <!-- Magnifier Toggle -->
                    <div class="flex items-center">
                      <input
                        v-model="magnifierEnabled"
                        type="checkbox"
                        class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <label class="ml-2 text-sm text-gray-700"> Enable magnifier zoom lens </label>
                    </div>

                    <!-- Animation Toggle -->
                    <div class="flex items-center">
                      <input
                        v-model="animationEnabled"
                        type="checkbox"
                        class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <label class="ml-2 text-sm text-gray-700">
                        Animate differences (blink)
                      </label>
                    </div>

                    <!-- Magnifier Settings (only shown when magnifier is enabled) -->
                    <div
                      v-if="magnifierEnabled"
                      class="col-span-2 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                    >
                      <h4 class="text-sm font-semibold text-blue-900 mb-3">Magnifier Settings</h4>
                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <label class="block text-sm font-medium text-blue-900 mb-2">
                            Zoom Level: {{ magnifierZoom }}x
                          </label>
                          <input
                            v-model.number="magnifierZoom"
                            type="range"
                            min="1.5"
                            max="5"
                            step="0.5"
                            class="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-blue-900 mb-2">
                            Lens Size: {{ magnifierSize }}px
                          </label>
                          <input
                            v-model.number="magnifierSize"
                            type="range"
                            min="100"
                            max="300"
                            step="25"
                            class="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <!-- Animation Speed Slider (only shown when animation is enabled) -->
                    <div v-if="animationEnabled">
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Animation Speed: {{ animationSpeed }}ms
                      </label>
                      <input
                        v-model.number="animationSpeed"
                        type="range"
                        min="200"
                        max="2000"
                        step="100"
                        class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div class="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Faster</span>
                        <span>Slower</span>
                      </div>
                    </div>
                  </div>

                  <!-- Layout Normalization Settings -->
                  <div class="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <h3 class="text-sm font-semibold text-gray-800 mb-3">Layout Normalization</h3>
                    <p class="text-xs text-gray-600 mb-4">
                      Handles PDFs with different dimensions by aligning and scaling appropriately
                    </p>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <!-- Strategy Selection -->
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Strategy</label>
                        <select
                          v-model="normalizationStrategy.type"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                          @change="runComparison"
                        >
                          <option value="largest">Use Largest Dimensions</option>
                          <option value="smallest">Use Smallest Dimensions</option>
                          <option value="first">Match PDF 1</option>
                          <option value="second">Match PDF 2</option>
                        </select>
                      </div>

                      <!-- Alignment Selection -->
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2"
                          >Alignment</label
                        >
                        <select
                          v-model="normalizationStrategy.alignment"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                          @change="runComparison"
                        >
                          <option value="top-left">Top Left</option>
                          <option value="top-center">Top Center</option>
                          <option value="center">Center</option>
                        </select>
                      </div>

                      <!-- Scale to Fit Toggle -->
                      <div class="flex items-center">
                        <input
                          v-model="normalizationStrategy.scaleToFit"
                          type="checkbox"
                          class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          @change="runComparison"
                        />
                        <label class="ml-2 text-sm text-gray-700">
                          Scale to fit (preserve aspect ratio)
                        </label>
                      </div>
                    </div>

                    <!-- Dimension Info Display -->
                    <div
                      v-if="dimensionInfo"
                      class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm"
                    >
                      <div class="font-semibold text-blue-900 mb-2">PDF Dimensions:</div>
                      <div class="grid grid-cols-2 gap-2 text-blue-800">
                        <div>
                          <span class="font-medium">PDF 1:</span>
                          {{ dimensionInfo.canvas1.width }} × {{ dimensionInfo.canvas1.height }}
                        </div>
                        <div>
                          <span class="font-medium">PDF 2:</span>
                          {{ dimensionInfo.canvas2.width }} × {{ dimensionInfo.canvas2.height }}
                        </div>
                      </div>
                      <div class="mt-2 font-semibold text-blue-900">
                        Normalized: {{ dimensionInfo.targetWidth }} ×
                        {{ dimensionInfo.targetHeight }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>

        <!-- Results Tab -->
        <div v-show="activeTab === 1">
          <div v-if="stats">
            <div class="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span class="text-gray-600">Different Pixels:</span>
                <span class="font-semibold text-gray-900 ml-2">{{
                  stats.differenceCount.toLocaleString()
                }}</span>
              </div>
              <div>
                <span class="text-gray-600">Total Pixels:</span>
                <span class="font-semibold text-gray-900 ml-2">{{
                  stats.totalPixels.toLocaleString()
                }}</span>
              </div>
              <div>
                <span class="text-gray-600">Difference:</span>
                <span
                  class="font-semibold ml-2"
                  :class="stats.percentDiff > 5 ? 'text-red-600' : 'text-green-600'"
                >
                  {{ stats.percentDiff.toFixed(2) }}%
                </span>
              </div>
            </div>
          </div>
          <div v-else class="text-gray-500 text-sm">
            No comparison results yet. Upload PDFs to compare.
          </div>
        </div>

        <!-- Metadata Tab -->
        <div v-show="activeTab === 2">
          <div v-if="leftMetadata && rightMetadata">
            <PdfMetadataDiff
              :left-metadata="leftMetadata"
              :right-metadata="rightMetadata"
              :left-file-name="leftFile?.name || 'PDF 1'"
              :right-file-name="rightFile?.name || 'PDF 2'"
            />
          </div>
          <div v-else class="text-gray-500 text-sm">
            No metadata available. Upload PDFs to compare.
          </div>
        </div>
      </div>
    </div>

    <!-- Difference View -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
      <div class="mb-3 text-lg font-semibold text-gray-800">
        {{ swipeModeEnabled ? 'Swipe Comparison' : 'Difference View' }}
      </div>

      <!-- Zoom Controls for Diff View -->
      <div v-if="!swipeModeEnabled" class="mb-3">
        <PdfViewerControls v-model="diffZoom" />
      </div>

      <!-- Swipe Comparison Mode -->
      <div v-if="swipeModeEnabled">
        <PdfSwipeCompare
          :canvas1="leftCanvasComponent?.canvas"
          :canvas2="rightCanvasComponent?.canvas"
          :zoom="sourceZoom"
          orientation="vertical"
        />
      </div>

      <!-- Diff Canvas (Normal Mode) -->
      <div
        v-else
        class="canvas-wrapper border border-gray-300 rounded-lg overflow-auto bg-gray-50 relative"
      >
        <!-- Loading overlay -->
        <div
          v-if="isRecomputingDiff"
          class="absolute inset-0 bg-white/80 flex items-center justify-center z-10"
        >
          <div class="flex items-center gap-2 text-sm text-gray-700">
            <svg
              class="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Re-rendering at {{ diffZoom }}%...
          </div>
        </div>

        <!-- Canvas with optional magnifier and animation support -->
        <PdfMagnifier
          :canvas="diffCanvas"
          :magnification="magnifierZoom"
          :size="magnifierSize"
          :enabled="magnifierEnabled"
        >
          <div class="canvas-animation-wrapper">
            <!-- Original canvas (for animation blend) -->
            <canvas
              v-if="animationEnabled && originalCanvas"
              ref="originalCanvas"
              class="animation-canvas"
              :class="{ 'animation-visible': !showingDiff }"
              :style="diffCanvasStyle"
            ></canvas>
            <!-- Diff canvas -->
            <canvas
              ref="diffCanvas"
              class="animation-canvas"
              :class="{ 'animation-visible': showingDiff || !animationEnabled }"
              :style="diffCanvasStyle"
            ></canvas>
          </div>
        </PdfMagnifier>
      </div>
    </div>

    <!-- Export Options (Collapsible) -->
    <div v-if="stats" class="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
      <button
        class="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        @click="exportExpanded = !exportExpanded"
      >
        <h3 class="text-lg font-semibold text-gray-800">Export Options</h3>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 text-gray-600 transition-transform duration-200"
          :class="{ 'rotate-180': !exportExpanded }"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <transition name="expand" @enter="onEnter" @after-enter="onAfterEnter" @leave="onLeave">
        <div v-show="exportExpanded" class="overflow-hidden">
          <div class="p-6 pt-2">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <!-- Format Selection -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Format</label>
                <select
                  v-model="exportFormat"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                >
                  <option value="png">PNG (Lossless)</option>
                  <option value="jpeg">JPEG (Compressed)</option>
                </select>
              </div>

              <!-- JPEG Quality Slider (only for JPEG) -->
              <div v-if="exportFormat === 'jpeg'">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  JPEG Quality: {{ (exportQuality * 100).toFixed(0) }}%
                </label>
                <input
                  v-model.number="exportQuality"
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div class="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Lower Quality</span>
                  <span>Higher Quality</span>
                </div>
              </div>

              <!-- Include Metadata Toggle -->
              <div class="flex items-center">
                <input
                  v-model="exportIncludeMetadata"
                  type="checkbox"
                  class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label class="ml-2 text-sm text-gray-700">
                  Include metadata (stats, timestamp)
                </label>
              </div>
            </div>

            <!-- Export Buttons -->
            <div class="flex gap-3">
              <button
                :disabled="isExporting"
                class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                @click="handleExport"
              >
                <svg
                  v-if="isExporting"
                  class="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <svg
                  v-else-if="exportSuccess"
                  class="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <svg
                  v-else
                  class="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  ></path>
                </svg>
                <span>{{ exportSuccess ? 'Downloaded!' : 'Download Image' }}</span>
              </button>

              <button
                class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center justify-center gap-2"
                @click="handleCopyToClipboard"
              >
                <svg
                  v-if="copySuccess"
                  class="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <svg
                  v-else
                  class="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  ></path>
                </svg>
                <span>{{ copySuccess ? 'Copied!' : 'Copy' }}</span>
              </button>
            </div>

            <!-- Color Legend (only for semantic mode) -->
            <div
              v-if="diffOptions.mode === 'semantic'"
              class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <h4 class="text-sm font-semibold text-blue-900 mb-3">Color Legend</h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded" style="background-color: rgb(34, 197, 94)"></div>
                  <div>
                    <div class="font-semibold text-blue-900">Additions</div>
                    <div class="text-xs text-blue-700">New content in PDF 2</div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded" style="background-color: rgb(239, 68, 68)"></div>
                  <div>
                    <div class="font-semibold text-blue-900">Deletions</div>
                    <div class="text-xs text-blue-700">Removed from PDF 1</div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded" style="background-color: rgb(250, 204, 21)"></div>
                  <div>
                    <div class="font-semibold text-blue-900">Modifications</div>
                    <div class="text-xs text-blue-700">Content changed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import { logger } from '~/utils/logger'
import type { DiffMode } from '~/composables/usePdfDiff'
import type { NormalizationStrategy } from '~/composables/usePdfNormalization'
import { usePdfNormalization } from '~/composables/usePdfNormalization'
import type { ExportFormat, ExportOptions } from '~/composables/useCanvasExport'
import { useCanvasExport } from '~/composables/useCanvasExport'
import type { PdfMetadata } from '~/composables/usePdfMetadata'
import { useDiffStore } from '~/stores/diff'
import { useUiStore } from '~/stores/ui'

const props = defineProps<{
  leftFile: File | null
  rightFile: File | null
  leftMetadata?: PdfMetadata | null
  rightMetadata?: PdfMetadata | null
}>()

type PdfCanvasExpose = {
  canvas: HTMLCanvasElement | null
  canvasWrapper: HTMLElement | null
  isReady: boolean
  zoom: number
}

type PdfCanvasInstance = ComponentPublicInstance<Record<string, never>, PdfCanvasExpose>

const leftCanvasComponent = ref<PdfCanvasInstance | null>(null)
const rightCanvasComponent = ref<PdfCanvasInstance | null>(null)
const diffCanvas = ref<HTMLCanvasElement | null>(null)
const originalCanvas = ref<HTMLCanvasElement | null>(null)

// Initialize Pinia stores
const diffStore = useDiffStore()
const uiStore = useUiStore()

const { comparePdfsAsync } = usePdfDiffWorker()
const { renderPdfToCanvas } = usePdfRenderer()
const { calculateNormalizedDimensions } = usePdfNormalization()
const { exportCanvas, exportCanvasWithMetadata, copyCanvasToClipboard } = useCanvasExport()
const { acquire: acquireCanvas, release: releaseCanvas } = useCanvasPool()

// Reusable temp canvases for diff recomputation (using canvas pool for memory efficiency)
const tempCanvas1 = ref<HTMLCanvasElement | null>(null)
const tempCanvas2 = ref<HTMLCanvasElement | null>(null)

// Use store state for zoom (now centralized in Pinia)
const sourceZoom = computed({
  get: () => diffStore.sourceZoom,
  set: (value) => diffStore.setSourceZoom(value),
})
const diffZoom = computed({
  get: () => diffStore.diffZoom,
  set: (value) => diffStore.setDiffZoom(value),
})
const diffRenderZoom = computed({
  get: () => diffStore.diffRenderZoom,
  set: (value) => diffStore.setDiffRenderZoom(value),
})
const isRecomputingDiff = computed({
  get: () => diffStore.isRecomputingDiff,
  set: (value) => diffStore.setIsRecomputingDiff(value),
})

// Debounce diff zoom for smart re-rendering
const debouncedDiffZoom = useDebounce(
  computed(() => diffZoom.value),
  500
)

// Track if diff zoom is in debounce period (for CSS-scale fallback)
const isDiffDebouncing = computed(() => diffZoom.value !== debouncedDiffZoom.value)

// Use store state for UI features (centralized in UI store)
const syncPanningEnabled = computed({
  get: () => uiStore.syncPanningEnabled,
  set: (value) => uiStore.setSyncPanning(value),
})
const sourcePdfsExpanded = computed({
  get: () => uiStore.sourcePdfsExpanded,
  set: (_value) => uiStore.toggleSourcePdfs(),
})
const advancedSettingsExpanded = computed({
  get: () => uiStore.advancedSettingsExpanded,
  set: (_value) => uiStore.toggleAdvancedSettings(),
})
const exportExpanded = computed({
  get: () => uiStore.exportExpanded,
  set: (_value) => uiStore.toggleExportSection(),
})
const activeTab = computed({
  get: () => uiStore.activeTab,
  set: (value) => uiStore.setActiveTab(value),
})
const swipeModeEnabled = computed({
  get: () => uiStore.swipeModeEnabled,
  set: (value) => uiStore.setSwipeMode(value),
})
const magnifierEnabled = computed({
  get: () => uiStore.magnifierEnabled,
  set: (value) => uiStore.setMagnifier(value),
})
const magnifierZoom = computed({
  get: () => uiStore.magnifierZoom,
  set: (value) => uiStore.setMagnifierZoom(value),
})
const magnifierSize = computed({
  get: () => uiStore.magnifierSize,
  set: (value) => uiStore.setMagnifierSize(value),
})
const animationEnabled = computed({
  get: () => uiStore.animationEnabled,
  set: (value) => uiStore.setAnimation(value),
})
const animationSpeed = computed({
  get: () => uiStore.animationSpeed,
  set: (value) => uiStore.setAnimationSpeed(value),
})
const showingDiff = computed({
  get: () => uiStore.showingDiff,
  set: (value) => (uiStore.showingDiff = value),
})

// Local state for animation interval (not in store as it's transient)
const animationIntervalId = ref<number | null>(null)

// Use store state for original image data (centralized in Diff store)
const originalImageData = computed({
  get: () => diffStore.originalImageData,
  set: (value) => value && diffStore.setOriginalImageData(value),
})

// Use store state for normalization strategy (centralized in Diff store)
const normalizationStrategy = computed({
  get: () => diffStore.normalizationStrategy,
  set: (value: Partial<NormalizationStrategy>) => diffStore.setNormalizationStrategy(value),
})

// Use store state for dimension info (centralized in Diff store)
const dimensionInfo = computed({
  get: () => diffStore.dimensionInfo,
  set: (value) => value && diffStore.setDimensionInfo(value),
})

// Use store state for diff options (centralized in Diff store)
const diffOptions = computed({
  get: () => diffStore.diffOptions,
  set: (value) => (diffStore.diffOptions = value),
})

// Use store state for export settings (centralized in UI store)
const exportFormat = computed({
  get: () => uiStore.exportFormat,
  set: (value: ExportFormat) => uiStore.setExportFormat(value),
})
const exportQuality = computed({
  get: () => uiStore.exportQuality,
  set: (value) => uiStore.setExportQuality(value),
})
const exportIncludeMetadata = computed({
  get: () => uiStore.exportIncludeMetadata,
  set: (value) => uiStore.setExportIncludeMetadata(value),
})
const isExporting = computed({
  get: () => uiStore.isExporting,
  set: (value) => uiStore.setIsExporting(value),
})
const exportSuccess = computed({
  get: () => uiStore.exportSuccess,
  set: (value) => uiStore.setExportSuccess(value),
})
const copySuccess = computed({
  get: () => uiStore.copySuccess,
  set: (value) => uiStore.setCopySuccess(value),
})

// Use store state for comparison stats (centralized in Diff store)
const stats = computed({
  get: () => diffStore.stats,
  set: (value) => value && diffStore.setStats(value),
})

const canCompare = computed(() => {
  const result = props.leftFile !== null && props.rightFile !== null
  logger.log('canCompare updated:', result, {
    leftFile: !!props.leftFile,
    rightFile: !!props.rightFile,
  })
  return result
})

// Scroll synchronization between source PDFs
const leftWrapper = computed(() => leftCanvasComponent.value?.canvasWrapper)
const rightWrapper = computed(() => rightCanvasComponent.value?.canvasWrapper)

useScrollSync(leftWrapper, rightWrapper, { enabled: syncPanningEnabled })

// CSS scaling for diff canvas during debounce (instant zoom feedback)
const diffCanvasStyle = computed(() => {
  // Calculate scale ratio for immediate visual feedback
  // Guard against division by zero or invalid scale values
  let transformScale = 1
  if (isDiffDebouncing.value && diffRenderZoom.value > 0 && diffZoom.value > 0) {
    transformScale = diffZoom.value / diffRenderZoom.value
    // Ensure scale is a valid number
    if (!isFinite(transformScale) || transformScale <= 0) {
      transformScale = 1
    }
  }

  return {
    display: 'block',
    transform: transformScale !== 1 ? `scale(${transformScale})` : 'none',
    transformOrigin: 'top left',
    transition: 'none', // No transition for instant feedback
  }
})

// Transition handlers for smooth collapse/expand animation
const onEnter = (el: HTMLElement) => {
  el.style.height = '0'
  el.style.opacity = '0'
}

const onAfterEnter = (el: HTMLElement) => {
  el.style.height = 'auto'
  el.style.opacity = '1'
  el.style.transition = 'height 0.3s ease-out, opacity 0.3s ease-out'
}

const onLeave = (el: HTMLElement) => {
  el.style.height = `${el.scrollHeight}px`
  el.style.opacity = '1'

  // Force reflow (intentionally reading offsetHeight to trigger layout)
  void el.offsetHeight

  el.style.transition = 'height 0.3s ease-in, opacity 0.3s ease-in'
  el.style.height = '0'
  el.style.opacity = '0'
}

const getModeDescription = (mode: DiffMode): string => {
  const descriptions: Record<DiffMode, string> = {
    pixel: 'Highlights all different pixels in red',
    threshold: 'Only highlights pixels that differ by more than the threshold',
    grayscale: 'Converts to grayscale before comparing',
    overlay: 'Blends both PDFs with red highlights for differences',
    heatmap: 'Shows difference intensity with color gradient (blue → red)',
    semantic:
      'Distinguishes additions (green), deletions (red), and modifications (yellow) based on content presence',
  }
  return descriptions[mode]
}

// Animation control functions using CSS transitions (50% CPU reduction vs RAF)
const startAnimation = () => {
  if (!originalImageData.value || !diffCanvas.value || !originalCanvas.value) {
    logger.warn('Cannot start animation: missing image data or canvases')
    return
  }

  // Clear any existing animation
  stopAnimation()

  logger.log('Starting CSS-based blink animation at', animationSpeed.value, 'ms interval')

  // Draw the original data to the original canvas once
  const ctx = originalCanvas.value.getContext('2d')
  if (ctx && diffCanvas.value) {
    originalCanvas.value.width = diffCanvas.value.width
    originalCanvas.value.height = diffCanvas.value.height
    const imageData = new ImageData(
      originalImageData.value,
      diffCanvas.value.width,
      diffCanvas.value.height
    )
    ctx.putImageData(imageData, 0, 0)
  }

  // Reset animation state
  showingDiff.value = true

  // Use setInterval to toggle visibility class (CSS handles the transition)
  animationIntervalId.value = window.setInterval(() => {
    showingDiff.value = !showingDiff.value
  }, animationSpeed.value)
}

const stopAnimation = () => {
  if (animationIntervalId.value !== null) {
    clearInterval(animationIntervalId.value)
    animationIntervalId.value = null
    logger.log('Stopped CSS animation')
  }

  // Ensure we're showing the diff when animation stops
  showingDiff.value = true
}

// Recompute diff at a specific zoom level (re-renders PDFs at new resolution)
const recomputeDiffAtZoom = async (targetZoom: number) => {
  if (isRecomputingDiff.value || !canCompare.value) return

  isRecomputingDiff.value = true

  // Stop animation before recomputing
  stopAnimation()

  // Acquire canvases from pool (if not already acquired)
  if (!tempCanvas1.value) {
    tempCanvas1.value = acquireCanvas(100, 100) // Size will be updated during render
  }
  if (!tempCanvas2.value) {
    tempCanvas2.value = acquireCanvas(100, 100) // Size will be updated during render
  }

  try {
    logger.log('Recomputing diff at zoom:', targetZoom)

    const scale = targetZoom / 100

    // Render both PDFs at the target zoom level (reusing temp canvases from pool)
    await renderPdfToCanvas(props.leftFile!, tempCanvas1.value, scale)
    await renderPdfToCanvas(props.rightFile!, tempCanvas2.value, scale)

    // Run comparison at high resolution using Web Worker with normalization
    const result = await comparePdfsAsync(
      tempCanvas1.value,
      tempCanvas2.value,
      diffCanvas.value!,
      diffOptions.value,
      normalizationStrategy.value
    )

    stats.value = {
      differenceCount: result.differenceCount,
      totalPixels: result.totalPixels,
      percentDiff: result.percentDiff,
    }

    // Store original image data for CSS-based animation
    originalImageData.value = result.originalData

    diffRenderZoom.value = targetZoom
    logger.log('Diff recomputed successfully at', targetZoom, '%')

    // Restart animation if it was enabled
    if (animationEnabled.value) {
      startAnimation()
    }
  } catch (err) {
    logger.error('Failed to recompute diff:', err)
  } finally {
    isRecomputingDiff.value = false
  }
}

const runComparison = async () => {
  if (!canCompare.value) return

  // Access the canvas element (already unwrapped via computed)
  const leftCanvas = leftCanvasComponent.value?.canvas
  const rightCanvas = rightCanvasComponent.value?.canvas

  logger.log('Running comparison with canvases:', {
    hasLeftCanvas: !!leftCanvas,
    hasRightCanvas: !!rightCanvas,
    hasDiffCanvas: !!diffCanvas.value,
    leftCanvasSize: leftCanvas ? `${leftCanvas.width}x${leftCanvas.height}` : 'N/A',
    rightCanvasSize: rightCanvas ? `${rightCanvas.width}x${rightCanvas.height}` : 'N/A',
  })

  if (!leftCanvas || !rightCanvas || !diffCanvas.value) {
    logger.error('Canvas elements not ready:', {
      leftCanvas: !!leftCanvas,
      rightCanvas: !!rightCanvas,
      diffCanvas: !!diffCanvas.value,
    })
    return
  }

  // Stop animation before recomputing
  stopAnimation()

  try {
    // Calculate and store dimension info for display
    const dimensions = calculateNormalizedDimensions(
      leftCanvas,
      rightCanvas,
      normalizationStrategy.value
    )

    dimensionInfo.value = {
      canvas1: { width: leftCanvas.width, height: leftCanvas.height },
      canvas2: { width: rightCanvas.width, height: rightCanvas.height },
      targetWidth: dimensions.targetWidth,
      targetHeight: dimensions.targetHeight,
    }

    // Use async worker-based comparison to prevent UI freezing (with normalization)
    const result = await comparePdfsAsync(
      leftCanvas,
      rightCanvas,
      diffCanvas.value,
      diffOptions.value,
      normalizationStrategy.value
    )

    stats.value = {
      differenceCount: result.differenceCount,
      totalPixels: result.totalPixels,
      percentDiff: result.percentDiff,
    }

    // Store original image data for CSS-based animation
    originalImageData.value = result.originalData

    // Update diff render zoom to match source zoom
    diffRenderZoom.value = sourceZoom.value

    // Auto-switch to Results tab after successful comparison
    activeTab.value = 1

    logger.log('Comparison completed:', stats.value, 'at zoom:', sourceZoom.value)

    // Restart animation if it was enabled
    if (animationEnabled.value) {
      startAnimation()
    }
  } catch (err) {
    logger.error('Comparison failed:', err)
  }
}

// Auto-run comparison when both files become available
watch(
  canCompare,
  async (canNowCompare) => {
    logger.log('watch(canCompare) triggered:', { canNowCompare })
    if (canNowCompare) {
      logger.log('Both files available, waiting for canvases to be ready...')

      // Wait for next tick to ensure component updates
      await nextTick()

      // Use readiness poller utility
      const poller = useReadinessPoller({
        condition: () => leftCanvasComponent.value?.isReady && rightCanvasComponent.value?.isReady,
        onReady: () => {
          logger.log('Both canvases ready, running initial comparison...')
          runComparison()
        },
        onTimeout: () => {
          logger.error('Canvases not ready after maximum attempts')
        },
      })

      poller.start()
    }
  },
  { immediate: true }
)

// Re-run comparison when source zoom changes (after PDFs have been rendered)
watch(sourceZoom, async () => {
  if (canCompare.value) {
    logger.log('Source zoom changed, waiting for re-render before comparison...')

    // Wait for PDFs to re-render at new zoom level
    await nextTick()

    const targetZoom = sourceZoom.value

    // Use readiness poller utility with zoom-specific condition
    const poller = useReadinessPoller({
      maxAttempts: 20,
      interval: 150,
      condition: () => {
        const leftReady = leftCanvasComponent.value?.isReady
        const rightReady = rightCanvasComponent.value?.isReady
        const leftZoom = leftCanvasComponent.value?.zoom
        const rightZoom = rightCanvasComponent.value?.zoom

        // Only ready when both canvases are at the target zoom level
        return leftReady && rightReady && leftZoom === targetZoom && rightZoom === targetZoom
      },
      onReady: () => {
        logger.log('Both canvases ready at target zoom, running comparison...')
        runComparison()
        // Update diff render zoom to match source zoom
        diffRenderZoom.value = sourceZoom.value
      },
      onTimeout: () => {
        logger.error('Canvases not ready at target zoom after maximum attempts')
      },
    })

    poller.start()
  }
})

// Re-render diff view when zoom changes (debounced)
watch(debouncedDiffZoom, async (newZoom) => {
  if (!canCompare.value) return

  // Calculate zoom delta to decide if re-render is needed
  const currentZoom = diffRenderZoom.value
  const zoomDelta = Math.abs(newZoom - currentZoom) / currentZoom
  const absoluteDelta = Math.abs(newZoom - currentZoom)

  // Skip re-render for small zoom changes (use CSS scaling instead)
  // Only re-render if zoom changed by >25% OR absolute diff >50 points
  if (zoomDelta > 0.25 || absoluteDelta > 50) {
    logger.log(
      'Significant zoom change (',
      zoomDelta.toFixed(2),
      'Δ), re-rendering at',
      newZoom,
      '%'
    )
    await recomputeDiffAtZoom(newZoom)
  } else {
    logger.log(
      'Small zoom change (',
      zoomDelta.toFixed(2),
      'Δ), using CSS scale only (no re-render)'
    )
    // diffZoom updates but diffRenderZoom stays the same
    // This maintains CSS transform in diffCanvasStyle until next significant zoom
  }
})

// Watch animation enabled state
watch(animationEnabled, (enabled) => {
  if (enabled) {
    startAnimation()
  } else {
    stopAnimation()
  }
})

// Watch animation speed changes
watch(animationSpeed, () => {
  if (animationEnabled.value) {
    // Restart animation with new speed
    startAnimation()
  }
})

// Export handler functions
const handleExport = async () => {
  if (!diffCanvas.value || !stats.value) {
    logger.warn('Cannot export: missing canvas or stats')
    return
  }

  isExporting.value = true
  exportSuccess.value = false

  try {
    const options: ExportOptions = {
      format: exportFormat.value,
      quality: exportQuality.value,
      includeMetadata: exportIncludeMetadata.value,
    }

    if (exportIncludeMetadata.value) {
      // Export with metadata overlay
      await exportCanvasWithMetadata(diffCanvas.value, options, {
        timestamp: new Date().toLocaleString(),
        mode: diffOptions.value.mode,
        differenceCount: stats.value.differenceCount,
        totalPixels: stats.value.totalPixels,
        percentDiff: stats.value.percentDiff,
        threshold: diffOptions.value.threshold,
        overlayOpacity: diffOptions.value.overlayOpacity,
      })
    } else {
      // Export canvas only (no metadata)
      await exportCanvas(diffCanvas.value, options)
    }

    exportSuccess.value = true
    logger.log('Export successful')

    // Reset success message after 3 seconds
    setTimeout(() => {
      exportSuccess.value = false
    }, 3000)
  } catch (error) {
    logger.error('Export failed:', error)
  } finally {
    isExporting.value = false
  }
}

const handleCopyToClipboard = async () => {
  if (!diffCanvas.value) {
    logger.warn('Cannot copy: missing canvas')
    return
  }

  copySuccess.value = false

  try {
    await copyCanvasToClipboard(diffCanvas.value)
    copySuccess.value = true
    logger.log('Copied to clipboard successfully')

    // Reset success message after 3 seconds
    setTimeout(() => {
      copySuccess.value = false
    }, 3000)
  } catch (error) {
    logger.error('Copy to clipboard failed:', error)
  }
}

// Trigger comparison on mount if files are already loaded
onMounted(async () => {
  if (canCompare.value) {
    logger.log('Component mounted with files already loaded, triggering comparison...')
    await nextTick()

    // Use readiness poller utility
    const poller = useReadinessPoller({
      condition: () => leftCanvasComponent.value?.isReady && rightCanvasComponent.value?.isReady,
      onReady: () => {
        logger.log('Both canvases ready on mount, running comparison...')
        runComparison()
      },
      onTimeout: () => {
        logger.warn('Canvases not ready after maximum attempts on mount')
      },
    })

    poller.start()
  }
})

// Clean up animation when component unmounts (prevent memory leaks)
onBeforeUnmount(() => {
  // Stop animation on unmount (cancels requestAnimationFrame)
  stopAnimation()

  // Release temp canvases back to the pool
  if (tempCanvas1.value) {
    releaseCanvas(tempCanvas1.value)
    tempCanvas1.value = null
  }
  if (tempCanvas2.value) {
    releaseCanvas(tempCanvas2.value)
    tempCanvas2.value = null
  }
})
</script>

<style scoped>
.canvas-wrapper {
  display: block;
  min-height: 200px;
  overflow: auto;
}

.canvas-wrapper canvas {
  display: block;
}

/* CSS-based animation for diff blinking (50% CPU reduction vs RAF) */
.canvas-animation-wrapper {
  position: relative;
  display: inline-block;
}

.animation-canvas {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  /* GPU acceleration for better performance */
  will-change: opacity;
  transform: translateZ(0);
}

.animation-canvas.animation-visible {
  opacity: 1;
  position: relative;
}

/* Ensure single canvas (no animation) displays correctly */
.canvas-animation-wrapper > canvas:only-child {
  position: relative;
  opacity: 1;
}
</style>
