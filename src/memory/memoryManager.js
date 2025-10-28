/**
 * Gestion mémoire conversationnelle simple :
 * - Stocke utterances importantes (user/assistant).
 * - Résume périodiquement l'historique pour conserver faits saillants.
 *
 * Strategy:
 * - Keep last N exchanges (ex: 6) raw, and keep a rolling "summary" for older exchanges.
 * - summary is produced via LLM summarization call.
 *
 * Usage: appendMessage(role, text), getContextForPrompt()
 */

const MAX_RAW_EXCHANGES = 6;

class MemoryManager {
  constructor(llmClient) {
    this.raw = []; // [{role, text, ts}]
    this.summary = ''; // rolling summary string
    this.llmClient = llmClient;
  }

  appendMessage(role, text) {
    this.raw.push({ role, text, ts: Date.now() });
    if (this.raw.length > MAX_RAW_EXCHANGES) {
      this._compress();
    }
  }

  async _compress() {
    // Keep last 3 raw messages, summarize the rest and merge into summary
    const keep = this.raw.splice(-3);
    const toSummarize = this.raw;
    if (toSummarize.length === 0) {
      this.raw = keep;
      return;
    }
    const concat = toSummarize.map(m => `${m.role}: ${m.text}`).join('\n');
    const prompt = `Résume les points importants et faits saillants suivants en 4 phrases max:\n\n${concat}`;
    const resp = await this.llmClient.generate({ prompt, max_tokens: 200, temperature: 0.0 });
    // Merge new summary with previous summary
    this.summary = [this.summary, resp.text].filter(Boolean).join('\n');
    // Keep only last 3 raw
    this.raw = keep;
  }

  getContextForPrompt() {
    const rawText = this.raw.map(m => `${m.role}: ${m.text}`).join('\n');
    const contextParts = [];
    if (this.summary) contextParts.push(`Résumé historique :\n${this.summary}`);
    if (rawText) contextParts.push(`Derniers échanges :\n${rawText}`);
    return contextParts.join('\n\n');
  }
}

module.exports = { MemoryManager };