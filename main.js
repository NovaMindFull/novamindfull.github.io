const chatbox = document.getElementById('chatbox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const exportBtn = document.getElementById('exportBtn');
const importFile = document.getElementById('importFile');

let model = {};
let memory = {};

// Charger le modèle initial
fetch('weights.json')
  .then(res => res.json())
  .then(data => { model = data; });

// Ajouter un message au chat
function addMessage(text, sender) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${sender}`;
  msgDiv.innerText = text;
  chatbox.appendChild(msgDiv);
  chatbox.scrollTop = chatbox.scrollHeight;
}

// Obtenir réponse du modèle
function getResponse(input) {
  input = input.toLowerCase().trim();

  // Si déjà appris
  if(memory[input]) return memory[input];

  // Sinon réponse existante
  if(model[input]) return model[input];

  return model["default"];
}

// Entraîner le modèle localement
function trainModel(input, response) {
  memory[input.toLowerCase().trim()] = response;
}

// Envoyer message
function sendMessage() {
  const text = userInput.value;
  if (!text) return;
  addMessage(text, 'user');
  
  let response = getResponse(text);
  addMessage(response, 'bot');

  // Exemple simple d'apprentissage : si réponse = default, demander la correction
  if(response === model["default"]) {
    setTimeout(() => {
      const correction = prompt(`NovaMind n'a pas compris : "${text}". Quelle devrait être la réponse ?`);
      if(correction) trainModel(text, correction);
    }, 100);
  }

  userInput.value = '';
}

// Envoyer avec Enter
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
  if(e.key === 'Enter' && !e.shiftKey){
    e.preventDefault();
    sendMessage();
  }
});

// Exporter le modèle local
exportBtn.addEventListener('click', () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(memory, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", "novamind_memory.json");
  dlAnchor.click();
});

// Importer modèle sauvegardé
importFile.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(event) {
    const imported = JSON.parse(event.target.result);
    memory = {...memory, ...imported};
    alert("Modèle importé avec succès !");
  };
  reader.readAsText(file);
});
