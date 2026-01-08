// 1. FIREBASE CONFIG
const firebaseConfig = { 
    apiKey: "AIzaSyDt_ayoflnFkRRnS2fXITY2EzJz0KcW5QA",
    authDomain: "makert-bfb76.firebaseapp.com",
    databaseURL: "https://makert-bfb76-default-rtdb.firebaseio.com",
    projectId: "makert-bfb76",
    storageBucket: "makert-bfb76.firebasestorage.app",
    messagingSenderId: "245693362931",
    appId: "1:245693362931:web:e15662a22dd50d2ac63d86",
    measurementId: "G-BCYZWWLGRX", 
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// 2. SONG DATA
const zatsopano = [
    { id: "new_1", title: "ndasala pati", artist: "Supersaax", file: "music/ndasala pati.mp3", cover: "images/zex1.jpg" },
    { id: "new_2", title: "NDIKUFUNAFUNA", artist: "Supersaax", file: "music/NDIKUFUNAFUNA.mp3", cover: "images/zex2.jpg" }
];

const zapakanthawi = [    
    { id: "old_1", title: "tasha", artist: "Supersaax", file: "music/tasha.mp3", cover: "images/zex1.jpg" },
    { id: "old_2", title: "ZEXMAN", artist: "Supersaax", file: "music/ZEXMAN.mp3", cover: "images/zex2.jpg" },
    { id: "old_3", title: "NDIKUFUNAFUNA2", artist: "Supersaax", file: "https://archive.org/download/NDIKUFUNAFUNA/NDIKUFUNAFUNA.mp3", cover: "images/zex1.jpg" }
];
const allMusic = [...zatsopano, ...zapakanthawi];

// Memory ya Share
let curShare = { id: "", title: "", fileUrl: "" };

// 3. MAIN REALTIME LISTENER
db.ref('stats').on('value', (snap) => {
    const stats = snap.val() || {};
    updateUI(stats);
});

function updateUI(stats) {
    const grids = {
        top: document.getElementById('top-10-grid'),
        new: document.getElementById('new-grid'),
        old: document.getElementById('old-grid'),
        all: document.getElementById('all-grid')
    };

    // Fafanizani kaye grids
    Object.values(grids).forEach(g => { if(g) g.innerHTML = ""; });

    // A. KUSANJA TOP 10
    const topSongs = [...allMusic].sort((a, b) => {
        const sA = stats[a.id] || {play:0, download:0, share:0};
        const sB = stats[b.id] || {play:0, download:0, share:0};
        const totalA = (sA.play || 0) + (sA.download || 0) + (sA.share || 0);
        const totalB = (sB.play || 0) + (sB.download || 0) + (sB.share || 0);
        return totalB - totalA;
    });

    topSongs.slice(0, 10).forEach((s, i) => {
        const st = stats[s.id] || {play:0, download:0, share:0};
        if ((st.play || 0) + (st.download || 0) + (st.share || 0) > 0) {
            if(grids.top) grids.top.innerHTML += `
             <div style="position:relative">
                <span class="rank-badge">#${i+1}</span> 
                ${createCard(s, st)}
            </div>`;
        }
    });

    // B. SECTIONS ZINA
    zatsopano.forEach(s => { if(grids.new) grids.new.innerHTML += createCard(s, stats[s.id] || {play:0, download:0, share:0}); });
    zapakanthawi.forEach(s => { if(grids.old) grids.old.innerHTML += createCard(s, stats[s.id] || {play:0, download:0, share:0}); });
    allMusic.forEach(s => { if(grids.all) grids.all.innerHTML += createCard(s, stats[s.id] || {play:0, download:0, share:0}); });
}

// 4. COMPACT CARD GENERATOR
function createCard(s, st) {
    // ONETSETSANI: openShare tsopano ikutumiza s.file kukhala fileUrl
    return `
    <div class="song-card">
        <div class="img-container" onclick="handlePlay('${s.id}', '${s.file}', '${s.title}')">
            <img src="${s.cover}">
        </div>
        <div class="song-info">
            <div class="song-title">${s.title}</div>
            <div class="song-artist">${s.artist}</div>
        </div>
        <div class="btn-row">
            <button class="btn-item" onclick="handlePlay('${s.id}', '${s.file}', '${s.title}')">
                <i class="fas fa-play"></i> ${st.play || 0}
            </button>
            <button class="btn-item" onclick="handleDown('${s.id}', '${s.file}')">
                <i class="fas fa-download"></i> ${st.download || 0}
            </button>
            <button class="btn-item" onclick="openShare('${s.id}', '${s.title}', '${s.file}')">
                <i class="fas fa-share-alt"></i> ${st.share || 0}
            </button>
        </div>
    </div>`;
}

// 5. ACTIONS
function handlePlay(id, file, title) {
    const audio = document.getElementById('mainAudio');
    if (audio.src.includes(file) && !audio.paused) {
        audio.pause();
    } else {
        audio.src = file; 
        audio.play();
        document.getElementById('playing-title').innerText = "Mukumvera: " + title;
        db.ref('stats/' + id + '/play').transaction(c => (c || 0) + 1);
    }
}

// Kukakamiza Download (Force Download)
function handleDown(id, file) {
    const a = document.createElement('a');
    a.href = file;
    a.download = file.split('/').pop();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    db.ref('stats/' + id + '/download').transaction(c => (c || 0) + 1);
}

// OPEN SHARE MODAL
function openShare(id, title, fileUrl) {
    curShare = { id, title, fileUrl }; 
    document.getElementById('share-name').innerText = title;
    document.getElementById('shareModal').style.display = 'block';
}

function closeShare() { document.getElementById('shareModal').style.display = 'none'; }

// COPY EMBED (Audio Player yokha)
window.copyEmbed = function() {
    if(!curShare.fileUrl) return alert("Error: Link ya nyimbo siikupezeka!");
    const fullFileUrl = curShare.fileUrl.startsWith('http') ? curShare.fileUrl : window.location.origin + "/" + curShare.fileUrl;
    const embedCode = `<audio controls style="width:100%"><source src="${fullFileUrl}" type="audio/mpeg"></audio>`;
    
    navigator.clipboard.writeText(embedCode).then(() => {
        alert("Embed code ya Player yakopedwa!");
    });
};

// COPY LINK (Direct Mp3 Link)
window.copyLink = function() {
    if(!curShare.fileUrl) return alert("Error: Link ya nyimbo siikupezeka!");
    const fullLink = curShare.fileUrl.startsWith('http') ? curShare.fileUrl : window.location.origin + "/" + curShare.fileUrl;
    
    navigator.clipboard.writeText(fullLink).then(() => {
        alert("Link ya nyimbo yakopedwa!");
        db.ref('stats/' + curShare.id + '/share').transaction(c => (c || 0) + 1);
    });
};

// WHATSAPP SHARE
function shareTo(p) {
    const fullLink = curShare.fileUrl.startsWith('http') ? curShare.fileUrl : window.location.origin + "/" + curShare.fileUrl;
    if(p==='whatsapp') {
        window.open(`https://api.whatsapp.com/send?text=Mvera ${curShare.title} pa Music Hub: ${fullLink}`);
    }
    db.ref('stats/' + curShare.id + '/share').transaction(c => (c || 0) + 1);
    closeShare();
}

// NAVIGATION & SEARCH
function showSection(id, btn) {
    document.querySelectorAll('.music-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    btn.classList.add('active');
}

function searchSongs() {
    let input = document.getElementById('searchInput').value.toLowerCase();
    document.querySelectorAll('.song-card').forEach(card => {
        card.style.display = card.innerText.toLowerCase().includes(input) ? "block" : "none";
    });
}
