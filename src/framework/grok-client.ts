/**
 * XBot Framework - Grok Client
 * 
 * Generic Grok client that works with any plugin.
 * Handles the conversation loop with function calling.
 */

import { config } from '../config';
import { ConversationThread } from '../types';
import { pluginManager } from './plugin-manager';
import { Tool, ToolResult, BotResponse, StorableData } from './types';

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

// Types for xAI API (OpenAI-compatible)
interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
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

  const messages: Message[] = [
    { role: 'system', content: pluginManager.getSystemPrompt() },
    { 
      role: 'user', 
      content: `Here's the conversation thread:\n\n${conversationText}\n\nPlease respond appropriately. Use the available tools if needed.` 
    },
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

  let finalMessage = response.choices[0].message.content || '';
  const hadToolCalls = toolResults.length > 0;

  // Strip any placeholder text that Grok might add (system appends URLs automatically)
  finalMessage = finalMessage
    .replace(/\s*\[link\]\s*/gi, '')
    .replace(/\s*More details:?\s*$/i, '')
    .replace(/\s*Click here:?\s*$/i, '')
    .replace(/\s*See more:?\s*$/i, '')
    .replace(/\s*Link:?\s*$/i, '')
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
      data: plugin.extractStorableData?.(toolResults) || undefined,
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
  const body: Record<string, unknown> = {
    model: 'grok-3-latest',
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

// Types
export interface GrokProcessResult {
  response: BotResponse;
  hadToolCalls: boolean;
  toolResults: ToolResult[];
}
