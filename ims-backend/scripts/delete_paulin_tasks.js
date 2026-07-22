const { PrismaClient } = require('@prisma/client');
(async function main(){
  const prisma = new PrismaClient();
  try {
    // Find tasks where project name or title or description contains 'paulin' (case-insensitive)
    // Prisma client here doesn't accept the `mode` option; search both cases.
    const matches = await prisma.task.findMany({
      where: {
        OR: [
          { title: { contains: 'Paulin' } },
          { title: { contains: 'paulin' } },
          { description: { contains: 'Paulin' } },
          { description: { contains: 'paulin' } },
          { project: { name: { contains: 'Paulin' } } },
          { project: { name: { contains: 'paulin' } } },
        ],
      },
      include: { project: true }
    });

    if(matches.length === 0){
      console.log('No matching tasks found.');
      return;
    }

    console.log('Found', matches.length, 'task(s) to delete:');
    matches.forEach(t => console.log('-', t.id, t.title, '(project:', t.project?.name || 'none', ')'));

    const ids = matches.map(t => t.id);
    // Delete tasks
    const deleted = await prisma.task.deleteMany({ where: { id: { in: ids } } });
    console.log('Deleted count:', deleted.count);
  } catch(e){ console.error(e); }
  finally{ await prisma.$disconnect(); }
})();
