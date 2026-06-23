import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find all recordings in IN_EDITING status
  const recordings = await prisma.recording.findMany({
    where: { status: 'IN_EDITING' },
    include: { event: { select: { title: true } } },
  });

  console.log(`Found ${recordings.length} recordings in IN_EDITING status`);

  if (recordings.length === 0) {
    console.log('Nothing to backfill.');
    return;
  }

  // Find or create the default Sermon Recordings project
  let project = await prisma.editingProject.findFirst({
    where: { title: 'Sermon Recordings' },
  });

  if (!project) {
    // Need an admin user to be the creator
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) {
      console.error('No admin user found. Cannot create project.');
      return;
    }
    project = await prisma.editingProject.create({
      data: {
        title: 'Sermon Recordings',
        description: 'Auto-created project for sermon recording edits',
        status: 'IN_PROGRESS',
        deadline: new Date(Date.now() + 30 * 86400000),
        createdById: admin.id,
      },
    });
    console.log('Created "Sermon Recordings" editing project');
  }

  // Create editing tasks for each recording
  for (const rec of recordings) {
    // Check if task already exists for this recording
    const existing = await prisma.editingTask.findFirst({
      where: { title: { contains: rec.title } },
    });
    if (existing) {
      console.log(`  Skipping "${rec.title}" — task already exists`);
      continue;
    }

    const assigneeId = rec.editorId || rec.recordingAssigneeId;
    if (!assigneeId) {
      console.log(`  Skipping "${rec.title}" — no editor assigned`);
      continue;
    }

    await prisma.editingTask.create({
      data: {
        projectId: project.id,
        title: `Edit: ${rec.title}`,
        description: rec.event?.title
          ? `Edit the recording for sermon "${rec.event.title}"`
          : `Edit recording: ${rec.title}`,
        assigneeId,
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        deadline: new Date(Date.now() + 7 * 86400000),
      },
    });
    console.log(`  Created editing task for "${rec.title}"`);
  }

  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
