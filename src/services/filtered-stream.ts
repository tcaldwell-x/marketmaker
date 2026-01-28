import { config } from '../config';
import { StreamData } from '../types';

type StreamHandler = (data: StreamData) => void | Promise<void>;
type ErrorHandler = (error: Error) => void;

/**
 * Filtered Stream Handler
 * Manages connection to X's filtered stream with automatic reconnection
 */
export class FilteredStream {
  private abortController: AbortController | null = null;
  private retryCount = 0;
  private isRunning = false;
  private handlers: StreamHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];
  
  /**
   * Register a handler for incoming tweets
   */
  onTweet(handler: StreamHandler): void {
    this.handlers.push(handler);
  }
  
  /**
   * Register an error handler
   */
  onError(handler: ErrorHandler): void {
    this.errorHandlers.push(handler);
  }
  
  /**
   * Start listening to the filtered stream
   */
  async connect(): Promise<void> {
    if (this.isRunning) {
      console.log('[Stream] Already connected');
      return;
    }
    
    this.isRunning = true;
    this.retryCount = 0;
    
    await this.startStream();
  }
  
  /**
   * Stop the stream connection
   */
  disconnect(): void {
    this.isRunning = false;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    console.log('[Stream] Disconnected');
  }
  
  /**
   * Internal method to start/restart the stream
   */
  private async startStream(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.connectToStream();
      } catch (error) {
        if (!this.isRunning) break;
        
        const err = error instanceof Error ? error : new Error(String(error));
        this.notifyError(err);
        
        await this.handleReconnect(err.message);
      }
    }
  }
  
  /**
   * Connect to the X filtered stream
   */
  private async connectToStream(): Promise<void> {
    this.abortController = new AbortController();
    
    // Build URL with expansions for getting full tweet data
    const params = new URLSearchParams({
      'tweet.fields': 'author_id,conversation_id,created_at,in_reply_to_user_id,referenced_tweets',
      'expansions': 'author_id,referenced_tweets.id,in_reply_to_user_id',
      'user.fields': 'name,username',
    });
    
    const url = `${config.endpoints.filteredStream}?${params}`;
    
    console.log('[Stream] Connecting to filtered stream...');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.bearerToken}`,
      },
      signal: this.abortController.signal,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Stream connection failed (${response.status}): ${errorText}`);
    }
    
    if (!response.body) {
      throw new Error('No response body from stream');
    }
    
    console.log('[Stream] Connected successfully');
    this.retryCount = 0; // Reset retry count on successful connection
    
    await this.processStream(response.body);
  }
  
  /**
   * Process the incoming stream data
   */
  private async processStream(body: ReadableStream<Uint8Array>): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    try {
      while (this.isRunning) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('[Stream] Stream ended');
          break;
        }
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete JSON objects (separated by newlines)
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue; // Skip heartbeats (empty lines)
          
          try {
            const data: StreamData = JSON.parse(trimmed);
            await this.notifyHandlers(data);
          } catch (parseError) {
            console.error('[Stream] Failed to parse:', trimmed);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
  
  /**
   * Notify all registered handlers
   */
  private async notifyHandlers(data: StreamData): Promise<void> {
    for (const handler of this.handlers) {
      try {
        await handler(data);
      } catch (error) {
        console.error('[Stream] Handler error:', error);
      }
    }
  }
  
  /**
   * Notify error handlers
   */
  private notifyError(error: Error): void {
    console.error('[Stream] Error:', error.message);
    for (const handler of this.errorHandlers) {
      try {
        handler(error);
      } catch (e) {
        console.error('[Stream] Error handler failed:', e);
      }
    }
  }
  
  /**
   * Handle reconnection with exponential backoff
   * Following X API recommendations:
   * - Network errors: Start at 250ms, cap at 16s
   * - HTTP errors (420, 429): Start at 1min, exponential backoff
   * - Other HTTP errors: Start at 5s, cap at 320s
   * - Provisioning errors (503): Wait 60s+ as X is setting up access
   */
  private async handleReconnect(errorMessage?: string): Promise<void> {
    if (!this.isRunning) return;
    
    this.retryCount++;
    
    if (this.retryCount > config.reconnect.maxRetries) {
      console.error('[Stream] Max retries exceeded, stopping');
      this.isRunning = false;
      return;
    }
    
    // Check for provisioning error - needs longer wait
    const isProvisioningError = errorMessage?.includes('ProvisioningSubscription') || 
                                 errorMessage?.includes('provisioned');
    
    let delay: number;
    
    if (isProvisioningError) {
      // For provisioning errors, wait 60 seconds between attempts
      delay = 60000;
      console.log(`[Stream] ⏳ X is provisioning your subscription. This is normal for new accounts.`);
      console.log(`[Stream] Waiting 60s before retry (attempt ${this.retryCount}/${config.reconnect.maxRetries})`);
    } else {
      // Exponential backoff with jitter for other errors
      const baseDelay = config.reconnect.baseDelayMs;
      const maxDelay = config.reconnect.maxDelayMs;
      delay = Math.min(
        baseDelay * Math.pow(2, this.retryCount - 1) + Math.random() * 1000,
        maxDelay
      );
      console.log(`[Stream] Reconnecting in ${Math.round(delay / 1000)}s (attempt ${this.retryCount}/${config.reconnect.maxRetries})`);
    }
    
    await this.sleep(delay);
  }
  
  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const filteredStream = new FilteredStream();
