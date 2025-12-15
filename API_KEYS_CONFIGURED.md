# ✅ API Keys Configured

## Yandex Maps API Key Added

Your Yandex API key has been configured in `cvpa-backend/.env`:

```
YANDEX_MAPS_API_KEY=abc99673-3aaa-4e91-bb72-9030d59f9e0e
ENABLE_REAL_APIS=true
```

## What's Now Enabled

✅ **Real API integrations are now active!**

- ✅ **Yandex Maps** - Real reviews from Yandex Maps (Uzbekistan/Russia)
- ✅ **App Store** - Real reviews via RSS feed (no key needed)
- ⚠️ **Google Play** - Will use scraping (no key needed)
- ❌ **Uzum** - Still using mock data (not yet implemented)

## Next Steps

### 1. Restart Backend Server

The backend needs to be restarted to pick up the new environment variables:

```bash
cd cvpa-backend
# Stop the current server (Ctrl+C)
npm run dev
```

### 2. Test with Real Data

When you create a new audit:

1. **For App Store**: Use real App ID (e.g., `1454827930` for Korzinka)
2. **For Yandex Maps**: Make sure the company name matches what's on Yandex Maps
3. **Select sources**: Check "Yandex Maps/Places (Узбекистан)"

### 3. Example: Testing with Korzinka

1. Create a company named "Korzinka" (or exact name from Yandex Maps)
2. Start audit with:
   - ✅ Website
   - ✅ App Store (use ID: `1454827930`)
   - ✅ Yandex Maps
   - ✅ Google Play (if you have package name)

3. The system will now collect **real reviews** from these sources!

## Verification

After restarting, check the console logs when running an audit:
- ✅ You should see: `"Collected X Yandex Maps reviews for..."` (real API)
- ✅ Instead of: `"Yandex API error, falling back to mock data"` (mock fallback)

## Important Notes

- **Yandex API**: Now configured and ready to use
- **Rate Limits**: Yandex has daily request limits (check your dashboard)
- **Business Names**: Must match exactly what's on Yandex Maps for best results
- **Fallback**: If API fails, system automatically falls back to mock data

## Troubleshooting

**If you see "Yandex API error, falling back to mock data":**
1. Check the API key is correct in `.env`
2. Verify the backend was restarted after adding the key
3. Check Yandex Developer dashboard - is the API key active?
4. Check console logs for specific error messages

**If business not found on Yandex Maps:**
1. Search manually on yandex.ru/maps to verify the business exists
2. Make sure company name matches exactly (including spelling)
3. Try the Russian name if English doesn't work

---

**Your Yandex API is now configured and ready to collect real reviews!** 🎉

