// scripts/convert_feedback_to_jsonl.js
// Convert stored feedback JSONL -> fine-tuning JSONL (OpenAI / generic instruction tuning format)
// Heuristique : si user a fourni 'comment' that appears as corrected assistant response, create a sample.
const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, '..', 'data', 'feedback.jsonl');
const OUTPUT = path.join(__dirname, '..', 'data', 'fine_tune_dataset.jsonl');

if (!fs.existsSync(INPUT)) {
  console.error('Aucun feedback trouvé:', INPUT);
  process.exit(1);
}

const lines = fs.readFileSync(INPUT, 'utf8').trim().split('\n');
const out = [];

for (const l of lines) {
  try {
    const fb = JSON.parse(l);
    // Simple heuristic: if comment is non-empty AND prompt+response present -> training pair
    if (fb.comment && fb.prompt && fb.response) {
      const prompt = `Instruction: Réponds à la question suivante de manière claire et utile.\n\nQuestion: ${fb.prompt}\n\nContrainte: Sois concis (<= 5 phrases) et corrige les erreurs de la réponse précédente.\n\nRéponse:`;
      const completion = ` ${fb.comment.trim()}\n`;
      out.push(JSON.stringify({ prompt, completion }));
    }
  } catch (e) {
    // skip malformed lines
  }
}

if (out.length === 0) {
  console.log('Aucun exemple convertible dans les feedbacks.');
} else {
  fs.writeFileSync(OUTPUT, out.join('\n') + '\n');
  console.log(`Dataset écrit dans ${OUTPUT} (${out.length} lignes)`);
}