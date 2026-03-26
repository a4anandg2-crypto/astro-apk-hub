import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

const getSlug = (t) => t.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

onAuthStateChanged(auth, (u) => {
    const isAdmin = u && ADMIN_EMAILS.includes(u.email);
    document.getElementById('admin-controls').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('guest-controls').style.display = isAdmin ? 'none' : 'block';
    if(u) document.getElementById('user-photo').src = u.photoURL;
});

async function postComment(col, targetId, text, user) {
    if (!text.trim()) return;
    await addDoc(collection(db, col), {
        targetId,
        text,
        user: user || "Anonymous",
        timestamp: new Date().toISOString()
    });
    loadComments(col, targetId);
}

async function loadComments(col, targetId) {
    const isGlobal = targetId === 'global';
    const container = document.getElementById(isGlobal ? 'home-comments-list' : 'app-comments-list');
    if (!container) return;

    const snap = await getDocs(collection(db, col));
    const comments = snap.docs
        .map(d => d.data())
        .filter(c => c.targetId === targetId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    container.innerHTML = comments.map(c => `
        <div class="comment-item">
            <div class="comment-meta"><strong>${c.user}</strong> • ${new Date(c.timestamp).toLocaleDateString()}</div>
            <div class="comment-text">${c.text}</div>
        </div>
    `).join('') || '<p class="empty-msg">No feedback yet.</p>';
}

window.postGlobalComment = () => {
    const u = document.getElementById('home-comment-user');
    const t = document.getElementById('home-comment-text');
    postComment('global_comments', 'global', t.value, u.value);
    t.value = '';
};

async function loadApps() {
    const snap = await getDocs(collection(db, "apps"));
    allApps = snap.docs.map(d => ({id: d.id, ...d.data()}));
    renderApps(allApps);
    loadComments('global_comments', 'global');
}

window.renderApps = (data) => {
    const list = document.getElementById('app-list');
    list.innerHTML = data.map(app => `
        <article class="store-card" onclick="openAppDetails('${app.name}', '${app.icon}', '${app.link}', '${encodeURIComponent(app.description)}', '${app.id}', '${app.rating || '4.8'}', '${app.size || 'Varies'}')">
            <div class="store-icon-wrapper">
                <img src="${app.icon}" class="store-icon" alt="${app.name}" loading="lazy">
                <div class="badge-rating">${app.rating || '4.8'}</div>
            </div>
            <div class="store-info">
                <h3 class="store-title">${app.name}</h3>
                <p class="store-desc">${app.size || 'Mod'} • Secure Premium</p>
            </div>
            <div class="store-action"><button class="btn-get">GET</button></div>
        </article>
    `).join('');
};

window.openAppDetails = (name, icon, link, desc, id, rating, size) => {
    window.history.pushState({appId: id}, name, `/${getSlug(name)}`);
    document.getElementById('main-view').style.display = 'none';
    document.getElementById('details-view').style.display = 'block';
    
    const isAdmin = auth.currentUser && ADMIN_EMAILS.includes(auth.currentUser.email);
    document.getElementById('dynamic-content').innerHTML = `
        <div class="app-page-wrapper">
            <header class="detail-header">
                <img src="${icon}" class="detail-icon" alt="${name}">
                <div class="detail-meta">
                    <h1 class="detail-title">${name}</h1>
                    <p class="detail-publisher">Verified Premium • ${size}</p>
                    <button id="dl-btn" class="btn-primary">Download APK (${size})</button>
                    <div id="prog-container" class="progress-box"><div id="prog-bar" class="progress-fill"></div></div>
                </div>
            </header>
            <div class="detail-stats">
                <div class="stat-item"><span class="stat-val">${rating} ★</span><span class="stat-lbl">Rating</span></div>
                <div class="stat-item"><span class="stat-val">${size}</span><span class="stat-lbl">Size</span></div>
                <div class="stat-item"><span class="stat-val">100%</span><span class="stat-lbl">Secure</span></div>
            </div>
            <section class="detail-about">
                <h3>About this Application</h3>
                <p>${decodeURIComponent(desc)}</p>
            </section>
            <section class="comment-section">
                <h3>User Reviews</h3>
                <div class="comment-input-wrap">
                    <input type="text" id="app-comment-user" placeholder="Name" class="input-field">
                    <textarea id="app-comment-text" placeholder="Write a review..." class="input-field" style="min-height:70px;"></textarea>
                    <button class="btn-primary" onclick="window.postAppComment('${id}')">Submit</button>
                </div>
                <div id="app-comments-list" class="comments-list"></div>
            </section>
            ${isAdmin ? `<div class="admin-actions"><button class="btn-outline" onclick="editExistingApp('${id}', '${encodeURIComponent(name)}', '${encodeURIComponent(icon)}', '${encodeURIComponent(link)}', '${encodeURIComponent(desc)}', '${rating}', '${size}')">Edit App</button></div>` : ''}
        </div>
    `;

    window.postAppComment = (appId) => {
        const u = document.getElementById('app-comment-user');
        const t = document.getElementById('app-comment-text');
        postComment('app_comments', appId, t.value, u.value);
        t.value = '';
    };

    loadComments('app_comments', id);

    document.getElementById('dl-btn').onclick = () => {
        const btn = document.getElementById('dl-btn');
        const box = document.getElementById('prog-container');
        const bar = document.getElementById('prog-bar');
        btn.style.display = 'none';
        box.style.display = 'block';
        let w = 0;
        let itv = setInterval(() => {
            w += 5;
            bar.style.width = w + '%';
            if(w >= 100) { clearInterval(itv); window.location.href = link; }
        }, 100);
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
    await addDoc(collection(db, "apps"), data);
    location.reload();
};

window.editExistingApp = (id, name, icon, link, desc, rating, size) => {
    document.getElementById('admin-modal').style.display = 'flex';
    document.getElementById('new-app-name').value = decodeURIComponent(name);
    document.getElementById('new-app-rating').value = rating;
    document.getElementById('new-app-size').value = size;
    document.getElementById('new-app-icon').value = decodeURIComponent(icon);
    document.getElementById('new-app-link').value = decodeURIComponent(link);
    document.getElementById('new-app-desc').value = decodeURIComponent(desc);

    const btn = document.getElementById('admin-submit-btn');
    btn.innerText = "Update App";
    btn.onclick = async () => {
        await updateDoc(doc(db, "apps", id), {
            name: document.getElementById('new-app-name').value,
            rating: document.getElementById('new-app-rating').value,
            size: document.getElementById('new-app-size').value,
            icon: document.getElementById('new-app-icon').value,
            link: document.getElementById('new-app-link').value,
            description: document.getElementById('new-app-desc').value
        });
        location.reload();
    };
};

window.goBack = () => {
    window.history.pushState({}, "", "/");
    document.getElementById('main-view').style.display = 'block';
    document.getElementById('details-view').style.display = 'none';
};

window.toggleDropdown = (e) => {
    e.stopPropagation();
    const m = document.getElementById('user-menu');
    m.style.display = m.style.display === 'block' ? 'none' : 'block';
};

window.loginWithGoogle = () => signInWithPopup(auth, new GoogleAuthProvider()).then(() => location.reload());
window.logout = () => signOut(auth).then(() => location.reload());
window.closeAdmin = () => document.getElementById('admin-modal').style.display = 'none';
window.openAdminPanel = () => {
    document.getElementById('admin-modal').style.display = 'flex';
    document.getElementById('admin-submit-btn').innerText = "Publish to Store";
    document.getElementById('admin-submit-btn').onclick = window.addNewApp;
};

document.getElementById('main-search').onkeyup = (e) => {
    const term = e.target.value.toLowerCase();
    renderApps(allApps.filter(a => a.name.toLowerCase().includes(term)));
};

document.addEventListener('click', () => { document.getElementById('user-menu').style.display = 'none'; });

loadApps();