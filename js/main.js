// Carrega os treinos do localStorage
const treinos = JSON.parse(localStorage.getItem('treinos')) || [];

// Função para renderizar os treinos
function renderTreinos() {
  const treinoList = document.getElementById('treino-list');
  treinoList.innerHTML = ''; // Limpa a lista

  treinos.forEach((treino, treinoIndex) => {
    const treinoDiv = document.createElement('div');
    treinoDiv.innerHTML = `
       <h2 class="treino-header">${treino.nome}</h2>
       <div class="row">
         ${treino.exercicios
           .map(
             (exercicio, index) => `
           <div class="col-md-6 col-lg-4">
             <div data-id="treino-${treinoIndex}-exercise-${index}" onclick="toggleCompleted(this)" class="card">
               <div class="card-body">
                 <h5 class="card-title">${exercicio.nome}</h5>
                 <p class="card-text"><strong>Descrição:</strong> ${exercicio.descricao}</p>
                 <p class="card-text"><strong>Séries:</strong> ${exercicio.series} | <strong>Repetições:</strong> ${exercicio.reps}</p>
               </div>
             </div>
           </div>
         `
           )
           .join('')}
       </div>
     `;
    treinoList.appendChild(treinoDiv);
  });
}

// Função para marcar/desmarcar exercícios concluídos
function toggleCompleted(card) {
  const id = card.getAttribute('data-id');
  card.classList.toggle('completed');

  // Salva o estado no localStorage
  let completedExercises =
    JSON.parse(localStorage.getItem('completedExercises')) || {};
  if (card.classList.contains('completed')) {
    completedExercises[id] = true;
  } else {
    delete completedExercises[id];
  }
  localStorage.setItem(
    'completedExercises',
    JSON.stringify(completedExercises)
  );
}

// Função para carregar o estado salvo no localStorage
function loadCompletedExercises() {
  const completedExercises =
    JSON.parse(localStorage.getItem('completedExercises')) || {};
  for (const id in completedExercises) {
    const card = document.querySelector(`[data-id="${id}"]`);
    if (card) {
      card.classList.add('completed');
    }
  }
}

// Função para resetar todos os treinos
function resetAll() {
  const cards = document.querySelectorAll('.card');
  cards.forEach((card) => {
    card.classList.remove('completed');
  });
  localStorage.removeItem('completedExercises');
}

// Renderiza os treinos ao carregar a página
window.onload = () => {
  renderTreinos();
  loadCompletedExercises();
};
