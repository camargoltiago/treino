import { ExerciseGuide } from '../types';

export const EXERCISE_GUIDES: Record<string, ExerciseGuide> = {
  'A1': {
    title: 'Supino inclinado com halteres',
    targetMuscles: 'Peitoral maior (feixe clavicular/superior), deltoide anterior e tríceps braquial.',
    setup: 'Ajuste o banco em uma inclinação entre 30° e 45° (mais que 45° transfere excessivamente a tensão para os ombros). Sente-se com as costas apoiadas, escápulas retraídas e deprimidas (peito aberto). Pés firmemente plantados no chão.',
    execution: '1. Com um halter em cada mão na altura da clavícula e cotovelos a ~60° do tronco, empurre os halteres para cima e ligeiramente para dentro em arco suave.\n2. Não encoste os halteres nem estenda os cotovelos a ponto de desarmar as escápulas.\n3. Desça controlando o peso por 2 a 3 segundos até sentir um alongamento vigoroso e seguro no peitoral.',
    breathing: 'Inspire profundamente durante a descida (fase excêntrica) abrindo a caixa torácica; expire na subida ultrapassando a metade do movimento.',
    mistakes: 'Banco excessivamente inclinado; abrir cotovelos a 90° em relação ao corpo (estresse no manguito rotador); quicar os halteres ou soltá-los descontroladamente.',
    safety: 'A carga informada deve ser POR HALTER (ex: 20 kg = um halter de 20 kg em cada mão). Em caso de falha, apoie os halteres nas coxas com cuidado.'
  },
  'A2': {
    title: 'Puxada frontal na máquina',
    targetMuscles: 'Latíssimo do dorso (grande dorsal), romboides, trapézio e bíceps.',
    setup: 'Ajuste o rolo acolchoado para que suas coxas fiquem bem firmes e travadas. Segure a barra na pegada pronada com largura um pouco maior que a dos ombros. Sente-se com o tronco levemente inclinado para trás (10-15°).',
    execution: '1. Inicie deprimindo as escápulas ("puxe os ombros para baixo").\n2. Em seguida, puxe a barra conduzindo o movimento com os cotovelos em direção ao topo do peito / osso esterno.\n3. Segure 1 segundo no pico de contração e retorne de forma estritamente controlada até estender os braços e alongar as dorsais.',
    breathing: 'Expire ao puxar a barra até o peito; inspire de forma controlada enquanto a barra sobe.',
    mistakes: 'Jogar o tronco excessivamente para trás usando embalo; puxar a barra atrás do pescoço (risco cervical grave); encolher os ombros.',
    safety: 'Evite trancos no final da subida da torre de placas para não sobrecarregar as articulações dos ombros.'
  },
  'A3': {
    title: 'Supino reto com barra',
    targetMuscles: 'Peitoral maior (porção esternal/média), tríceps braquial e deltoide anterior.',
    setup: 'Deite-se no banco plano com os olhos diretamente alinhados abaixo da barra. Pés apoiados firmemente no chão. Faça a retração e depressão escapular, criando um arco lombar natural anatômico. Pegada ligeiramente mais larga que os ombros, polegares travando a barra.',
    execution: '1. Tire a barra do suporte com braços estendidos e estabilizados.\n2. Desça a barra de forma lenta e controlada até tocar suavemente a linha média/inferior do peito.\n3. Mantenha os cotovelos a ~45–75° do tronco.\n4. Empurre com firmeza, aproveitando a firmeza dos pés no chão (leg drive), sem desencaixar as escápulas no topo.',
    breathing: 'Inspire e trave a respiração na descida para manter o tórax rígido e seguro; solte o ar na parte final da subida.',
    mistakes: 'Bater e quicar a barra no esterno; cotovelos abertos em 90° alinhados aos ombros; levantar o quadril ou os pés do banco.',
    safety: 'Sempre utilize as travas de proteção do rack. Mantenha os punhos neutros e retos, nunca hiperestendidos para trás.'
  },
  'A4': {
    title: 'Remada sentada no cabo',
    targetMuscles: 'Trapézio médio e inferior, romboides, grande dorsal e bíceps.',
    setup: 'Sente-se no aparelho de polia baixa. Apoie os pés nas plataformas com os joelhos ligeiramente destravados. Segure o puxador triângulo mantendo a coluna ereta, peito aberto e ombros para trás.',
    execution: '1. Com o tronco estabilizado na vertical, puxe o pegador em direção ao abdômen inferior (linha do umbigo).\n2. Concentre-se em puxar com os cotovelos para trás e aproximar ao máximo as escápulas no final.\n3. Retorne de forma lenta e cadenciada, permitindo que as escápulas se abram sem curvar a lombar.',
    breathing: 'Expire enquanto traciona o cabo em direção ao abdômen; inspire ao estender os braços controlando o peso.',
    mistakes: 'Balançar o tronco para a frente e para trás como um pêndulo; curvar a região lombar para puxar mais carga; puxar para a altura do peito encolhendo os ombros.',
    safety: 'A estabilidade lombar é prioritária. O movimento é dorsal e escapular, não de flexão/extensão da coluna.'
  },
  'A5': {
    title: 'Elevação lateral com halteres',
    targetMuscles: 'Deltoide lateral (porção média dos ombros).',
    setup: 'Fique em pé com os pés na largura dos quadris, joelhos levemente destravados e tronco ligeiramente inclinado para a frente (~10°). Segure os halteres ao lado das coxas com pegada neutra.',
    execution: '1. Eleve os braços lateralmente no plano escapular (cerca de 20° à frente da linha do corpo pura) até a altura dos ombros.\n2. Mantenha uma leve flexão nos cotovelos. Cotovelo e punho devem subir alinhados.\n3. Controle a descida por 2 segundos resistindo à gravidade.',
    breathing: 'Expire ao elevar os halteres até a linha do ombro; inspire na descida controlada.',
    mistakes: 'Jogar o corpo para trás usando impulso com as pernas; elevar acima da linha dos ombros girando o polegar para baixo; deixar os cotovelos caírem abaixo dos punhos.',
    safety: 'Carga por halter. A elevação lateral responde muito melhor a técnica impecável e tempo sob tensão do que a cargas excessivas que desgastam o manguito.'
  },
  'A6': {
    title: 'Rosca direta com barra',
    targetMuscles: 'Bíceps braquial, braquial anterior e braquiorradial.',
    setup: 'Em pé, postura ereta, abdômen contraído e pés firmes. Segure a barra (reta ou W) com pegada supinada (palmas para cima) na largura dos ombros. Cotovelos encostados nas laterais do abdômen.',
    execution: '1. Flexione os cotovelos erguendo a barra em direção aos ombros, mantendo os cotovelos totalmente imóveis na lateral do corpo.\n2. Aperte o bíceps no topo por 1 segundo.\n3. Desça a barra de maneira cadenciada até a extensão quase total dos braços.',
    breathing: 'Expire na subida da barra; inspire na descida excêntrica.',
    mistakes: 'Balançar as costas para iniciar o movimento; jogar os cotovelos para a frente eliminando a tensão no bíceps; soltar o peso na descida.',
    safety: 'Exercício em BI-SET com A7: assim que terminar as repetições de A6, vá imediatamente para o A7 sem descanso!'
  },
  'A7': {
    title: 'Tríceps pulley com barra V',
    targetMuscles: 'Tríceps braquial (todas as três cabeças, com ênfase lateral/medial).',
    setup: 'De frente para o cabo com a barra V acoplada à polia alta. Segure a barra com pegada pronada firme. Dê um passo para trás, incline o tronco ligeiramente para a frente e trave os cotovelos junto às costelas.',
    execution: '1. Empurre a barra para baixo exclusivamente pela extensão dos cotovelos, até travar os braços na posição inferior com contração máxima do tríceps.\n2. Retorne o movimento até os antebraços formarem um ângulo de aproximadamente 90° com o braço, sem permitir que os cotovelos se movam para a frente.',
    breathing: 'Expire ao empurrar a barra para baixo; inspire controladamente no retorno.',
    mistakes: 'Subir os cotovelos junto com a barra; usar o peso do tronco para pressionar a barra; abrir excessivamente os cotovelos.',
    safety: 'DESCANSO DO BI-SET: Ao concluir cada série do A7, o descanso do par (60–90 s) deve ser iniciado no cronômetro antes de repetir o bi-set.'
  },
  'B1': {
    title: 'Agachamento completo com barra',
    targetMuscles: 'Quadríceps, glúteo máximo, adutores, core e eretores da espinha.',
    setup: 'Posicione a barra sobre a musculatura do trapézio (barra alta ou baixa segura). Pés afastados na largura dos ombros com pontas apontando levemente para fora (15–30°). Cotovelos apontados para baixo e peito erguido.',
    execution: '1. Puxe o ar inflando o abdômen e estabilizando a coluna (manobra de Valsalva).\n2. Inicie o agachamento flexionando simultaneamente quadris e joelhos, descendo como se fosse sentar entre as pernas.\n3. Desça até pelo menos as coxas ficarem paralelas ao chão (ou abaixo se sua mobilidade mantiver a lombar neutra).\n4. Suba empurrando o chão pelo meio do pé de maneira vigorosa e estável.',
    breathing: 'Inspire fundo no topo e trave o core antes de descer; solte o ar apenas após passar pelo ponto de maior esforço na subida.',
    mistakes: 'Valgo dinâmico (joelhos colapsando para dentro); tirar calcanhares do solo; arredondar a coluna lombar na base ("butt wink" excessivo).',
    safety: 'Sempre monte as barras de proteção na altura adequada do rack. Respeite sua mobilidade articular sem insistir em dores.'
  },
  'B2': {
    title: 'Leg press 45 graus',
    targetMuscles: 'Quadríceps, glúteos e adutores.',
    setup: 'Sente-se no aparelho com as costas e a região lombar totalmente coladas no encosto. Pés na plataforma na largura dos ombros, apontando ligeiramente para fora. Destrave o carrinho segurando firmemente as manoplas laterais.',
    execution: '1. Desça a plataforma de forma suave e controlada até que os joelhos atinjam ~90° de flexão, sem que o quadril ou cóccix saiam do assento.\n2. Empurre a plataforma através dos calcanhares e parte média do pé até estender as pernas, mantendo os joelhos minimamente destravados no topo.',
    breathing: 'Inspire na descida do carrinho; expire durante o empurrão.',
    mistakes: 'Descolar a lombar do encosto (causa enorme pressão discal); travar os joelhos com impacto no topo (hiperextensão perigosa); colocar as mãos nos joelhos.',
    safety: 'NUNCA trave os joelhos completamente com cargas pesadas. Mantenha os joelhos alinhados com a ponta dos pés o tempo todo.'
  },
  'B3': {
    title: 'Levantamento terra romeno com barra (RDL)',
    targetMuscles: 'Isquiotibiais (posteriores de coxa), glúteo máximo e eretores da espinha.',
    setup: 'Em pé, segurando a barra na largura dos ombros com pegada pronada. Pés na largura do quadril, joelhos ligeiramente destravados (flexão fixa de 15–20° durante todo o exercício). Escápulas travadas para trás e peito aberto.',
    execution: '1. Empurre o quadril o mais para trás possível em um movimento de dobradiça (hip hinge), mantendo a barra deslizando colada às coxas.\n2. Mantenha a coluna absolutamente neutra. Desça até sentir um forte alongamento nos posteriores da coxa (normalmente logo abaixo dos joelhos).\n3. Retorne contraindo os glúteos e projetando o quadril para a frente.',
    breathing: 'Inspire na descida com o core rígido; expire ao finalizar a extensão de quadril.',
    mistakes: 'Dobrar os joelhos transformando o movimento em agachamento; afastar a barra do corpo; curvar as costas para alcançar o chão.',
    safety: 'A amplitude é determinada pela flexibilidade dos seus isquiotibiais com a coluna neutra. Não force além do ponto em que a lombar começaria a curvar.'
  },
  'B4': {
    title: 'Cadeira extensora',
    targetMuscles: 'Quadríceps isolado (com alta ativação do reto femoral).',
    setup: 'Ajuste o encosto de modo que o eixo de rotação da máquina fique exatamente na linha dos seus joelhos. O rolo deve repousar confortavelmente na frente das canelas, logo acima dos tornozelos. Segure com firmeza nas manoplas para manter o quadril grudado no assento.',
    execution: '1. Estenda as pernas erguendo a carga até a extensão completa, contraindo o quadríceps com força no topo por 1 segundo.\n2. Desça com cadência estrita de 2 a 3 segundos até a flexão completa dos joelhos, sem deixar os pesos da pilha baterem.',
    breathing: 'Expire na subida (extensão); inspire na descida controlada.',
    mistakes: 'Levantar o quadril do assento; dar tranco inicial com impulsão rápida; deixar os pesos baterem e perder a tensão contínua.',
    safety: 'DROP-SET OPCIONAL: Na 3ª e última série, você pode realizar o drop-set: reduza ~25-30% da carga e faça repetições imediatas até a fadiga técnica. Registre o drop-set no botão específico.'
  },
  'B5': {
    title: 'Mesa flexora deitada',
    targetMuscles: 'Isquiotibiais (bíceps femoral, semitendíneo e semimembranoso).',
    setup: 'Deite-se de bruços no aparelho. Ajuste a almofada cilíndrica para ficar posicionada logo abaixo das panturrilhas (acima do tendão de Aquiles). Alinhe os joelhos ao eixo da máquina e segure firme nas manoplas dianteiras.',
    execution: '1. Pressione a pelve e o abdômen contra o banco.\n2. Flexione os joelhos puxando os calcanhares em direção aos glúteos de forma fluida e potente.\n3. Segure 1 segundo no topo da contração e desça de forma controlada até estender quase completamente as pernas.',
    breathing: 'Expire na subida dos calcanhares; inspire na descida controlada.',
    mistakes: 'Levantar o quadril do banco e hiperextender a lombar para ajudar na puxada; movimentos rápidos com trancos no joelho.',
    safety: 'A estabilização pélvica é fundamental. Mantenha os glúteos firmes e a pelve apoiada para isolar a contração nos posteriores de coxa.'
  },
  'B6': {
    title: 'Panturrilha em pé na máquina',
    targetMuscles: 'Gastrocnêmio (cabeça medial e lateral) e sóleo.',
    setup: 'Posicione os ombros sob as almofadas acolchoadas. Coloque apenas a bola dos pés na borda da plataforma, com os calcanhares no ar. Joelhos estendidos com leve destrave milimétrico.',
    execution: '1. Desça os calcanhares o máximo que a amplitude permitir para obter um alongamento profundo da panturrilha e segure por 1 segundo na base.\n2. Eleve os calcanhares com força máxima na ponta dos pés, contraindo o músculo no topo por mais 1 segundo.\n3. Desça lentamente.',
    breathing: 'Expire ao subir na ponta dos pés; inspire enquanto desce para o alongamento.',
    mistakes: 'Fazer repetições curtas e quicadas no tendão; flexionar e estender os joelhos para empurrar o peso; não pausar no ponto mais baixo.',
    safety: 'A pausa de 1 segundo embaixo elimina a resposta elástica do tendão de Aquiles, forçando o gastrocnêmio a produzir trabalho mecânico real.'
  },
  'B7': {
    title: 'Abdominal na polia',
    targetMuscles: 'Reto abdominal e oblíquos.',
    setup: 'Ajoelhe-se em frente à polia alta com o acessório de corda acoplado. Segure as pontas da corda ao lado da cabeça/orelhas. Quadris levemente recuados e travados no lugar.',
    execution: '1. Sem mover os quadris ou sentar sobre os calcanhares, enrole a coluna toracolombar para a frente e para baixo, levando as costelas em direção à pelve.\n2. Contraia o abdômen intensamente na parte inferior por 1 segundo.\n3. Retorne de forma lenta desenrolando a coluna até a posição inicial.',
    breathing: 'Expire vigorosamente enquanto flexiona a coluna esvaziando o abdômen; inspire ao retornar.',
    mistakes: 'Puxar a corda usando os braços e tríceps; fazer flexão de quadril sentando e levantando os glúteos em vez de enrolar o tronco.',
    safety: 'O quadril deve permanecer como ponto de apoio estático. O movimento é puramente a flexão da coluna pelos músculos abdominais.'
  },
  'C1': {
    title: 'Leg press horizontal',
    targetMuscles: 'Quadríceps, glúteos e adutores.',
    setup: 'Sente-se no aparelho horizontal com a coluna e cabeça apoiadas. Posicione os pés na plataforma na largura dos ombros, pontas levemente voltadas para fora. Ajuste o assento para uma boa amplitude de partida.',
    execution: '1. Empurre a plataforma até estender as pernas, mantendo uma leve folga nos joelhos no final (sem travar).\n2. Retorne flexionando os joelhos em ritmo constante de 2 a 3 segundos, mantendo a pressão uniforme na sola dos pés.\n3. No Treino C de pump, mantenha uma tensão contínua sem pausas mortas no topo.',
    breathing: 'Inspire ao flexionar as pernas; expire ao empurrar.',
    mistakes: 'Deixar os joelhos caírem para dentro; descolar a lombar do banco na flexão máxima; bater os batentes da máquina.',
    safety: 'Concentre-se na sensação de queimação e acúmulo de metabólitos com cadência suave e controle total.'
  },
  'C2': {
    title: 'Cadeira flexora sentada',
    targetMuscles: 'Isquiotibiais (com vantagem do comprimento muscular pela flexão de quadril).',
    setup: 'Ajuste o encosto para alinhar os joelhos com o eixo giratório da máquina. Ajuste a almofada estabilizadora sobre as coxas de forma bem apertada para impedir que as pernas se elevem. Almofada inferior apoiada atrás dos tornozelos.',
    execution: '1. Flexione os joelhos puxando os calcanhares para baixo e para trás até a máxima contração dos posteriores de coxa.\n2. Pause por 1 segundo na contração máxima.\n3. Retorne lentamente sentindo o alongamento dos isquiotibiais até a extensão quase total.',
    breathing: 'Expire na descida/flexão; inspire no retorno alongado.',
    mistakes: 'Trava superior das coxas frouxa; jogar o tronco para trás para impulsionar; realizar repetições incompletas.',
    safety: 'A cadeira flexora é biomecanicamente excelente para hipertrofia por posicionar o posterior em posição pré-alongada. Mantenha os pés relaxados para focar nos isquiotibiais.'
  },
  'C3': {
    title: 'Supino reto na máquina',
    targetMuscles: 'Peitoral maior, tríceps e deltoide anterior.',
    setup: 'Ajuste a altura do banco para que as manoplas fiquem alinhadas com a parte média do seu peito. Apoie bem as costas e cabeça no encosto, com os pés firmes no chão e escápulas aduzidas.',
    execution: '1. Empurre as manoplas estendendo os braços de maneira controlada, sem projetar os ombros para a frente no topo do movimento.\n2. Retorne lentamente até sentir o peitoral alongar bem nas laterais, sem deixar as placas da torre baterem.\n3. Mantenha cadência ritmada característica de treino de pump.',
    breathing: 'Expire ao empurrar; inspire ao retornar.',
    mistakes: 'Ajustar o banco muito baixo (manoplas perto do pescoço); perder a retração das escápulas; travar cotovelos bruscamente.',
    safety: 'A trajetória guiada oferece máxima segurança para chegar bem próximo da falha muscular sem risco de a barra cair.'
  },
  'C4': {
    title: 'Remada articulada na máquina',
    targetMuscles: 'Latíssimo do dorso, romboides, trapézio e bíceps.',
    setup: 'Ajuste o assento para que o apoio de peito fique firme na altura do esterno. Segure as manoplas com pegada neutra ou pronada com os braços estendidos e peito em contato pleno com o estofado.',
    execution: '1. Puxe as manoplas conduzindo com os cotovelos para trás, espremendo as escápulas na contração final.\n2. Mantenha o contato do peito com o apoio em todo o percurso.\n3. Retorne lentamente permitindo que as costas abram e alonguem de forma agradável.',
    breathing: 'Expire durante a remada; inspire no retorno controlado.',
    mistakes: 'Descolar o peito do estofado dando trancos com o corpo; encolher os ombros; puxar excessivamente com as mãos e antebraços.',
    safety: 'Mantenha a postura torácica alta. Não deixe o queixo projetar para a frente durante o esforço.'
  },
  'C5': {
    title: 'Elevação lateral na polia',
    targetMuscles: 'Deltoide lateral.',
    setup: 'Ajuste a polia na altura do tornozelo ou joelho. Fique de lado para a máquina e segure o pegador individual com a mão de fora (cabo passando por trás ou pela frente do corpo). Segure na barra da máquina com a outra mão para estabilidade.',
    execution: '1. Eleve o braço lateralmente no plano escapular até a altura do ombro.\n2. Mantenha o cotovelo ligeiramente destravado.\n3. Sinta a tensão contínua imediata que o cabo gera desde o primeiro grau de movimento. Desça segurando o peso por 2 a 3 segundos.',
    breathing: 'Expire na subida; inspire na descida lenta.',
    mistakes: 'Girar o tronco para levantar a placa; levantar a mão muito mais alto que o cotovelo; balançar a perna de apoio.',
    safety: 'A polia garante tensão mecânica uniforme por toda a amplitude. Mantenha carga moderada para atingir com precisão a faixa de 12–20 reps.'
  },
  'C6': {
    title: 'Rosca martelo com corda',
    targetMuscles: 'Braquial, braquiorradial e bíceps braquial.',
    setup: 'Prenda a corda na polia baixa. Segure as pontas da corda com pegada neutra (palmas voltadas uma para a outra). Postura reta, peito aberto, cotovelos fixados junto às costelas.',
    execution: '1. Flexione os cotovelos puxando as pontas da corda para cima.\n2. No ponto alto, afaste ligeiramente as pontas da corda para fora para máxima contração do braquial e antebraço.\n3. Retorne devagar até estender os braços mantendo a tensão no cabo.',
    breathing: 'Expire ao subir; inspire ao descer.',
    mistakes: 'Balançar as costas; afastar os cotovelos do tronco para frente durante a subida; usar impulso das pernas.',
    safety: 'BI-SET COM C7: Ao terminar as repetições de C6, não descanse! Passe imediatamente para o exercício C7 (Tríceps corda).'
  },
  'C7': {
    title: 'Tríceps corda na polia',
    targetMuscles: 'Tríceps braquial (ênfase na cabeça lateral e longa).',
    setup: 'Posicione a corda na polia alta. Segure as pontas da corda com pegada neutra. Tronco levemente inclinado para a frente, cotovelos travados na lateral do corpo.',
    execution: '1. Estenda os braços para baixo. No final da extensão, afaste as pontas da corda para fora abrindo as mãos para potencializar o pico de contração do tríceps.\n2. Retorne controlando o peso até os antebraços formarem um ângulo de cerca de 90° com os braços.',
    breathing: 'Expire ao empurrar para baixo e abrir a corda; inspire ao retornar.',
    mistakes: 'Deixar os cotovelos oscilarem para frente e para trás; não abrir as cordas na fase final; usar impulso do tronco.',
    safety: 'DESCANSO DO BI-SET: Ao concluir cada série do C7 (o segundo exercício do bi-set), o cronômetro de descanso do bi-set (60–90 segundos) deve ser iniciado!'
  },
  'C8': {
    title: 'Panturrilha sentada',
    targetMuscles: 'Sóleo da panturrilha (músculo profundo abaixo do gastrocnêmio).',
    setup: 'Sente-se no aparelho com as almofadas acolchoadas posicionadas sobre a parte inferior das coxas (logo acima dos joelhos). Posicione a ponta dos pés na plataforma com os calcanhares livres. Destrave a alavanca de segurança.',
    execution: '1. Desça os calcanhares o máximo possível para um alongamento completo do sóleo e segure por 1 segundo no ponto mais baixo.\n2. Em seguida, eleve os calcanhares o mais alto possível até a contração máxima e pause 1 segundo no topo. Retorne controlando a descida.',
    breathing: 'Expire na subida; inspire na descida com alongamento.',
    mistakes: 'Movimento rápido estilo "mola", sem aproveitar a pausa; colocar os joelhos muito para trás ou para frente no acolchoado.',
    safety: 'Com os joelhos flexionados a 90°, o gastrocnêmio fica em insuficiência ativa, transferindo quase todo o trabalho mecânico para o sóleo. Pause na base e no topo para maximizar o recrutamento muscular.'
  }
};
