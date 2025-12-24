
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

// --- KONFIGURASI DATABASE ---
const MONGO_URI = "ISI_DENGAN_LINK_MONGODB_KAMU"; 

mongoose.connect(MONGO_URI)
  .then(() => console.log("Database Terkoneksi!"))
  .catch(err => console.log("Gagal koneksi:", err));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- MODELS ---
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true }
}));

const Message = mongoose.model('Message', new mongoose.Schema({
    targetUser: String,
    content: String,
    createdAt: { type: Date, default: Date.now }
}));

// --- ROUTES ---

// Halaman Login & Daftar
app.get('/', (req, res) => {
    if(req.cookies.user) return res.redirect('/dashboard');
    res.render('index');
});

app.post('/auth', async (req, res) => {
    const { username, password, action } = req.body;
    if (action === 'register') {
        try {
            await User.create({ username, password });
            res.cookie('user', username);
            res.redirect('/dashboard');
        } catch (e) { res.send("Username sudah dipakai!"); }
    } else {
        const user = await User.findOne({ username, password });
        if (user) {
            res.cookie('user', username);
            res.redirect('/dashboard');
        } else { res.send("Login Gagal! Cek username/password."); }
    }
});

// Dashboard (Melihat Pesan Masuk)
app.get('/dashboard', async (req, res) => {
    const username = req.cookies.user;
    if(!username) return res.redirect('/');
    const messages = await Message.find({ targetUser: username }).sort({ createdAt: -1 });
    res.render('dashboard', { username, messages, host: req.get('host') });
});

// Logout
app.get('/logout', (req, res) => {
    res.clearCookie('user');
    res.redirect('/');
});

// Halaman Kirim Pesan (Public)
app.get('/u/:username', async (req, res) => {
    const user = await User.findOne({ username: req.params.username });
    if(!user) return res.status(404).send("User tidak ditemukan");
    res.render('profile', { target: req.params.username });
});

app.post('/send/:username', async (req, res) => {
    await Message.create({ targetUser: req.params.username, content: req.body.message });
    res.render('success', { target: req.params.username });
});

module.exports = app;
// Port lokal jika tidak di vercel
if (process.env.NODE_ENV !== 'production') {
    app.listen(3000, () => console.log('Server jalan di http://localhost:3000'));
}
