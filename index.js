// index.js

const axios = require('axios');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
// const Bottleneck = require('bottleneck'); // Opsional jika ingin mengatur delay antar akun
const config = require('./config');
const accountsData = require('./accounts');

// ANSI color codes untuk log
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m"
};

// Fungsi untuk logging
const logger = {
  success: (message) => {
    console.log(`${colors.green}✅ SUCCESS:${colors.reset} ${message}`);
  },
  error: (message) => {
    console.log(`${colors.red}❌ ERROR:${colors.reset} ${message}`);
  }
};

// Definisikan endpoint API
const apiEndpoints = {
  keepalive: "https://www.aeropres.in/chromeapi/dawn/v1/userreward/keepalive"
};

// Agent untuk mengabaikan SSL (jika diperlukan)
const ignoreSslAgent = new https.Agent({
  rejectUnauthorized: false
});

// Fungsi untuk menampilkan pesan selamat datang
const displayWelcome = () => {
  console.log(
    `${colors.green}🌟 DAWN Validator Extension Automatic Claim 🌟${colors.reset}\n` +
    `Github: recitativonika | github.com/recitativonika`
  );
};

// Prefix untuk App ID
const appIdPrefix = "6752b";

// Fungsi untuk menghasilkan App ID berdasarkan token
const generateAppId = (token) => {
  const hash = crypto.createHash('md5').update(token).digest('hex');
  return `${appIdPrefix}${hash.slice(0, 19)}`;
};

// Path untuk menyimpan App IDs
const appIdFilePath = path.join(__dirname, 'appIds.json');

// Fungsi untuk memuat App IDs
const loadAppIds = () => {
  if (fs.existsSync(appIdFilePath)) {
    return JSON.parse(fs.readFileSync(appIdFilePath, 'utf-8'));
  }
  return {};
};

// Fungsi untuk menyimpan App IDs
const saveAppIds = (appIds) => {
  fs.writeFileSync(appIdFilePath, JSON.stringify(appIds, null, 2));
};

// Fungsi fetch dan post dengan retry dan exponential backoff
const postWithRetry = async (url, payload, options, retries = config.maxRetries, backoff = config.backoffInitial) => {
  try {
    const response = await axios.post(url, payload, options);
    return response;
  } catch (error) {
    if (error.response) {
      if (error.response.status === 429 && retries > 0) {
        const retryAfter = error.response.headers['retry-after'];
        let waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : backoff;
        waitTime = Math.min(waitTime, config.backoffMax * 1000); // Konversi ke milidetik

        // Tambahkan jitter hingga 50%
        const jitter = Math.floor(Math.random() * (waitTime * 0.5));
        waitTime += jitter;

        await new Promise(resolve => setTimeout(resolve, waitTime));
        return postWithRetry(url, payload, options, retries - 1, backoff * 2);
      } else if (error.response.status === 402) {
        logger.error(`Payment Required on POST: ${JSON.stringify(error.response.data)}`);
        process.exit(1);
      }
    } else if (error.code === 'ECONNABORTED') {
      // Timeout error
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, backoff));
        return postWithRetry(url, payload, options, retries - 1, backoff * 2);
      }
    }
    throw error;
  }
};

// Fungsi untuk mengirim keep-alive
const keepAliveRequest = async (options, email, appId) => {
  const payload = {
    username: email,
    extensionid: "fpdkjdnhkakefebpekbdhillbhonfjjp",
    numberoftabs: 0,
    _v: "1.1.2"
  };

  try {
    const url = `${apiEndpoints.keepalive}?appid=${appId}`;
    await postWithRetry(url, payload, options);
    return true;
  } catch (error) {
    logger.error(`Keep-Alive failed for ${email}: ${error.message}`);
  }
  return false;
};

// Fungsi countdown sebelum restart
const countdown = async (seconds) => {
  for (let i = seconds; i > 0; i--) {
    process.stdout.write(`⏳ Next process in: ${i} seconds...\r`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  console.log("\n🔄 Restarting...\n");
};

// Fungsi untuk memproses setiap akun
const processAccount = async (account, appIds) => {
  const { email, token } = account;
  const extensionId = "fpdkjdnhkakefebpekbdhillbhonfjjp";

  let appId = appIds[email];
  if (!appId) {
    appId = generateAppId(token);
    appIds[email] = appId;
    saveAppIds(appIds);
  }

  const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    "Accept": "*/*",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "Origin": `chrome-extension://${extensionId}`,
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, seperti Gecko) Chrome/129.0.0.0 Safari/537.36",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "cross-site"
  };

  const requestOptions = {
    headers,
    httpsAgent: ignoreSslAgent,
    timeout: config.timeout || 20000 // Timeout default 20 detik
  };

  const keepAliveSuccess = await keepAliveRequest(requestOptions, email, appId);
  if (keepAliveSuccess) {
    logger.success(`Keep-Alive successful for ${email}`);
  }
};

// Jika Anda ingin mengatur delay antar akun, Anda dapat menggunakan fungsi delay sederhana:
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fungsi utama untuk memproses semua akun
const processAccounts = async () => {
  displayWelcome();
  const appIds = loadAppIds();

  while (true) {
    // Proses setiap akun secara berurutan (atau bisa juga paralel sesuai kebutuhan)
    for (const account of accountsData) {
      try {
        await processAccount(account, appIds);
        // Jika Anda ingin jeda antar akun, gunakan delay di sini, misalnya:
        await delay(config.minDelay * 1000);
      } catch (error) {
        logger.error(`Error processing ${account.email}: ${error.message}`);
      }
    }
    
    console.log("All accounts processed.");
    await countdown(config.restartDelay);
  }
};

// Jalankan proses utama
processAccounts();
