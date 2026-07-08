const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { researchCompany } = require('./agent');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running!' });
});

app.post('/api/research', async (req, res) => {
  try {
    const { companyName } = req.body;
    if (!companyName) {
      return res.status(400).json({ error: 'companyName is required' });
    }
    const result = await researchCompany(companyName);
    res.json({ result });
  } catch (err) {
    console.error(err);
    const message = err?.message || 'Something went wrong';
    const isQuotaError = /429|quota|rate limit/i.test(message);
    res.status(isQuotaError ? 429 : 500).json({
      error: isQuotaError
        ? 'Tavily quota or rate limit reached. Please wait a moment and try again.'
        : 'Something went wrong',
      details: message,
    });
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});
