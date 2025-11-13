Task:

Build a simple proof-of-concept web application using Nuxt 3 and TailwindCSS that allows a user to upload two PDF files and visually compare them.

Requirements:

Provide two file upload inputs for PDF files.

Use PDF.js to render page 1 of each uploaded PDF to a <canvas>.

Display the two rendered canvases side by side.

Implement a basic diff mode:

Compare the two canvases pixel-by-pixel.

Create a third canvas that highlights differences (e.g., red pixels).

Keep the UI simple:

Two upload fields

A preview area with three canvases: left, right, diff

Use TailwindCSS for basic styling.

Technical details:

Use Nuxt 3 with the Composition API.

Load and use PDF.js inside the project.

Perform the diff entirely client-side using canvas pixel data.

The diff algorithm can be very basic (simple pixel comparison, no optimizations needed).

Scope limitations:

Only render and compare page 1 (no multi-page support needed).

No backend — everything must run in the browser.

Minimal error handling is fine.

Deliverables:

A working Nuxt project structure.

Components for uploading, rendering, and diffing the PDFs.

TailwindCSS styling applied.

Short instructions on how to run the app locally.
