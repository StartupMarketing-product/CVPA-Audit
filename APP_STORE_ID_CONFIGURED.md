# ✅ App Store ID Configuration Added

## What's Been Updated

The system now supports storing and using **real App Store IDs** and **Google Play package names** for companies!

### Changes Made:

1. ✅ **Database**: Added `app_store_id` and `google_play_package` columns to companies table
2. ✅ **Backend API**: Updated to accept and store App Store IDs
3. ✅ **Backend Routes**: Updated to use stored App Store IDs when collecting reviews
4. ✅ **Frontend UI**: Added input fields for App Store ID and Google Play package name

## How to Use

### Option 1: Add When Creating Company (Recommended)

When creating a new company:

1. Fill in company name, industry, etc.
2. **App Store ID field**: Enter `1454827930` (for Korzinka)
   - This is the numeric ID from the App Store URL
   - Format: `apps.apple.com/app/id**1454827930**`
3. **Google Play Package**: Enter package name (e.g., `com.korzinka.app`)
4. Save the company

### Option 2: Update Existing Company

For existing companies, you can update them via the API or directly in the database:

```sql
UPDATE companies 
SET app_store_id = '1454827930' 
WHERE name = 'Korzinka';
```

Or add it through the UI (if we add an edit feature).

## Korzinka Example

For Korzinka app:
- **App Store ID**: `1454827930`
- **Google Play Package**: (check Google Play Store for the package name)

## How It Works Now

1. **When you create a company** with an App Store ID
2. **When you run an audit** and select "App Store" as a source
3. **The system will use the stored App Store ID** instead of 'mock-app-id'
4. **Real reviews will be collected** from the App Store RSS feed!

## Next Steps

1. **Restart backend** (if not already restarted) to load database changes
2. **Create or update a company** with the App Store ID
3. **Run an audit** - it will now use the real App Store ID!

## Verification

After creating a company with App Store ID and running an audit:
- ✅ Check backend console: Should see `"Collected X App Store reviews for app 1454827930"`
- ✅ Reviews should be real (not mock data)
- ✅ Reviews should match what's on the App Store

---

**The App Store ID system is now in place!** Just add the ID when creating/updating companies, and real reviews will be collected automatically. 🎉

