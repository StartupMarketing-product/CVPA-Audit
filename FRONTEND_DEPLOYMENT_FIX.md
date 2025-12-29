# Frontend Deployment Fix - HTML Response Issue

## Problem
Frontend deployed on Netlify is receiving HTML (`<!doctype`) instead of JSON from API calls, causing `SyntaxError: Unexpected token '<'`.

## Root Cause
The deployed frontend build is using **relative URLs** (`/api/v1/...`) instead of the full backend URL (`https://cvpa-backend.onrender.com/api/v1/...`). This happens when:

1. **`VITE_API_URL` environment variable is not set in Netlify**, so it defaults to `http://localhost:3001/api/v1`
2. **The frontend build is outdated** and doesn't include the latest code that uses `apiClient` properly

## Solution

### Step 1: Set Environment Variable in Netlify

1. Go to Netlify Dashboard → Your Site → **Site settings** → **Environment variables**
2. Add a new variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://cvpa-backend.onrender.com/api/v1`
3. **Save** the variable

### Step 2: Trigger a New Build

After setting the environment variable, Netlify should automatically trigger a new build. If not:

1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Wait for the build to complete

### Step 3: Verify the Build

After deployment, check:

1. **Browser Console**: Should see requests going to `https://cvpa-backend.onrender.com/api/v1/...` instead of relative URLs
2. **Network Tab**: Check the actual request URLs in DevTools → Network tab
3. **No more HTML errors**: The `SyntaxError: Unexpected token '<'` should be gone

## Verification

After fixing, the frontend should:
- ✅ Make API calls to `https://cvpa-backend.onrender.com/api/v1/companies/...`
- ✅ Receive JSON responses (not HTML)
- ✅ Display gap analysis correctly
- ✅ Load audits successfully

## Current Status

- ✅ Source code is correct (uses `apiClient` with `VITE_API_URL`)
- ❌ Netlify environment variable likely missing or incorrect
- ❌ Frontend build may be outdated

## Next Steps

1. Set `VITE_API_URL=https://cvpa-backend.onrender.com/api/v1` in Netlify
2. Trigger a new build
3. Test the application
4. Check browser console for the new error messages (should show better diagnostics)
