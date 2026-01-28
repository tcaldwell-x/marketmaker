/**
 * XBot Framework - Grok Client
 * 
 * Generic Grok client that works with any plugin.
 * Handles the conversation loop with function calling.
 */

import { config } from '../config';
import { ConversationThread, Media } from '../types';
import { pluginManager } from './index';
import { Tool, ToolResult, BotResponse, StorableData } from './types';

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

// Content types for multimodal messages
interface TextContent {
  type: 'text';
  text: string;
}

interface ImageContent {
  type: 'image_url';
  image_url: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
  };
}

type MessageContent = string | (TextContent | ImageContent)[];

// Types for xAI API (OpenAI-compatible)
interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: MessageContent | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: Message;
    finish_reason: 'stop' | 'tool_calls' | 'length';
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Process a conversation thread using Grok and the active plugin
 */
export async function processWithGrok(thread: ConversationThread): Promise<GrokProcessResult> {
  if (!config.grokApiKey) {
    throw new Error('Grok API key not configured');
  }

  if (!pluginManager.isReady()) {
    throw new Error('No plugin is active');
  }

  const plugin = pluginManager.getActivePlugin()!;

  // Format the conversation for Grok
  const conversationText = thread.tweets
    .map(tweet => {
      const user = thread.participants.find(u => u.id === tweet.author_id);
      return `@${user?.username || 'user'}: ${tweet.text}`;
    })
    .join('\n');

  console.log('[Grok] Processing conversation:\n', conversationText);

  // Collect image URLs from the conversation
  const imageUrls = getImageUrlsFromThread(thread);
  if (imageUrls.length > 0) {
    console.log(`[Grok] Found ${imageUrls.length} image(s) in conversation`);
  }

  // Build user message content (multimodal if images present)
  const userMessageText = `Here's the conversation thread:\n\n${conversationText}\n\nPlease respond appropriately. Use the available tools if needed.${imageUrls.length > 0 ? '\n\nThe user has shared image(s) - please analyze them to understand their request better.' : ''}`;
  
  let userContent: MessageContent;
  if (imageUrls.length > 0) {
    // Multimodal content with images
    const content: (TextContent | ImageContent)[] = [
      { type: 'text', text: userMessageText },
    ];
    // Add images (limit to first 4 to avoid token limits)
    for (const url of imageUrls.slice(0, 4)) {
      content.push({
        type: 'image_url',
        image_url: { url, detail: 'auto' },
      });
    }
    userContent = content;
  } else {
    userContent = userMessageText;
  }

  const messages: Message[] = [
    { role: 'system', content: pluginManager.getSystemPrompt() },
    { role: 'user', content: userContent },
  ];

  const tools = pluginManager.getTools();
  const toolResults: ToolResult[] = [];

  // Initial call to Grok
  let response = await callGrok(messages, tools);
  let iterations = 0;
  const maxIterations = 5;

  // Handle tool calls (function calling loop)
  while (response.choices[0].finish_reason === 'tool_calls' && iterations < maxIterations) {
    iterations++;
    const assistantMessage = response.choices[0].message;
    messages.push(assistantMessage);

    console.log(`[Grok] Tool calls requested (iteration ${iterations}):`,
      assistantMessage.tool_calls?.map(tc => tc.function.name));

    // Execute each tool call through the plugin
    for (const toolCall of assistantMessage.tool_calls || []) {
      const args = JSON.parse(toolCall.function.arguments);
      
      const result = await pluginManager.executeTool({
        thread,
        toolName: toolCall.function.name,
        arguments: args,
      });

      toolResults.push(result);

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }

    // Call Grok again with the tool results
    response = await callGrok(messages, tools);
  }

  // Response content is always a string (multimodal is input only)
  const rawContent = response.choices[0].message.content;
  let finalMessage = typeof rawContent === 'string' ? rawContent : '';
  const hadToolCalls = toolResults.length > 0;

  // Strip any placeholder text or URLs that Grok might add (system appends URLs automatically)
  finalMessage = finalMessage
    .replace(/\s*\[link\]\s*/gi, '')
    .replace(/\s*More details:?\s*$/i, '')
    .replace(/\s*Click here:?\s*$/i, '')
    .replace(/\s*See more:?\s*$/i, '')
    .replace(/\s*Link:?\s*$/i, '')
    // Remove any URLs Grok might hallucinate (we add our own)
    .replace(/https?:\/\/[^\s)]+/gi, '')
    .replace(/\bt\.co\/\S+/gi, '')
    .trim();

  console.log(`[Grok] Final response (${hadToolCalls ? 'with tools' : 'conversational'}):`, finalMessage);

  // Let plugin format the response if it has a custom formatter
  let botResponse: BotResponse;
  
  if (plugin.formatResponse) {
    botResponse = await plugin.formatResponse(finalMessage, toolResults);
  } else {
    // Default formatting
    botResponse = {
      message: finalMessage,
      hasData: hadToolCalls && toolResults.some(r => r.success),
      data: plugin.extractStorableData?.(toolResults, finalMessage) || undefined,
    };
  }

  return {
    response: botResponse,
    hadToolCalls,
    toolResults,
  };
}

/**
 * Call the Grok API
 */
async function callGrok(messages: Message[], tools?: Tool[]): Promise<ChatCompletionResponse> {
  const model = 'grok-4-1-fast-reasoning';
  
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: 0.7,
  };

  if (tools && tools.length > 0) {
    body.tools = tools;
    body.tool_choice = 'auto';
  }

  const response = await fetch(GROK_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.grokApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Grok] API error:', response.status, errorText);
    throw new Error(`Grok API error (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<ChatCompletionResponse>;
}

/**
 * Check if Grok is configured
 */
export function isGrokConfigured(): boolean {
  return !!config.grokApiKey;
}

/**
 * Extract image URLs from a conversation thread
 * Maps tweet media_keys to actual URLs from the includes.media array
 */
function getImageUrlsFromThread(thread: ConversationThread): string[] {
  const urls: string[] = [];
  
  if (!thread.media || thread.media.length === 0) {
    return urls;
  }

  // Build a map of media_key -> URL
  const mediaMap = new Map<string, string>();
  for (const media of thread.media) {
    // For photos, use url; for videos/gifs, use preview_image_url
    const imageUrl = media.type === 'photo' ? media.url : media.preview_image_url;
    if (imageUrl) {
      mediaMap.set(media.media_key, imageUrl);
    }
  }

  // Find all media_keys referenced in tweets and get their URLs
  for (const tweet of thread.tweets) {
    if (tweet.attachments?.media_keys) {
      for (const mediaKey of tweet.attachments.media_keys) {
        const url = mediaMap.get(mediaKey);
        if (url && !urls.includes(url)) {
          urls.push(url);
        }
      }
    }
  }

  return urls;
}

// Types
export interface GrokProcessResult {
  response: BotResponse;
  hadToolCalls: boolean;
  toolResults: ToolResult[];
}
