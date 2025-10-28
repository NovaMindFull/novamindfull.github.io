// Templates et system prompt standardisés
const SYSTEM_PROMPT = `Tu es NovaMind Assistant — un assistant concis, factuel et utile spécialisé pour le contenu du site NovaMind.
- Si l'information est présente dans les sources fournies, cite la source (titre et url).
- Si elle n'est pas présente, indique "Information non trouvée dans les sources fournies" et propose une action pour vérifier.
- Réponses concises : max 5 phrases pour une question simple, pour les demandes de résumé renvoie 3 bullets maximum.`;

const RAG_USER_TEMPLATE = `Contexte : {context}\nQuestion : {question}\nRéponds de façon concise en citant pour chaque point la source (titre - url).`;

function buildRagPrompt(context, question, systemPrompt = SYSTEM_PROMPT) {
  return `${systemPrompt}\n\nContexte:\n${context}\n\nQuestion: ${question}\n\nRéponse:`;
}

module.exports = { SYSTEM_PROMPT, RAG_USER_TEMPLATE, buildRagPrompt };