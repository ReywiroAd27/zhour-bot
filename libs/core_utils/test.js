const WebSocket = require('ws');

// Opsi untuk mengabaikan validasi sertifikat
const options = {
    rejectUnauthorized: false
};

// Buat koneksi websocket dengan opsi
const socket = new WebSocket('wss://localhost:9000/socket', options);

// Event saat koneksi terbuka
socket.on('open', function() {
    console.log('Koneksi terbuka');
});

// Event saat menerima pesan dari server
socket.on('message', function(data) {
    console.log('Pesan dari server: ' + data);
});

// Event saat koneksi ditutup
socket.on('close', function() {
    console.log('Koneksi ditutup');
});

// Event saat terjadi kesalahan
socket.on('error', function(error) {
    console.error('Kesalahan: ' + error.message);
});

// Mengirim pesan ke server
function kirimPesan(pesan) {
    socket.send(pesan);
}
