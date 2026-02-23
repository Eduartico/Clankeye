import express from 'express';
const app = express();
app.get('/health', (req, res) => res.json({ ok: true }));
app.listen(4000, () => console.log('MINIMAL SERVER ON 4000'));
