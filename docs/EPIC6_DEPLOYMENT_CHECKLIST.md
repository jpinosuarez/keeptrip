# EPIC 6: Production & Domain Setup — Deployment Checklist

**Version:** 1.0  
**Date:** April 10, 2026  
**Status:** Ready for Execution  
**Target:** Production deployment of Keeptrip PWA to custom domain

---

## 🎯 Overview

This document provides step-by-step instructions for deploying the Keeptrip PWA to production with full API security hardening. All cloud infrastructure, DNS, and authentication settings must be configured before going live.

**Prerequisites:**
- Firebase project admin access
- Mapbox account with API token management privileges
- Google Cloud project linked to Firebase
- Registered custom domain (DNS control)
- Git repository updated with security fixes (storage.rules updated)

---

## Phase 1: Firebase Hosting & Custom Domain Setup

### Step 1.1: Deploy to Firebase Hosting + Rules

1. **Ensure `storage.rules` is committed with cross-service Firestore allowlist:**
   ```bash
   cd /path/to/keeptrip
   git status
   # Verify storage.rules shows the updated isCuracionAdmin() function
   ```

2. **Build the production PWA:**
   ```bash
   npm run build
   ```

3. **Deploy production bundle + security rules:**
   ```bash
   npm run deploy:prod
   ```

   This command deploys Hosting, Firestore rules, and Storage rules in one rollout.

   Expected output:
   ```
   ✔ Deploy complete!
   
   Project Console: https://console.firebase.google.com/project/keeptrip-app-b06b3
   Hosting URL: https://keeptrip-app-b06b3.web.app
   ```

4. **Verify the app loads correctly at the temporary Firebase URL:**
   - Visit: `https://keeptrip-app-b06b3.web.app`
   - Check that all pages load, maps render, and authentication works
   - Verify PWA install prompt appears on mobile browsers

---

### Step 1.2: Connect Custom Domain to Firebase Hosting

1. **Open Firebase Console:**
   - Navigate to: [https://console.firebase.google.com](https://console.firebase.google.com)
   - Select project: `keeptrip-app-b06b3`

2. **Go to Hosting:**
   - Left sidebar → **Hosting** → **Domains**

3. **Add custom domain:**
   - Click **"Connect domain"** button
   - Enter your custom domain (e.g., `keeptrip.com` or `app.keeptrip.com`)
   - Follow the on-screen instructions

4. **Configure DNS records:**
   Firebase will provide DNS records to add. There are two options:

   **Option A: Direct A Record (Recommended for simplicity)**
   - Firebase displays the IP address for the A record
   - Add to your DNS provider (GoDaddy, Namecheap, Route53, Cloudflare, etc.):
     ```
     Type: A
     Name: @ (or your subdomain)
     Value: 35.184.79.123 (example IP from Firebase)
     TTL: 1 hour (or default)
     ```
   - Wait for DNS propagation (typically 5-30 minutes)

   **Option B: CNAME Record (If using Firebase's subdomain)**
   - Firebase provides a CNAME target
   - Add to DNS:
     ```
     Type: CNAME
     Name: www (or your subdomain)
     Value: keeptrip-app-b06b3.web.app
     TTL: 1 hour
     ```

5. **Verify domain ownership (if prompted):**
   - Firebase may require a TXT record for verification
   - Add the provided TXT record to your DNS:
     ```
     Type: TXT
     Name: @ (or as specified by Firebase)
     Value: [verification-code-from-firebase]
     ```

6. **Wait for certificate provisioning:**
   - Firebase automatically provisions SSL/TLS certificate (Let's Encrypt)
   - Status shows "Pending" → "Connected" (typically 24 hours)
   - HTTPS is automatically enabled once certificate is ready

7. **Test domain access:**
   ```bash
   # Verify domain resolves
   nslookup keeptrip.com
   
   # Test HTTPS connection
   curl -I https://keeptrip.com
   # Expected: HTTP/2 200 with "Strict-Transport-Security" header
   ```

---

## Phase 2: Google Cloud Firebase API Security

### Step 2.1: Restrict Firebase API Key (VITE_FIREBASE_API_KEY)

**Background:**  
The `VITE_FIREBASE_API_KEY` is exposed in your frontend bundle but can be restricted to specific HTTP referrers. This prevents API key abuse from other domains or mobile apps.

1. **Open Google Cloud Console:**
   - Navigate to: [https://console.cloud.google.com](https://console.cloud.google.com)
   - Select project: `keeptrip-app-b06b3`

2. **Go to API Credentials:**
   - Left sidebar → **APIs & Services** → **Credentials**

3. **Find the Firebase Web API Key:**
   - Look for the key that matches your `VITE_FIREBASE_API_KEY` from `.env.local`
   - It will be labeled as "API key" with type "Public"

4. **Click on the key to edit it:**
   - Click the key name or pencil icon

5. **Configure Application Restrictions:**
   - Section: **Application restrictions**
   - Select: **HTTP referrers (web sites)**

6. **Add allowed referrers:**
   In the **Website restrictions** field, add the following patterns (one per line):
   ```
   https://keeptrip.com/*
   https://www.keeptrip.com/*
   https://app.keeptrip.com/*
   http://localhost:5173/*
   http://localhost:3000/*
   ```

   **Important Notes:**
   - Include trailing `/*` to match all paths under the domain
   - Add both `https://` and `http://` variants for staging
   - If using Firebase preview URLs for testing, also add:
     ```
     https://keeptrip-app-b06b3.web.app/*
     ```

7. **Configure API Restrictions (Optional but Recommended):**
   - Section: **API restrictions**
   - Select: **Restrict key**
   - Choose only the APIs your app uses:
     - ✓ Cloud Firestore API
     - ✓ Firebase Authentication API
     - ✓ Firebase Cloud Storage API
     - ✓ Firebase Realtime Database API (if used)
     - ✗ Uncheck others to minimize attack surface

8. **Save changes:**
   - Click **"Save"** button
   - Changes take effect within 5 minutes

9. **Test from restricted referrer:**
   ```bash
   # Test from your production domain
   curl -H "Referer: https://keeptrip.com/trips" \
     "https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyAssertion?key=[YOUR_KEY]"
   ```

---

## Phase 3: Mapbox Token Security

### Step 3.1: Restrict Mapbox Token to Production URLs

**Background:**  
Your `VITE_MAPBOX_TOKEN` is a Mapbox public token and can be restricted to specific URL referrers to prevent usage from unauthorized domains.

1. **Open Mapbox Account:**
   - Navigate to: [https://account.mapbox.com/access-tokens/](https://account.mapbox.com/access-tokens/)
   - Log in to your Mapbox account

2. **Find your token:**
   - Look for the token starting with `pk.eyJ...`
   - This is your `VITE_MAPBOX_TOKEN`

3. **Click on the token to edit:**
   - Click the token name or the pencil icon

4. **Configure URL Restrictions:**
   - Section: **URL Restrictions**
   - Toggle: **Enable Restricted URLs** (if not already enabled)

5. **Add allowed URLs:**
   In the URL patterns field, add:
   ```
   https://keeptrip.com
   https://www.keeptrip.com
   https://app.keeptrip.com
   http://localhost:5173
   http://localhost:3000
   ```

   **Important Notes:**
   - Do NOT include `/*` wildcards in Mapbox (unlike Google Cloud)
   - Add only base domains, not paths
   - For subdomains, add each separately or use wildcard if Mapbox supports it (e.g., `*.keeptrip.com`)

6. **Configure Scope (if available in your tier):**
   - Section: **Tokens** or **Scopes**
   - Ensure the token has these permissions:
     - ✓ Read public data
     - ✓ Read tiles and raster data
     - ✓ Map Session API access (for interactive maps)

7. **Save changes:**
   - Click **"Save"** button
   - Changes take effect within 5-10 minutes

8. **Test from restricted referrer:**
   ```bash
   # Open your domain in browser and check Network tab in DevTools
   # Mapbox API calls should succeed
   # Requests from unauthorized domains should receive 403 Unauthorized
   ```

---

## Phase 4: Firebase Authentication — Authorized Domains

### Step 4.1: Add Custom Domain to Authorized Domains List

**Background:**  
Firebase Authentication has a strict list of authorized domains to prevent token hijacking. Your production domain must be added.

1. **Open Firebase Console:**
   - Navigate to: [https://console.firebase.google.com](https://console.firebase.google.com)
   - Select project: `keeptrip-app-b06b3`

2. **Go to Authentication:**
   - Left sidebar → **Authentication** → **Settings**

3. **Find the Authorized domains section:**
   - Scroll down to: **Authorized domains**

4. **Add your production domain:**
   - Click **"Add domain"** button
   - Enter your domain(s):
     ```
     keeptrip.com
     www.keeptrip.com
     app.keeptrip.com
     ```
   - If using subdomains, add each separately

5. **Keep these pre-existing entries:**
   - `localhost` (for local development)
   - `keeptrip-app-b06b3.web.app` (Firebase hosting preview)

6. **Save:**
   - Changes take effect immediately

7. **Verify authentication works:**
   - Visit your production domain
   - Sign up or log in with a test account
   - Confirm that redirect URIs work and no "domain not authorized" errors appear

---

## Phase 5: Firestore Admin Allowlist Setup

### Step 5.1: Create Admins Collection (Manual)

**Background:**  
Your updated `storage.rules` now checks if the user exists in `/admins/{uid}` instead of using hardcoded emails. Create this collection manually in Firestore.

1. **Open Firebase Console:**
   - Navigate to: [https://console.firebase.google.com](https://console.firebase.google.com)
   - Select project: `keeptrip-app-b06b3`

2. **Go to Firestore Database:**
   - Left sidebar → **Firestore Database**

3. **Create a new collection:**
   - Click **"+ Create collection"** or **"Start collection"** (if empty)
   - Collection ID: `admins`

4. **Add admin documents:**
   - For each admin user, add a new document:
   - Document ID: `[USER_UID]` (the Firebase user's UID, e.g., `abc123def456`)
   - Fields:
     ```
     Field name: email
     Type: String
     Value: pinosuarezjoaquin@gmail.com
     
     Field name: role
     Type: String
     Value: curator
     
     Field name: createdAt
     Type: Timestamp
     Value: (auto-set to current time)
     ```

   Example documents:
   ```
   /admins/uid-joaquin-pinos/
   ├── email: "pinosuarezjoaquin@gmail.com"
   ├── role: "curator"
   └── createdAt: 2026-04-10T...

   /admins/uid-second-admin/
   ├── email: "second.admin@keeptrip.com"
   ├── role: "curator"
   └── createdAt: 2026-04-10T...
   ```

5. **Verify security rules:**
   - The `/admins/` collection is NOT exposed via Firestore rules (intentionally hidden)
   - Only the Storage rules read from it via cross-service query
   - Users cannot query or modify `/admins/` directly

---

## Phase 6: Pre-Launch Security Verification

### Step 6.1: Validate All Restrictions

Run these tests before allowing public access:

1. **Test Firebase API Key restriction:**
   ```bash
   # Should work from authorized domain
   curl -H "Referer: https://keeptrip.com" \
     "https://www.googleapis.com/[...]/test"
   
   # Should fail (403 Forbidden) from unauthorized domain
   curl -H "Referer: https://malicious-site.com" \
     "https://www.googleapis.com/[...]/test"
   ```

2. **Test Mapbox token restriction:**
   - Open browser DevTools → Network tab
   - Visit your production domain
   - Look for Mapbox API calls (to `api.mapbox.com`)
   - Verify calls succeed (status 200)
   - Try accessing token from another domain (should fail)

3. **Test Firestore security rules:**
   ```bash
   # From Firebase Console, test rules with mock data
   # Simulate a non-owner trying to read another user's trip
   # Expected: "Request denied" message
   
   # Simulate the owner accessing their own trip
   # Expected: "Request allowed" message
   ```

4. **Test Storage security rules:**
   - Attempt to upload a non-image file (e.g., `.exe`, `.zip`)
   - Expected: Upload blocked with "format not allowed" error
   - Attempt to upload image > 5 MB
   - Expected: "File too large" error
   - Normal image upload should succeed

5. **Test admin curation access:**
   - Log in as a non-admin user
   - Try to upload to `/curated/` directory
   - Expected: Upload denied (user not in admins allowlist)
   - Add user to `/admins/` collection
   - Retry upload
   - Expected: Upload succeeds

6. **Test domain authentication:**
   - Visit `https://keeptrip.com`
   - Log in with email/password
   - Expected: Google redirects to your domain (no "domain not authorized" error)
   - Check redirect_uri matches authorized domains list

---

## Phase 7: Monitoring & Incident Response

### Step 7.1: Enable Cloud Audit Logging

1. **Open Google Cloud Console:**
   - [https://console.cloud.google.com](https://console.cloud.google.com)
   - Select project: `keeptrip-app-b06b3`

2. **Go to Audit Logs:**
   - Left sidebar → **Logging** → **Audit Logs**

3. **Ensure these audit logs are enabled:**
   - Admin Activity (default, always on)
   - Data Access (optional, generates more logs)
   - System Event (optional)

4. **Create alerts for suspicious activity:**
   - Go to **Logs-based Metrics**
   - Create metric for: Failed authentication attempts
   - Create alert when metric threshold is exceeded

### Step 7.2: Set Up Firestore Monitoring

1. **Open Firebase Console:**
   - [https://console.firebase.google.com](https://console.firebase.google.com)

2. **Go to Firestore → Monitoring (if available):**
   - Monitor read/write throughput
   - Alert on unusual access patterns

---

## Phase 8: Post-Deployment Verification

### Step 8.1: Live Checklist

After deployment, verify all functions work end-to-end:

- [ ] **Domain resolves:** `nslookup keeptrip.com` returns correct IP
- [ ] **HTTPS works:** `https://keeptrip.com` loads without certificate errors
- [ ] **PWA installs:** Mobile browser shows install prompt
- [ ] **Sign-up works:** Create new user, receive verification email
- [ ] **Authentication:** Login/logout/session persistence all work
- [ ] **Maps load:** Mapbox tiles render without errors
- [ ] **Image upload:** Users can upload trip photos
- [ ] **Firestore read/write:** Real-time data sync works
- [ ] **Admin curation:** Admin-only features still work
- [ ] **Offline mode:** Service Worker caches assets and PWA works offline
- [ ] **API keys restricted:** Unauthorized domain requests are blocked
- [ ] **CORS headers:** Requests from other domains are blocked

---

## Phase 9: Rollback Plan

If critical issues arise in production:

1. **Immediate: Block traffic to custom domain**
   - Point DNS A record back to old server (if applicable)
   - Or set up quick redirect to version on `keeptrip-app-b06b3.web.app`

2. **Short-term: Revert storage.rules**
   ```bash
   git revert [commit-with-storage-rules-update]
   firebase deploy --only firestore:rules,storage
   ```

3. **Medium-term: Investigate & fix**
   - Check Cloud Audit Logs for errors
   - Review Firestore Console for data conflicts
   - Test fixes in staging environment first

4. **Long-term: Post-mortem**
   - Document what went wrong
   - Update deployment checklist
   - Add additional automated tests

---

## Support & Documentation References

- **Firebase Hosting:** [https://firebase.google.com/docs/hosting](https://firebase.google.com/docs/hosting)
- **Google Cloud API Security:** [https://cloud.google.com/docs/authentication/api-keys](https://cloud.google.com/docs/authentication/api-keys)
- **Mapbox Token Management:** [https://docs.mapbox.com/help/how-mapbox-works/access-tokens/](https://docs.mapbox.com/help/how-mapbox-works/access-tokens/)
- **Firebase Auth Authorized Domains:** [https://firebase.google.com/docs/auth/security-rules#authorized_domains](https://firebase.google.com/docs/auth/security-rules#authorized_domains)
- **Firestore Security Rules Best Practices:** [https://firebase.google.com/docs/firestore/security/rules-best-practices](https://firebase.google.com/docs/firestore/security/rules-best-practices)

---

## Approval & Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Architect | — | — | — |
| DevOps Lead | — | — | — |
| Security Lead | — | — | — |

---

**Document Status:** Ready for Execution  
**Last Updated:** April 10, 2026  
**Next Review:** Post-deployment (7 days after go-live)
