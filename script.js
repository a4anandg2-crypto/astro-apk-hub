import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
let selectedAppId = null;
const ADMIN_EMAILS = ["a4anandg2@gmail.com", "per149209@gmail.com"];

const getSlug = (text) => text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

onAuthStateChanged(auth, (user) => {
    const isAdmin = user && ADMIN_EMAILS.includes(user.email);
    document.getElementById('admin-controls').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('guest-controls').style.display = isAdmin ? 'none' : 'block';
    if(user) document.getElementById('user-photo').src = user.photoURL;
});

// --- COMMENT SYSTEM ---
async function postComment(collectionName, targetId, text, userName) {
    if (!text.trim()) return alert("Please enter a comment!");
    await addDoc(collection(db, collectionName), {
        targetId,
        text,
        user: userName || "Anonymous User",
        timestamp: new Date().toISOString()
    });
    loadComments(collectionName, targetId);
}

async function loadComments(collectionName, targetId) {
    const containerId = targetId === 'global' ? 'home-comments-list' : 'app-comments-list';
    const container = document.getElementById(containerId);
    if (!container) return;

    const snap = await getDocs(collection(db, collectionName));
    const comments = snap.docs
        .map(d => d.data())
        .filter(c => c.targetId === targetId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    container.innerHTML = comments.map(c => `
        <div class="comment-item">
            <div class="comment-meta"><strong>${c.user}</strong> • ${new Date(c.timestamp).toLocaleDateString()}</div>
            <div class="comment-text">${c.text}</div>
        </div>
    `).join('') || '<p style="color:var(--text-secondary); font-size:14px;">No feedback yet. Start the conversation!</p>';
}

window.postGlobalComment = () => {
    const user = document.getElementById('home-comment-user').value;
    const text = document.getElementById('home-comment-text').value;
    postComment('global_comments', 'global', text, user);
    document.getElementById('home-comment-text').value = '';
};

// --- APP DATA LOGIC ---
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
                <img src="${app.icon}" class="store-icon" alt="${app.name}">
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
    selectedAppId = id;
    window.history.pushState({appId: id}, name, `/${getSlug(name)}`);
    document.getElementById('main-view').style.display = 'none';
    document.getElementById('details-view').style.display = 'block';
    
    const isAdmin = auth.currentUser && ADMIN_EMAILS.includes(auth.currentUser.email);
    const decodedDesc = decodeURIComponent(desc);

    document.getElementById('dynamic-content').innerHTML = `
        <div class="app-page-wrapper">
            <header class="detail-header">
                <img src="${icon}" class="detail-icon">
                <div class="detail-meta">
                    <h1 class="detail-title">${name}</h1>
                    <p class="detail-publisher">Verified Premium • ${size}</p>
                    <button id="dl-btn" class="btn-primary">Get Application (${size})</button>
                    <div id="prog-container" class="progress-box"><div id="prog-bar" class="progress-fill"></div></div>
                </div>
            </header>

            <div class="detail-stats">
                <div class="stat-item"><span class="stat-val">${rating} ★</span><span class="stat-lbl">Rating</span></div>
                <div class="stat-item"><span class="stat-val">${size}</span><span class="stat-lbl">Size</span></div>
                <div class="stat-item"><span class="stat-val">100%</span><span class="stat-lbl">Secure</span></div>
            </div>

            <section class="detail-about">
                <h3>About this App</h3>
                <p>${decodedDesc}</p>
            </section>

            <section class="comment-section">
                <h3>App Reviews</h3>
                <div class="comment-input-wrap">
                    <input type="text" id="app-comment-user" placeholder="Name" class="input-field">
                    <textarea id="app-comment-text" placeholder="Write a review for ${name}..." class="input-field" style="min-height:70px;"></textarea>
                    <button class="btn-primary" onclick="window.postAppComment('${id}')">Submit Review</button>
                </div>
                <div id="app-comments-list" class="comments-list"></div>
            </section>

            ${isAdmin ? `<div class="admin-actions">
                <button class="btn-outline" onclick="editExistingApp('${id}', '${encodeURIComponent(name)}', '${encodeURIComponent(icon)}', '${encodeURIComponent(link)}', '${encodeURIComponent(desc)}', '${rating}', '${size}')">Edit App</button>
            </div>` : ''}
        </div>
    `;

    window.postAppComment = (appId) => {
        const user = document.getElementById('app-comment-user').value;
        const text = document.getElementById('app-comment-text').value;
        postComment('app_comments', appId, text, user);
        document.getElementById('app-comment-text').value = '';
    };

    loadComments('app_comments', id);

    document.getElementById('dl-btn').onclick = () => {
        document.getElementById('dl-btn').style.display = 'none';
        document.getElementById('prog-container').style.display = 'block';
        let w = 0;
        let itv = setInterval(() => {
            w += 5;
            document.getElementById('prog-bar').style.width = w + '%';
            if(w >= 100) { clearInterval(itv); window.location.href = link; }
        }, 100);
    };
};

window.addNewApp = async () => {
    const name = document.getElementById('new-app-name').value;
    const rating = document.getElementById('new-app-rating').value;
    const size = document.getElementById('new-app-size').value;
    const icon = document.getElementById('new-app-icon').value;
    const link = document.getElementById('new-app-link').value;
    const description = document.getElementById('new-app-desc').value;

    await addDoc(collection(db, "apps"), { name, rating, size, icon, link, description });
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

// ... keep your helper functions (goBack, login, etc.) ...
window.goBack = () => {
    window.history.pushState({}, "", "/");
    document.getElementById('main-view').style.display = 'block';
    document.getElementById('details-view').style.display = 'none';
};
window.loginWithGoogle = () => signInWithPopup(auth, new GoogleAuthProvider()).then(() => location.reload());
window.logout = () => signOut(auth).then(() => location.reload());
window.closeAdmin = () => { document.getElementById('admin-modal').style.display = 'none'; };
window.openAdminPanel = () => { 
    document.getElementById('admin-modal').style.display = 'flex'; 
    document.getElementById('admin-submit-btn').innerText = "Publish to Store";
    document.getElementById('admin-submit-btn').onclick = window.addNewApp;
};

loadApps();