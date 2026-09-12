const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: '123456789',
  database: 'Factusol',
  port: 5432,
  max: 15,
  idleTimeoutMillis: 30000
});

// Enable CORS for localhost:4200 and any client
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const path = require('path');

app.use(express.json());

// Serve static assets (images, logos, factusol photos)
app.use('/assets', express.static(path.join(__dirname, 'src/assets')));

// Logger
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const dbRes = await pool.query("SELECT count(*) FROM f_art WHERE suwart = '1'");
    res.json({
      status: 'online',
      message: 'Suministros Rubio Factusol Local API',
      active_articles: parseInt(dbRes.rows[0].count, 10),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// 1. Articles + Measures
app.get('/api/articles', async (req, res) => {
  try {
    const artQuery = `
      SELECT codart, eanart, famart, desart, dewart, tivart,
             cp1art, cp2art, cp3art, imgart, mewart, cstart,
             pcoart, uumart
      FROM f_art
      WHERE suwart = '1'
      ORDER BY desart ASC
    `;
    const artResult = await pool.query(artQuery);

    const umeQuery = `
      SELECT desume
      FROM f_ume
      WHERE TRIM(desume) <> ''
    `;
    const umeResult = await pool.query(umeQuery);
    const measures = umeResult.rows.map(r => r.desume);

    res.json({ articles: artResult.rows, measures });
  } catch (err) {
    console.error('Error in /api/articles:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2. Search Articles
app.get('/api/articles/search', async (req, res) => {
  try {
    const query = req.query.query || '';
    const q = `%${query}%`;
    const sql = `
      SELECT codart, eanart, famart, desart, dewart, tivart,
             cp1art, cp2art, cp3art, imgart, mewart, cstart,
             pcoart, uumart
      FROM f_art
      WHERE (LOWER(desart) LIKE LOWER($1) OR LOWER(codart) LIKE LOWER($1))
        AND suwart = '1'
      ORDER BY desart ASC
      LIMIT 100
    `;
    const result = await pool.query(sql, [q]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error in /api/articles/search:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. Articles by family
app.get('/api/family/:famId', async (req, res) => {
  try {
    const famId = req.params.famId;
    const sql = `
      SELECT codart, eanart, famart, desart, dewart, tivart,
             cp1art, cp2art, cp3art, imgart, mewart, cstart,
             pcoart, uumart
      FROM f_art
      WHERE (famart = $1 
             OR famart = LPAD($1, 3, '0') 
             OR famart = LPAD($1, 2, '0')
             OR TRIM(LEADING '0' FROM famart) = TRIM(LEADING '0' FROM $1))
        AND suwart = '1'
      ORDER BY desart ASC
    `;
    const result = await pool.query(sql, [famId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error in /api/family/:famId:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 4. Single Article by ID
app.get('/api/articles/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const sql = `
      SELECT codart, eanart, famart, desart, dewart, tivart,
             cp1art, cp2art, cp3art, imgart, mewart, cstart,
             pcoart, uumart
      FROM f_art
      WHERE codart = $1 AND suwart = '1'
    `;
    const result = await pool.query(sql, [id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Article not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Families (All)
app.get('/api/family', async (req, res) => {
  try {
    const sql = "SELECT codfam, desfam FROM f_fam WHERE suwfam = '1' ORDER BY desfam ASC";
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error('Error in /api/family:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 6. Families by sections
app.get('/api/families/:ids', async (req, res) => {
  try {
    const ids = req.params.ids.split(',').map(s => s.trim());
    const sql = `
      SELECT codfam, desfam
      FROM f_fam
      WHERE secfam = ANY($1::text[])
        AND suwfam = '1'
      ORDER BY desfam ASC
    `;
    const result = await pool.query(sql, [ids]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error in /api/families/:ids:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 7. Sections
app.get('/api/secction', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM f_sec WHERE suwsec = '1' ORDER BY dessec ASC");
    const mapped = result.rows.map(sec => ({
      codsec: sec.codsec,
      dessec: sec.dessec,
      imasec: sec.imasec
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/section', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM f_sec WHERE suwsec = '1' ORDER BY dessec ASC");
    const mapped = result.rows.map(sec => ({
      codsec: sec.codsec,
      dessec: sec.dessec,
      imasec: sec.imasec
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Measures
app.get('/api/measures', async (req, res) => {
  try {
    const result = await pool.query("SELECT desume FROM f_ume WHERE TRIM(desume) <> ''");
    res.json({ measures: result.rows.map(r => r.desume) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Rates
app.get('/api/rates', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM f_tar ORDER BY codtar ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error in /api/rates:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`====================================================`);
  console.log(`🚀 Suministros Rubio Factusol API activa en http://127.0.0.1:${PORT}`);
  console.log(`📊 Conectada a PostgreSQL Factusol (localhost:5432)`);
  console.log(`====================================================`);
});
