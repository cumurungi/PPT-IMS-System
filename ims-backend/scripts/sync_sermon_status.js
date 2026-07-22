const { PrismaClient } = require('@prisma/client');

(async function main() {
  const prisma = new PrismaClient();
  try {
    // Recordings that are being worked on / done, but whose linked sermon is still merely PLANNED
    const recordings = await prisma.recording.findMany({
      where: {
        eventId: { not: null },
        status: { in: ['IN_EDITING', 'EDITED', 'APPROVED', 'PUBLISHED'] },
        event: { status: 'PLANNED' },
      },
      include: { event: { select: { id: true, title: true, status: true } } },
    });

    console.log('Found', recordings.length, 'recording(s) with a PLANNED sermon to sync:');
    for (const r of recordings) {
      console.log('-', r.event.title, '(recording:', r.status + ')');
      await prisma.event.update({
        where: { id: r.eventId },
        data: { status: 'IN_PROGRESS' },
      });
    }
    console.log('Synced', recordings.length, 'sermon(s) to IN_PROGRESS.');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
