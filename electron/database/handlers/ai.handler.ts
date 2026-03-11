// ============================================================
// FinanceMe — AI Advisor IPC Handler
// Uses Groq (Llama 3) with BYOK (Bring Your Own Key).
// ============================================================

import { ipcMain } from 'electron';
import { getDb } from '../db';
import OpenAI from 'openai';

// ── Types ────────────────────────────────────────────────────

interface AIActionProposal {
  action: string;
  params: Record<string, unknown>;
  description: string;
}

interface AIChatResponse {
  text: string;
  actions?: AIActionProposal[];
}

// In-memory conversation history (per session)
let conversationHistory: { role: 'user' | 'assistant' | 'system'; content: string }[] = [];

// ── Helpers ──────────────────────────────────────────────────

function getFinancialContext(): string {
  const db = getDb();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  // Current user
  const user = db.prepare('SELECT * FROM users LIMIT 1').get() as any;
  if (!user) return 'No user found.';

  // Income & expenses this month
  const income = db.prepare(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'income' AND date LIKE ? || '%'`
  ).get(monthStr) as { total: number };

  const expense = db.prepare(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense' AND date LIKE ? || '%'`
  ).get(monthStr) as { total: number };

  const balance = income.total - expense.total;
  const safeToSpend = Math.max(0, (user.monthly_income * 0.8) - expense.total);

  // Budget overview
  const budgets = db.prepare(`
    SELECT b.amount as budget_amount, c.name as category_name,
      COALESCE((SELECT SUM(t.amount) FROM transactions t
        WHERE t.category_id = b.category_id AND t.type = 'expense'
        AND t.date LIKE ? || '%'), 0) as spent
    FROM budgets b
    JOIN categories c ON b.category_id = c.id
    WHERE b.month = ? AND b.year = ?
  `).all(monthStr, month, year) as any[];

  // Categories list
  const categories = db.prepare(
    `SELECT id, name, type FROM categories ORDER BY type, name`
  ).all() as any[];

  // Recent transactions (last 5)
  const recentTx = db.prepare(`
    SELECT t.amount, t.type, t.description, t.date, c.name as category_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    ORDER BY t.date DESC LIMIT 5
  `).all() as any[];

  // Savings goals
  const savings = db.prepare(
    `SELECT name, target_amount, current_amount, deadline FROM savings_goals WHERE is_completed = 0`
  ).all() as any[];

  return `
FINANCIAL CONTEXT (${monthStr}):
- User: ${user.name}
- Currency: ${user.currency}
- Monthly Income: ${user.monthly_income.toLocaleString()}
- This month's income: ${income.total.toLocaleString()}
- This month's expenses: ${expense.total.toLocaleString()}
- Balance (income - expense): ${balance.toLocaleString()}
- Safe to Spend: ${safeToSpend.toLocaleString()}

BUDGETS THIS MONTH:
${budgets.length > 0 ? budgets.map(b => `- ${b.category_name}: spent ${b.spent.toLocaleString()} / ${b.budget_amount.toLocaleString()}`).join('\n') : '- No budgets set'}

CATEGORIES AVAILABLE:
${categories.map(c => `- [${c.type}] ${c.name} (id: ${c.id})`).join('\n')}

RECENT TRANSACTIONS:
${recentTx.length > 0 ? recentTx.map(t => `- ${t.date} | ${t.type} | ${t.amount.toLocaleString()} | ${t.category_name || 'Uncategorized'} | ${t.description || ''}`).join('\n') : '- No recent transactions'}

SAVINGS GOALS:
${savings.length > 0 ? savings.map(s => `- ${s.name}: ${s.current_amount.toLocaleString()} / ${s.target_amount.toLocaleString()} (deadline: ${s.deadline || 'none'})`).join('\n') : '- No active savings goals'}
`.trim();
}

const SYSTEM_INSTRUCTION = `You are FinanceMe AI Advisor — a friendly, smart financial assistant embedded inside a personal finance desktop app called FinanceMe. You speak Bahasa Indonesia casually (like a helpful friend) but can switch to English if the user does.

Your capabilities:
1. Analyze the user's financial data and give smart, responsible advice.
2. Help them plan spending (date nights, trips, purchases) while keeping their budget healthy.
3. Suggest actions like creating budgets, recording transactions, or setting savings goals.

IMPORTANT RULES:
- You MUST always consider the user's current financial state before making suggestions.
- Be concise, warm, and encouraging. Use emojis sparingly for friendliness.
- If the user's finances are tight, be honest but supportive.
- **NEVER output an action block unless the user EXPLICITLY asks you to create, add, or set something (e.g., "bikin budget dong", "catat transaksiku", "buat savings goal").** 
- If the user is just asking for advice or chatting, DO NOT output any action blocks. Just reply with text.
- When you do output an ACTION block, ALWAYS output a special JSON block wrapped in \`\`\`action tags so the app can parse it.
- NEVER execute actions directly. Always propose them via the \`\`\`action block so the user can approve or reject them via the UI.

ACTION FORMAT:
When suggesting an action, include this JSON in your response:
\`\`\`action
{
  "action": "create_budget" | "create_transaction" | "create_savings_goal",
  "params": { ... },
  "description": "Human-readable description of what this action does"
}
\`\`\`

For create_budget params: { "category_id": number, "category_name": string, "amount": number, "month": number, "year": number }
For create_transaction params: { "type": "income" | "expense", "amount": number, "category_id": number, "category_name": string, "description": string, "date": "YYYY-MM-DD" }
For create_savings_goal params: { "name": string, "target_amount": number, "deadline": "YYYY-MM-DD" | null }

You can include multiple action blocks if needed.`;

// ── Helper: get API key from DB ──────────────────────────────

function getApiKey(): string | null {
  const db = getDb();
  try {
    const columns = db.prepare("PRAGMA table_info(users)").all() as any[];
    const hasColumn = columns.some((c: any) => c.name === 'groq_api_key');
    if (!hasColumn) return null;
    const user = db.prepare("SELECT groq_api_key FROM users LIMIT 1").get() as any;
    return user?.groq_api_key || null;
  } catch {
    return null;
  }
}

// ── Handler Registration ─────────────────────────────────────

export function registerAIHandlers(): void {
  const db = getDb();

  // Save API key
  ipcMain.handle('ai:saveKey', (_event, apiKey: string) => {
    try {
      const columns = db.prepare("PRAGMA table_info(users)").all() as any[];
      const hasColumn = columns.some((c: any) => c.name === 'groq_api_key');
      if (!hasColumn) {
        db.exec("ALTER TABLE users ADD COLUMN groq_api_key TEXT");
      }
      db.prepare("UPDATE users SET groq_api_key = ? WHERE id = (SELECT id FROM users LIMIT 1)").run(apiKey);
      return { success: true };
    } catch (err: any) {
      console.error('[AI] Failed to save key:', err);
      return { success: false, error: err.message };
    }
  });

  // Get API key (masked for display)
  ipcMain.handle('ai:getKey', () => {
    const key = getApiKey();
    if (!key) return { hasKey: false, maskedKey: '' };
    const masked = key.substring(0, 6) + '••••••••' + key.substring(key.length - 4);
    return { hasKey: true, maskedKey: masked };
  });

  // Clear conversation history
  ipcMain.handle('ai:clearHistory', () => {
    conversationHistory = [];
    return { success: true };
  });

  // List available Groq models
  ipcMain.handle('ai:listModels', async () => {
    try {
      const apiKey = getApiKey();
      if (!apiKey) return { success: false, models: [], error: 'No API key' };

      const client = new OpenAI({ apiKey, baseURL: 'https://api.groq.com/openai/v1' });
      const list = await client.models.list();
      const models: { id: string; owned_by: string }[] = [];
      for await (const model of list) {
        models.push({ id: model.id, owned_by: model.owned_by });
      }

      console.log('[AI] ── Available Groq Models ──────────────────');
      for (const m of models) {
        console.log(`  • ${m.id} (owned by: ${m.owned_by})`);
      }
      console.log(`[AI] Total: ${models.length} models available.`);

      return { success: true, models };
    } catch (err: any) {
      console.error('[AI] ListModels error:', err);
      return { success: false, models: [], error: err.message };
    }
  });

  // Chat with AI
  ipcMain.handle('ai:chat', async (_event, message: string): Promise<AIChatResponse> => {
    try {
      // 1. Get API key
      const apiKey = getApiKey();
      if (!apiKey) throw new Error('API Key belum diatur. Silakan masukkan Groq API Key di Settings.');

      // 2. Build context
      const financialContext = getFinancialContext();

      // 3. Initialize Groq client (OpenAI-compatible)
      const client = new OpenAI({
        apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
      });

      // 4. Add user message to history
      conversationHistory.push({ role: 'user', content: message });

      // 5. Build messages array with system prompt
      const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        { role: 'system', content: SYSTEM_INSTRUCTION + '\n\n' + financialContext },
        ...conversationHistory,
      ];

      // 6. Call Groq
      const completion = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
      });

      const responseText = completion.choices[0]?.message?.content || '';

      // 7. Add assistant response to history
      conversationHistory.push({ role: 'assistant', content: responseText });

      // 8. Parse action blocks from response
      const actions: AIActionProposal[] = [];
      const actionRegex = /```action\s*\n([\s\S]*?)```/g;
      let match;
      while ((match = actionRegex.exec(responseText)) !== null) {
        try {
          const parsed = JSON.parse(match[1]);
          actions.push(parsed);
        } catch {
          console.warn('[AI] Failed to parse action block:', match[1]);
        }
      }

      // 9. Clean text (remove action blocks for display)
      const cleanText = responseText.replace(/```action\s*\n[\s\S]*?```/g, '').trim();

      return { text: cleanText, actions };
    } catch (err: any) {
      console.error('[AI] Chat error:', err);
      throw new Error(err.message || 'Gagal menghubungi AI. Periksa koneksi internet dan API Key.');
    }
  });

  // Log available models on startup (non-blocking)
  logAvailableModels();
}

/** Fetch and log available Groq models (called once at startup) */
async function logAvailableModels() {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.log('[AI] No Groq API key configured — skipping model listing.');
      return;
    }

    const client = new OpenAI({ apiKey, baseURL: 'https://api.groq.com/openai/v1' });
    const list = await client.models.list();
    const models: string[] = [];
    for await (const model of list) {
      models.push(model.id);
    }

    console.log('[AI] ── Available Grok Models ──────────────────');
    for (const id of models) {
      console.log(`  • ${id}`);
    }
    console.log(`[AI] Total: ${models.length} models available.`);
  } catch (err) {
    console.warn('[AI] Could not list models on startup:', err);
  }
}
