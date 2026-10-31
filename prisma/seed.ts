import { PrismaClient, MuscleGroup } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed do Personal Life OS (Finanças + Foco + Notas + Calendário + Academia)...');

  // 1. Configurações Globais (upsert para preservar se já existir)
  await prisma.appSetting.upsert({
    where: { id: 'default' },
    update: {
      dailyFocusGoalMinutes: 100,
      pomodoroFocusMinutes: 25,
      pomodoroShortBreak: 5,
      pomodoroLongBreak: 15,
      weeklyWorkoutGoal: 4,
      dailyWaterGoalMl: 3000,
    },
    create: {
      id: 'default',
      monthlyIncome: 5500.0,
      emergencyFundGoal: 20000.0,
      currency: 'BRL',
      dailyFocusGoalMinutes: 100,
      pomodoroFocusMinutes: 25,
      pomodoroShortBreak: 5,
      pomodoroLongBreak: 15,
      weeklyWorkoutGoal: 4,
      dailyWaterGoalMl: 3000,
    },
  });

  // Categorias padrão (sem contas ou transações falsas)
  const existingCategoriesCount = await prisma.category.count();
  if (existingCategoriesCount === 0) {
    console.log('Criando categorias padrão do sistema...');
    const catSalario = await prisma.category.create({
      data: { name: 'Salário', type: 'INCOME', color: '#16a34a', icon: 'Briefcase', isDefault: true },
    });
    const catMoradia = await prisma.category.create({
      data: { name: 'Moradia', type: 'EXPENSE', color: '#ea580c', icon: 'Home', isDefault: true },
    });
    const catAlimentacao = await prisma.category.create({
      data: { name: 'Alimentação', type: 'EXPENSE', color: '#dc2626', icon: 'Utensils', isDefault: true },
    });
    const catTransporte = await prisma.category.create({
      data: { name: 'Transporte', type: 'EXPENSE', color: '#2563eb', icon: 'Car', isDefault: true },
    });
    const catSaude = await prisma.category.create({
      data: { name: 'Saúde', type: 'EXPENSE', color: '#059669', icon: 'HeartPulse', isDefault: true },
    });
    const catAssinaturas = await prisma.category.create({
      data: { name: 'Assinaturas', type: 'EXPENSE', color: '#0284c7', icon: 'Tv', isDefault: true },
    });

    await prisma.rule.createMany({
      data: [
        { pattern: 'IFOOD', categoryId: catAlimentacao.id },
        { pattern: 'UBER', categoryId: catTransporte.id },
        { pattern: 'NETFLIX', categoryId: catAssinaturas.id },
        { pattern: 'SPOTIFY', categoryId: catAssinaturas.id },
        { pattern: 'SMARTFIT', categoryId: catSaude.id },
      ],
    });
  }

  // ==============================================================
  // PASSO 2.1: Pastas de Notas Iniciais (Upsert por id determinístico)
  // ==============================================================
  const initialFolders = [
    { id: 'folder-financas', name: 'Finanças & Planejamento', icon: 'Wallet', color: '#10b981' },
    { id: 'folder-trabalho', name: 'Trabalho & Estudos', icon: 'Briefcase', color: '#3b82f6' },
    { id: 'folder-academia', name: 'Academia & Dieta', icon: 'Dumbbell', color: '#06b6d4' },
    { id: 'folder-diario', name: 'Diário Pessoal', icon: 'BookOpen', color: '#f59e0b' },
  ];

  for (const folder of initialFolders) {
    await prisma.noteFolder.upsert({
      where: { id: folder.id },
      update: { name: folder.name, icon: folder.icon, color: folder.color },
      create: folder,
    });
  }

  // ==============================================================
  // PASSO 2.2: Projetos Iniciais de Foco (Upsert por id determinístico)
  // ==============================================================
  const initialProjects = [
    { id: 'proj-trabalho', name: 'Trabalho Principal', color: '#3b82f6', icon: 'Briefcase' },
    { id: 'proj-estudos', name: 'Estudos & Carreira', color: '#8b5cf6', icon: 'GraduationCap' },
    { id: 'proj-organizacao', name: 'Organização Pessoal', color: '#f59e0b', icon: 'CheckSquare' },
  ];

  for (const proj of initialProjects) {
    await prisma.project.upsert({
      where: { id: proj.id },
      update: { name: proj.name, color: proj.color, icon: proj.icon },
      create: proj,
    });
  }

  // Criar tarefas iniciais caso não haja nenhuma
  const tasksCount = await prisma.task.count();
  if (tasksCount === 0) {
    const today = new Date();
    await prisma.task.createMany({
      data: [
        {
          title: 'Revisar orçamento mensal e fluxo de caixa',
          description: 'Conferir contas a vencer na semana e ajustar dinheiro livre.',
          status: 'TODO',
          priority: 'HIGH',
          dueDate: today,
          estimatedPomodoros: 2,
          completedPomodoros: 0,
          projectId: 'proj-organizacao',
        },
        {
          title: 'Bloco de Deep Work — Projeto Principal',
          description: 'Focar sem distrações nas entregas prioritárias do dia.',
          status: 'IN_PROGRESS',
          priority: 'URGENT',
          dueDate: today,
          estimatedPomodoros: 4,
          completedPomodoros: 1,
          projectId: 'proj-trabalho',
        },
        {
          title: 'Estudo Técnico & Arquitetura de Software',
          description: 'Leitura ativa e prática com anotações no Segundo Cérebro.',
          status: 'TODO',
          priority: 'MEDIUM',
          dueDate: today,
          estimatedPomodoros: 2,
          completedPomodoros: 0,
          projectId: 'proj-estudos',
        },
      ],
    });
  }

  // ==============================================================
  // PASSO 2.3: Biblioteca de Exercícios Completa (24 Exercícios Reais)
  // ==============================================================
  const exercisesList: Array<{
    id: string;
    name: string;
    muscleGroup: MuscleGroup;
    equipment: string;
    defaultRestSeconds: number;
    instructions: string;
  }> = [
    // CHEST
    { id: 'ex-supino-reto-barra', name: 'Supino Reto com Barra', muscleGroup: 'CHEST', equipment: 'Barra', defaultRestSeconds: 120, instructions: 'Escápulas retraídas, pés firmes no chão, descer a barra até tocar levemente o esterno.' },
    { id: 'ex-supino-inclinado-halter', name: 'Supino Inclinado com Halteres', muscleGroup: 'CHEST', equipment: 'Halter', defaultRestSeconds: 90, instructions: 'Banco a 30-45 graus. Controle a fase excêntrica alongando bem o peitoral superior.' },
    { id: 'ex-crucifixo-polia', name: 'Crucifixo na Polia (Crossover)', muscleGroup: 'CHEST', equipment: 'Polia', defaultRestSeconds: 75, instructions: 'Estabilize o tronco e concentre a contração máxima no centro do peito.' },
    // SHOULDERS
    { id: 'ex-desenvolvimento-halter', name: 'Desenvolvimento com Halteres', muscleGroup: 'SHOULDERS', equipment: 'Halter', defaultRestSeconds: 90, instructions: 'Mantenha o core firme e cotovelos levemente à frente da linha dos ombros.' },
    { id: 'ex-elevacao-lateral', name: 'Elevação Lateral com Halteres', muscleGroup: 'SHOULDERS', equipment: 'Halter', defaultRestSeconds: 60, instructions: 'Suba até a linha dos ombros guiando pelos cotovelos, sem balançar o tronco.' },
    { id: 'ex-crucifixo-inverso', name: 'Crucifixo Inverso na Máquina (Posterior)', muscleGroup: 'SHOULDERS', equipment: 'Máquina', defaultRestSeconds: 60, instructions: 'Foque no deltoide posterior evitando juntar excessivamente as escápulas.' },
    // TRICEPS
    { id: 'ex-triceps-pulley-corda', name: 'Tríceps Pulley com Corda', muscleGroup: 'TRICEPS', equipment: 'Polia', defaultRestSeconds: 60, instructions: 'Cotovelos fixos ao lado do corpo, abra a corda no final da extensão.' },
    { id: 'ex-triceps-frances', name: 'Tríceps Francês / Testa na Polia', muscleGroup: 'TRICEPS', equipment: 'Polia', defaultRestSeconds: 75, instructions: 'Alongue bem a cabeça longa do tríceps mantendo os cotovelos apontados para frente.' },
    // BACK
    { id: 'ex-puxada-frontal', name: 'Puxada Frontal Aberta (Pulldown)', muscleGroup: 'BACK', equipment: 'Polia', defaultRestSeconds: 90, instructions: 'Inicie o movimento deprimindo as escápulas e puxe a barra em direção ao topo do peito.' },
    { id: 'ex-remada-curvada', name: 'Remada Curvada / Cavalinho', muscleGroup: 'BACK', equipment: 'Barra', defaultRestSeconds: 120, instructions: 'Coluna neutra, tronco inclinado a 45° e puxe em direção ao umbigo.' },
    { id: 'ex-remada-baixa-triangulo', name: 'Remada Baixa Sentado (Triângulo)', muscleGroup: 'BACK', equipment: 'Polia', defaultRestSeconds: 90, instructions: 'Alongue as dorsais na frente e contraia estufando o peito ao puxar.' },
    { id: 'ex-pull-down-corda', name: 'Pulldown com Corda (Braços Estendidos)', muscleGroup: 'BACK', equipment: 'Polia', defaultRestSeconds: 60, instructions: 'Concentre a força nas dorsais mantendo os braços quase estendidos.' },
    // BICEPS
    { id: 'ex-rosca-direta-barra-w', name: 'Rosca Direta na Barra W', muscleGroup: 'BICEPS', equipment: 'Barra', defaultRestSeconds: 75, instructions: 'Evite roubar com a lombar, controle a descida em 2 segundos.' },
    { id: 'ex-rosca-martelo', name: 'Rosca Martelo com Halteres', muscleGroup: 'BICEPS', equipment: 'Halter', defaultRestSeconds: 60, instructions: 'Pegada neutra focando em braquial e antebraço.' },
    { id: 'ex-rosca-inclinada', name: 'Rosca Banco Inclinado 45°', muscleGroup: 'BICEPS', equipment: 'Halter', defaultRestSeconds: 75, instructions: 'Mantenha os cotovelos atrás da linha do tronco para máximo alongamento.' },
    // LEGS & GLUTES
    { id: 'ex-agachamento-livre', name: 'Agachamento Livre / Hack Machine', muscleGroup: 'LEGS', equipment: 'Barra', defaultRestSeconds: 150, instructions: 'Brace abdominal firme, joelhos acompanhando a ponta dos pés, boa amplitude.' },
    { id: 'ex-leg-press-45', name: 'Leg Press 45°', muscleGroup: 'LEGS', equipment: 'Máquina', defaultRestSeconds: 120, instructions: 'Desça até 90° ou mais sem retirar o quadril do encosto. Não trave os joelhos no topo.' },
    { id: 'ex-cadeira-extensora', name: 'Cadeira Extensora', muscleGroup: 'LEGS', equipment: 'Máquina', defaultRestSeconds: 75, instructions: 'Segure 1 segundo no pico de contração do quadríceps.' },
    { id: 'ex-stiff-barra', name: 'Stiff com Barra / Halteres', muscleGroup: 'LEGS', equipment: 'Barra', defaultRestSeconds: 120, instructions: 'Projete o quadril para trás mantendo a coluna reta e sentindo alongar os posteriores.' },
    { id: 'ex-mesa-flexora', name: 'Mesa / Cadeira Flexora', muscleGroup: 'LEGS', equipment: 'Máquina', defaultRestSeconds: 75, instructions: 'Mantenha o quadril pressionado contra o banco durante toda a série.' },
    { id: 'ex-elevacao-pelvica', name: 'Elevação Pélvica na Máquina / Barra', muscleGroup: 'GLUTES', equipment: 'Barra', defaultRestSeconds: 90, instructions: 'Contraia forte os glúteos no topo com queixo levemente recolhido.' },
    { id: 'ex-panturrilha-sentado', name: 'Panturrilha em Pé / Sentado', muscleGroup: 'LEGS', equipment: 'Máquina', defaultRestSeconds: 60, instructions: 'Amplitude máxima no alongamento e pausa de 1s no topo.' },
    // ABS & CARDIO
    { id: 'ex-abdominal-infra', name: 'Abdominal Supra na Polia / Infra', muscleGroup: 'ABS', equipment: 'Polia', defaultRestSeconds: 60, instructions: 'Enrole a coluna vertebral soltando todo o ar na contração.' },
    { id: 'ex-cardio-esteira', name: 'Esteira Inclinada / Escada (LISS)', muscleGroup: 'CARDIO', equipment: 'Máquina', defaultRestSeconds: 30, instructions: 'Zona 2 cardíaca (120-135 bpm) para saúde cardiovascular e gasto calórico.' },
  ];

  for (const ex of exercisesList) {
    await prisma.exercise.upsert({
      where: { id: ex.id },
      update: {
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        equipment: ex.equipment,
        defaultRestSeconds: ex.defaultRestSeconds,
        instructions: ex.instructions,
      },
      create: ex,
    });
  }

  // ==============================================================
  // PASSO 2.4: 3 Fichas de Treino Prontas (A - Push, B - Pull, C - Legs)
  // ==============================================================
  const routines = [
    {
      id: 'routine-push-a',
      name: 'Treino A — Push (Peito, Ombro e Tríceps)',
      code: 'A',
      description: 'Foco em tensão mecânica para empurrar: peitoral completo, deltoide anterior/lateral e tríceps.',
      color: '#06b6d4',
      suggestedDays: ['MON', 'THU'],
      exercises: [
        { id: 're-a-1', exerciseId: 'ex-supino-reto-barra', order: 1, targetSets: 4, targetReps: '6-8', targetWeightKg: 60, restSeconds: 120 },
        { id: 're-a-2', exerciseId: 'ex-supino-inclinado-halter', order: 2, targetSets: 3, targetReps: '8-10', targetWeightKg: 24, restSeconds: 90 },
        { id: 're-a-3', exerciseId: 'ex-crucifixo-polia', order: 3, targetSets: 3, targetReps: '10-12', targetWeightKg: 15, restSeconds: 75 },
        { id: 're-a-4', exerciseId: 'ex-desenvolvimento-halter', order: 4, targetSets: 3, targetReps: '8-10', targetWeightKg: 20, restSeconds: 90 },
        { id: 're-a-5', exerciseId: 'ex-elevacao-lateral', order: 5, targetSets: 4, targetReps: '12-15', targetWeightKg: 12, restSeconds: 60 },
        { id: 're-a-6', exerciseId: 'ex-triceps-pulley-corda', order: 6, targetSets: 3, targetReps: '10-12', targetWeightKg: 25, restSeconds: 60 },
        { id: 're-a-7', exerciseId: 'ex-triceps-frances', order: 7, targetSets: 3, targetReps: '10-12', targetWeightKg: 20, restSeconds: 75 },
      ],
    },
    {
      id: 'routine-pull-b',
      name: 'Treino B — Pull (Costas, Trapézio e Bíceps)',
      code: 'B',
      description: 'Expansão e densidade dorsal, deltoide posterior e pico de bíceps.',
      color: '#8b5cf6',
      suggestedDays: ['TUE', 'FRI'],
      exercises: [
        { id: 're-b-1', exerciseId: 'ex-puxada-frontal', order: 1, targetSets: 4, targetReps: '8-10', targetWeightKg: 55, restSeconds: 90 },
        { id: 're-b-2', exerciseId: 'ex-remada-curvada', order: 2, targetSets: 4, targetReps: '8-10', targetWeightKg: 50, restSeconds: 120 },
        { id: 're-b-3', exerciseId: 'ex-remada-baixa-triangulo', order: 3, targetSets: 3, targetReps: '10-12', targetWeightKg: 50, restSeconds: 90 },
        { id: 're-b-4', exerciseId: 'ex-crucifixo-inverso', order: 4, targetSets: 3, targetReps: '12-15', targetWeightKg: 35, restSeconds: 60 },
        { id: 're-b-5', exerciseId: 'ex-rosca-direta-barra-w', order: 5, targetSets: 3, targetReps: '8-10', targetWeightKg: 28, restSeconds: 75 },
        { id: 're-b-6', exerciseId: 'ex-rosca-martelo', order: 6, targetSets: 3, targetReps: '10-12', targetWeightKg: 14, restSeconds: 60 },
      ],
    },
    {
      id: 'routine-legs-c',
      name: 'Treino C — Legs (Pernas Completo & Core)',
      code: 'C',
      description: 'Quadríceps, posteriores de coxa, glúteos, panturrilhas e estabilidade abdominal.',
      color: '#10b981',
      suggestedDays: ['WED', 'SAT'],
      exercises: [
        { id: 're-c-1', exerciseId: 'ex-agachamento-livre', order: 1, targetSets: 4, targetReps: '6-8', targetWeightKg: 80, restSeconds: 150 },
        { id: 're-c-2', exerciseId: 'ex-leg-press-45', order: 2, targetSets: 4, targetReps: '10-12', targetWeightKg: 180, restSeconds: 120 },
        { id: 're-c-3', exerciseId: 'ex-cadeira-extensora', order: 3, targetSets: 3, targetReps: '12-15', targetWeightKg: 65, restSeconds: 75 },
        { id: 're-c-4', exerciseId: 'ex-stiff-barra', order: 4, targetSets: 4, targetReps: '8-10', targetWeightKg: 70, restSeconds: 120 },
        { id: 're-c-5', exerciseId: 'ex-mesa-flexora', order: 5, targetSets: 3, targetReps: '10-12', targetWeightKg: 50, restSeconds: 75 },
        { id: 're-c-6', exerciseId: 'ex-panturrilha-sentado', order: 6, targetSets: 4, targetReps: '12-15', targetWeightKg: 45, restSeconds: 60 },
        { id: 're-c-7', exerciseId: 'ex-abdominal-infra', order: 7, targetSets: 3, targetReps: '15-20', targetWeightKg: 30, restSeconds: 60 },
      ],
    },
  ];

  for (const r of routines) {
    await prisma.workoutRoutine.upsert({
      where: { id: r.id },
      update: {
        name: r.name,
        code: r.code,
        description: r.description,
        color: r.color,
        suggestedDays: r.suggestedDays,
        isActive: true,
      },
      create: {
        id: r.id,
        name: r.name,
        code: r.code,
        description: r.description,
        color: r.color,
        suggestedDays: r.suggestedDays,
        isActive: true,
      },
    });

    for (const item of r.exercises) {
      await prisma.workoutRoutineExercise.upsert({
        where: { id: item.id },
        update: {
          order: item.order,
          targetSets: item.targetSets,
          targetReps: item.targetReps,
          targetWeightKg: item.targetWeightKg,
          restSeconds: item.restSeconds,
        },
        create: {
          id: item.id,
          routineId: r.id,
          exerciseId: item.exerciseId,
          order: item.order,
          targetSets: item.targetSets,
          targetReps: item.targetReps,
          targetWeightKg: item.targetWeightKg,
          restSeconds: item.restSeconds,
        },
      });
    }
  }

  // Nota inicial de boas-vindas caso não haja notas
  const notesCount = await prisma.note.count();
  if (notesCount === 0) {
    await prisma.note.create({
      data: {
        title: 'Plano Estratégico — Life OS 360°',
        folderId: 'folder-financas',
        isPinned: true,
        isFavorite: true,
        tags: ['planejamento', 'financas', 'treino'],
        content: `# Bem-vindo ao seu Segundo Cérebro 🧠\n\nEste espaço conecta suas **Finanças**, **Projetos de Foco**, **Calendário** e **Academia**.\n\n## Metas Principais\n- [x] Estruturar orçamento e reserva de emergência\n- [ ] Manter média de 4 sessões de foco (Pomodoro) por dia\n- [ ] Concluir 4 treinos por semana com progressão de carga\n- [ ] Beber 3L de água e tomar 5g de creatina todos os dias`,
      },
    });
  }

  console.log('✅ Seed do Life OS concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
