import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Configure multer for local storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'projects');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB per file
});

// POST /api/v1/upload/project/:projectId
// Supports multiple files (folder upload sends multiple files with paths)
router.post('/project/:projectId', upload.array('files', 50), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId;
    const files = req.files as Express.Multer.File[];
    // filePaths comes from the frontend — the relative path within the folder
    const filePaths: string[] = req.body.filePaths
      ? (Array.isArray(req.body.filePaths) ? req.body.filePaths : [req.body.filePaths])
      : [];

    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    // Verify project exists
    await prisma.project.findUniqueOrThrow({ where: { id: projectId } });

    // Create records for each file
    const records = await Promise.all(
      files.map((file, index) => {
        const relativePath = filePaths[index] || file.originalname;
        return prisma.projectFile.create({
          data: {
            projectId,
            fileName: file.originalname,
            filePath: relativePath,
            fileUrl: `/uploads/projects/${file.filename}`,
            fileSizeBytes: file.size,
            mimeType: file.mimetype,
            uploadedById: req.user!.id,
          },
        });
      })
    );

    res.status(201).json({ uploaded: records.length, files: records });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/upload/project/:projectId/files
router.get('/project/:projectId/files', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = await prisma.projectFile.findMany({
      where: { projectId: req.params.projectId },
      orderBy: { filePath: 'asc' },
    });

    // Build folder tree structure
    const tree = buildFileTree(files);
    res.json({ files, tree });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/upload/project/:projectId/files/:fileId
router.delete('/project/:projectId/files/:fileId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = await prisma.projectFile.findUniqueOrThrow({ where: { id: req.params.fileId } });

    // Delete physical file
    const filePath = path.join(process.cwd(), file.fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // Delete record
    await prisma.projectFile.delete({ where: { id: req.params.fileId } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Helper: build a nested tree from flat file paths
function buildFileTree(files: any[]) {
  const root: any = { name: '/', type: 'folder', children: [] };

  for (const file of files) {
    const parts = file.filePath.split('/');
    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      let folder = current.children.find((c: any) => c.name === parts[i] && c.type === 'folder');
      if (!folder) {
        folder = { name: parts[i], type: 'folder', children: [] };
        current.children.push(folder);
      }
      current = folder;
    }

    current.children.push({
      id: file.id,
      name: parts[parts.length - 1],
      type: 'file',
      size: file.fileSizeBytes,
      mimeType: file.mimeType,
      url: file.fileUrl,
      createdAt: file.createdAt,
    });
  }

  return root;
}

// POST /api/v1/upload/media-asset — single file upload for media library
router.post('/media-asset', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    res.status(201).json({
      fileUrl: `/uploads/projects/${file.filename}`,
      fileName: file.originalname,
      fileSizeBytes: file.size,
      mimeType: file.mimetype,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
