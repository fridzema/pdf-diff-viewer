# PDF Diff Viewer

A simple proof-of-concept web application built with Nuxt 3, TailwindCSS, and PDF.js that allows users to upload two PDF files and visually compare them.

## Features

- **Upload Two PDF Files**: Drag-and-drop or browse to select PDF files
- **Visual Comparison**: Side-by-side view of both PDFs plus a difference canvas
- **Multiple Comparison Modes**:
  - **Pixel Difference**: Highlights all different pixels in red
  - **Threshold Mode**: Only highlights pixels that differ beyond a configurable threshold
  - **Grayscale Diff**: Converts to grayscale before comparing
  - **Color Overlay**: Blends both PDFs with red highlights for differences
  - **Heatmap**: Shows difference intensity with color gradient (blue → red)
- **Configurable Options**:
  - Sensitivity threshold slider
  - Overlay opacity control
  - Grayscale conversion toggle
- **Real-Time Statistics**: View pixel counts and percentage differences
- **Client-Side Processing**: Everything runs in your browser - no backend required

## Tech Stack

- **Nuxt 3**: Vue.js framework with server-side rendering
- **TypeScript**: Type-safe development
- **TailwindCSS**: Utility-first CSS framework
- **PDF.js**: Mozilla's PDF rendering library
- **Bun**: Fast JavaScript runtime and package manager

## Project Structure

```
pdf-diff/
├── assets/
│   └── css/
│       └── main.css              # TailwindCSS imports
├── components/
│   ├── PdfUploader.vue           # File upload with drag-and-drop
│   ├── PdfCanvas.vue             # PDF to canvas renderer
│   └── PdfDiff.vue               # Main comparison component
├── composables/
│   ├── usePdfRenderer.ts         # PDF rendering logic
│   └── usePdfDiff.ts             # Diff algorithm implementations
├── pages/
│   └── index.vue                 # Main application page
├── app.vue                       # Root component
├── nuxt.config.ts                # Nuxt configuration
├── tailwind.config.js            # TailwindCSS configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed on your system

### Installation

1. Clone or navigate to the project directory:
```bash
cd pdf-diff
```

2. Install dependencies:
```bash
bun install
```

### Development

Start the development server:

```bash
bun run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

Build the application for production:

```bash
bun run build
```

Preview the production build:

```bash
bun run preview
```

## Usage

1. **Upload PDFs**:
   - Click "Choose File" or drag-and-drop two PDF files into the upload areas
   - Only the first page of each PDF will be rendered

2. **Adjust Settings**:
   - Select a comparison mode from the dropdown
   - Adjust the sensitivity threshold slider
   - For overlay mode, adjust the opacity slider
   - Toggle grayscale conversion if needed

3. **View Results**:
   - The difference canvas shows the comparison result
   - Statistics show the number of different pixels and percentage difference
   - Red highlights indicate differences (exact visualization depends on selected mode)

## Comparison Modes Explained

### Pixel Difference
Compares each pixel exactly. Any difference is highlighted in red. Most strict mode.

### Threshold Mode
Only highlights pixels where the color difference exceeds the threshold value. Useful for ignoring minor anti-aliasing differences.

### Grayscale Diff
Converts both PDFs to grayscale before comparing. Useful when you only care about structural differences, not color changes.

### Color Overlay
Blends both PDFs together, with differences highlighted in red with adjustable opacity. Good for seeing what's changed while maintaining context.

### Heatmap
Shows difference intensity using a color gradient (blue for identical, red for very different). Best for visualizing the degree of difference across the document.

## Limitations

- Only compares the first page of each PDF
- No multi-page support
- Files must be under 50MB
- Basic error handling
- Comparison happens entirely in browser (may be slow for large PDFs)

## Technical Notes

- PDF.js worker is loaded from CDN for simplicity
- Canvas pixel comparison is performed synchronously
- The scale factor for PDF rendering is set to 1.5 for good quality
- All comparison algorithms process pixel data in RGBA format

## Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas
- File API
- ES6+ JavaScript
- WebAssembly (for PDF.js)

## Future Enhancements

Potential improvements for this proof-of-concept:
- Multi-page comparison support
- Export diff results as images
- Zoom and pan controls
- More comparison algorithms
- Performance optimizations for large PDFs
- Undo/redo for settings changes
- Side-by-side synced scrolling

## License

This is a proof-of-concept project for demonstration purposes.

## Credits

- Built with [Nuxt 3](https://nuxt.com/)
- PDF rendering by [PDF.js](https://mozilla.github.io/pdf.js/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
