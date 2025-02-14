// Variáveis globais
let currentTreinoId = null; // Armazena o ID do treino atualmente selecionado
const treinos = JSON.parse(localStorage.getItem('treinos')) || [];

// Função para renderizar a lista de treinos
function renderTreinos() {
  const treinoList = document.getElementById('treino-list');
  treinoList.innerHTML = ''; // Limpa a lista

  treinos.forEach((treino, index) => {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 mb-4';

    const card = document.createElement('div');
    card.className = 'card';
    card.onclick = () => openTreino(index);

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    const title = document.createElement('h5');
    title.className = 'card-title';
    title.textContent = treino.nome;

    // Botão de remoção
    const buttons = document.createElement('div');
    buttons.innerHTML = `
      <span class="btn-remove" onclick="removeTreino(${index}, event)">Remover</span>
    `;

    cardBody.appendChild(title);
    cardBody.appendChild(buttons);
    card.appendChild(cardBody);
    col.appendChild(card);
    treinoList.appendChild(col);
  });
}

// Função para abrir um treino específico
function openTreino(index) {
  currentTreinoId = index;

  const modal = new bootstrap.Modal(
    document.getElementById('addExerciseModal')
  );
  modal.show();

  // Renderiza os exercícios do treino
  updateExerciseList(treinos[index]);
}

// Função para atualizar a lista de exercícios no modal
function updateExerciseList(treino) {
  const exerciseList = document.getElementById('exercise-list');
  if (!exerciseList) return;

  exerciseList.innerHTML = `
${
  treino.exercicios.length > 0
    ? `
  <div class="list-group">
    ${treino.exercicios
      .map(
        (exercicio, idx) => `
      <div class="list-group-item exercise-card">
        <div>
          <h6>${exercicio.nome}</h6>
          <p><strong>Descrição:</strong> ${exercicio.descricao}</p>
          <p><strong>Séries:</strong> ${exercicio.series} | <strong>Repetições:</strong> ${exercicio.reps}</p>
        </div>
        <span class="btn-remove" onclick="removeExercise(${currentTreinoId}, ${idx})">Remover</span>
      </div>
    `
      )
      .join('')}
  </div>
`
    : '<p>Nenhum exercício adicionado ainda.</p>'
}
`;
}

// Função para adicionar um novo treino
function addTreino() {
  const treinoName = document.getElementById('treino-name').value.trim();
  if (!treinoName) {
    alert('Por favor, insira um nome para o treino.');
    return;
  }

  treinos.push({ nome: treinoName, exercicios: [] });
  localStorage.setItem('treinos', JSON.stringify(treinos));
  renderTreinos();

  // Fecha o modal
  const modal = bootstrap.Modal.getInstance(
    document.getElementById('addTreinoModal')
  );
  modal.hide();

  // Limpa o campo de nome
  document.getElementById('treino-name').value = '';
}

// Função para remover um treino
function removeTreino(index, event) {
  event.stopPropagation(); // Impede que o card abra o modal de exercícios
  if (confirm('Tem certeza que deseja remover este treino?')) {
    treinos.splice(index, 1);
    localStorage.setItem('treinos', JSON.stringify(treinos));
    renderTreinos();
  }
}

// Função para adicionar um exercício ao treino selecionado
function addExercise() {
  const nome = document.getElementById('exercise-name').value.trim();
  const descricao = document
    .getElementById('exercise-description')
    .value.trim();
  const series = document.getElementById('exercise-series').value.trim();
  const reps = document.getElementById('exercise-reps').value.trim();

  if (!nome || !descricao || !series || !reps) {
    alert('Preencha todos os campos.');
    return;
  }

  treinos[currentTreinoId].exercicios.push({
    nome,
    descricao,
    series: parseInt(series),
    reps,
  });

  localStorage.setItem('treinos', JSON.stringify(treinos));
  updateExerciseList(treinos[currentTreinoId]);

  // Limpa os campos do formulário
  document.getElementById('exercise-name').value = '';
  document.getElementById('exercise-description').value = '';
  document.getElementById('exercise-series').value = '';
  document.getElementById('exercise-reps').value = '';
}

// Função para remover um exercício
function removeExercise(treinoId, exerciseId) {
  if (confirm('Tem certeza que deseja remover este exercício?')) {
    treinos[treinoId].exercicios.splice(exerciseId, 1);
    localStorage.setItem('treinos', JSON.stringify(treinos));
    updateExerciseList(treinos[treinoId]);
  }
}

// Inicializa a lista de treinos ao carregar a página
window.onload = renderTreinos;
