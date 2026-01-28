import { StreamData } from '../types';
type StreamHandler = (data: StreamData) => void | Promise<void>;
type ErrorHandler = (error: Error) => void;
/**
 * Filtered Stream Handler
 * Manages connection to X's filtered stream with automatic reconnection
 */
export declare class FilteredStream {
    private abortController;
    private retryCount;
    private isRunning;
    private handlers;
    private errorHandlers;
    /**
     * Register a handler for incoming tweets
     */
    onTweet(handler: StreamHandler): void;
    /**
     * Register an error handler
     */
    onError(handler: ErrorHandler): void;
    /**
     * Start listening to the filtered stream
     */
    connect(): Promise<void>;
    /**
     * Stop the stream connection
     */
    disconnect(): void;
    /**
     * Internal method to start/restart the stream
     */
    private startStream;
    /**
     * Connect to the X filtered stream
     */
    private connectToStream;
    /**
     * Process the incoming stream data
     */
    private processStream;
    /**
     * Notify all registered handlers
     */
    private notifyHandlers;
    /**
     * Notify error handlers
     */
    private notifyError;
    /**
     * Handle reconnection with exponential backoff
     * Following X API recommendations:
     * - Network errors: Start at 250ms, cap at 16s
     * - HTTP errors (420, 429): Start at 1min, exponential backoff
     * - Other HTTP errors: Start at 5s, cap at 320s
     * - Provisioning errors (503): Wait 60s+ as X is setting up access
     */
    private handleReconnect;
    /**
     * Sleep helper
     */
    private sleep;
}
export declare const filteredStream: FilteredStream;
export {};
//# sourceMappingURL=filtered-stream.d.ts.map