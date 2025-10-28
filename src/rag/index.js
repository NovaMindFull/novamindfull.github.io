/**
 * Exemple minimal de pipeline RAG en Node.js (adaptable au front via fetch).
 * - indexDocuments(docs, embedClient, vectorClient)
 * - queryWithRag(question, embedClient, vectorClient, llmClient)
 *
 * Remarques :
 * - embedClient doit exposer embed(text) -> vector[] (float array)
 * - vectorClient doit exposer upsert(id, vector, metadata) et query(vector, topK) -> [{id, score, metadata}]
 * - llmClient doit exposer generate({ prompt, max_tokens, temperature }) -> { text }
 *
 * Adapte les clients (OpenAI, Cohere, HuggingFace embeddings, Pinecone, Weaviate, FAISS).
 */

const CHUNK_SIZE = 800; // caractères approximatifs (ou tokens selon outil)
const CHUNK_OVERLAP = 200;

function chunkText(text, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + size, text.length);
    chunks.push(text.slice(i, end));
    i = Math.max(end - overlap, end);
  }
  return chunks;
}

async function indexDocuments(docs, embedClient, vectorClient) {
  // docs: [{ id, title, text, url }]
  for (const doc of docs) {
    const chunks = chunkText(doc.text);
    for (let idx = 0; idx < chunks.length; idx++) {
      const content = chunks[idx];
      const embedding = await embedClient.embed(content);
      const id = `${doc.id}::${idx}`;
      const metadata = { docId: doc.id, title: doc.title, url: doc.url, chunkIndex: idx, content: content.slice(0, 200) };
      await vectorClient.upsert(id, embedding, metadata);
    }
  }
}

/**
 * Query pipeline:
 * 1) Embed question
 * 2) Retrieve topK chunks
 * 3) Construct prompt with retrieved context and user question (explicitly ask to cite sources)
 * 4) Call LLM
 */
async function queryWithRag(question, embedClient, vectorClient, llmClient, opts = {}) {
  const { topK = 3, systemPrompt = '', userPromptTemplate = '' } = opts;
  const qEmb = await embedClient.embed(question);
  const results = await vectorClient.query(qEmb, topK);

  // Compose context
  const sources = results.map((r, i) => ({ rank: i + 1, id: r.id, score: r.score, title: r.metadata.title, url: r.metadata.url, snippet: r.metadata.content }));
  const contextText = sources.map(s => `Source ${s.rank} — ${s.title} (${s.url}):\n${s.snippet}`).join('\n\n');

  // Build prompt: keep it conservative and instruct to cite sources
  const prompt = `
${systemPrompt}\n\nContexte récupéré :\n${contextText}\n\nQuestion de l'utilisateur : ${question}\n\nInstructions : Réponds en t'appuyant UNIQUEMENT sur le contexte fourni. Pour chaque affirmation factuelle, indique la source (titre + url). Si la réponse n'est pas dans le contexte, réponds "Information non trouvée dans les sources fournies."
  `;

  const llmResp = await llmClient.generate({ prompt, max_tokens: 512, temperature: 0.0 });
  return { answer: llmResp.text, sources };
}

module.exports = { chunkText, indexDocuments, queryWithRag };