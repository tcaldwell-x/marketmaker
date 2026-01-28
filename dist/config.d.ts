export declare const config: {
    bearerToken: string;
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessTokenSecret: string;
    botUsername: string;
    websiteUrl: string;
    grokApiKey: string;
    plugin: {
        id: string;
        sandboxMode: boolean;
    };
    endpoints: {
        filteredStream: string;
        filteredStreamRules: string;
        tweets: string;
        users: string;
    };
    reconnect: {
        maxRetries: number;
        baseDelayMs: number;
        maxDelayMs: number;
    };
};
export declare function validateConfig(): void;
//# sourceMappingURL=config.d.ts.map