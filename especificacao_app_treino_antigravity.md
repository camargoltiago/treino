# Especificação para o Antigravity — Meu Treino Híbrido

## Objetivo

Crie um aplicativo web **funcional**, mobile-first, para acompanhar meu treino de hipertrofia e pump. Entregue o código em **um arquivo `index.html`**, usando **HTML5, Tailwind CSS via CDN e JavaScript puro**. Não crie apenas um mockup: todos os controles precisam funcionar. Não use backend, autenticação ou banco remoto. Os dados devem persistir no **`localStorage`** do navegador.

O aplicativo deve funcionar em desktop e celular, com interface moderna, escura (dark mode por padrão), acessível, limpa e prática de operar durante o treino. Utilize Tailwind CSS para o visual; ícones podem ser SVG inline ou biblioteca via CDN. Não dependa de build, Node.js ou frameworks.

## Treinos cadastrados inicialmente

Cadastrar exatamente os exercícios, séries e faixas de repetições abaixo, na ordem indicada. Os valores são **metas**, não registros de séries já realizadas. Não preencher cargas iniciais fictícias.

### Treino A — Segunda-feira — Upper Body (Hipertrofia)

| ID | Exercício | Séries previstas | Repetições por série | Descanso | Observações |
|---|---|---:|---|---|---|
| A1 | Supino inclinado com halteres | 3 | 8–12 | 120 s (até 180 s se necessário) | Peito superior; descida controlada |
| A2 | Puxada frontal na máquina | 3 | 8–12 | 120 s (até 180 s se necessário) | Costas; evitar balanço do tronco |
| A3 | Supino reto com barra | 3 | 8–10 | 120 s (até 180 s se necessário) | Peito; amplitude segura |
| A4 | Remada sentada no cabo | 3 | 10–12 | 120 s (até 180 s se necessário) | Costas; não impulsionar com lombar |
| A5 | Elevação lateral com halteres | 3 | 12–15 | 60–90 s | Ombros; controlar descida |
| A6 | Rosca direta com barra | 3 | 10–12 | Bi-set com A7 | Bíceps |
| A7 | Tríceps pulley com barra V | 3 | 10–15 | 60–90 s após o par | Tríceps |

**Bi-set A6 + A7:** fazer uma série de rosca direta e uma de tríceps pulley em sequência, sem descanso programado entre elas; descansar 60–90 segundos depois do par. Repetir 3 vezes. Total: **21 séries previstas**.

### Treino B — Quarta-feira — Lower Body (Hipertrofia)

| ID | Exercício | Séries previstas | Repetições por série | Descanso | Observações |
|---|---|---:|---|---|---|
| B1 | Agachamento completo com barra | 3 | 6–10 | 120–180 s | Técnica e amplitude segura |
| B2 | Leg press 45 graus | 3 | 10–12 | 120–180 s | Controlar descida; não tirar quadril do banco |
| B3 | Levantamento terra romeno com barra | 3 | 8–12 | 120–180 s | Quadril para trás; coluna neutra |
| B4 | Cadeira extensora | 3 | 12–15 | 60–90 s | Drop-set opcional na última série |
| B5 | Mesa flexora deitada | 3 | 10–15 | 60–90 s | Controlar retorno |
| B6 | Panturrilha em pé na máquina | 4 | 12–20 | 60–90 s | Amplitude controlada |
| B7 | Abdominal na polia | 3 | 12–15 | 60–90 s | Flexionar tronco, sem puxar com braços |

**Drop-set B4:** na última série, permitir marcar a execução de um drop-set opcional, reduzindo a carga aproximadamente 25–30% e fazendo repetições adicionais controladas. Registrar o drop-set separadamente para não confundir com as 3 séries previstas. Total: **22 séries previstas**, excluindo a série adicional opcional do drop-set.

### Treino C — Sexta-feira — Full Body (Pump)

| ID | Exercício | Séries previstas | Repetições por série | Descanso | Observações |
|---|---|---:|---|---|---|
| C1 | Leg press horizontal | 3 | 10–15 | 90–120 s | Quadríceps e glúteos |
| C2 | Cadeira flexora sentada | 3 | 12–15 | 60–90 s | Posteriores de coxa |
| C3 | Supino reto na máquina | 3 | 10–12 | 90–120 s | Peito |
| C4 | Remada articulada na máquina | 3 | 10–12 | 90–120 s | Costas |
| C5 | Elevação lateral na polia | 3 | 12–20 | 60–90 s | Deltoides laterais |
| C6 | Rosca martelo com corda | 2 | 12–15 | Bi-set com C7 | Bíceps e braquial |
| C7 | Tríceps corda na polia | 2 | 12–15 | 60–90 s após o par | Tríceps |
| C8 | Panturrilha sentada | 3 | 12–20 | 60–90 s | Panturrilhas |

**Bi-set C6 + C7:** executar uma série de cada exercício sem descanso programado entre eles; descansar 60–90 segundos após o par. Repetir 2 vezes. Total: **22 séries previstas**.

**Cardio opcional nos três dias:** caminhada em esteira por 10 minutos após a musculação. Mostrar como atividade complementar, com checkbox próprio, **sem contabilizar como série de musculação**.

## Funcionalidades obrigatórias

### 1. Tela inicial

- Cabeçalho com nome do aplicativo, data atual e atalho para histórico.
- Três cards: **Treino A — Upper**, **Treino B — Lower**, **Treino C — Full Body**; mostrar dia sugerido, grupos musculares, quantidade de exercícios e séries previstas.
- Destacar o treino sugerido para o dia, mas **não bloquear** iniciar qualquer um dos três em qualquer data.
- Mostrar resumo da última sessão de cada treino, se existir.
- Botão **Iniciar treino** ou **Continuar treino** quando houver sessão em andamento.

### 2. Sessão de treino e registro por série

- Ao iniciar, criar uma **sessão com ID único**, treino escolhido, horário de início, status `em_andamento` e exercícios planejados.
- Cada exercício aparece em um card com nome, grupo muscular, meta de séries e repetições, descanso e botão **Como fazer?**.
- Exibir uma linha por série prevista: `Série 1`, `Série 2` etc., com **input de carga (kg)**, **input de repetições realizadas** e **checkbox/botão Concluir série**.
- Aceitar cargas decimais em kg (ex.: 12,5) e repetições inteiras não negativas; usar teclado numérico no celular. Diferenciar claramente **repetições planejadas** das **realizadas**.
- Uma série só pode ser concluída quando seus campos obrigatórios de carga e repetições estiverem válidos. Permitir **0 kg** para exercícios com peso corporal ou sem carga externa; mostrar dica explicativa. Permitir desmarcar e editar uma série já concluída.
- Para exercícios com halteres, esclarecer na interface que o valor em kg é **por halter**, quando aplicável; para os demais, carga indicada no aparelho/barra conforme o usuário informar.
- Exibir **Concluir exercício** depois de registrar as séries, mas permitir que o usuário marque o exercício como concluído manualmente mesmo se tiver feito menos séries do que o planejado. Nesse caso, pedir confirmação e registrar a quantidade realmente feita; nunca fabricar séries faltantes.
- Progresso visual da sessão: séries realizadas / séries previstas e exercícios concluídos / total. Calcular progresso com base em dados reais, sem contar drop-set extra como série prevista.
- Permitir adicionar **série extra**, excluir série extra e registrar observações por exercício; preservar a distinção entre série prevista e extra.
- Permitir registrar **drop-set opcional** no B4 como uma série adicional com carga, repetições e conclusão independentes.
- Permitir **finalizar treino** com confirmação e resumo, mesmo que existam exercícios pendentes (avisar quais). Registrar horário final e duração. Oferecer **Cancelar treino** com confirmação clara; não apagar automaticamente sessões históricas.
- Botão para retomar sessão em andamento depois de fechar/reabrir o navegador.

### 3. Modal explicativo de cada exercício

- Todo card deve ter botão visível **Como fazer?**, que abre um **modal de verdade**, com título, músculos trabalhados, posição inicial, execução passo a passo, respiração, erros comuns, dicas de segurança e meta de séries/repetições.
- Criar **conteúdo específico para cada um dos 22 exercícios únicos** (reutilizar a explicação quando o exercício for o mesmo). Não usar textos genéricos idênticos em todos.
- Exemplos de pontos importantes: supino com ombros estáveis e sem quicar barra; agachamento com coluna estável e amplitude confortável; terra romeno com dobradiça de quadril e coluna neutra; leg press sem arredondar lombar; elevação lateral sem impulso; exercícios na polia sem trancos.
- Adicionar pequenos avisos para interromper caso haja dor aguda e ajustar amplitude/carga à capacidade individual. Não fazer afirmações médicas nem prometer resultados.
- Modal responsivo, rolável em telas pequenas, com botão fechar, fechamento por Escape e clique fora (quando apropriado), foco acessível e retorno de foco ao botão de origem.
- Não inventar vídeos, links ou imagens externos. Pode usar pequenos ícones/ilustrações SVG simples opcionais; o conteúdo textual deve ser suficiente.

### 4. Cronômetro de descanso

- Ao concluir uma série, oferecer/iniciar automaticamente cronômetro com duração padrão do exercício. Para intervalos em faixa, escolher um padrão dentro da faixa e permitir ajuste rápido (ex.: 60, 90, 120, 180 segundos).
- Mostrar contagem regressiva fixa e discreta, com pausar, reiniciar e pular.
- Para bi-sets, não iniciar descanso entre o primeiro e o segundo exercício do par; iniciar após concluir a série correspondente do segundo exercício.
- Persistir o horário-alvo do descanso, de forma que a contagem permaneça correta após atualizar a página. Não depender somente de `setInterval` para medir o tempo decorrido.
- Aviso visual ao terminar; áudio opcional somente após interação do usuário e respeitando restrições do navegador.

### 5. Histórico e evolução

- Listar sessões concluídas em ordem cronológica reversa, com data, treino, duração, exercícios, séries, cargas e repetições.
- Abrir detalhes de qualquer sessão histórica sem sobrescrevê-la.
- Mostrar **última carga registrada** de cada exercício ao iniciar uma nova sessão, como sugestão editável, sem preencher automaticamente como série concluída.
- Exibir evolução simples por exercício (ex.: melhor carga e histórico de cargas/repetições), sem tratar carga máxima isolada como medida definitiva de hipertrofia.
- Calcular volume por exercício/sessão como `soma(carga_kg × repetições)` apenas quando fizer sentido; sinalizar que esse cálculo é aproximado e não comparável diretamente entre aparelhos ou exercícios diferentes.
- Permitir excluir uma sessão do histórico somente com confirmação explícita.

### 6. Persistência e backup

- Persistir automaticamente no `localStorage` **a cada alteração**: pesos, repetições, checkboxes, notas, sessões em andamento, histórico e descanso.
- Usar uma chave versionada, por exemplo `meu_treino_hibrido_v1`, com estrutura JSON consistente e funções centralizadas `loadState()` e `saveState()`.
- Inicializar o plano padrão apenas quando não houver dados salvos; nunca sobrescrever histórico ao atualizar/recarregar a página.
- Validar dados carregados e tratar JSON inválido/indisponibilidade ou limite de armazenamento com mensagem amigável, sem quebrar toda a interface.
- Incluir botões **Exportar backup JSON** e **Importar backup JSON** com validação e confirmação antes de substituir dados existentes.
- Explicar discretamente que os dados ficam **somente neste navegador/dispositivo**, não sincronizam entre dispositivos e podem ser perdidos ao limpar dados do site.
- Para funcionar corretamente com `localStorage`, orientar abrir por um servidor local simples (ex.: Live Server), pois comportamento de `file://` pode variar entre navegadores.

## Regras gerais do treino

- Foco em hipertrofia e pump, mas não equiparar pump a crescimento muscular.
- Orientação geral: manter cerca de 1–2 repetições em reserva na maioria das séries, priorizando técnica.
- Sugerir aumento de carga quando todas as séries atingirem o topo da faixa de repetições com boa execução, sem automatizar aumentos de carga.
- Cardio opcional de 10 minutos ao final de cada sessão.
- Duração estimada de cada treino: aproximadamente 60–70 minutos, variável.
- Planejamento inicial: 6–8 semanas, sem apagar dados após esse período.

## UX e aparência

- Visual de app fitness premium, dark mode, cards arredondados, contraste alto, hierarquia visual clara e destaque de ações concluídas.
- Mobile-first; botões grandes e espaçados, inputs confortáveis para digitar com uma mão, cabeçalho de progresso e ações principais facilmente acessíveis.
- Estados claros: pendente, em andamento, série concluída, exercício concluído, treino finalizado.
- Mostrar toast de salvamento/erro sem interromper a sessão.
- Não usar formulários enormes; expandir/colapsar cards de exercícios, mantendo fácil acesso aos inputs.
- Acessibilidade: labels em inputs, botões reais, navegação por teclado, atributos ARIA pertinentes e modal acessível.

## Estrutura técnica sugerida

- Arquivo principal obrigatório: `index.html`, autocontido, com `<style>` mínimo quando Tailwind não cobrir e `<script>` JavaScript no final do documento.
- Tailwind CSS via CDN. Nenhuma API paga, nenhuma chave secreta, nenhum backend.
- Separar logicamente no JS: `workoutPlans`, `exerciseGuides`, `state`, `storage`, `render`, `events`, `timer` e `history`.
- IDs estáveis para treinos, exercícios, sessões e séries. Não usar nome exibido como chave primária.
- Evitar `innerHTML` com dados digitados pelo usuário sem sanitização; usar `textContent` ou escaping apropriado.
- Tratar mudanças de dia, recarregamento, múltiplas sessões históricas e edição de séries sem duplicar registros.
- Caso precise usar vários arquivos auxiliares por organização, ainda assim entregar um `index.html` que abra a aplicação e explicar a estrutura; a preferência é **um HTML único**.

## Critérios de aceite — testar antes de entregar

1. Abro o aplicativo, escolho Treino A e começo uma sessão.
2. Digito `20` kg e `10` repetições na primeira série do supino, concluo a série e vejo progresso atualizado.
3. Recarrego a página: os dados e a sessão em andamento continuam presentes.
4. Abro **Como fazer?** do supino e vejo explicações específicas; consigo fechar o modal.
5. Registro menos séries que o planejado, concluo o exercício e o app mantém a contagem real.
6. Concluo um bi-set e o descanso começa **depois do par**, não no meio.
7. Finalizo o treino e vejo o histórico com as cargas, repetições e horário.
8. Inicio outra sessão e vejo as cargas anteriores como referência, sem séries previamente marcadas como feitas.
9. Registro o drop-set de B4 e ele aparece no histórico sem alterar a meta de 3 séries normais.
10. Exporto JSON, limpo os dados após confirmação e importo o backup; o histórico é restaurado.
11. Testo a interface em largura de celular e desktop sem elementos cortados.

**Entrega esperada:** criar o arquivo `index.html` completo e funcional, com o treino já cadastrado, interface pronta e todas as interações implementadas. Não responder apenas com descrição, pseudocódigo ou telas estáticas. Se algo não puder ser implementado, informar exatamente a limitação e não simular funcionalidade.
