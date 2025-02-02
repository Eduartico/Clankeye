const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const olxRoutes = require('./routes/olxRoutes');

const app = express();
const PORT = 4000;

app.use(bodyParser.json());
app.use(cors());

app.use('/api/olx', olxRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
