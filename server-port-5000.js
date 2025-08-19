const express = require('express');
const cors = require('cors');
const esewaRoutes = require('./server/routes/esewa');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use('/api/esewa', esewaRoutes);

app.listen(PORT, () => {
  console.log(`eSewa callback server running on port ${PORT}`);
});