import { validateConfig, config } from '../config';
import { xClient } from '../services/x-client';

/**
 * Utility script to view and manage stream rules
 * Run with: npm run setup-rules
 */
async function main(): Promise<void> {
  console.log('🔧 Stream Rules Manager\n');
  
  // Validate configuration
  try {
    validateConfig();
  } catch (error) {
    console.error('❌ Configuration error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
  
  const command = process.argv[2] || 'list';
  
  switch (command) {
    case 'list':
      await listRules();
      break;
    case 'add':
      await addDefaultRule();
      break;
    case 'clear':
      await clearRules();
      break;
    case 'reset':
      await clearRules();
      await addDefaultRule();
      break;
    default:
      console.log('Usage: npm run setup-rules [list|add|clear|reset]');
      console.log('  list  - Show current rules');
      console.log('  add   - Add the default mention rule');
      console.log('  clear - Delete all rules');
      console.log('  reset - Clear and re-add default rule');
  }
}

async function listRules(): Promise<void> {
  console.log('📋 Current stream rules:\n');
  
  const response = await xClient.getStreamRules();
  
  if (!response.data || response.data.length === 0) {
    console.log('  (no rules configured)');
    return;
  }
  
  for (const rule of response.data) {
    console.log(`  ID: ${rule.id}`);
    console.log(`  Value: ${rule.value}`);
    console.log(`  Tag: ${rule.tag || '(none)'}`);
    console.log('');
  }
}

async function addDefaultRule(): Promise<void> {
  console.log(`➕ Adding rule for @${config.botUsername}...\n`);
  
  const response = await xClient.addStreamRules([
    {
      value: `@${config.botUsername}`,
      tag: 'bot-mention',
    },
  ]);
  
  if (response.errors && response.errors.length > 0) {
    console.error('❌ Errors:', response.errors);
    return;
  }
  
  console.log('✅ Rule added successfully');
  console.log(`  Created: ${response.meta?.summary?.created || 0}`);
  console.log(`  Valid: ${response.meta?.summary?.valid || 0}`);
}

async function clearRules(): Promise<void> {
  console.log('🗑️  Clearing all rules...\n');
  
  const existing = await xClient.getStreamRules();
  
  if (!existing.data || existing.data.length === 0) {
    console.log('  No rules to clear');
    return;
  }
  
  const ids = existing.data.map(r => r.id!).filter(Boolean);
  
  await xClient.deleteStreamRules(ids);
  
  console.log(`✅ Deleted ${ids.length} rule(s)`);
}

main().catch(console.error);
