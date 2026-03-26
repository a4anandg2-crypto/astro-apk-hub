import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// --- State Management ---
onAuthStateChanged(auth, (user) => {
    const isAdmin = user && ADMIN_EMAILS.includes(user.email);
    document.getElementById('admin-controls').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('guest-controls').style.display = isAdmin ? 'none' : 'block';
    if(user) document.getElementById('user-photo').src = user.photoURL;
});

// --- Content Handlers ---
async function loadApps() {
    const snap = await getDocs(collection(db, "apps"));
    allApps = snap.docs.map(d => ({id: d.id, ...d.data()}));
    renderApps(allApps);
    loadComments('global_comments', 'global');
}

window.renderApps = (data) => {
    const list = document.getElementById('app-list');
    list.innerHTML = data.map(app => `
        <article class="app-card" onclick="openAppDetails('${app.name}', '${app.icon}', '${app.link}', '${encodeURIComponent(app.description)}', '${app.id}', '${app.rating || '4.8'}', '${app.size || 'Varies'}')">
            <img src="${app.icon}" class="app-icon" loading="lazy">
            <div class="app-info">
                <div class="app-name">${app.name}</div>
                <div class="app-meta">${app.size || 'Premium'} • Safe Build</div>
            </div>
            <button class="btn-get">GET</button>
            <div class="badge-rating">${app.rating || '4.8'} ★</div>
        </article>
    `).join('');
};

window.openAppDetails = (name, icon, link, desc, id, rating, size) => {
    document.getElementById('main-view').style.display = 'none';
    const dv = document.getElementById('details-view');
    dv.style.display = 'block';
    window.scrollTo(0, 0);

    const isAdmin = auth.currentUser && ADMIN_EMAILS.includes(auth.currentUser.email);
    const decodedDesc = decodeURIComponent(desc);

    document.getElementById('dynamic-content').innerHTML = `
        <div class="detail-header">
            <img src="${icon}" class="detail-icon">
            <div class="detail-content">
                <h1 class="detail-title">${name}</h1>
                <p style="color:var(--text-secondary); margin-bottom:20px;">${size} • Verified Mod • Safe & Secure</p>
                <button id="dl-btn" class="btn-primary">Download (Direct Link)</button>
                <div id="prog-box" class="progress-box"><div id="prog-fill" class="progress-fill"></div></div>
                
                ${isAdmin ? `
                <div class="admin-actions">
                    <button class="btn-outline" onclick="editApp('${id}')">Edit</button>
                    <button class="btn-outline" style="color:var(--danger);" onclick="deleteApp('${id}')">Delete</button>
                </div>
                ` : ''}
            </div>
        </div>
        <div class="app-description" style="margin-top:40px;">
            <h3>Description & Features</h3>
            <div style="margin-top:15px; color:var(--text-secondary);">${decodedDesc}</div>
        </div>
    `;

    document.getElementById('dl-btn').onclick = () => {
        const prog = document.getElementById('prog-box');
        const fill = document.getElementById('prog-fill');
        const btn = document.getElementById('dl-btn');
        btn.style.display = 'none';
        prog.style.display = 'block';
        let width = 0;
        const interval = setInterval(() => {
            width += Math.random() * 8;
            if(width >= 100) {
                clearInterval(interval);
                window.location.href = link;
            }
            fill.style.width = width + '%';
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
    const auto = document.getElementById('auto-approve-toggle').checked;
    await addDoc(collection(db, "apps"), data);
    await updateDoc(doc(db, "settings", "comments"), { autoApprove: auto }).catch(() => {});
    location.reload();
};

window.deleteApp = async (id) => {
    if(confirm("Delete this app permanently?")) {
        await deleteDoc(doc(db, "apps", id));
        location.reload();
    }
};

window.filterApps = () => {
    const q = document.getElementById('main-search').value.toLowerCase();
    const filtered = allApps.filter(a => a.name.toLowerCase().includes(q));
    renderApps(filtered);
};

window.goBack = () => {
    document.getElementById('main-view').style.display = 'block';
    document.getElementById('details-view').style.display = 'none';
    window.scrollTo(0,0);
};

// UI Triggers
window.toggleDropdown = (e) => {
    e.stopPropagation();
    const m = document.getElementById('user-menu');
    m.style.display = m.style.display === 'block' ? 'none' : 'block';
};
document.addEventListener('click', () => { document.getElementById('user-menu').style.display = 'none'; });
window.openAdminPanel = () => document.getElementById('admin-modal').style.display = 'flex';
window.closeAdmin = () => document.getElementById('admin-modal').style.display = 'none';
window.loginWithGoogle = () => signInWithPopup(auth, new GoogleAuthProvider()).then(() => location.reload());
window.logout = () => signOut(auth).then(() => location.reload());

loadApps();