/* SmArT AStro HuB - Core Logic
    Architecture: Senior Frontend Lead
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase Configuration
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

// --- State Tracking ---
onAuthStateChanged(auth, (user) => {
    const isAdmin = user && ADMIN_EMAILS.includes(user.email);
    document.getElementById('admin-controls').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('guest-controls').style.display = isAdmin ? 'none' : 'block';
    if(user) document.getElementById('user-photo').src = user.photoURL;
});

// --- UI Helpers ---
const getSlug = (t) => t.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

window.toggleDropdown = (e) => {
    e.stopPropagation();
    const m = document.getElementById('user-menu');
    m.style.display = (m.style.display === 'block') ? 'none' : 'block';
};

document.addEventListener('click', () => {
    const m = document.getElementById('user-menu');
    if(m) m.style.display = 'none';
});

// --- Content Engines ---

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
    else alert("Success! Your review will appear after community verification.");
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
    `).join('') || '<p style="font-size:14px; color:var(--text-dim);">Be the first to share your experience!</p>';
}

window.postGlobalComment = () => {
    const u = document.getElementById('home-comment-user').value;
    const t = document.getElementById('home-comment-text').value;
    postComment('global_comments', 'global', t, u);
    document.getElementById('home-comment-text').value = '';
};

// --- Store Logic ---

async function loadApps() {
    try {
        const snap = await getDocs(collection(db, "apps"));
        allApps = snap.docs.map(d => ({id: d.id, ...d.data()}));
        renderApps(allApps);
        loadComments('global_comments', 'global');
    } catch (e) {
        console.error("Store load failed", e);
    }
}

window.renderApps = (data) => {
    const list = document.getElementById('app-list');
    if(!list) return;
    
    list.innerHTML = data.map(app => `
        <article class="store-card" onclick="openAppDetails('${app.name}', '${app.icon}', '${app.link}', '${encodeURIComponent(app.description)}', '${app.id}', '${app.rating || '4.9'}', '${app.size || 'Varies'}')">
            <div class="store-icon-wrapper">
                <img src="${app.icon}" class="store-icon" alt="${app.name} premium mod" loading="lazy">
                <div class="badge-rating">${app.rating || '4.9'} ★</div>
            </div>
            <div class="store-info">
                <h3 class="store-title">${app.name}</h3>
                <p class="store-desc">${app.size || 'Premium'} • Safe & Verified</p>
            </div>
            <div class="store-action">
                <button class="btn-get">GET</button>
            </div>
        </article>
    `).join('');
};

window.openAppDetails = (name, icon, link, desc, id, rating, size) => {
    window.history.pushState({id}, name, `/${getSlug(name)}`);
    document.getElementById('main-view').style.display = 'none';
    const dv = document.getElementById('details-view');
    dv.style.display = 'block';
    window.scrollTo(0, 0);
    
    const decodedDesc = decodeURIComponent(desc);
    document.getElementById('dynamic-content').innerHTML = `
        <div class="app-page-wrapper">
            <header class="app-page-header">
                <img src="${icon}" class="detail-icon" alt="${name}">
                <div class="detail-info-box">
                    <h1 class="detail-title">${name}</h1>
                    <p class="detail-meta-text">Verified Premium Mod • ${size} • Safe Build</p>
                    <button id="dl-btn" class="btn-primary">Download APK</button>
                    <div id="prog-container" class="progress-box"><div id="prog-bar" class="progress-fill"></div></div>
                </div>
            </header>

            <section class="app-description">
                <h3 style="margin-bottom:15px;">Mod Features & Details</h3>
                <div class="desc-content">${decodedDesc}</div>
            </section>

            <section class="app-reviews-section" style="margin-top:40px;">
                <h3 style="margin-bottom:20px;">User Reviews</h3>
                <div class="feedback-form">
                    <div class="input-grid">
                        <input type="text" id="app-comment-user" placeholder="Name" class="field-input">
                        <textarea id="app-comment-text" placeholder="Share your experience..." class="field-input area-input" style="min-height:80px;"></textarea>
                    </div>
                    <button class="btn-submit" onclick="window.postAppComment('${id}')">Submit Review</button>
                </div>
                <div id="app-comments-list" class="feedback-list"></div>
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

    // Download Logic with Simulation
    document.getElementById('dl-btn').onclick = () => {
        const btn = document.getElementById('dl-btn');
        const prog = document.getElementById('prog-container');
        const bar = document.getElementById('prog-bar');
        
        btn.style.display = 'none';
        prog.style.display = 'block';
        
        let width = 0;
        const interval = setInterval(() => {
            width += Math.random() * 10;
            if(width >= 100) {
                width = 100;
                clearInterval(interval);
                window.location.href = link;
            }
            bar.style.width = width + '%';
        }, 150);
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
    
    if(!data.name || !data.link) return alert("Please fill required fields.");
    
    const auto = document.getElementById('auto-approve-toggle').checked;

    try {
        await addDoc(collection(db, "apps"), data);
        await updateDoc(doc(db, "settings", "comments"), { autoApprove: auto }).catch(() => {});
        location.reload();
    } catch (e) { alert("Error publishing app."); }
};

window.goBack = () => {
    window.history.pushState({}, "", "/");
    document.getElementById('main-view').style.display = 'block';
    document.getElementById('details-view').style.display = 'none';
    window.scrollTo(0, 0);
};

window.filterApps = () => {
    const q = document.getElementById('main-search').value.toLowerCase();
    const filtered = allApps.filter(a => a.name.toLowerCase().includes(q));
    renderApps(filtered);
};

// --- Auth & Navigation ---
window.loginWithGoogle = () => signInWithPopup(auth, new GoogleAuthProvider()).then(() => location.reload());
window.logout = () => signOut(auth).then(() => location.reload());
window.openAdminPanel = () => { document.getElementById('admin-modal').style.display = 'flex'; };
window.closeAdmin = () => { document.getElementById('admin-modal').style.display = 'none'; };

// Init
loadApps();