import 'dotenv/config';
import bcrypt from 'bcrypt';
import prisma from '../src/lib/prisma.js';

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10);

  const user = await prisma.user.upsert({
    where: { email: 'gean@studyflow.dev' },
    update: {
      name: 'Gean Lima',
      level: 'Universitario',
      theme: 'light',
      passwordHash,
    },
    create: {
      name: 'Gean Lima',
      email: 'gean@studyflow.dev',
      level: 'Universitario',
      theme: 'light',
      passwordHash,
    },
  });

  await prisma.community.deleteMany();
  await prisma.file.deleteMany({ where: { userId: user.id } });
  await prisma.study.deleteMany({ where: { userId: user.id } });
  await prisma.habit.deleteMany({ where: { userId: user.id } });
  await prisma.task.deleteMany({ where: { userId: user.id } });
  await prisma.communityMember.deleteMany({ where: { userId: user.id } });

  await prisma.community.createMany({
    data: [
      {
        title: 'JavaScript Coding',
        slug: 'javascript-coding',
        members: 1280,
        icon: 'bxl-javascript',
        description: 'Projetos web, DOM, boas praticas e desafios.',
      },
      {
        title: 'Math Experts',
        slug: 'math-experts',
        members: 860,
        icon: 'bx-math',
        description: 'Calculo, algebra, listas e resolucao de problemas.',
      },
      {
        title: 'Algorithms',
        slug: 'algorithms',
        members: 640,
        icon: 'bx-code-alt',
        description: 'Estruturas de dados e logica de programacao.',
      },
    ],
  });

  await prisma.task.createMany({
    data: [
      {
        userId: user.id,
        title: 'Revisar DOM e eventos',
        course: 'Desenvolvimento Web',
        dueDateLabel: 'Hoje',
        priority: 'Alta',
        status: 'Pendente',
      },
      {
        userId: user.id,
        title: 'Resolver lista de calculo',
        course: 'Matematica',
        dueDateLabel: 'Amanha',
        priority: 'Media',
        status: 'Em progresso',
      },
      {
        userId: user.id,
        title: 'Organizar anotacoes da aula',
        course: 'Banco de Dados',
        dueDateLabel: 'Sex',
        priority: 'Baixa',
        status: 'Concluida',
      },
    ],
  });

  await prisma.habit.createMany({
    data: [
      { userId: user.id, title: 'Estudar 2h', streak: 8, doneToday: true, frequency: 'Diario' },
      { userId: user.id, title: 'Ler 10 paginas', streak: 5, doneToday: false, frequency: 'Diario' },
      { userId: user.id, title: 'Revisar flashcards', streak: 12, doneToday: true, frequency: 'Seg-Sex' },
      { userId: user.id, title: 'Beber agua', streak: 3, doneToday: false, frequency: 'Diario' },
    ],
  });

  await prisma.study.createMany({
    data: [
      { userId: user.id, title: 'Matematica', progress: 68, hours: 7.5, color: 'green' },
      { userId: user.id, title: 'Programacao', progress: 52, hours: 5, color: 'blue' },
      { userId: user.id, title: 'Banco de Dados', progress: 34, hours: 3.5, color: 'orange' },
    ],
  });

  await prisma.file.createMany({
    data: [
      { userId: user.id, name: 'VectorAndArrays.pdf', area: 'Matematica', dateLabel: 'Hoje' },
      { userId: user.id, name: 'CalculumNotes.txt', area: 'Matematica', dateLabel: 'Ontem' },
      { userId: user.id, name: 'ProjetoWeb.md', area: 'Programacao', dateLabel: 'Seg' },
    ],
  });

  console.log('Seed completed for user gean@studyflow.dev / 123456');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
