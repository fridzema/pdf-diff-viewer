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
        <div v-if="activeTab === 0">
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
        <div v-if="activeTab === 1">
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
        <div v-if="activeTab === 2">
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

        <!-- Canvas with magnifier (if enabled) -->
        <PdfMagnifier
          v-if="magnifierEnabled"
          :canvas="diffCanvas"
          :magnification="magnifierZoom"
          :size="magnifierSize"
          :enabled="magnifierEnabled"
        >
          <canvas ref="diffCanvas" :style="diffCanvasStyle"></canvas>
        </PdfMagnifier>

        <!-- Canvas without magnifier -->
        <canvas v-else ref="diffCanvas" :style="diffCanvasStyle"></canvas>
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
import { logger } from '~/utils/logger'
import type { DiffMode, DiffOptions } from '~/composables/usePdfDiff'
import type { NormalizationStrategy } from '~/composables/usePdfNormalization'
import { usePdfNormalization } from '~/composables/usePdfNormalization'
import type { ExportFormat, ExportOptions } from '~/composables/useCanvasExport'
import { useCanvasExport } from '~/composables/useCanvasExport'
import type { PdfMetadata } from '~/composables/usePdfMetadata'

const props = defineProps<{
  leftFile: File | null
  rightFile: File | null
  leftMetadata?: PdfMetadata | null
  rightMetadata?: PdfMetadata | null
}>()

const leftCanvasComponent = ref<any>(null)
const rightCanvasComponent = ref<any>(null)
const diffCanvas = ref<HTMLCanvasElement | null>(null)

const { comparePdfsAsync } = usePdfDiffWorker()
const { renderPdfToCanvas } = usePdfRenderer()
const { calculateNormalizedDimensions } = usePdfNormalization()
const { exportCanvas, exportCanvasWithMetadata, copyCanvasToClipboard } = useCanvasExport()

// Reusable temp canvases for diff recomputation (Phase 1.2 optimization)
const tempCanvas1 = ref<HTMLCanvasElement>(document.createElement('canvas'))
const tempCanvas2 = ref<HTMLCanvasElement>(document.createElement('canvas'))

// Zoom state management
const sourceZoom = ref(100) // Synced zoom for both source PDFs (100% = 1.0 scale)
const diffZoom = ref(100) // Independent zoom for difference view
const diffRenderZoom = ref(100) // Actual rendered zoom of diff canvas
const isRecomputingDiff = ref(false)

// Timeout tracking for cleanup (prevent memory leaks)
const pollingTimeoutId = ref<number | null>(null)
const zoomTimeoutId = ref<number | null>(null)

// Debounce diff zoom for smart re-rendering
const debouncedDiffZoom = useDebounce(
  computed(() => diffZoom.value),
  500
)

// Track if diff zoom is in debounce period (for CSS-scale fallback)
const isDiffDebouncing = computed(() => diffZoom.value !== debouncedDiffZoom.value)

// Scroll sync state
const syncPanningEnabled = ref(true)

// Collapsible source PDFs state (open by default)
const sourcePdfsExpanded = ref(true)

// Collapsible sections state
const advancedSettingsExpanded = ref(false)
const exportExpanded = ref(false)

// Active tab for tabbed interface (0 = Settings, 1 = Results, 2 = Metadata)
const activeTab = ref(0)

// Swipe mode state
const swipeModeEnabled = ref(false)

// Magnifier state
const magnifierEnabled = ref(false)
const magnifierZoom = ref(2.5)
const magnifierSize = ref(200)

// Animation state
const animationEnabled = ref(false)
const animationSpeed = ref(500) // milliseconds
const showingDiff = ref(true)
const animationIntervalId = ref<number | null>(null)
const diffImageData = ref<Uint8ClampedArray | null>(null)
const originalImageData = ref<Uint8ClampedArray | null>(null)
const canvasWidth = ref(0)
const canvasHeight = ref(0)

// Normalization state
const normalizationStrategy = ref<NormalizationStrategy>({
  type: 'largest',
  alignment: 'top-left',
  backgroundColor: '#ffffff',
  scaleToFit: false,
})

const dimensionInfo = ref<{
  canvas1: { width: number; height: number }
  canvas2: { width: number; height: number }
  targetWidth: number
  targetHeight: number
} | null>(null)

const diffOptions = ref<DiffOptions>({
  mode: 'pixel',
  threshold: 10,
  overlayOpacity: 0.5,
  useGrayscale: false,
})

// Export state
const exportFormat = ref<ExportFormat>('png')
const exportQuality = ref(0.95) // JPEG quality (0-1)
const exportIncludeMetadata = ref(true)
const isExporting = ref(false)
const exportSuccess = ref(false)
const copySuccess = ref(false)

const stats = ref<{
  differenceCount: number
  totalPixels: number
  percentDiff: number
} | null>(null)

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

// Animation control functions
const startAnimation = () => {
  if (!diffImageData.value || !originalImageData.value || !diffCanvas.value) {
    logger.warn('Cannot start animation: missing image data or canvas')
    return
  }

  // Clear any existing interval
  stopAnimation()

  logger.log('Starting blink animation at', animationSpeed.value, 'ms interval')

  // Create the animation interval
  animationIntervalId.value = setInterval(() => {
    if (!diffCanvas.value) return

    const ctx = diffCanvas.value.getContext('2d')
    if (!ctx) return

    // Toggle between showing diff and original
    showingDiff.value = !showingDiff.value

    const dataToShow = showingDiff.value ? diffImageData.value : originalImageData.value
    if (dataToShow) {
      const imageData = new ImageData(dataToShow, canvasWidth.value, canvasHeight.value)
      ctx.putImageData(imageData, 0, 0)
    }
  }, animationSpeed.value) as unknown as number
}

const stopAnimation = () => {
  if (animationIntervalId.value !== null) {
    clearInterval(animationIntervalId.value)
    animationIntervalId.value = null
    logger.log('Stopped blink animation')
  }

  // Ensure we're showing the diff data when animation stops
  if (diffImageData.value && diffCanvas.value) {
    showingDiff.value = true
    const ctx = diffCanvas.value.getContext('2d')
    if (ctx && canvasWidth.value > 0 && canvasHeight.value > 0) {
      try {
        const imageData = new ImageData(diffImageData.value, canvasWidth.value, canvasHeight.value)
        ctx.putImageData(imageData, 0, 0)
      } catch (err) {
        logger.error('Failed to restore diff canvas:', err)
      }
    }
  }
}

// Recompute diff at a specific zoom level (re-renders PDFs at new resolution)
const recomputeDiffAtZoom = async (targetZoom: number) => {
  if (isRecomputingDiff.value || !canCompare.value) return

  isRecomputingDiff.value = true

  // Stop animation before recomputing
  stopAnimation()

  try {
    logger.log('Recomputing diff at zoom:', targetZoom)

    const scale = targetZoom / 100

    // Render both PDFs at the target zoom level (reusing temp canvases)
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

    // Store both image data arrays for animation
    diffImageData.value = result.diffData
    originalImageData.value = result.originalData
    canvasWidth.value = diffCanvas.value!.width
    canvasHeight.value = diffCanvas.value!.height

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

    // Store both image data arrays for animation
    diffImageData.value = result.diffData
    originalImageData.value = result.originalData
    canvasWidth.value = diffCanvas.value.width
    canvasHeight.value = diffCanvas.value.height

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
  async (canNowCompare, oldValue) => {
    logger.log('watch(canCompare) triggered:', { canNowCompare, oldValue })
    if (canNowCompare) {
      logger.log('Both files available, waiting for canvases to be ready...')

      // Wait for next tick to ensure component updates
      await nextTick()

      // Poll for canvas readiness (max 10 attempts, 200ms each = 2 seconds)
      let attempts = 0
      const maxAttempts = 10

      const checkAndRun = () => {
        const leftReady = leftCanvasComponent.value?.isReady
        const rightReady = rightCanvasComponent.value?.isReady

        logger.log(`Canvas readiness check (attempt ${attempts + 1}/${maxAttempts}):`, {
          leftReady,
          rightReady,
        })

        if (leftReady && rightReady) {
          logger.log('Both canvases ready, running initial comparison...')
          runComparison()
          pollingTimeoutId.value = null
        } else if (attempts < maxAttempts) {
          attempts++
          // Clear previous timeout and set new one
          if (pollingTimeoutId.value) clearTimeout(pollingTimeoutId.value)
          pollingTimeoutId.value = setTimeout(checkAndRun, 200) as unknown as number
        } else {
          logger.error('Canvases not ready after', maxAttempts, 'attempts')
          pollingTimeoutId.value = null
        }
      }

      checkAndRun()
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

    // Clear previous timeout to avoid race conditions
    if (zoomTimeoutId.value) clearTimeout(zoomTimeoutId.value)

    // Poll for canvas readiness to ensure both canvases have finished re-rendering
    // at the new zoom level before running comparison
    let attempts = 0
    const maxAttempts = 20 // 20 * 150ms = 3 seconds max wait
    const targetZoom = sourceZoom.value

    const checkAndRunComparison = () => {
      const leftReady = leftCanvasComponent.value?.isReady
      const rightReady = rightCanvasComponent.value?.isReady
      const leftZoom = leftCanvasComponent.value?.zoom
      const rightZoom = rightCanvasComponent.value?.zoom

      logger.log(`Canvas readiness check after zoom (attempt ${attempts + 1}/${maxAttempts}):`, {
        leftReady,
        rightReady,
        leftZoom,
        rightZoom,
        targetZoom,
      })

      // Only run comparison when:
      // 1. Both canvases are ready (rendered)
      // 2. Both canvases are at the target zoom level
      if (leftReady && rightReady && leftZoom === targetZoom && rightZoom === targetZoom) {
        logger.log('Both canvases ready at target zoom, running comparison...')
        runComparison()
        // Update diff render zoom to match source zoom
        diffRenderZoom.value = sourceZoom.value
        zoomTimeoutId.value = null
      } else if (attempts < maxAttempts) {
        attempts++
        zoomTimeoutId.value = setTimeout(checkAndRunComparison, 150) as unknown as number
      } else {
        logger.error('Canvases not ready at target zoom after', maxAttempts, 'attempts')
        zoomTimeoutId.value = null
      }
    }

    // Start polling for canvas readiness
    checkAndRunComparison()
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

// Watch magnifier toggle to restore canvas content
watch(magnifierEnabled, async () => {
  // When magnifier is toggled, the canvas element is recreated due to v-if/v-else
  // We need to restore the diff data to the new canvas element
  await nextTick() // Wait for DOM update

  if (diffImageData.value && diffCanvas.value && canvasWidth.value > 0 && canvasHeight.value > 0) {
    const ctx = diffCanvas.value.getContext('2d')
    if (ctx) {
      try {
        // Restore canvas dimensions
        diffCanvas.value.width = canvasWidth.value
        diffCanvas.value.height = canvasHeight.value

        // Restore the diff image data
        const imageData = new ImageData(diffImageData.value, canvasWidth.value, canvasHeight.value)
        ctx.putImageData(imageData, 0, 0)
        logger.log('Restored diff canvas after magnifier toggle')
      } catch (err) {
        logger.error('Failed to restore diff canvas after magnifier toggle:', err)
      }
    }
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

    // Wait for canvases to be ready
    let attempts = 0
    const maxAttempts = 10

    const checkAndRun = () => {
      const leftReady = leftCanvasComponent.value?.isReady
      const rightReady = rightCanvasComponent.value?.isReady

      logger.log(`Canvas readiness check on mount (attempt ${attempts + 1}/${maxAttempts}):`, {
        leftReady,
        rightReady,
      })

      if (leftReady && rightReady) {
        logger.log('Both canvases ready on mount, running comparison...')
        runComparison()
      } else if (attempts < maxAttempts) {
        attempts++
        setTimeout(checkAndRun, 200)
      } else {
        logger.warn('Canvases not ready after', maxAttempts, 'attempts on mount')
      }
    }

    checkAndRun()
  }
})

// Clean up timeouts and animation when component unmounts (prevent memory leaks)
onBeforeUnmount(() => {
  if (pollingTimeoutId.value) {
    clearTimeout(pollingTimeoutId.value)
    pollingTimeoutId.value = null
  }
  if (zoomTimeoutId.value) {
    clearTimeout(zoomTimeoutId.value)
    zoomTimeoutId.value = null
  }
  // Stop animation on unmount
  stopAnimation()
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
</style>
