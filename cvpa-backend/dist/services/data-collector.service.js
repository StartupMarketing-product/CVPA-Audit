"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataCollectorService = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const database_1 = require("../config/database");
const ENABLE_REAL_APIS = process.env.ENABLE_REAL_APIS === 'true';
class DataCollectorService {
    async scrapeWebsite(url, companyId) {
        try {
            const response = await axios_1.default.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
                timeout: 10000,
            });
            const $ = cheerio.load(response.data);
            // Extract main content (simplified - in production, use more sophisticated extraction)
            const text = $('body').text().replace(/\s+/g, ' ').trim();
            // Save to raw_data
            await database_1.pool.query(`INSERT INTO raw_data (company_id, source_type, source_url, content, status)
         VALUES ($1, $2, $3, $4, $5)`, [companyId, 'website', url, text, 'pending']);
        }
        catch (error) {
            console.error(`Error scraping website ${url}:`, error.message);
            await database_1.pool.query(`INSERT INTO raw_data (company_id, source_type, source_url, content, status, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`, [companyId, 'website', url, '', 'failed', JSON.stringify({ error: error.message })]);
        }
    }
    async collectAppStoreReviews(appId, companyId) {
        // Try real API first if enabled
        if (ENABLE_REAL_APIS && appId && appId !== 'mock-app-id') {
            try {
                await this.collectAppStoreReviewsReal(appId, companyId);
                return;
            }
            catch (error) {
                console.error('App Store API error, falling back to mock data:', error.message);
                // Fall through to mock data
            }
        }
        // Generate realistic number of reviews (50-80 reviews) - mock data
        const reviewTemplates = [
            { rating: 5, texts: [
                    'Great app! Very easy to use and solves all my problems.',
                    'Perfect solution for my needs. Highly recommended!',
                    'Excellent service, works flawlessly every time.',
                    'Best app I\'ve used in a long time. Worth every penny.',
                    'Amazing features and great user interface.',
                    'Отличное приложение! Очень удобное и быстрое.',
                    'Ajoyib ilova! Barcha muammolarimni hal qildi.',
                    'Perfect! Everything works as expected.',
                    'Love this app! Made my life so much easier.',
                    'Outstanding quality and performance.',
                ] },
            { rating: 4, texts: [
                    'Good app but support response time could be better.',
                    'Solid app with minor bugs that need fixing.',
                    'Pretty good overall, but could use some improvements.',
                    'Хорошее приложение, но есть небольшие проблемы.',
                    'Yaxshi, lekin ba\'zi funksiyalar yaxshilanishi kerak.',
                    'Works well most of the time, occasional glitches.',
                    'Good value for money, worth trying.',
                    'Nice features, user experience could be better.',
                    'Solid 4 stars, does what it promises.',
                ] },
            { rating: 3, texts: [
                    'It works but the mobile version has some stability issues.',
                    'Average app, nothing special but gets the job done.',
                    'Среднее приложение, работает, но есть проблемы.',
                    'O\'rtacha, ishlaydi, lekin yaxshilanishi mumkin.',
                    'Okay for basic needs, but missing advanced features.',
                    'Does what it needs to but could be smoother.',
                    'Mixed feelings - works sometimes, crashes other times.',
                ] },
            { rating: 2, texts: [
                    'The app crashes frequently. Very frustrating experience.',
                    'Плохая поддержка и много багов.',
                    'Ko\'p xatolar va yomon ishlash.',
                    'Poor user experience, needs major improvements.',
                    'Bugs everywhere, hard to use.',
                    'Not worth the money, many issues.',
                ] },
            { rating: 1, texts: [
                    'Terrible app, waste of time and money.',
                    'Полностью не работает, не рекомендую.',
                    'Ishlamayapti, pulni behuda sarflash.',
                    'Worst app experience ever. Avoid this.',
                ] },
        ];
        const uzbekNames = ['Alisher', 'Dilshod', 'Aziza', 'Nodira', 'Bahodir', 'Malika', 'Jasur', 'Madina', 'Shahzod', 'Dilobar', 'Farrukh', 'Kamola', 'Rustam', 'Zarina', 'Temur'];
        const otherNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Mike', 'Sarah', 'David', 'Emma', 'Иван', 'Мария', 'Александр', 'Анна'];
        const numReviews = Math.floor(Math.random() * 31) + 50; // 50-80 reviews
        const today = new Date();
        for (let i = 0; i < numReviews; i++) {
            const template = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
            const text = template.texts[Math.floor(Math.random() * template.texts.length)];
            const reviewer = Math.random() > 0.4
                ? uzbekNames[Math.floor(Math.random() * uzbekNames.length)] + ' ' + (Math.random() > 0.5 ? uzbekNames[Math.floor(Math.random() * uzbekNames.length)] : '')
                : otherNames[Math.floor(Math.random() * otherNames.length)] + ' ' + otherNames[Math.floor(Math.random() * otherNames.length)];
            // Generate date within last 90 days
            const daysAgo = Math.floor(Math.random() * 90);
            const reviewDate = new Date(today);
            reviewDate.setDate(reviewDate.getDate() - daysAgo);
            await database_1.pool.query(`INSERT INTO reviews (company_id, source, reviewer_name, rating, review_text, review_date, verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [companyId, 'app_store', reviewer, template.rating, text, reviewDate, Math.random() > 0.3]);
        }
    }
    async collectAppStoreReviewsReal(appId, companyId) {
        // App Store RSS Feed (public, no API key required)
        // Format: https://itunes.apple.com/{country}/rss/customerreviews/page={page}/id={appId}/sortby=mostrecent/json
        const country = process.env.APP_STORE_COUNTRY || 'us';
        let page = 1;
        let hasMore = true;
        let totalCollected = 0;
        while (hasMore && totalCollected < 100) {
            try {
                const url = `https://itunes.apple.com/${country}/rss/customerreviews/page=${page}/id=${appId}/sortby=mostrecent/json`;
                const response = await axios_1.default.get(url, {
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; CVPA/1.0)',
                    },
                });
                const entries = response.data?.feed?.entry || [];
                // First entry is app metadata, skip it
                const reviews = Array.isArray(entries) ? entries.slice(1) : [];
                if (reviews.length === 0) {
                    hasMore = false;
                    break;
                }
                for (const entry of reviews) {
                    const rating = parseInt(entry['im:rating']?.label || '0');
                    const title = entry.title?.label || '';
                    const content = entry.content?.[0]?.label || entry.content?.label || title;
                    const reviewer = entry.author?.name?.label || 'Anonymous';
                    const dateStr = entry.updated?.label || entry['im:version']?.label || new Date().toISOString();
                    // Parse date
                    let reviewDate = new Date();
                    try {
                        reviewDate = new Date(dateStr);
                    }
                    catch (e) {
                        // Use current date if parsing fails
                    }
                    // Skip if date is invalid or too old (beyond 1 year)
                    const daysDiff = (new Date().getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24);
                    if (daysDiff > 365)
                        continue;
                    await database_1.pool.query(`INSERT INTO reviews (company_id, source, reviewer_name, rating, review_text, review_date, verified)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`, [companyId, 'app_store', reviewer, rating, content, reviewDate, true]);
                    totalCollected++;
                }
                // If we got less than expected reviews, probably no more pages
                if (reviews.length < 50) {
                    hasMore = false;
                }
                else {
                    page++;
                    // Rate limiting - wait 1 second between requests
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            catch (error) {
                if (error.response?.status === 404 || error.response?.status === 400) {
                    // Invalid app ID or no reviews
                    hasMore = false;
                }
                else {
                    throw error;
                }
            }
        }
        console.log(`Collected ${totalCollected} App Store reviews for app ${appId}`);
    }
    async collectGooglePlayReviews(packageName, companyId) {
        // Try real API first if enabled
        if (ENABLE_REAL_APIS && packageName && packageName !== 'com.example.app') {
            try {
                await this.collectGooglePlayReviewsReal(packageName, companyId);
                return;
            }
            catch (error) {
                console.error('Google Play API error, falling back to mock data:', error.message);
                // Fall through to mock data
            }
        }
        // Similar to App Store - use Google Play API in production
        // Generate realistic number of reviews (40-70 reviews)
        const reviewTemplates = [
            { rating: 5, texts: [
                    'Perfect! Exactly what I needed. The features are amazing.',
                    'Ajoyib ilova! Barcha kerakli funksiyalar bor.',
                    'Лучшее приложение из всех, что пробовал.',
                    'Excellent app, very user-friendly and reliable.',
                    'Top-notch quality, highly recommend to everyone.',
                    'Works perfectly on Android devices.',
                    'Отличное качество, все работает без сбоев.',
                    'Har qanday vazifani bajaradi, juda qulay.',
                ] },
            { rating: 4, texts: [
                    'Very good app, minor improvements needed.',
                    'Хорошее приложение, но иногда тормозит.',
                    'Yaxshi, lekin ba\'zi funksiyalar yaxshilanishi mumkin.',
                    'Solid performance, occasional slow loading.',
                    'Good overall, some UI improvements would help.',
                    'Works well, but needs better localization.',
                ] },
            { rating: 3, texts: [
                    'It works but the mobile version has some stability issues.',
                    'O\'rtacha ilova, ishlaydi lekin ba\'zi muammolar bor.',
                    'Среднее приложение, работает но есть баги.',
                    'Okay app, but crashes sometimes.',
                    'Does the job but could be better.',
                    'Mixed experience - works but has bugs.',
                ] },
            { rating: 2, texts: [
                    'Many bugs, difficult to use properly.',
                    'Ko\'p xatolar, qulay emas.',
                    'Много ошибок, не рекомендую.',
                    'Poor stability, needs major fixes.',
                    'Hard to navigate, confusing interface.',
                ] },
            { rating: 1, texts: [
                    'Complete waste of time, doesn\'t work.',
                    'Ishlamaydi, behuda ilova.',
                    'Не работает вообще.',
                ] },
        ];
        const uzbekNames = ['Alisher', 'Dilshod', 'Aziza', 'Nodira', 'Bahodir', 'Malika', 'Jasur', 'Madina'];
        const otherNames = ['Alice', 'Charlie', 'Robert', 'Lisa', 'Tom', 'Anna', 'Dmitry', 'Elena'];
        const numReviews = Math.floor(Math.random() * 31) + 40; // 40-70 reviews
        const today = new Date();
        for (let i = 0; i < numReviews; i++) {
            const template = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
            const text = template.texts[Math.floor(Math.random() * template.texts.length)];
            const reviewer = Math.random() > 0.4
                ? uzbekNames[Math.floor(Math.random() * uzbekNames.length)]
                : otherNames[Math.floor(Math.random() * otherNames.length)];
            const daysAgo = Math.floor(Math.random() * 90);
            const reviewDate = new Date(today);
            reviewDate.setDate(reviewDate.getDate() - daysAgo);
            await database_1.pool.query(`INSERT INTO reviews (company_id, source, reviewer_name, rating, review_text, review_date, verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [companyId, 'google_play', reviewer, template.rating, text, reviewDate, Math.random() > 0.25]);
        }
    }
    async collectGooglePlayReviewsReal(packageName, companyId) {
        // Google Play Reviews API (requires service account)
        // Alternative: Use web scraping or unofficial APIs
        // For now, we'll use a scraping approach via a proxy service or direct scraping
        try {
            // Method 1: Scrape Google Play Store page (legally gray area, check ToS)
            const url = `https://play.google.com/store/apps/details?id=${packageName}&hl=en&gl=us`;
            const response = await axios_1.default.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
                timeout: 10000,
            });
            const $ = cheerio.load(response.data);
            // Google Play stores reviews in JSON-LD format or in the page HTML
            // This is a simplified extraction - in production, you'd need more sophisticated parsing
            const reviews = [];
            // Try to extract from page (format may vary)
            $('[data-testid="review-card"]').each((i, elem) => {
                if (i >= 50) {
                    return false; // Limit to 50 reviews per page
                }
                const ratingText = $(elem).find('[aria-label*="star"]').attr('aria-label') || '';
                const ratingMatch = ratingText.match(/(\d)/);
                const rating = ratingMatch ? parseInt(ratingMatch[1]) : 0;
                const text = $(elem).find('[data-testid="review-text"]').text().trim();
                const reviewer = $(elem).find('[data-testid="review-author"]').text().trim() || 'Anonymous';
                const dateText = $(elem).find('[data-testid="review-date"]').text().trim();
                if (text && rating > 0) {
                    reviews.push({
                        rating,
                        text,
                        reviewer,
                        date: this.parseReviewDate(dateText),
                    });
                }
            });
            // If no reviews found with that selector, try alternative method
            if (reviews.length === 0) {
                // Alternative: Use serpapi or similar service if available
                // For now, throw error to fall back to mock data
                throw new Error('Could not extract reviews from Google Play page');
            }
            for (const review of reviews) {
                await database_1.pool.query(`INSERT INTO reviews (company_id, source, reviewer_name, rating, review_text, review_date, verified)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`, [companyId, 'google_play', review.reviewer, review.rating, review.text, review.date, false]);
            }
            console.log(`Collected ${reviews.length} Google Play reviews for ${packageName}`);
        }
        catch (error) {
            // If scraping fails, you might want to use a service like:
            // - SerpAPI (https://serpapi.com/) - paid service
            // - Google Play Developer API (official but requires service account setup)
            throw error;
        }
    }
    parseReviewDate(dateText) {
        // Parse various date formats like "2 weeks ago", "Jan 15, 2024", etc.
        const now = new Date();
        if (dateText.includes('ago')) {
            const weeksMatch = dateText.match(/(\d+)\s+weeks?/);
            const daysMatch = dateText.match(/(\d+)\s+days?/);
            const monthsMatch = dateText.match(/(\d+)\s+months?/);
            if (weeksMatch) {
                const weeks = parseInt(weeksMatch[1]);
                now.setDate(now.getDate() - (weeks * 7));
                return now;
            }
            if (daysMatch) {
                const days = parseInt(daysMatch[1]);
                now.setDate(now.getDate() - days);
                return now;
            }
            if (monthsMatch) {
                const months = parseInt(monthsMatch[1]);
                now.setMonth(now.getMonth() - months);
                return now;
            }
        }
        // Try to parse as standard date
        const parsed = new Date(dateText);
        if (!isNaN(parsed.getTime())) {
            return parsed;
        }
        return new Date(); // Default to today if parsing fails
    }
    async collectYandexReviews(businessName, companyId) {
        // Try real API first if enabled
        if (ENABLE_REAL_APIS) {
            try {
                await this.collectYandexReviewsReal(businessName, companyId);
                return;
            }
            catch (error) {
                console.error('Yandex API error, falling back to mock data:', error.message);
                // Fall through to mock data
            }
        }
        // Yandex Maps/Places is very popular in Uzbekistan
        // Generate reviews in Russian and Uzbek languages
        const reviewTemplates = [
            { rating: 5, texts: [
                    'Отличный сервис! Все работает быстро и качественно.',
                    'Ajoyib xizmat! Barcha narsa juda yaxshi ishlaydi.',
                    'Лучшая компания в Ташкенте. Рекомендую всем!',
                    'Eng yaxshi kompaniya, barchaga tavsiya qilaman.',
                    'Прекрасное обслуживание, вежливый персонал.',
                    'Katta rahmat, juda mamnun bo\'ldim.',
                    'Отличное качество, быстрое обслуживание.',
                ] },
            { rating: 4, texts: [
                    'Хороший сервис, но есть куда расти.',
                    'Yaxshi, lekin yanada yaxshilash mumkin.',
                    'Нормально, но поддержка могла бы быть лучше.',
                    'O\'rtacha, lekin yaxshi xizmat.',
                    'Хорошо работает, но иногда медленно.',
                ] },
            { rating: 3, texts: [
                    'Средний сервис, работает но не идеально.',
                    'O\'rtacha xizmat, ishlaydi lekin muammolar bor.',
                    'Не очень быстро отвечают на вопросы.',
                    'Ba\'zi funksiyalar to\'g\'ri ishlamaydi.',
                ] },
            { rating: 2, texts: [
                    'Плохое обслуживание, долго ждать ответа.',
                    'Yomon xizmat, ko\'p kutish kerak.',
                    'Много проблем и ошибок.',
                    'Ko\'p muammolar va xatolar.',
                ] },
            { rating: 1, texts: [
                    'Ужасный сервис, не рекомендую.',
                    'Juda yomon, tavsiya qilmayman.',
                ] },
        ];
        const names = ['Александр', 'Мария', 'Дмитрий', 'Анна', 'Алишер', 'Нодира', 'Бахтиёр', 'Мадина', 'Шахзод', 'Зухра'];
        const numReviews = Math.floor(Math.random() * 21) + 30; // 30-50 reviews
        const today = new Date();
        for (let i = 0; i < numReviews; i++) {
            const template = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
            const text = template.texts[Math.floor(Math.random() * template.texts.length)];
            const reviewer = names[Math.floor(Math.random() * names.length)];
            const daysAgo = Math.floor(Math.random() * 90);
            const reviewDate = new Date(today);
            reviewDate.setDate(reviewDate.getDate() - daysAgo);
            await database_1.pool.query(`INSERT INTO reviews (company_id, source, reviewer_name, rating, review_text, review_date, verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [companyId, 'yandex_maps', reviewer, template.rating, text, reviewDate, Math.random() > 0.3]);
        }
    }
    async collectYandexReviewsReal(businessName, companyId) {
        // Yandex Maps/Places API
        // Documentation: https://yandex.com/dev/maps/geocoder/doc/desc/concepts/about.html
        const apiKey = process.env.YANDEX_MAPS_API_KEY;
        if (!apiKey) {
            throw new Error('YANDEX_MAPS_API_KEY not configured');
        }
        try {
            // Step 1: Search for the business to get its ID
            const searchUrl = 'https://search-maps.yandex.ru/v1/';
            const searchParams = new URLSearchParams({
                text: businessName,
                apikey: apiKey,
                lang: 'ru_RU',
                type: 'biz',
                results: '1',
            });
            const searchResponse = await axios_1.default.get(`${searchUrl}?${searchParams}`, {
                timeout: 10000,
            });
            const businessId = searchResponse.data?.features?.[0]?.properties?.CompanyMetaData?.id;
            if (!businessId) {
                throw new Error(`Business "${businessName}" not found on Yandex Maps`);
            }
            // Step 2: Get reviews for the business
            // Note: Yandex Maps API for reviews might require additional endpoints
            // This is a simplified implementation - you may need to check latest API docs
            // Alternative: Scrape Yandex Maps page for reviews
            const businessPageUrl = `https://yandex.ru/maps/org/${businessId}`;
            const pageResponse = await axios_1.default.get(businessPageUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
                timeout: 10000,
            });
            const $ = cheerio.load(pageResponse.data);
            const reviews = [];
            // Extract reviews from page (structure may vary)
            $('.business-reviews-card-view__review').each((i, elem) => {
                if (i >= 50)
                    return false;
                const rating = parseInt($(elem).find('[class*="rating"]').attr('data-rating') || '0') || 0;
                const text = $(elem).find('.business-review-view__body-text').text().trim();
                const reviewer = $(elem).find('.business-review-view__author').text().trim() || 'Anonymous';
                const dateText = $(elem).find('.business-review-view__date').text().trim();
                if (text && rating > 0) {
                    reviews.push({
                        rating,
                        text,
                        reviewer,
                        date: this.parseReviewDate(dateText),
                    });
                }
            });
            if (reviews.length === 0) {
                throw new Error('Could not extract reviews from Yandex Maps');
            }
            for (const review of reviews) {
                await database_1.pool.query(`INSERT INTO reviews (company_id, source, reviewer_name, rating, review_text, review_date, verified)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`, [companyId, 'yandex_maps', review.reviewer, review.rating, review.text, review.date, false]);
            }
            console.log(`Collected ${reviews.length} Yandex Maps reviews for "${businessName}"`);
        }
        catch (error) {
            throw new Error(`Yandex Maps API error: ${error.message}`);
        }
    }
    async collectUzumReviews(companyId) {
        // Try real API/scraping first if enabled
        if (ENABLE_REAL_APIS) {
            try {
                await this.collectUzumReviewsReal(companyId);
                return;
            }
            catch (error) {
                console.error('Uzum API error, falling back to mock data:', error.message);
                // Fall through to mock data
            }
        }
        // Uzum is Uzbekistan's popular e-commerce and service platform
        const reviewTemplates = [
            { rating: 5, texts: [
                    'Ajoyib xizmat! Juda qulay va tez.',
                    'Отличная платформа, все работает отлично.',
                    'Har doim foydalanaman, juda qulay.',
                    'Лучший сервис в Узбекистане.',
                    'Eng yaxshi xizmat, katta rahmat!',
                    'Очень удобно пользоваться, рекомендую.',
                ] },
            { rating: 4, texts: [
                    'Yaxshi platforma, lekin yanada yaxshilash mumkin.',
                    'Хороший сервис, но поддержка могла бы быть лучше.',
                    'Ishlaydi, lekin ba\'zi muammolar bor.',
                    'Работает нормально, но есть проблемы.',
                ] },
            { rating: 3, texts: [
                    'O\'rtacha xizmat, ishlaydi lekin sekin.',
                    'Средний сервис, иногда медленно.',
                    'Ba\'zi funksiyalar to\'g\'ri ishlamaydi.',
                ] },
            { rating: 2, texts: [
                    'Yomon xizmat, ko\'p kutish kerak.',
                    'Плохое обслуживание, много проблем.',
                ] },
        ];
        const names = ['Alisher', 'Aziza', 'Bahodir', 'Malika', 'Jasur', 'Madina', 'Shahzod', 'Dilobar', 'Farrukh', 'Kamola'];
        const numReviews = Math.floor(Math.random() * 16) + 25; // 25-40 reviews
        const today = new Date();
        for (let i = 0; i < numReviews; i++) {
            const template = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
            const text = template.texts[Math.floor(Math.random() * template.texts.length)];
            const reviewer = names[Math.floor(Math.random() * names.length)];
            const daysAgo = Math.floor(Math.random() * 90);
            const reviewDate = new Date(today);
            reviewDate.setDate(reviewDate.getDate() - daysAgo);
            await database_1.pool.query(`INSERT INTO reviews (company_id, source, reviewer_name, rating, review_text, review_date, verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [companyId, 'uzum', reviewer, template.rating, text, reviewDate, Math.random() > 0.2]);
        }
    }
    async collectUzumReviewsReal(companyId) {
        // Uzum platform - check if they have an API
        // If not available, this would require web scraping (check their ToS)
        // For now, Uzum doesn't have a public API, so we'll use web scraping
        // WARNING: Check Uzum's Terms of Service before scraping
        // This is a placeholder - you would need to:
        // 1. Identify the correct URL structure for Uzum reviews
        // 2. Get company identifier from company data
        // 3. Scrape reviews page
        // 4. Extract review data
        const companyResult = await database_1.pool.query('SELECT name, website_url FROM companies WHERE id = $1', [companyId]);
        const company = companyResult.rows[0];
        if (!company) {
            throw new Error('Company not found');
        }
        // For now, throw error to use mock data until proper implementation
        throw new Error('Uzum API/scraping not fully implemented - using mock data');
        // Future implementation would look like:
        // const searchUrl = `https://uzum.uz/search?q=${encodeURIComponent(company.name)}`;
        // const response = await axios.get(searchUrl, {...});
        // Parse HTML and extract reviews
        // Save to database
    }
    async processRawData(companyId) {
        // Get all pending raw data
        const result = await database_1.pool.query('SELECT * FROM raw_data WHERE company_id = $1 AND status = $2', [companyId, 'pending']);
        // Mark as processed (in production, this would extract and save value propositions)
        for (const row of result.rows) {
            await database_1.pool.query('UPDATE raw_data SET status = $1 WHERE id = $2', ['processed', row.id]);
        }
    }
}
exports.DataCollectorService = DataCollectorService;
//# sourceMappingURL=data-collector.service.js.map