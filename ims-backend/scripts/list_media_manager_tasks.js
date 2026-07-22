const { PrismaClient } = require('@prisma/client');
(async function main(){
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { email: 'media.manager@ims.com' } });
    if(!user){ console.log('Media manager not found'); return; }
    console.log('USER:', { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department });

    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { project: { department: user.department } },
          { projectId: null, assignee: { department: user.department } },
        ],
      },
      include: {
        assignee: { select: { id: true, name: true, department: true } },
        project: { select: { id: true, name: true, department: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    console.log('TASKS_COUNT:', tasks.length);
    for(const t of tasks){
      console.log('---');
      console.log({ id: t.id, title: t.title, project: t.project, assignee: t.assignee, createdBy: t.createdBy, deadline: t.deadline, status: t.status });
    }

    // Also list tasks created by media manager in other departments (to show cross-dept leakage)
    const otherTasks = await prisma.task.findMany({ where: { createdById: user.id, project: { department: { not: user.department } } }, include: { project: true }, take: 50 });
    console.log('TASKS_CREATED_BY_MANAGER_IN_OTHER_DEPTS:', otherTasks.length);
    for(const t of otherTasks) console.log({ id: t.id, title: t.title, project: t.project?.department });

  } catch(e){ console.error(e); }
  finally{ await prisma.$disconnect(); }
})();
