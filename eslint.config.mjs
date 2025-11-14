// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt({
  features: {
    typescript: true,
    stylistic: false, // Disable overly strict stylistic rules
  },
}).append(
  // Your custom configs here
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.vue'],
    rules: {
      // Customize rules as needed
      'no-console': 'warn', // Warn on console.log (good for production)
      '@typescript-eslint/no-explicit-any': 'warn',
      'vue/multi-word-component-names': 'off', // Allow single-word component names
      'vue/no-multiple-template-root': 'off', // Allow multiple template roots (Vue 3)
      'vue/max-attributes-per-line': 'off', // Allow multiple attributes per line
      'vue/singleline-html-element-content-newline': 'off', // Allow inline content
      'vue/html-self-closing': 'off', // Don't require self-closing tags
    }
  }
)
