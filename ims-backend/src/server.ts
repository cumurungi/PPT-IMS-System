import 'dotenv/config';
import app from './app';

const PORT = parseInt(process.env.PORT || '3001', 10);

app.listen(PORT, () => {
  console.log(`IMS Backend running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Email] SMTP_USER=${process.env.SMTP_USER ? '✓ set' : '✗ missing'}, SMTP_PASS=${process.env.SMTP_PASS ? '✓ set' : '✗ missing'}`);
});
