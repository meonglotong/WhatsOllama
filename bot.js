const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'whatsapp-bot' })
});

let botId;

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Scan QR code dengan WhatsApp Anda.');
});

client.on('ready', () => {
    console.log('Bot WhatsApp sudah siap!');
    botId = client.info.wid._serialized;
    console.log('ID Bot:', botId);
});

client.on('authenticated', () => {
    console.log('Autentikasi berhasil! Sesi seharusnya sudah disimpan.');
});

client.on('auth_failure', (msg) => {
    console.error('Gagal autentikasi:', msg);
    console.log('Sesi tidak akan disimpan karena autentikasi gagal.');
});

client.on('message', async (message) => {
    console.log(`Pesan diterima dari ${message.from}: ${message.body}`);

    // Cek apakah pesan dari grup atau pribadi
    if (message.from.includes('@g.us')) {
        // Pesan dari grup
        const mentions = await message.getMentions();
        const isBotMentioned = mentions.some(contact => contact.id._serialized === botId);

        if (isBotMentioned) {
            console.log('Bot di-mention di grup:', message.body);
            await respondToMessage(message);
        } else {
            console.log('Bot tidak di-mention di grup, mengabaikan pesan.');
        }
    } else {
        // Pesan dari chat pribadi
        console.log('Pesan pribadi diterima:', message.body);
        await respondToMessage(message);
    }
});

// Fungsi untuk mengirim pesan ke Ollama dan membalas
async function respondToMessage(message) {
    try {
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'llama3.2',
            prompt: message.body,
            stream: false
        });
        const reply = response.data.response;
        message.reply(reply);
    } catch (error) {
        console.error('Error saat menghubungi Ollama:', error);
        message.reply('Maaf, ada masalah dengan bot.');
    }
}

client.initialize();

console.log('Mencoba memuat sesi dari penyimpanan lokal...');