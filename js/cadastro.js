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
    card.className = 'card h-100'; // Altura uniforme para todas as cards
    card.onclick = () => openTreino(index);
    const cardBody = document.createElement('div');
    cardBody.className =
      'card-body d-flex justify-content-between align-items-center'; // Flexbox para alinhar elementos
    const title = document.createElement('h5');
    title.className = 'card-title mb-0'; // Remove margem inferior para evitar espaçamento desnecessário
    title.textContent = treino.nome;

    // Botão de remoção
    const removeButton = document.createElement('button');
    removeButton.className = 'btn btn-danger btn-sm'; // Estilo de botão vermelho pequeno
    removeButton.innerHTML = `<i class="bi bi-trash"></i>`; // Ícone de lixeira
    removeButton.onclick = (event) => {
      event.stopPropagation(); // Evita que o clique no botão abra o modal
      showConfirmModal(index); // Mostra o modal de confirmação
    };

    // Adiciona os elementos ao corpo do card
    cardBody.appendChild(title);
    cardBody.appendChild(removeButton);
    card.appendChild(cardBody);
    col.appendChild(card);
    treinoList.appendChild(col);
  });
}

// Função para mostrar o modal de confirmação
function showConfirmModal(index) {
  // Armazena o índice do treino a ser removido
  const confirmModal = new bootstrap.Modal(
    document.getElementById('confirmModal')
  );
  document.getElementById('confirmRemove').onclick = () => {
    removeTreino(index); // Remove o treino após confirmação
    confirmModal.hide(); // Fecha o modal
  };
  confirmModal.show();
}

// Função para remover um treino
// Função para remover um treino
function removeTreino(index) {
  treinos.splice(index, 1);
  localStorage.setItem('treinos', JSON.stringify(treinos));
  renderTreinos();

  // Exibe o toast de sucesso
  const successToast = new bootstrap.Toast(
    document.getElementById('successToast'),
    {
      delay: 1000, // Duração de exibição (1.5 segundos)
      animation: true, // Ativa animações
    }
  );

  // Remove a classe 'hide' antes de mostrar o toast
  document.getElementById('successToast').classList.remove('hide');

  // Mostra o toast
  successToast.show();

  // Fecha o modal de confirmação
  const confirmModal = bootstrap.Modal.getInstance(
    document.getElementById('confirmModal')
  );
  confirmModal.hide();
}

// Adiciona um ouvinte de evento para ocultar o toast após ser fechado
document
  .getElementById('successToast')
  .addEventListener('hidden.bs.toast', function () {
    this.classList.add('hide'); // Adiciona a classe 'hide' novamente
  });

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
                  <div class="list-group-item exercise-card d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h6 class="mb-1">${exercicio.nome}</h6>
                      <p class="mb-0"><strong>Descrição:</strong> ${exercicio.descricao}</p>
                      <p class="mb-0"><strong>Séries:</strong> ${exercicio.series} | <strong>Repetições:</strong> ${exercicio.reps}</p>
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="removeExercise(${currentTreinoId}, ${idx})">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                `
              )
              .join('')}
          </div>
        `
        : '<p class="text-center text-muted">Nenhum exercício adicionado ainda.</p>'
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

// Função para adicionar um exercício ao treino selecionado
function addExercise() {
  const nome = document.getElementById('exercise-name').value.trim();
  const descricao =
    document.getElementById('exercise-description').value.trim() || '-';

  const series = document.getElementById('exercise-series').value.trim();
  const reps = document.getElementById('exercise-reps').value.trim();
  if (!nome || !series || !reps) {
    alert('Preencha todos os campos obrigatórios.');
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
  treinos[treinoId].exercicios.splice(exerciseId, 1);
  localStorage.setItem('treinos', JSON.stringify(treinos));
  updateExerciseList(treinos[treinoId]);
}

// Função para exportar os dados como PDF
// Função para exportar os dados como PDF
function exportToPDF() {
  const { jsPDF } = window.jspdf; // Importa a biblioteca
  const doc = new jsPDF();

  // Configurações iniciais
  let y = 20; // Posição vertical inicial
  const pageHeight = doc.internal.pageSize.height - 10; // Altura máxima da página (com margem)

  // Título do PDF
  doc.setFontSize(18);
  doc.text('Meus Treinos', 10, y);
  y += 15; // Espaçamento após o título

  treinos.forEach((treino, index) => {
    // Nome do treino
    doc.setFontSize(14);
    doc.text(`${index + 1}. ${treino.nome}`, 10, y);
    y += 10;

    if (treino.exercicios.length > 0) {
      treino.exercicios.forEach((exercicio, idx) => {
        // Verifica se há espaço suficiente na página atual
        if (y >= pageHeight) {
          doc.addPage(); // Adiciona uma nova página
          y = 20; // Reseta a posição vertical
        }

        // Exercício
        doc.setFontSize(12);
        doc.text(`- Exercício: ${exercicio.nome}`, 15, y);
        y += 6;

        // Descrição
        doc.setFontSize(10); // Tamanho menor para a descrição
        doc.text(`Descrição: ${exercicio.descricao}`, 15, y);
        y += 6;

        // Séries e Repetições
        doc.setFontSize(12);
        doc.text(
          `Séries: ${exercicio.series} | Repetições: ${exercicio.reps}`,
          15,
          y
        );
        y += 10;
      });
    } else {
      // Nenhum exercício adicionado
      doc.setFontSize(12);
      doc.text('Nenhum exercício adicionado.', 15, y);
      y += 10;
    }

    // Espaçamento entre treinos
    y += 5;

    // Verifica se há espaço suficiente para o próximo treino
    if (y >= pageHeight) {
      doc.addPage(); // Adiciona uma nova página
      y = 20; // Reseta a posição vertical
    }
  });

  // Salva o PDF
  // Gera o nome do arquivo com a data e hora atual
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Mês com dois dígitos
  const day = String(now.getDate()).padStart(2, '0'); // Dia com dois dígitos
  const hours = String(now.getHours()).padStart(2, '0'); // Hora com dois dígitos
  const minutes = String(now.getMinutes()).padStart(2, '0'); // Minutos com dois dígitos
  const seconds = String(now.getSeconds()).padStart(2, '0'); // Segundos com dois dígitos

  const fileName = `treino_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.pdf`;

  // Salva o PDF com o nome gerado
  doc.save(fileName);
}

// Inicializa a lista de treinos ao carregar a página
window.onload = renderTreinos;
