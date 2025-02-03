import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import olxRoutes from './routes/olxRoutes.js';
import vintedRoutes from './routes/vintedRoutes.js';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';

const app = express();
const PORT = 4000;

app.use(bodyParser.json());
app.use(cors());

const swaggerDocument = JSON.parse(fs.readFileSync('./swagger-output.json', 'utf-8'));
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('', olxRoutes);
app.use('', vintedRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}/swagger`);
});
