const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || '45C5FF775A69B523C2407189D62592BC';
const ACCDB_PATH = 'G:/Otros ordenadores/Mi PC/Bentian/API/bentian/2252025.accdb';

let adodb = null;
try {
  adodb = require('g:/Otros ordenadores/Mi PC/Bentian/API/bentian/node_modules/node-adodb');
} catch (e) {
  try { adodb = require('node-adodb'); } catch (_) {}
}

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

app.use(express.json());

// Serve static assets (images, logos, factusol photos)
app.use('/assets', express.static(path.join(__dirname, 'src/assets')));

// Logger
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// Helper to sanitize SQL strings for Access OLEDB
function sanitizeAccess(value) {
  if (!value) return '';
  return String(value).replace(/'/g, "''").trim();
}

// Background sync to Access F_CLI
async function syncToAccessDb(action, clientData) {
  if (!adodb || !fs.existsSync(ACCDB_PATH)) return;
  try {
    const connection = adodb.open(`Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${ACCDB_PATH};`);
    const sCodcli = sanitizeAccess(clientData.codcli);
    const sName = sanitizeAccess(clientData.name);
    const sNif = sanitizeAccess(clientData.dni);
    const sDom = sanitizeAccess(clientData.address);
    const sPob = sanitizeAccess(clientData.pob);
    const sCpo = sanitizeAccess(clientData.cp);
    const sPro = sanitizeAccess(clientData.prov);
    const sTel = sanitizeAccess(clientData.telf);
    const sEmail = sanitizeAccess(clientData.email);
    const sWebpass = sanitizeAccess(clientData.passwordHash);

    if (action === 'insert') {
      const sql = `
        INSERT INTO F_CLI (CODCLI, CUWCLI, CAWCLI, NIFCLI, NOFCLI, NOCCLI, DOMCLI, POBCLI, CPOCLI, PROCLI, TELCLI, EMACLI)
        VALUES (${Number(sCodcli)}, '${sCodcli}', '${sWebpass}', '${sNif}', '${sName}', '${sName}', '${sDom}', '${sPob}', '${sCpo}', '${sPro}', '${sTel}', '${sEmail}')
      `;
      await connection.execute(sql);
      console.log(`[Access Sync] ✓ Cliente ${sCodcli} sincronizado en ${path.basename(ACCDB_PATH)}`);
    } else if (action === 'update') {
      const sql = `
        UPDATE F_CLI
        SET NOFCLI = '${sName}',
            EMACLI = '${sEmail}',
            DOMCLI = '${sDom}',
            NIFCLI = '${sNif}',
            TELCLI = '${sTel}',
            CPOCLI = '${sCpo}',
            POBCLI = '${sPob}',
            PROCLI = '${sPro}'
        WHERE CODCLI = ${Number(sCodcli)}
      `;
      await connection.execute(sql);
      console.log(`[Access Sync] ✓ Cliente ${sCodcli} actualizado en ${path.basename(ACCDB_PATH)}`);
    }
  } catch (err) {
    console.warn(`[Access Sync Notice] No se pudo escribir en Access (bloqueo normal si Factusol está en uso): ${err.message}`);
  }
}

// Auto-initialize usuarios table if not exists
async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        codcli INTEGER PRIMARY KEY,
        name VARCHAR(100),
        surname VARCHAR(100),
        email VARCHAR(255) UNIQUE,
        address VARCHAR(200),
        dni VARCHAR(30),
        telf VARCHAR(30),
        cp VARCHAR(10),
        pob VARCHAR(50),
        prov VARCHAR(50),
        pais VARCHAR(50),
        tdc VARCHAR(10),
        password VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Tabla usuarios verificada en PostgreSQL Factusol');
  } catch (err) {
    console.error('Error inicializando tabla usuarios:', err.message);
  }
}
initDb();

// =========================================================================
// 1. HEALTH CHECK
// =========================================================================
app.get('/api/health', async (req, res) => {
  try {
    const dbRes = await pool.query("SELECT count(*) FROM f_art WHERE suwart = '1'");
    const userRes = await pool.query("SELECT count(*) FROM f_cli");
    res.json({
      status: 'online',
      message: 'Suministros Rubio Factusol Local API (Auth & Full ERP Ready)',
      active_articles: parseInt(dbRes.rows[0].count, 10),
      total_clients: parseInt(userRes.rows[0].count, 10),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// =========================================================================
// 2. USER AUTHENTICATION & PROFILE
// =========================================================================

// POST /api/login
app.post(['/api/login', '/api/user/login'], async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }

  try {
    const q = `
      SELECT codcli, nofcli, noccli, nifcli, domcli, pobcli, cpocli, procli, telcli, emacli, cuwcli, cawcli, tarcli
      FROM f_cli
      WHERE LOWER(TRIM(emacli)) = LOWER(TRIM($1))
         OR LOWER(TRIM(cuwcli)) = LOWER(TRIM($1))
         OR codcli = TRIM($1)
      LIMIT 1
    `;
    const result = await pool.query(q, [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas. Usuario no encontrado.' });
    }

    const user = result.rows[0];
    const hash = user.cawcli;
    let isValid = false;

    if (hash && (hash.startsWith('$2a$') || hash.startsWith('$2b$'))) {
      isValid = await bcrypt.compare(password, hash);
    } else if (hash) {
      isValid = (password === hash);
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: user.codcli, email: user.emacli },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const safeUser = {
      id: user.codcli,
      CODCLI: user.codcli,
      name: user.nofcli || '',
      NAME: user.nofcli || '',
      surname: '',
      SURNAME: '',
      email: user.emacli || '',
      EMAIL: user.emacli || '',
      address: user.domcli || '',
      ADDRESS: user.domcli || '',
      dni: user.nifcli || '',
      DNI: user.nifcli || '',
      telf: user.telcli || '',
      TELF: user.telcli || '',
      cp: user.cpocli || '',
      CP: user.cpocli || '',
      pob: user.pobcli || '',
      POB: user.pobcli || '',
      prov: user.procli || '',
      PROV: user.procli || '',
      pais: 'España',
      PAIS: 'España',
      tarcli: user.tarcli || '1'
    };

    res.json({
      message: 'Login exitoso',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno en el servidor durante el login' });
  }
});

// POST /api/createUser
app.post(['/api/createUser', '/api/register', '/api/user/create'], async (req, res) => {
  try {
    const rawName = req.body.NAME || req.body.name || req.body.username || '';
    const rawSurname = req.body.SURNAME || req.body.surname || '';
    const rawEmail = (req.body.EMAIL || req.body.email || '').trim().toLowerCase();
    const rawAddress = req.body.ADDRESS || req.body.address || '';
    const rawDni = (req.body.DNI || req.body.dni || '').trim();
    const rawTelf = req.body.TELF || req.body.telf || '';
    const rawCp = req.body.CP || req.body.cp || '';
    const rawPob = req.body.POB || req.body.pob || '';
    const rawProv = req.body.PROV || req.body.prov || '';
    const rawPais = req.body.PAIS || req.body.pais || 'España';
    const rawTdc = req.body.TDC || req.body.tdc || '';
    const rawPass = req.body.WEBPASS || req.body.password || '';

    if (!rawEmail || !rawPass) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    // Check duplicate email
    const checkEmail = await pool.query(
      'SELECT codcli::text FROM f_cli WHERE LOWER(TRIM(emacli)) = $1 UNION SELECT codcli::text FROM usuarios WHERE LOWER(TRIM(email)) = $1 LIMIT 1',
      [rawEmail]
    );
    if (checkEmail.rows.length > 0) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }

    let hashedPassword = rawPass;
    if (!rawPass.startsWith('$2a$') && !rawPass.startsWith('$2b$')) {
      hashedPassword = await bcrypt.hash(rawPass, 10);
    }

    // Calculate next CODCLI
    const maxRes = await pool.query(`
      SELECT COALESCE(MAX(CAST(codcli AS INTEGER)), 10000) AS max_id 
      FROM f_cli 
      WHERE codcli ~ '^[0-9]+$' AND CAST(codcli AS INTEGER) < 900000
    `);
    const nextId = (parseInt(maxRes.rows[0].max_id, 10) || 10000) + 1;
    const codcliStr = String(nextId);
    const fullName = (rawSurname ? `${rawName} ${rawSurname}` : rawName).trim() || 'Cliente Web';

    // Insert into f_cli
    await pool.query(`
      INSERT INTO f_cli (
        codcli, nofcli, noccli, nifcli, domcli, pobcli, cpocli, procli, telcli, emacli, cuwcli, cawcli
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      )
    `, [
      codcliStr, fullName, fullName, rawDni, rawAddress, rawPob, rawCp, rawProv, rawTelf, rawEmail, codcliStr, hashedPassword
    ]);

    // Insert into usuarios table
    await pool.query(`
      INSERT INTO usuarios (
        codcli, name, surname, email, address, dni, telf, cp, pob, prov, pais, tdc, password
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      )
      ON CONFLICT (codcli) DO NOTHING
    `, [
      nextId, rawName, rawSurname, rawEmail, rawAddress, rawDni, rawTelf, rawCp, rawPob, rawProv, rawPais, rawTdc, hashedPassword
    ]);

    // Background sync to Access
    syncToAccessDb('insert', {
      codcli: codcliStr,
      name: fullName,
      dni: rawDni,
      address: rawAddress,
      pob: rawPob,
      cp: rawCp,
      prov: rawProv,
      telf: rawTelf,
      email: rawEmail,
      passwordHash: hashedPassword
    });

    res.status(201).json({
      message: 'Usuario registrado correctamente en Factusol',
      codcli: codcliStr
    });
  } catch (err) {
    console.error('Error al registrar usuario:', err);
    res.status(500).json({ error: 'Error al registrar el usuario en Factusol: ' + err.message });
  }
});

// PUT /api/updateUser
app.put(['/api/updateUser', '/api/user/update'], async (req, res) => {
  try {
    const codcli = req.body.CODCLI || req.body.codcli || req.body.id;
    if (!codcli) {
      return res.status(400).json({ error: 'El identificador del usuario (CODCLI) es requerido' });
    }

    const rawName = req.body.NAME || req.body.name || req.body.username || '';
    const rawSurname = req.body.SURNAME || req.body.surname || '';
    const rawEmail = req.body.EMAIL || req.body.email || '';
    const rawAddress = req.body.ADDRESS || req.body.address || '';
    const rawDni = req.body.DNI || req.body.dni || '';
    const rawTelf = req.body.TELF || req.body.telf || '';
    const rawCp = req.body.CP || req.body.cp || '';
    const rawPob = req.body.POB || req.body.pob || '';
    const rawProv = req.body.PROV || req.body.prov || '';
    const fullName = (rawSurname ? `${rawName} ${rawSurname}` : rawName).trim();

    const result = await pool.query(`
      UPDATE f_cli
      SET nofcli = COALESCE(NULLIF($1, ''), nofcli),
          domcli = COALESCE(NULLIF($2, ''), domcli),
          pobcli = COALESCE(NULLIF($3, ''), pobcli),
          cpocli = COALESCE(NULLIF($4, ''), cpocli),
          procli = COALESCE(NULLIF($5, ''), procli),
          telcli = COALESCE(NULLIF($6, ''), telcli),
          emacli = COALESCE(NULLIF($7, ''), emacli),
          nifcli = COALESCE(NULLIF($8, ''), nifcli)
      WHERE codcli = $9
      RETURNING codcli, nofcli, noccli, nifcli, domcli, pobcli, cpocli, procli, telcli, emacli, cuwcli, tarcli
    `, [fullName, rawAddress, rawPob, rawCp, rawProv, rawTelf, rawEmail, rawDni, String(codcli)]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado en Factusol' });
    }

    const updated = result.rows[0];

    // Update usuarios table
    await pool.query(`
      UPDATE usuarios
      SET name = COALESCE(NULLIF($1, ''), name),
          surname = COALESCE(NULLIF($2, ''), surname),
          email = COALESCE(NULLIF($3, ''), email),
          address = COALESCE(NULLIF($4, ''), address),
          dni = COALESCE(NULLIF($5, ''), dni),
          telf = COALESCE(NULLIF($6, ''), telf),
          cp = COALESCE(NULLIF($7, ''), cp),
          pob = COALESCE(NULLIF($8, ''), pob),
          prov = COALESCE(NULLIF($9, ''), prov)
      WHERE codcli = $10
    `, [rawName, rawSurname, rawEmail, rawAddress, rawDni, rawTelf, rawCp, rawPob, rawProv, parseInt(codcli, 10)]).catch(() => null);

    syncToAccessDb('update', {
      codcli: String(codcli),
      name: fullName,
      dni: rawDni,
      address: rawAddress,
      pob: rawPob,
      cp: rawCp,
      prov: rawProv,
      telf: rawTelf,
      email: rawEmail
    });

    const safeUser = {
      id: updated.codcli,
      CODCLI: updated.codcli,
      name: updated.nofcli,
      NAME: updated.nofcli,
      surname: '',
      SURNAME: '',
      email: updated.emacli,
      EMAIL: updated.emacli,
      address: updated.domcli,
      ADDRESS: updated.domcli,
      dni: updated.nifcli,
      DNI: updated.nifcli,
      telf: updated.telcli,
      TELF: updated.telcli,
      cp: updated.cpocli,
      CP: updated.cpocli,
      pob: updated.pobcli,
      POB: updated.pobcli,
      prov: updated.procli,
      PROV: updated.procli,
      pais: 'España',
      PAIS: 'España'
    };

    res.json({
      message: 'Perfil actualizado correctamente',
      updatedUser: safeUser
    });
  } catch (err) {
    console.error('Error actualizando usuario:', err);
    res.status(500).json({ error: 'Error actualizando el usuario: ' + err.message });
  }
});

// GET /api/user/:id
app.get('/api/user/:id', async (req, res) => {
  try {
    const codcli = req.params.id;
    const result = await pool.query(
      'SELECT codcli, nofcli, noccli, nifcli, domcli, pobcli, cpocli, procli, telcli, emacli, cuwcli, tarcli FROM f_cli WHERE codcli = $1',
      [String(codcli)]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const user = result.rows[0];
    res.json({
      id: user.codcli,
      CODCLI: user.codcli,
      name: user.nofcli,
      NAME: user.nofcli,
      email: user.emacli,
      EMAIL: user.emacli,
      address: user.domcli,
      ADDRESS: user.domcli,
      dni: user.nifcli,
      DNI: user.nifcli,
      telf: user.telcli,
      TELF: user.telcli,
      cp: user.cpocli,
      CP: user.cpocli,
      pob: user.pobcli,
      POB: user.pobcli,
      prov: user.procli,
      PROV: user.procli,
      tarcli: user.tarcli || '1'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/user/:codcli
app.get(['/api/orders/user/:codcli', '/api/user/orders/:codcli'], async (req, res) => {
  try {
    const codcli = req.params.codcli;
    const result = await pool.query(
      'SELECT tippcl, codpcl, fecpcl, totpcl, estpcl, refpcl FROM f_pcl WHERE clipcl = $1 ORDER BY fecpcl DESC, codpcl DESC LIMIT 50',
      [parseInt(codcli, 10)]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 3. ARTICLES, CATALOG & MEASURES
// =========================================================================

// GET /api/articles
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

// GET /api/articles/search
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

// GET /api/family/:famId
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

// GET /api/articles/:id
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

// GET /api/family
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

// GET /api/families/:ids
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

// GET /api/secction & /api/section
app.get(['/api/secction', '/api/section'], async (req, res) => {
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

// GET /api/measures
app.get('/api/measures', async (req, res) => {
  try {
    const result = await pool.query("SELECT codume, desume FROM f_ume WHERE TRIM(desume) <> '' ORDER BY desume ASC");
    res.json({
      measures: result.rows.map(r => r.desume),
      units: result.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rates
app.get('/api/rates', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM f_tar ORDER BY codtar ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error in /api/rates:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rates/lines/:codtar
app.get('/api/rates/lines/:codtar', async (req, res) => {
  try {
    const codtar = req.params.codtar;
    const result = await pool.query('SELECT arlta, prelta FROM f_lta WHERE tarlta = $1', [codtar]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 4. ORDERS & CHECKOUT INTEGRATION (Factusol F_PCL & F_LPC)
// =========================================================================
app.post(['/api/payment/orders', '/api/pasarelaGlobal/pay'], async (req, res) => {
  try {
    const { order, shippingData, paymentMethodType } = req.body;
    console.log('[API Order/Payment received]', { paymentMethodType, shippingData: shippingData?.fullName });

    // Calculate next CODPCL
    const series = order?.cabecera?.tippcl || '3';
    const maxRes = await pool.query('SELECT COALESCE(MAX(codpcl), 0) AS max_id FROM f_pcl WHERE tippcl = $1', [series]);
    const nextCodpcl = (parseInt(maxRes.rows[0].max_id, 10) || 0) + 1;
    const ref = order?.cabecera?.refpcl || `WEB-${Date.now()}`;
    const clientId = parseInt(order?.cabecera?.clipcl || 0, 10);
    const today = new Date().toISOString().split('T')[0];
    const total = parseFloat(order?.cabecera?.totpcl || req.body.order?.total || 0);

    // Insert order header in f_pcl
    await pool.query(`
      INSERT INTO f_pcl (
        tippcl, codpcl, fecpcl, clipcl, cvepcl, refpcl, totpcl, estpcl, fpagpcl, cnopcl, cdopcl, cpocpcl, pobcpcl, procpcl
      ) VALUES (
        $1, $2, $3, $4, '1', $5, $6, '0', $7, $8, $9, $10, $11, $12
      )
    `, [
      series,
      nextCodpcl,
      today,
      clientId,
      ref,
      total,
      paymentMethodType || 'TAR',
      shippingData?.fullName || '',
      shippingData?.address || '',
      shippingData?.postalCode || '',
      shippingData?.city || '',
      shippingData?.province || ''
    ]);

    // Insert lines in f_lpc if available
    const lines = order?.lineas || req.body.cartItems || [];
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const pos = i + 1;
      const artCode = l.artlpc || l.codart || l.sku || 'GEN';
      const des = l.deslpc || l.desart || l.name || 'Artículo';
      const qty = parseFloat(l.canlpc || l.quantity || 1);
      const price = parseFloat(l.prelpc || l.price || 0);
      const lineTotal = parseFloat(l.totlpc || (qty * price) || 0);

      await pool.query(`
        INSERT INTO f_lpc (
          tiplpc, codlpc, poslpc, artlpc, deslpc, canlpc, prelpc, totlpc
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        )
      `, [
        series, nextCodpcl, pos, artCode, des, qty, price, lineTotal
      ]).catch(e => console.warn(`Error inserting line ${pos} in f_lpc:`, e.message));
    }

    console.log(`✓ Pedido creado en Factusol f_pcl: Serie ${series}, Pedido #${nextCodpcl}, Ref ${ref}`);

    res.json({
      success: true,
      pedidoId: nextCodpcl,
      orderNumber: String(nextCodpcl),
      message: `Pedido #${nextCodpcl} registrado con éxito en Factusol`
    });
  } catch (err) {
    console.error('Error registrando pedido:', err);
    res.status(500).json({ error: 'Error registrando el pedido en Factusol: ' + err.message });
  }
});

// START SERVER
app.listen(PORT, '127.0.0.1', () => {
  console.log(`====================================================`);
  console.log(`🚀 Suministros Rubio Factusol API activa en http://127.0.0.1:${PORT}`);
  console.log(`📊 Conectada a PostgreSQL Factusol (localhost:5432)`);
  console.log(`👥 Soporte de Usuarios, Clientes f_cli y Autenticación ACTIVO`);
  console.log(`====================================================`);
});
