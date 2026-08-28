import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Try .env.local or local.env first (standard local development override)
const dotEnvLocalPath = path.join(rootDir, '.env.local');
const localEnvPath = path.join(rootDir, 'local.env');

if (fs.existsSync(dotEnvLocalPath)) {
  dotenv.config({ path: dotEnvLocalPath });
} else if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
}

// 2. Fallback to .env (production / default)
const dotEnvPath = path.join(rootDir, '.env');
if (fs.existsSync(dotEnvPath)) {
  dotenv.config({ path: dotEnvPath });
}
