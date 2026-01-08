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

// 2. SONG DATA (Onetsetsani kuti muli ma ID)
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

let curShare = { id: "", title: "" };

// 3. MAIN REALTIME LISTENER
// Ichi ndicho chimasintha nyimbo nthawi yomweyo chiwerengero chikasitnha
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

    // Fafanizani kaye m'ma grid onse
    Object.values(grids).forEach(g => g.innerHTML = "");

    // A. KUSANJA TOP 10 (Dynamic Sorting Logic)
    // Tikupanga list yatsopano yosanjidwa kutengera Plays + Downloads + Shares
    const topSongs = [...allMusic].sort((a, b) => {
        const sA = stats[a.id] || {play:0, download:0, share:0};
        const sB = stats[b.id] || {play:0, download:0, share:0};
        const totalA = (sA.play || 0) + (sA.download || 0) + (sA.share || 0);
        const totalB = (sB.play || 0) + (sB.download || 0) + (sB.share || 0);
        return totalB - totalA; // Wamphamvu ali pamwamba
    });

    // Onetsani nyimbo 10 zokha zomwe zili ndi mawerengero
    topSongs.slice(0, 10).forEach((s, i) => {
        const st = stats[s.id] || {play:0, download:0, share:0};
        if ((st.play || 0) + (st.download || 0) + (st.share || 0) > 0) {
            grids.top.innerHTML += `
             <div style="position:relative">
            <span class="rank-badge">#${i+1}</span> 
            ${createCard(s, st)}
        </div>`;
     }
   });

    // B. ZATSOPANO & ZAPAKANTHAWI (Mndandanda wamba)
    zatsopano.forEach(s => grids.new.innerHTML += createCard(s, stats[s.id] || {play:0, download:0, share:0}));
    zapakanthawi.forEach(s => grids.old.innerHTML += createCard(s, stats[s.id] || {play:0, download:0, share:0}));
    allMusic.forEach(s => grids.all.innerHTML += createCard(s, stats[s.id] || {play:0, download:0, share:0}));
}

// 4. COMPACT CARD GENERATOR
function createCard(s, st) {
    return `
    <div class="song-card">
        <div class="img-container" onclick="handlePlay('${s.id}', '${s.file}', '${s.title}')">
            <img src="${s.cover}">
            <div class="overlay-play"><i class="fas fa-play"></i></div>
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
            <button class="btn-item" onclick="openShare('${s.id}', '${s.title}')">
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
        audio.src = file; audio.play();
        document.getElementById('playing-title').innerText = "Mukumvera: " + title;
        db.ref('stats/' + id + '/play').transaction(c => (c || 0) + 1);
    }
}

function handleDown(id, file) {
    window.open(file, '_blank');
    db.ref('stats/' + id + '/download').transaction(c => (c || 0) + 1);
}

function openShare(id, title) {
    curShare = { id, title };
    document.getElementById('share-name').innerText = title;
    document.getElementById('shareModal').style.display = 'block';
}

function closeShare() { document.getElementById('shareModal').style.display = 'none'; }

window.copyEmbed = function() {
    // Tikupanga player ya HTML5 yomwe izangosewera file ya nyimboyo
    const embedCode = `<audio controls style="width:100%"><source src="${curShare.fileUrl}" type="audio/mpeg">Browser yanu siikuthandiza audio player.</audio>`;
    
    navigator.clipboard.writeText(embedCode).then(() => {
        alert("Embed code ya Player yakopedwa!");
    });
};

window.copyLink = function() {
    const directLink = curShare.fileUrl; // Izi zitenga link ya mp3
    navigator.clipboard.writeText(directLink).then(() => {
        alert("Link ya nyimbo yakopedwa!");
        if (typeof db !== 'undefined') {
            db.ref('stats/' + curShare.id + '/share').transaction(c => (c || 0) + 1);
        }
    });
};

function shareTo(p) {
    const link = window.location.origin + window.location.pathname + "?id=" + curShare.id;
    if(p==='whatsapp') window.open(`https://api.whatsapp.com/send?text=Mvera ${curShare.title}: ${link}`);
    db.ref('stats/' + curShare.id + '/share').transaction(c => (c || 0) + 1);
    closeShare();
}

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
