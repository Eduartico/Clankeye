// ⚠️  Must be set BEFORE any Crawlee import so it writes to temp and never
//    triggers nodemon restarts inside the project directory.
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
process.env.CRAWLEE_STORAGE_DIR = path.join(os.tmpdir(), 'clankeye-crawlee-storage');

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import routes from './routes.js';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 4000;

app.use(bodyParser.json());
app.use(cors());

const swaggerDocument = JSON.parse(fs.readFileSync(path.join(__dirname, 'swagger-output.json'), 'utf-8'));
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/', routes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}/swagger`);
});
