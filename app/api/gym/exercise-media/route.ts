import { NextRequest, NextResponse } from 'next/server';
import { getCachedExerciseMedia, setCachedExerciseMedia } from '@/lib/gymCache';

export const dynamic = 'force-dynamic';

interface ExerciseMapping {
  id: string;
  enName: string;
  equipment: string;
  ptName: string;
  muscleGroup: string;
  instructions: string[];
}

/**
 * Catálogo De-para PT-BR -> Base Pública de Exercícios (free-exercise-db / MIT)
 * Cada ID mapeia diretamente para fotos em alta resolução:
 * https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${id}/0.jpg (Posição inicial / Aparelho)
 * https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${id}/1.jpg (Pico de contração / Execução)
 */
const EXERCISE_CATALOG: Record<string, ExerciseMapping> = {
  // ================= PEITORAL =================
  'supino reto com barra': {
    id: 'Barbell_Bench_Press_-_Medium_Grip',
    enName: 'Barbell Bench Press',
    equipment: 'Barra Olímpica e Banco Reto',
    ptName: 'Supino Reto com Barra',
    muscleGroup: 'Peitoral Maior',
    instructions: [
      'Deite-se no banco reto com os olhos alinhados verticalmente abaixo da barra.',
      'Apoie os pés firmemente no chão e retrai as escápulas contra o encosto.',
      'Segure a barra com pegada ligeiramente mais larga que a largura dos ombros.',
      'Desça a barra controladamente em 2-3s até encostar levemente no terço inferior do esterno.',
      'Empurre a barra verticalmente até a extensão completa dos cotovelos sem descolar as escápulas.',
    ],
  },
  'supino reto': {
    id: 'Barbell_Bench_Press_-_Medium_Grip',
    enName: 'Barbell Bench Press',
    equipment: 'Barra Olímpica e Banco Reto',
    ptName: 'Supino Reto',
    muscleGroup: 'Peitoral Maior',
    instructions: [
      'Mantenha as escápulas aduzidas e os pés cravados no chão.',
      'Desça o peso de forma controlada até a linha dos mamilos.',
      'Evite afastar excessivamente os cotovelos a 90° para proteger a articulação do ombro (mantenha em ~75°).',
      'Expire ao empurrar a carga para cima.',
    ],
  },
  'supino reto com halteres': {
    id: 'Dumbbell_Bench_Press',
    enName: 'Dumbbell Bench Press',
    equipment: 'Halteres e Banco Reto',
    ptName: 'Supino Reto com Halteres',
    muscleGroup: 'Peitoral Maior',
    instructions: [
      'Sente-se no banco com os halteres nas coxas e deite-se usando as pernas para impulsioná-los.',
      'Mantenha o peito estufado e desça os halteres alongando bem as fibras do peitoral.',
      'Empurre os halteres para cima aproximando-os no topo sem bater um no outro.',
    ],
  },
  'supino inclinado com halteres': {
    id: 'Incline_Dumbbell_Press',
    enName: 'Incline Dumbbell Press',
    equipment: 'Halteres e Banco Inclinado (30°-45°)',
    ptName: 'Supino Inclinado com Halteres',
    muscleGroup: 'Peitoral Superior (Clavicular)',
    instructions: [
      'Ajuste o banco em inclinação de 30° a 45° (evite mais que 45° para não sobrecarregar o deltoide).',
      'Posicione os halteres acima do peitoral com pegada pronada.',
      'Desça alongando o feixe clavicular do peito mantendo os cotovelos controlados.',
      'Suba convergindo os halteres acima da clavícula.',
    ],
  },
  'supino inclinado': {
    id: 'Incline_Dumbbell_Press',
    enName: 'Incline Dumbbell Press',
    equipment: 'Halteres / Barra e Banco Inclinado',
    ptName: 'Supino Inclinado',
    muscleGroup: 'Peitoral Superior',
    instructions: [
      'Banco ajustado a 30° ou 45°.',
      'Desça o peso controladamente sentindo o alongamento no topo do peito.',
      'Empurre forte expirando no topo do movimento.',
    ],
  },
  'supino inclinado barra': {
    id: 'Barbell_Incline_Bench_Press',
    enName: 'Barbell Incline Bench Press',
    equipment: 'Barra e Banco Inclinado',
    ptName: 'Supino Inclinado com Barra',
    muscleGroup: 'Peitoral Superior',
    instructions: [
      'Segure a barra com pegada ligeiramente mais aberta que os ombros.',
      'Desça até o topo do peito, logo abaixo do queixo.',
      'Empurre com força concentrando no peitoral superior.',
    ],
  },
  'supino declinado': {
    id: 'Decline_Barbell_Bench_Press',
    enName: 'Decline Barbell Bench Press',
    equipment: 'Barra e Banco Declinado',
    ptName: 'Supino Declinado',
    muscleGroup: 'Peitoral Inferior',
    instructions: [
      'Trave bem as pernas nos suportes do banco declinado.',
      'Desça a barra em direção à base do peitoral.',
      'Empurre até a extensão quase completa dos braços.',
    ],
  },
  'crucifixo na polia': {
    id: 'Cable_Crossover',
    enName: 'Cable Crossover',
    equipment: 'Polia Dupla (Crossover)',
    ptName: 'Crucifixo na Polia (Crossover)',
    muscleGroup: 'Peitoral e Miolo do Peito',
    instructions: [
      'Posicione as roldanas na altura dos ombros ou ligeiramente acima.',
      'Dê um passo à frente com tronco levemente inclinado e core estável.',
      'Com cotovelos levemente flexionados, traga os pegadores para frente até quase se tocarem.',
      'Segure 1 segundo no pico de contração máxima.',
    ],
  },
  'crossover': {
    id: 'Cable_Crossover',
    enName: 'Cable Crossover',
    equipment: 'Polia Dupla (Crossover)',
    ptName: 'Crossover na Polia',
    muscleGroup: 'Peitoral',
    instructions: [
      'Mantenha os cotovelos fixos e estáveis durante todo o arco de movimento.',
      'Sinta o peitoral esticar ao abrir e esmague na contração frontal.',
    ],
  },
  'crucifixo': {
    id: 'Dumbbell_Flyes',
    enName: 'Dumbbell Flyes',
    equipment: 'Halteres e Banco Reto',
    ptName: 'Crucifixo com Halteres',
    muscleGroup: 'Peitoral Maior',
    instructions: [
      'Deite-se no banco com os halteres acima do peito.',
      'Abra os braços em arco com cotovelos levemente curvados sentindo alongamento profundo.',
      'Feche o arco como se estivesse abraçando um barril grande.',
    ],
  },
  'peck deck': {
    id: 'Butterfly',
    enName: 'Butterfly / Pec Deck',
    equipment: 'Aparelho Voador / Peck Deck',
    ptName: 'Voador / Peck Deck',
    muscleGroup: 'Peitoral',
    instructions: [
      'Ajuste a altura do banco para que os braços fiquem na linha do peitoral.',
      'Feche os braços contraindo o peito no centro.',
      'Retorne devagar sem deixar os pesos baterem na pilha.',
    ],
  },
  'voador': {
    id: 'Butterfly',
    enName: 'Butterfly / Pec Deck',
    equipment: 'Aparelho Voador',
    ptName: 'Voador',
    muscleGroup: 'Peitoral',
    instructions: [
      'Encoste as costas no apoio e mantenha os ombros abaixados.',
      'Pressione os apoios até unir as mãos na frente do tronco.',
    ],
  },
  'paralelas': {
    id: 'Dips_-_Chest_Version',
    enName: 'Chest Dips',
    equipment: 'Barras Paralelas',
    ptName: 'Paralelas (Peito / Tríceps)',
    muscleGroup: 'Peitoral Inferior e Tríceps',
    instructions: [
      'Suspenda-se nas barras com tronco inclinado para frente para enfatizar o peito.',
      'Desça flexionando os cotovelos até formar ângulo de 90°.',
      'Empurre de volta com força.',
    ],
  },

  // ================= COSTAS & DORSAIS =================
  'puxada frontal aberta': {
    id: 'Wide-Grip_Lat_Pulldown',
    enName: 'Wide-Grip Lat Pulldown',
    equipment: 'Aparelho Puxador Alto e Barra Aberta',
    ptName: 'Puxada Frontal Aberta (Pulldown)',
    muscleGroup: 'Latíssimo do Dorso (Dorsais)',
    instructions: [
      'Ajuste o apoio das coxas para manter o corpo bem travado.',
      'Segure a barra com pegada pronada aberta além da linha dos ombros.',
      'Inicie deprimindo e retraindo as escápulas antes de dobrar os cotovelos.',
      'Puxe a barra em direção à parte superior do peito estufando a caixa torácica.',
      'Suba esticando totalmente os braços para alongar a grande dorsal.',
    ],
  },
  'puxada frontal': {
    id: 'Wide-Grip_Lat_Pulldown',
    enName: 'Wide-Grip Lat Pulldown',
    equipment: 'Aparelho Puxador Alto e Barra Aberta',
    ptName: 'Puxada Frontal',
    muscleGroup: 'Latíssimo do Dorso',
    instructions: [
      'Puxe a barra no peito mantendo a postura ereta.',
      'Concentre a força nos cotovelos descendo em direção aos quadris.',
    ],
  },
  'puxada alta': {
    id: 'Wide-Grip_Lat_Pulldown',
    enName: 'Lat Pulldown',
    equipment: 'Polia Alta',
    ptName: 'Puxada Alta',
    muscleGroup: 'Dorsais',
    instructions: [
      'Estabilize as pernas no apoio e puxe a barra controladamente.',
    ],
  },
  'pulldown com corda': {
    id: 'Straight-Arm_Dumbbell_Pullover',
    enName: 'Cable Straight-Arm Pulldown',
    equipment: 'Polia Alta e Corda',
    ptName: 'Pulldown com Corda (Braços Estendidos)',
    muscleGroup: 'Dorsais e Redondo Maior',
    instructions: [
      'Afaste-se da polia com joelhos levemente flexcionados e tronco a 30°.',
      'Com braços quase retos, puxe a corda em direção às coxas usando a força das costas.',
      'Segure 1 segundo contraindo a asa dorsal e suba até a linha da cabeça.',
    ],
  },
  'remada curvada': {
    id: 'Bent_Over_Two-Arm_Long_Barbell_Row',
    enName: 'Bent Over Barbell Row',
    equipment: 'Barra com Anilhas',
    ptName: 'Remada Curvada / Cavalinho',
    muscleGroup: 'Dorsais, Trapézio e Romboides',
    instructions: [
      'Segure a barra e incline o tronco à frente a 45°, mantendo a lombar neutra e joelhos semi-flexionados.',
      'Puxe a barra em direção ao umbigo mantendo os cotovelos próximos às costelas.',
      'Aperte as escápulas no topo e desça controladamente sem perder a postura.',
    ],
  },
  'remada cavalinho': {
    id: 'Bent_Over_Two-Arm_Long_Barbell_Row',
    enName: 'T-Bar Row',
    equipment: 'Barra T / Cavalinho',
    ptName: 'Remada Cavalinho',
    muscleGroup: 'Meio das Costas e Densidade Dorsal',
    instructions: [
      'Encaixe a barra entre as pernas e segure no pegador triangular.',
      'Puxe com as costas mantendo a coluna ereta e abdômen firme.',
    ],
  },
  'remada baixa sentado': {
    id: 'Seated_Cable_Rows',
    enName: 'Seated Cable Rows',
    equipment: 'Aparelho de Remada Baixa e Triângulo',
    ptName: 'Remada Baixa Sentado (Triângulo)',
    muscleGroup: 'Dorsais e Miolo das Costas',
    instructions: [
      'Sente-se com pés firmes na plataforma e joelhos ligeiramente destravados.',
      'Pegue o triângulo e alinhe a coluna reta.',
      'Puxe o pegador contra o abdômen estufando o peito e aproximando as escápulas.',
      'Estique os braços permitindo que as escápulas se abram suavemente à frente.',
    ],
  },
  'remada baixa': {
    id: 'Seated_Cable_Rows',
    enName: 'Seated Cable Rows',
    equipment: 'Polia Baixa',
    ptName: 'Remada Baixa',
    muscleGroup: 'Dorsais e Trapézio',
    instructions: [
      'Puxe o triângulo rente à barriga mantendo a postura firme.',
    ],
  },
  'remada unilateral': {
    id: 'One-Arm_Dumbbell_Row',
    enName: 'One-Arm Dumbbell Row',
    equipment: 'Halter e Banco Reto',
    ptName: 'Remada Unilateral / Serrote',
    muscleGroup: 'Grande Dorsal',
    instructions: [
      'Apoie um joelho e a mão do mesmo lado no banco.',
      'Com a outra mão, puxe o halter em direção ao quadril, como se serrasse madeira.',
      'Mantenha as costas paralelas ao solo.',
    ],
  },
  'serrote': {
    id: 'One-Arm_Dumbbell_Row',
    enName: 'One-Arm Dumbbell Row',
    equipment: 'Halter e Banco',
    ptName: 'Serrote com Halter',
    muscleGroup: 'Dorsais',
    instructions: [
      'Puxe o halter conduzindo pelo cotovelo até a linha do tronco.',
    ],
  },
  'barra fixa': {
    id: 'Pullups',
    enName: 'Pullups',
    equipment: 'Barra Fixa',
    ptName: 'Barra Fixa',
    muscleGroup: 'Dorsais e Bíceps',
    instructions: [
      'Segure na barra com pegada pronada.',
      'Puxe o corpo para cima até o queixo ultrapassar a barra.',
      'Desça controlando até a extensão completa.',
    ],
  },
  'levantamento terra': {
    id: 'Barbell_Deadlift',
    enName: 'Barbell Deadlift',
    equipment: 'Barra Olímpica e Anilhas',
    ptName: 'Levantamento Terra',
    muscleGroup: 'Cadeia Posterior Completa e Lombar',
    instructions: [
      'Posicione a barra sobre o meio dos pés, canelas quase tocando na barra.',
      'Dobre o quadril e joelhos, pegue a barra com pegada mista ou pronada.',
      'Estufe o peito, ative as dorsais e empurre o chão com os pés até ficar ereto.',
    ],
  },

  // ================= OMBROS & DELTOIDES =================
  'desenvolvimento com halteres': {
    id: 'Dumbbell_Shoulder_Press',
    enName: 'Dumbbell Shoulder Press',
    equipment: 'Halteres e Banco a 80°-90°',
    ptName: 'Desenvolvimento com Halteres',
    muscleGroup: 'Deltoide Anterior e Lateral',
    instructions: [
      'Sente-se com as costas totalmente apoiadas no encosto.',
      'Suba os halteres na altura das orelhas com cotovelos a 75° à frente do corpo.',
      'Empurre para cima até estender os braços sem tocar os halteres no topo.',
      'Desça em 2 segundos até a altura do queixo.',
    ],
  },
  'desenvolvimento': {
    id: 'Dumbbell_Shoulder_Press',
    enName: 'Shoulder Press',
    equipment: 'Halteres / Máquina',
    ptName: 'Desenvolvimento de Ombros',
    muscleGroup: 'Deltoides',
    instructions: [
      'Empurre o peso verticalmente mantendo a respiração cadenciada.',
    ],
  },
  'elevacao lateral com halteres': {
    id: 'Side_Lateral_Raise',
    enName: 'Side Lateral Raise',
    equipment: 'Halteres',
    ptName: 'Elevação Lateral com Halteres',
    muscleGroup: 'Deltoide Lateral (Ombro Cabeça Média)',
    instructions: [
      'Fique em pé com leve inclinação do tronco para frente.',
      'Eleve os halteres lateralmente guiando pelo cotovelo (como se despejasse água de uma jarra).',
      'Pare na linha horizontal dos ombros.',
      'Desça devagar controlando o peso, sem balançar o quadril.',
    ],
  },
  'elevacao lateral': {
    id: 'Side_Lateral_Raise',
    enName: 'Side Lateral Raise',
    equipment: 'Halteres / Polia',
    ptName: 'Elevação Lateral',
    muscleGroup: 'Deltoide Lateral',
    instructions: [
      'Suba os braços até a altura dos ombros e desça em velocidade controlada.',
    ],
  },
  'elevacao frontal': {
    id: 'Front_Dumbbell_Raise',
    enName: 'Front Dumbbell Raise',
    equipment: 'Halteres ou Barra',
    ptName: 'Elevação Frontal',
    muscleGroup: 'Deltoide Anterior',
    instructions: [
      'Suba o peso à frente do corpo até a linha dos olhos.',
      'Desça sem deixar o tronco balançar para trás.',
    ],
  },
  'crucifixo inverso na maquina': {
    id: 'Reverse_Machine_Flyes',
    enName: 'Reverse Machine Flyes',
    equipment: 'Aparelho Peck Deck Inverso',
    ptName: 'Crucifixo Inverso na Máquina (Posterior)',
    muscleGroup: 'Deltoide Posterior',
    instructions: [
      'Sente-se de frente para o aparelho com peito encostado no apoio.',
      'Segure as manoplas na horizontal ou neutra.',
      'Abra os braços puxando com o fundo dos ombros sem dar tranco nas escápulas.',
    ],
  },
  'crucifixo inverso': {
    id: 'Reverse_Flyes',
    enName: 'Reverse Flyes',
    equipment: 'Máquina / Halteres',
    ptName: 'Crucifixo Inverso',
    muscleGroup: 'Deltoide Posterior',
    instructions: [
      'Foque em puxar com a parte de trás dos ombros.',
    ],
  },
  'encolhimento': {
    id: 'Barbell_Shrug',
    enName: 'Barbell Shrug',
    equipment: 'Barra ou Halteres',
    ptName: 'Encolhimento de Ombros',
    muscleGroup: 'Trapézio Superior',
    instructions: [
      'Segure o peso e encolha os ombros em direção às orelhas em linha reta.',
      'Segure 1 segundo no pico de contração e desça alongando.',
    ],
  },

  // ================= BRAÇOS (BÍCEPS & TRÍCEPS) =================
  'triceps pulley com corda': {
    id: 'Triceps_Pushdown_-_Rope_Attachment',
    enName: 'Triceps Pushdown - Rope Attachment',
    equipment: 'Polia Alta e Acessório de Corda',
    ptName: 'Tríceps Pulley com Corda',
    muscleGroup: 'Tríceps (Cabeça Lateral e Medial)',
    instructions: [
      'Fique de frente para a polia com tronco levemente inclinado.',
      'Fixe os cotovelos junto às costelas, eles não devem se mexer para frente ou trás.',
      'Empurre a corda para baixo estendendo os braços e abra as pontas no final da descida.',
      'Retorne até o antebraço formar 90° com o bíceps.',
    ],
  },
  'triceps corda': {
    id: 'Triceps_Pushdown_-_Rope_Attachment',
    enName: 'Triceps Rope Pushdown',
    equipment: 'Polia Alta e Corda',
    ptName: 'Tríceps Corda',
    muscleGroup: 'Tríceps',
    instructions: [
      'Cotovelos colados ao corpo, abra a corda no final para pico de contração.',
    ],
  },
  'triceps frances / testa na polia': {
    id: 'Standing_Dumbbell_Triceps_Extension',
    enName: 'Overhead Triceps Extension',
    equipment: 'Polia / Halteres',
    ptName: 'Tríceps Francês / Testa na Polia',
    muscleGroup: 'Tríceps (Cabeça Longa)',
    instructions: [
      'Posicione os braços elevados acima da cabeça apontando cotovelos para frente.',
      'Flexione os antebraços para trás sentindo o tríceps alongar profundamente.',
      'Estenda os cotovelos empurrando o peso para cima.',
    ],
  },
  'triceps frances': {
    id: 'Standing_Dumbbell_Triceps_Extension',
    enName: 'Overhead Triceps Extension',
    equipment: 'Halter / Polia',
    ptName: 'Tríceps Francês',
    muscleGroup: 'Tríceps Cabeça Longa',
    instructions: [
      'Mantenha os cotovelos fechados e estenda os antebraços acima da cabeça.',
    ],
  },
  'triceps testa': {
    id: 'EZ-Bar_Skullcrusher',
    enName: 'EZ-Bar Skullcrusher',
    equipment: 'Barra W e Banco Reto',
    ptName: 'Tríceps Testa',
    muscleGroup: 'Tríceps',
    instructions: [
      'Deite-se no banco, segure a barra W acima do peito.',
      'Dobre apenas os cotovelos trazendo a barra em direção à testa.',
      'Estenda de volta contraindo o tríceps.',
    ],
  },
  'rosca direta na barra w': {
    id: 'Close-Grip_EZ_Bar_Curl',
    enName: 'EZ-Bar Curl',
    equipment: 'Barra W e Anilhas',
    ptName: 'Rosca Direta na Barra W',
    muscleGroup: 'Bíceps Braquial',
    instructions: [
      'Segure a barra W nas curvas anatômicas que aliviam o estresse no punho.',
      'Mantenha os cotovelos fixados ao lado do corpo.',
      'Suba a barra contraindo o bíceps até a altura do peito sem balançar o tronco.',
      'Desça de forma controlada em 2 a 3 segundos.',
    ],
  },
  'rosca direta': {
    id: 'Barbell_Curl',
    enName: 'Barbell Curl',
    equipment: 'Barra W ou Reta',
    ptName: 'Rosca Direta',
    muscleGroup: 'Bíceps',
    instructions: [
      'Cotovelos colados ao corpo, flexione os braços sem roubar com a lombar.',
    ],
  },
  'rosca martelo com halteres': {
    id: 'Hammer_Curls',
    enName: 'Hammer Curls',
    equipment: 'Halteres',
    ptName: 'Rosca Martelo com Halteres',
    muscleGroup: 'Braquial, Braquiorradial e Bíceps',
    instructions: [
      'Segure os halteres com pegada neutra (palmas das mãos voltadas uma para a outra).',
      'Flexione os braços mantendo as palmas voltadas para dentro.',
      'Ideal para espessura do braço e antebraço.',
    ],
  },
  'rosca martelo': {
    id: 'Hammer_Curls',
    enName: 'Hammer Curls',
    equipment: 'Halteres',
    ptName: 'Rosca Martelo',
    muscleGroup: 'Braquial e Antebraço',
    instructions: [
      'Pegada neutra o tempo todo, eleve até a linha do peito e desça devagar.',
    ],
  },
  'rosca banco inclinado 45°': {
    id: 'Incline_Dumbbell_Curl',
    enName: 'Incline Dumbbell Curl',
    equipment: 'Halteres e Banco a 45°',
    ptName: 'Rosca Banco Inclinado 45°',
    muscleGroup: 'Bíceps (Cabeça Longa)',
    instructions: [
      'Sente-se no banco a 45° permitindo que os braços fiquem caídos para trás da linha do tronco.',
      'Inicie a rosca supinando as mãos no movimento.',
      'Máximo alongamento das fibras do bíceps.',
    ],
  },
  'rosca inclinada': {
    id: 'Incline_Dumbbell_Curl',
    enName: 'Incline Dumbbell Curl',
    equipment: 'Halteres e Banco Inclinado',
    ptName: 'Rosca no Banco Inclinado',
    muscleGroup: 'Bíceps',
    instructions: [
      'Cotovelos para trás do tronco, alongue bem na base e contraia no topo.',
    ],
  },
  'rosca scott': {
    id: 'Preacher_Curl',
    enName: 'Preacher Curl',
    equipment: 'Banco Scott e Barra W',
    ptName: 'Rosca Scott',
    muscleGroup: 'Bíceps Isolado',
    instructions: [
      'Apoie os braços no banco inclinado sem descolar as axilas.',
      'Suba a barra e não estenda bruscamente no final para proteger o tendão.',
    ],
  },

  // ================= PERNAS & GLÚTEOS =================
  'agachamento livre / hack machine': {
    id: 'Barbell_Squat',
    enName: 'Barbell Squat',
    equipment: 'Barra Olímpica, Anilhas e Gaiola de Agachamento',
    ptName: 'Agachamento Livre / Hack Machine',
    muscleGroup: 'Quadríceps, Glúteos e Core',
    instructions: [
      'Apoie a barra no trapézio com pegada firme e cotovelos apontados para baixo.',
      'Pés na largura dos ombros com pontas ligeiramente apontadas para fora.',
      'Faça o brace abdominal (trave o ar no core).',
      'Desça projetando o quadril para trás e dobrando os joelhos até pelo menos 90°.',
      'Suba empurrando o chão com os calcanhares sem aproximar os joelhos (valgo dinâmico).',
    ],
  },
  'agachamento livre': {
    id: 'Barbell_Squat',
    enName: 'Barbell Squat',
    equipment: 'Barra Olímpica e Suporte',
    ptName: 'Agachamento Livre',
    muscleGroup: 'Quadríceps e Glúteos',
    instructions: [
      'Coluna neutra, amplitude completa e pés cravados no chão.',
    ],
  },
  'agachamento': {
    id: 'Barbell_Squat',
    enName: 'Barbell Squat',
    equipment: 'Barra Olímpica',
    ptName: 'Agachamento',
    muscleGroup: 'Pernas Completo',
    instructions: [
      'Agache com peito estufado e postura ereta.',
    ],
  },
  'leg press 45°': {
    id: 'Leg_Press',
    enName: 'Sled 45 Degree Leg Press',
    equipment: 'Aparelho Leg Press 45 Graus',
    ptName: 'Leg Press 45°',
    muscleGroup: 'Quadríceps e Glúteos',
    instructions: [
      'Acomode a lombar e o quadril 100% encostados no banco (nunca descole o glúteo do encosto).',
      'Posicione os pés na largura dos ombros no meio da plataforma.',
      'Destrave a máquina e desça o trenó até 90° ou mais.',
      'Empurre de volta pela plataforma sem travar (hiperextender) os joelhos no topo.',
    ],
  },
  'leg press 45': {
    id: 'Leg_Press',
    enName: 'Leg Press 45',
    equipment: 'Máquina Leg Press 45°',
    ptName: 'Leg Press 45°',
    muscleGroup: 'Quadríceps e Glúteos',
    instructions: [
      'Desça até boa profundidade sem descolar a lombar do encosto.',
    ],
  },
  'leg press': {
    id: 'Leg_Press',
    enName: 'Leg Press',
    equipment: 'Aparelho Leg Press',
    ptName: 'Leg Press',
    muscleGroup: 'Quadríceps',
    instructions: [
      'Mantenha os calcanhares apoiados e empurre com força.',
    ],
  },
  'cadeira extensora': {
    id: 'Leg_Extensions',
    enName: 'Leg Extensions',
    equipment: 'Aparelho Cadeira Extensora',
    ptName: 'Cadeira Extensora',
    muscleGroup: 'Quadríceps (Reto Femoral e Vastos)',
    instructions: [
      'Ajuste o encosto para o joelho ficar alinhado com o eixo giratório da máquina.',
      'O rolete deve ficar logo acima dos tornozelos.',
      'Estenda as pernas segurando 1 segundo no topo de contração máxima.',
      'Desça de forma suave e controlada.',
    ],
  },
  'extensora': {
    id: 'Leg_Extensions',
    enName: 'Leg Extensions',
    equipment: 'Cadeira Extensora',
    ptName: 'Extensora',
    muscleGroup: 'Quadríceps',
    instructions: [
      'Estenda totalmente as pernas e segure 1 segundo no topo.',
    ],
  },
  'stiff com barra / halteres': {
    id: 'Stiff-Legged_Barbell_Deadlift',
    enName: 'Stiff-Legged Barbell Deadlift',
    equipment: 'Barra Olímpica ou Halteres',
    ptName: 'Stiff com Barra / Halteres',
    muscleGroup: 'Isquiotibiais (Posterior de Coxa) e Glúteos',
    instructions: [
      'Fique em pé segurando o peso na frente das coxas com joelhos quase retos (microflexão).',
      'Projete o bumbum para trás dobrando o quadril mantendo a coluna totalmente selada e reta.',
      'Desça a barra rente às pernas até sentir o alongamento máximo do posterior.',
      'Suba contraindo os glúteos e retornando à posição ereta.',
    ],
  },
  'stiff': {
    id: 'Stiff-Legged_Barbell_Deadlift',
    enName: 'Stiff Deadlift',
    equipment: 'Barra ou Halteres',
    ptName: 'Stiff',
    muscleGroup: 'Posterior de Coxa',
    instructions: [
      'Quadril para trás, coluna travada e sinta os posteriores queimarem.',
    ],
  },
  'mesa / cadeira flexora': {
    id: 'Lying_Leg_Curls',
    enName: 'Lying Leg Curls',
    equipment: 'Aparelho Mesa Flexora ou Cadeira Flexora',
    ptName: 'Mesa / Cadeira Flexora',
    muscleGroup: 'Isquiotibiais (Posterior de Coxa)',
    instructions: [
      'Deite-se na mesa com o rolete apoiado atrás dos tornozelos.',
      'Pressione o quadril contra o estofado durante todo o movimento.',
      'Puxe os calcanhares em direção aos glúteos.',
      'Retorne devagar sem soltar o peso na pilha.',
    ],
  },
  'mesa flexora': {
    id: 'Lying_Leg_Curls',
    enName: 'Lying Leg Curls',
    equipment: 'Mesa Flexora',
    ptName: 'Mesa Flexora',
    muscleGroup: 'Posterior de Coxa',
    instructions: [
      'Dobre as pernas trazendo os pés até os glúteos e controle o retorno.',
    ],
  },
  'cadeira flexora': {
    id: 'Seated_Leg_Curl',
    enName: 'Seated Leg Curl',
    equipment: 'Cadeira Flexora',
    ptName: 'Cadeira Flexora',
    muscleGroup: 'Posterior de Coxa',
    instructions: [
      'Trave bem a coxa com a almofada e flexione os joelhos para baixo.',
    ],
  },
  'elevacao pelvica na maquina / barra': {
    id: 'Barbell_Glute_Bridge',
    enName: 'Barbell Hip Thrust',
    equipment: 'Máquina de Elevação Pélvica ou Barra com Almofada',
    ptName: 'Elevação Pélvica na Máquina / Barra',
    muscleGroup: 'Glúteo Máximo',
    instructions: [
      'Apoie as costas no banco logo abaixo das escápulas ou use a máquina dedicada.',
      'Posicione a barra sobre a bacia protegida por almofada.',
      'Pés na largura dos ombros com joelhos a 90° no topo.',
      'Empurre o quadril para cima contraindo os glúteos no topo por 1 a 2 segundos.',
      'Mantenha o queixo apontado para o peito durante a subida.',
    ],
  },
  'elevacao pelvica': {
    id: 'Barbell_Glute_Bridge',
    enName: 'Barbell Hip Thrust',
    equipment: 'Máquina ou Barra',
    ptName: 'Elevação Pélvica',
    muscleGroup: 'Glúteos',
    instructions: [
      'Empurre pelos calcanhares e aperte o glúteo no pico do movimento.',
    ],
  },
  'panturrilha em pe / sentado': {
    id: 'Standing_Calf_Raises',
    enName: 'Standing Calf Raises',
    equipment: 'Máquina Panturrilha em Pé ou Burrinho',
    ptName: 'Panturrilha em Pé / Sentado',
    muscleGroup: 'Gastrocnêmio e Sóleo (Panturrilhas)',
    instructions: [
      'Posicione apenas a ponta dos pés na borda da plataforma.',
      'Desça os calcanhares ao máximo sentindo alongar a panturrilha.',
      'Suba na ponta dos pés o mais alto possível e pause 1 segundo no topo.',
      'Evite quicar o peso na base.',
    ],
  },
  'panturrilha sentado': {
    id: 'Seated_Calf_Raise',
    enName: 'Seated Calf Raise',
    equipment: 'Aparelho Panturrilha Sentado (Burrinho)',
    ptName: 'Panturrilha Sentado',
    muscleGroup: 'Sóleo',
    instructions: [
      'Máxima amplitude de movimento com pausa de 1 segundo na ponta dos pés.',
    ],
  },
  'panturrilha': {
    id: 'Standing_Calf_Raises',
    enName: 'Calf Raises',
    equipment: 'Aparelho de Panturrilha',
    ptName: 'Panturrilha',
    muscleGroup: 'Panturrilha',
    instructions: [
      'Desça alongando e suba contraindo no topo.',
    ],
  },
  'afundo': {
    id: 'Dumbbell_Lunges',
    enName: 'Dumbbell Lunges',
    equipment: 'Halteres',
    ptName: 'Afundo com Halteres',
    muscleGroup: 'Quadríceps e Glúteos',
    instructions: [
      'Dê um passo à frente e desça o joelho de trás até quase tocar o chão.',
      'Empurre pelo calcanhar da perna da frente para retornar.',
    ],
  },
  'agachamento bulgaro': {
    id: 'Bulgarian_Split_Squat',
    enName: 'Bulgarian Split Squat',
    equipment: 'Halteres e Banco Reto',
    ptName: 'Agachamento Búlgaro',
    muscleGroup: 'Glúteos e Quadríceps',
    instructions: [
      'Apoie o peito do pé de trás no banco e agache na perna da frente.',
      'Excelente construtor unilateral de glúteo e estabilidade.',
    ],
  },

  // ================= ABDÔMEN & CORE =================
  'abdominal supra na polia / infra': {
    id: 'Cable_Crunch',
    enName: 'Cable Crunch',
    equipment: 'Polia Alta e Corda',
    ptName: 'Abdominal Supra na Polia / Infra',
    muscleGroup: 'Reto Abdominal',
    instructions: [
      'Ajoelhe-se na frente da polia segurando as pontas da corda nas têmporas.',
      'Enrole a coluna vertebral trazendo a cabeça em direção aos joelhos.',
      'Solte todo o ar contraindo o abdômen no ponto mais baixo.',
      'Retorne devagar sem hiperextender a lombar.',
    ],
  },
  'abdominal': {
    id: 'Crunches',
    enName: 'Crunches',
    equipment: 'Colchonete',
    ptName: 'Abdominal Crunch',
    muscleGroup: 'Abdômen',
    instructions: [
      'Deite-se no colchonete com joelhos flexionados e enrole o tronco.',
    ],
  },
  'prancha': {
    id: 'Plank',
    enName: 'Plank',
    equipment: 'Colchonete',
    ptName: 'Prancha Isométrica',
    muscleGroup: 'Core e Estabilidade',
    instructions: [
      'Apoie os antebraços e pontas dos pés mantendo o corpo alinhado como uma tábua.',
      'Ative o abdômen e glúteos sem deixar a lombar cair.',
    ],
  },

  // ================= CARDIO =================
  'esteira inclinada / escada (liss)': {
    id: 'Treadmill_Jogging',
    enName: 'Incline Treadmill Walking',
    equipment: 'Esteira Elétrica com Inclinação ou Simulador de Escada',
    ptName: 'Esteira Inclinada / Escada (LISS)',
    muscleGroup: 'Cardiovascular e Resistência',
    instructions: [
      'Ajuste a inclinação entre 6% e 12% com velocidade moderada (4.5 a 6 km/h).',
      'Caminhe com postura ereta sem se apoiar nos corrimões para gastar mais calorias.',
      'Mantenha a frequência cardíaca na Zona 2 (120-135 bpm) para queima de gordura.',
    ],
  },
  'esteira': {
    id: 'Treadmill_Jogging',
    enName: 'Treadmill',
    equipment: 'Esteira Elétrica',
    ptName: 'Esteira',
    muscleGroup: 'Cardio',
    instructions: [
      'Mantenha ritmo constante e passadas naturais.',
    ],
  },
};

/**
 * Normaliza string removendo acentos, pontuações e excesso de espaços
 */
function normalizeName(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Encontra o exercício correspondente no catálogo através de correspondência exata ou fuzzy
 */
function findExerciseInCatalog(query: string): ExerciseMapping | null {
  const normalizedQuery = normalizeName(query);

  // 1. Busca direta por chave normalizada
  for (const [key, mapping] of Object.entries(EXERCISE_CATALOG)) {
    if (normalizeName(key) === normalizedQuery) {
      return mapping;
    }
  }

  // 2. Busca por contenção (substring)
  for (const [key, mapping] of Object.entries(EXERCISE_CATALOG)) {
    const normKey = normalizeName(key);
    if (normalizedQuery.includes(normKey) || normKey.includes(normalizedQuery)) {
      return mapping;
    }
  }

  // 3. Busca por similaridade de palavras-chave
  const queryWords = normalizedQuery.split(' ').filter((w) => w.length > 2);
  let bestMatch: ExerciseMapping | null = null;
  let maxScore = 0;

  for (const [key, mapping] of Object.entries(EXERCISE_CATALOG)) {
    const keyWords = normalizeName(key).split(' ').filter((w) => w.length > 2);
    let score = 0;
    for (const qw of queryWords) {
      if (keyWords.includes(qw)) score += 2;
      else if (keyWords.some((kw) => kw.includes(qw) || qw.includes(kw))) score += 1;
    }

    if (score > maxScore && score >= 2) {
      maxScore = score;
      bestMatch = mapping;
    }
  }

  return bestMatch;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const exerciseName = searchParams.get('name') || searchParams.get('q');

    if (!exerciseName) {
      return NextResponse.json(
        { success: false, error: 'O parâmetro "name" do exercício é obrigatório' },
        { status: 400 }
      );
    }

    // 1. Verificar cache em memória
    const cached = getCachedExerciseMedia(exerciseName);
    if (cached) {
      return NextResponse.json(
        { success: true, data: cached, cached: true },
        { headers: { 'X-Cache': 'HIT' } }
      );
    }

    // 2. Localizar no catálogo De-para
    const match = findExerciseInCatalog(exerciseName);

    if (!match) {
      // Fallback genérico quando não encontrado
      const defaultPhoto =
        'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press_-_Medium_Grip/0.jpg';
      const defaultSecondary =
        'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press_-_Medium_Grip/1.jpg';
      const defaultInst = [
        'Ajuste o aparelho de acordo com a sua altura.',
        'Mantenha a postura alinhada e realize o movimento com cadência controlada.',
        'Respire de forma contínua durante a execução.',
      ];

      const fallbackResult = {
        name: exerciseName,
        enName: exerciseName,
        ptName: exerciseName,
        photoUrl: defaultPhoto,
        secondaryPhotoUrl: defaultSecondary,
        imageUrl: defaultPhoto,
        thumbnailUrl: defaultPhoto,
        apparatusName: 'Aparelho ou Acessório de Academia',
        equipment: 'Aparelho ou Acessório de Academia',
        muscleGroup: 'Geral',
        instructions: defaultInst,
        setupInstructions: defaultInst.join(' '),
      };

      setCachedExerciseMedia(exerciseName, fallbackResult);
      return NextResponse.json(
        { success: true, data: fallbackResult, cached: false },
        { headers: { 'X-Cache': 'MISS' } }
      );
    }

    // 3. Montar URLs das fotos de alta resolução do free-exercise-db
    const photoUrl = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${match.id}/0.jpg`;
    const secondaryPhotoUrl = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${match.id}/1.jpg`;

    let finalInstructions = match.instructions;

    // 4. Se houver chave API Ninjas configurada, tentar buscar dicas complementares com timeout
    const apiNinjasKey = process.env.API_NINJAS_KEY;
    if (apiNinjasKey) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1200); // Timeout rápido de 1.2s para nunca travar

        const ninjaRes = await fetch(
          `https://api.api-ninjas.com/v1/exercises?name=${encodeURIComponent(match.enName)}`,
          {
            headers: { 'X-Api-Key': apiNinjasKey },
            signal: controller.signal,
          }
        );
        clearTimeout(timeout);

        if (ninjaRes.ok) {
          const ninjaData = await ninjaRes.json();
          if (Array.isArray(ninjaData) && ninjaData.length > 0 && ninjaData[0].instructions) {
            const rawNinjaInst: string = ninjaData[0].instructions;
            // Se as instruções em inglês trouxerem pontos úteis, adiciona ao fim
            const extraSteps = rawNinjaInst
              .split('.')
              .map((s) => s.trim())
              .filter((s) => s.length > 15)
              .slice(0, 2);
            if (extraSteps.length > 0) {
              finalInstructions = [...match.instructions, ...extraSteps.map((s) => `Dica Pro: ${s}`)];
            }
          }
        }
      } catch {
        // Fallback gracioso para instruções em PT-BR do catálogo caso a API Ninjas falhe ou dê timeout
      }
    }

    const result = {
      name: exerciseName,
      ptName: match.ptName,
      enName: match.enName,
      photoUrl,
      secondaryPhotoUrl,
      imageUrl: photoUrl,
      thumbnailUrl: photoUrl,
      apparatusName: match.equipment,
      equipment: match.equipment,
      muscleGroup: match.muscleGroup,
      instructions: finalInstructions,
      setupInstructions: finalInstructions.join(' '),
    };

    // 5. Salvar em cache (24 horas)
    setCachedExerciseMedia(exerciseName, result);

    return NextResponse.json(
      { success: true, data: result, cached: false },
      { headers: { 'X-Cache': 'MISS' } }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao carregar mídia do exercício' },
      { status: 500 }
    );
  }
}
