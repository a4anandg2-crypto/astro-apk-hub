import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCiIYUWBTr3__sQo--g6dWvMIxDjqC7r0o",
    authDomain: "astro-apk-hub.firebaseapp.com",
    projectId: "astro-apk-hub",
    storageBucket: "astro-apk-hub.firebasestorage.app",
    messagingSenderId: "386427363240",
    appId: "1:386427363240:web:d094bbfc50677f1b09c79d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let allApps = [];
const ADMIN_EMAILS = ["a4anandg2@gmail.com", "per149209@gmail.com"];

// --- UI Utilities ---
const getSlug = (t) => t.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

onAuthStateChanged(auth, (user) => {
    const isAdmin = user && ADMIN_EMAILS.includes(user.email);
    document.getElementById('admin-controls').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('guest-controls').style.display = isAdmin ? 'none' : 'block';
    if(user) document.getElementById('user-photo').src = user.photoURL;
});

window.toggleDropdown = (e) => {
    e.stopPropagation();
    const m = document.getElementById('user-menu');
    m.style.display = (m.style.display === 'block') ? 'none' : 'block';
};

document.addEventListener('click', () => {
    const m = document.getElementById('user-menu');
    if(m) m.style.display = 'none';
});

// --- Comment & Settings System ---
async function getAutoApproveStatus() {
    try {
        const s = await getDoc(doc(db, "settings", "comments"));
        return s.exists() ? s.data().autoApprove : true;
    } catch { return true; }
}

async function postComment(col, targetId, text, user) {
    if (!text.trim()) return alert("Message cannot be empty.");
    const isAuto = await getAutoApproveStatus();
    const isAdmin = auth.currentUser && ADMIN_EMAILS.includes(auth.currentUser.email);
    
    await addDoc(collection(db, col), {
        targetId, text, user: user || "Anonymous",
        timestamp: new Date().toISOString(),
        approved: (isAuto || isAdmin)
    });
    
    if (isAuto || isAdmin) loadComments(col, targetId);
    else alert("Comment submitted! It will appear after approval.");
}

async function loadComments(col, targetId) {
    const cid = targetId === 'global' ? 'home-comments-list' : 'app-comments-list';
    const cont = document.getElementById(cid);
    if (!cont) return;

    const snap = await getDocs(collection(db, col));
    const isAdmin = auth.currentUser && ADMIN_EMAILS.includes(auth.currentUser.email);
    
    const data = snap.docs
        .map(d => ({id: d.id, ...d.data()}))
        .filter(c => c.targetId === targetId && (c.approved || isAdmin))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    cont.innerHTML = data.map(c => `
        <div class="comment-item">
            <div class="comment-meta"><strong>${c.user}</strong> • ${new Date(c.timestamp).toLocaleDateString()}</div>
            <div class="comment-text">${c.text}</div>
        </div>
    `).join('') || '<p style="font-size:14px; color:var(--text-secondary);">Start the conversation!</p>';
}

window.postGlobalComment = () => {
    const u = document.getElementById('home-comment-user').value;
    const t = document.getElementById('home-comment-text').value;
    postComment('global_comments', 'global', t, u);
    document.getElementById('home-comment-text').value = '';
};

// --- App Store Logic ---
async function loadApps() {
    const snap = await getDocs(collection(db, "apps"));
    allApps = snap.docs.map(d => ({id: d.id, ...d.data()}));
    renderApps(allApps);
    loadComments('global_comments', 'global');
}

window.renderApps = (data) => {
    const list = document.getElementById('app-list');
    list.innerHTML = data.map(app => `
        <article class="store-card" onclick="openAppDetails('${app.name}', '${app.icon}', '${app.link}', '${encodeURIComponent(app.description)}', '${app.id}', '${app.rating || '4.9'}', '${app.size || 'Varies'}')">
            <div class="store-icon-wrapper">
                <img src="${app.icon}" class="store-icon" alt="${app.name} icon" loading="lazy">
                <div class="badge-rating">${app.rating || '4.9'} ★</div>
            </div>
            <div class="store-info">
                <h3 class="store-title">${app.name}</h3>
                <p class="store-desc">${app.size || 'Premium'} • Safe & Verified</p>
            </div>
            <div class="store-action"><button class="btn-get">GET</button></div>
        </article>
    `).join('');
};

window.openAppDetails = (name, icon, link, desc, id, rating, size) => {
    window.history.pushState({id}, name, `/${getSlug(name)}`);
    document.getElementById('main-view').style.display = 'none';
    const dv = document.getElementById('details-view');
    dv.style.display = 'block';
    
    const dDesc = decodeURIComponent(desc);
    document.getElementById('dynamic-content').innerHTML = `
        <div class="app-page">
            <header class="detail-header">
                <img src="${icon}" class="detail-icon" alt="${name}">
                <div class="detail-meta">
                    <h1 class="detail-title">${name}</h1>
                    <p class="detail-publisher">Verified Premium Mod • ${size}</p>
                    <button id="dl-btn" class="btn-primary">Download APK (${size})</button>
                    <div id="prog-container" class="progress-box"><div id="prog-bar" class="progress-fill"></div></div>
                </div>
            </header>
            <div class="detail-stats">
                <div class="stat-item"><span class="stat-val">${rating} ★</span><span class="stat-lbl">Rating</span></div>
                <div class="stat-item"><span class="stat-val">${size}</span><span class="stat-lbl">Size</span></div>
                <div class="stat-item"><span class="stat-val">Secure</span><span class="stat-lbl">Safety</span></div>
            </div>
            <section class="detail-about">
                <h3>About this Version</h3>
                <p>${dDesc}</p>
            </section>
            <section class="comment-section">
                <h3>Reviews</h3>
                <div class="comment-input-wrap">
                    <input type="text" id="app-comment-user" placeholder="Name" class="input-field">
                    <textarea id="app-comment-text" placeholder="Write a review..." class="input-field" style="min-height:70px;"></textarea>
                    <button class="btn-primary" onclick="window.postAppComment('${id}')">Submit</button>
                </div>
                <div id="app-comments-list" class="comments-list"></div>
            </section>
        </div>
    `;

    window.postAppComment = (aid) => {
        const u = document.getElementById('app-comment-user').value;
        const t = document.getElementById('app-comment-text').value;
        postComment('app_comments', aid, t, u);
        document.getElementById('app-comment-text').value = '';
    };

    loadComments('app_comments', id);

    document.getElementById('dl-btn').onclick = () => {
        const btn = document.getElementById('dl-btn');
        btn.style.display = 'none';
        document.getElementById('prog-container').style.display = 'block';
        let w = 0;
        let itv = setInterval(() => {
            w += 5;
            document.getElementById('prog-bar').style.width = w + '%';
            if(w >= 100) { clearInterval(itv); window.location.href = link; }
        }, 80);
    };
};

window.addNewApp = async () => {
    const data = {
        name: document.getElementById('new-app-name').value,
        rating: document.getElementById('new-app-rating').value,
        size: document.getElementById('new-app-size').value,
        icon: document.getElementById('new-app-icon').value,
        link: document.getElementById('new-app-link').value,
        description: document.getElementById('new-app-desc').value
    };
    const auto = document.getElementById('auto-approve-toggle').checked;

    await addDoc(collection(db, "apps"), data);
    await updateDoc(doc(db, "settings", "comments"), { autoApprove: auto }).catch(() => {});
    location.reload();
};

window.goBack = () => {
    window.history.pushState({}, "", "/");
    document.getElementById('main-view').style.display = 'block';
    document.getElementById('details-view').style.display = 'none';
};

window.filterApps = () => {
    const q = document.getElementById('main-search').value.toLowerCase();
    const filtered = allApps.filter(a => a.name.toLowerCase().includes(q));
    renderApps(filtered);
};

window.loginWithGoogle = () => signInWithPopup(auth, new GoogleAuthProvider()).then(() => location.reload());
window.logout = () => signOut(auth).then(() => location.reload());
window.openAdminPanel = () => { document.getElementById('admin-modal').style.display = 'flex'; };
window.closeAdmin = () => { document.getElementById('admin-modal').style.display = 'none'; };

loadApps();