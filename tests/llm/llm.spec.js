// Exemple de tests Jest basiques pour vérifier la cohérence des réponses
// Adaptable selon le client utilisé (mocks).
const { chunkText } = require('../../src/rag/index');

test('chunkText coupe correctement pour petits textes', () => {
  const t = 'a'.repeat(100);
  const chunks = chunkText(t, 50, 10);
  expect(chunks.length).toBeGreaterThanOrEqual(2);
});

test('chunkText gère texte court', () => {
  const t = 'Bonjour';
  const chunks = chunkText(t, 50, 10);
  expect(chunks.length).toBe(1);
});