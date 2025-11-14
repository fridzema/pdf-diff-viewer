# DigitalOcean 404 Error Fix

## Problem

Your app is returning 404 errors because the app spec is missing critical configuration.

## Current Issues in Your App Spec

❌ **Missing**: `build_command` - DigitalOcean doesn't know how to build
❌ **Missing**: `output_dir` - Doesn't know where built files are
❌ **Missing**: `error_document` - No SPA fallback routing
⚠️ **Wrong**: Path prefix `/pdf-diff-viewer2` instead of root `/`

## Solution: Update App Spec

### Method 1: Using DigitalOcean UI (Easiest)

1. **Go to your app**: https://cloud.digitalocean.com/apps
   - Select app: **pdf-diff**

2. **Open App Spec Editor**:
   - Click **Settings** (left sidebar)
   - Click **App Spec**
   - Click **Edit**

3. **Replace entire spec** with contents of `digitalocean-app-spec.yaml`
   - Copy the entire file
   - Paste into the editor (replace all existing content)

4. **Save and Deploy**:
   - Click **Save**
   - Click **Deploy** (or auto-deploy will trigger)

### Method 2: Using doctl CLI

```bash
# Get your app ID
doctl apps list

# Update the app spec
doctl apps update YOUR-APP-ID --spec digitalocean-app-spec.yaml

# Trigger deployment
doctl apps create-deployment YOUR-APP-ID
```

## Key Configuration Changes

### Added Build Configuration

```yaml
build_command: npm install && npm run copy-worker && npm run generate
output_dir: .output/public
```

### Added SPA Fallback (Fixes 404)

```yaml
error_document: index.html
```

### Fixed Routing (Serve from Root)

```yaml
routes:
  - path: /
```

Note: Component-level `routes` and app-level `ingress` are mutually exclusive. We use component routes for simplicity.

## After Applying

1. **Wait for build** (3-5 minutes)
2. **Check deployment logs** for any errors
3. **Visit your app URL** - should now work without 404!

## Troubleshooting

### Build Still Fails?

Check the build logs in DigitalOcean console for specific errors.

### Still Getting 404?

1. Verify `error_document: index.html` is in the spec
2. Check that `output_dir: .output/public` is correct
3. Ensure path prefix is `/` not `/pdf-diff-viewer2`

### Build Succeeds but Blank Page?

Check browser console for JavaScript errors - might be asset path issues.
