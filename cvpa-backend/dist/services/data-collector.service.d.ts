export declare class DataCollectorService {
    scrapeWebsite(url: string, companyId: string): Promise<void>;
    collectAppStoreReviews(appId: string, companyId: string): Promise<void>;
    collectAppStoreReviewsReal(appId: string, companyId: string): Promise<void>;
    collectGooglePlayReviews(packageName: string, companyId: string): Promise<void>;
    collectGooglePlayReviewsReal(packageName: string, companyId: string): Promise<void>;
    private parseReviewDate;
    collectYandexReviews(businessName: string, companyId: string): Promise<void>;
    collectYandexReviewsReal(businessName: string, companyId: string): Promise<void>;
    collectUzumReviews(companyId: string): Promise<void>;
    collectUzumReviewsReal(companyId: string): Promise<void>;
    processRawData(companyId: string): Promise<void>;
}
//# sourceMappingURL=data-collector.service.d.ts.map