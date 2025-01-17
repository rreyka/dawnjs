// config.js

const config = {
    useProxy: true, // Set to true jika Anda ingin menggunakan proxy, false jika tidak
    restartDelay: 207, // Delay dalam detik sebelum merestart proses
    minDelay: 3, // Random delay untuk pengiriman paket keepalive (detik)
    maxDelay: 10, // Random delay untuk pengiriman paket keepalive (detik)
    concurrency: 2, // Kurangi concurrency untuk menghindari rate limit
    backoffInitial: 30, // Waktu tunggu awal untuk retry (milidetik)
    backoffMax: 50, // Batas maksimum backoff (milidetik)
    maxRetries: 5 // Maksimum jumlah retry
};

module.exports = config;
