export declare class AuthService {
    register(email: string, password: string, name: string): Promise<{
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
        };
        token: never;
    }>;
    login(email: string, password: string): Promise<{
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
        };
        token: never;
        refreshToken: never;
    }>;
    private generateToken;
    private generateRefreshToken;
}
//# sourceMappingURL=auth.service.d.ts.map