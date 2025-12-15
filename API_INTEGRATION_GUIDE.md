# Real API Integration Guide

## ✅ What's Been Added

The platform now supports **real API integrations** for collecting reviews from actual sources. The system will try real APIs first, then fall back to mock data if APIs fail or aren't configured.

## 🔧 Configuration

### Step 1: Enable Real APIs

In `cvpa-backend/.env`, set:
```env
ENABLE_REAL_APIS=true
```

### Step 2: Configure API Keys

Add your API keys to `.env`:

```env
# App Store - No key needed, but set country code
APP_STORE_COUNTRY=us  # Options: us, ua, ru, uz, etc.

# Google Play - Path to service account JSON key file
GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH=/path/to/service-account-key.json

# Yandex Maps API
YANDEX_MAPS_API_KEY=your-yandex-api-key-here

# Uzum (if they provide API)
UZUM_API_KEY=your-uzum-api-key-here
```

## 📱 App Store Integration

### How It Works
- Uses **App Store RSS Feed** (public, no API key needed)
- URL format: `https://itunes.apple.com/{country}/rss/customerreviews/page={page}/id={appId}/sortby=mostrecent/json`
- Collects up to 100 reviews (multiple pages)

### Requirements
- Valid App Store app ID (numeric ID, not bundle ID)
- Country code (default: 'us')

### Usage
When creating an audit, provide the actual App Store app ID:
- Find your app ID in App Store Connect
- Or get it from the App Store URL: `https://apps.apple.com/app/id{APP_ID}`

### Example
```typescript
await dataCollector.collectAppStoreReviews('123456789', companyId);
// Where 123456789 is your actual App Store app ID
```

## 🤖 Google Play Integration

### How It Works
- Currently uses **web scraping** of Google Play Store pages
- Alternative: Google Play Developer API (requires service account setup)

### Requirements
- Package name (e.g., `com.example.app`)
- Web scraping approach (check Google's ToS)

### Limitations
- Web scraping may break if Google changes page structure
- Rate limiting may apply
- Consider using official Google Play Developer API for production

### Official API Alternative
To use Google Play Developer API:
1. Create a Google Cloud Project
2. Enable Google Play Developer API
3. Create a Service Account
4. Download JSON key file
5. Set `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH` in `.env`

Then update the code to use the official API instead of scraping.

## 🗺️ Yandex Maps Integration

### How It Works
- Uses **Yandex Maps Search API** to find businesses
- Then scrapes business page for reviews
- Requires API key

### Getting API Key
1. Go to: https://developer.tech.yandex.com/
2. Create an account
3. Create a new service
4. Get your API key
5. Add to `.env`: `YANDEX_MAPS_API_KEY=your-key`

### Requirements
- Yandex Maps API key
- Business name must match Yandex Maps listing

### Usage
The system will:
1. Search for business by name
2. Get business ID
3. Scrape reviews from business page

## 🛒 Uzum Integration

### Status
**Not fully implemented yet** - Uzum doesn't appear to have a public API.

### Options
1. **Web Scraping** (check Uzum's Terms of Service)
2. **Partnership** - Contact Uzum for API access
3. **Manual Import** - Export reviews and import via CSV

### Future Implementation
When implementing, you'll need to:
- Identify Uzum's review URL structure
- Get business/seller identifier
- Scrape or use API to get reviews
- Parse and store in database

## 🔄 Fallback Mechanism

The system is designed to be resilient:

1. **Try real API first** (if `ENABLE_REAL_APIS=true`)
2. **If API fails or not configured** → Falls back to mock data
3. **Logs errors** for debugging

This means:
- ✅ You can test the platform with mock data
- ✅ Gradually enable real APIs as you get keys
- ✅ Platform continues working even if APIs fail

## 📊 Current Status

| Source | Status | Notes |
|--------|--------|-------|
| App Store | ✅ Ready | RSS feed, no API key needed |
| Google Play | ⚠️ Partial | Web scraping (check ToS), official API requires service account |
| Yandex Maps | ✅ Ready | Requires API key, uses Search API + scraping |
| Uzum | ❌ Not Ready | No public API, needs implementation |

## 🚀 Getting Started

1. **Start with App Store** (easiest - no API key needed)
   ```env
   ENABLE_REAL_APIS=true
   APP_STORE_COUNTRY=uz  # or us, ru, etc.
   ```

2. **Get Yandex API key** for Yandex Maps
   - Sign up at https://developer.tech.yandex.com/
   - Add key to `.env`

3. **For Google Play**, consider using official API for production

4. **Restart backend** after changing `.env`:
   ```bash
   cd cvpa-backend
   npm run dev
   ```

## ⚠️ Important Notes

### Legal Considerations
- **Check Terms of Service** for each platform before scraping
- **Respect rate limits** - don't make too many requests
- **Use official APIs** when available (more reliable, legal)

### Rate Limiting
- App Store: Built-in delays (1 second between pages)
- Google Play: May have rate limits
- Yandex: Check API documentation for limits

### Error Handling
- All APIs have try-catch blocks
- Errors are logged to console
- System falls back to mock data on failure

## 🐛 Troubleshooting

### "API error, falling back to mock data"
- Check API key is correct
- Verify API key has necessary permissions
- Check internet connection
- Review error logs in console

### "No reviews found"
- Verify app/business exists on the platform
- Check app ID/business name is correct
- Some platforms may have no reviews

### Reviews not appearing
- Check database connection
- Verify API actually returned data
- Check console logs for errors

---

**Need help?** Check the console logs - all API calls log their status and errors.

