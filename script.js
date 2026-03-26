/**
 * Astro APK Hub - Optimized Core Logic
 * Performance: Refactored with Event Delegation, Throttling, and Memory Management
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// State
let allApps = [];
const ADMIN_EMAILS = ["a4anandg2@gmail.com", "per149209@gmail.com"];

/**
 * Performance: Throttling for Search
 */
function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

/**
 * DOM Elements Cache (Memory Optimization)
 */
const UI = {
    appList: document.getElementById('app-list'),
    mainView: document.getElementById('main-view'),
    detailsView: document.getElementById('details-view'),
    dynamicContent: document.getElementById('dynamic-content'),
    search: document.getElementById('main-search'),
    adminControls: document.getElementById('admin-controls'),
    guestControls: document.getElementById('guest-controls'),
    userPhoto: document.getElementById('user-photo'),
    userMenu: document.getElementById('user-menu'),
    adminModal: document.getElementById('admin-modal'),
    commentsList: document.getElementById('home-comments-list')
};

/**
 * Authentication & State
 */
onAuthStateChanged(auth, (user) => {
    const isAdmin = user && ADMIN_EMAILS.includes(user.email);
    UI.adminControls.style.display = isAdmin ? 'block' : 'none';
    UI.guestControls.style.display = isAdmin ? 'none' : 'block';
    if(user) UI.userPhoto.src = user.photoURL;
});

/**
 * UI Rendering (Optimized Fragment Injection)
 */
const renderApps = (data) => {
    if (!data.length) {
        UI.appList.innerHTML = `<p style="text-align:center; grid-column:1/-1; padding:40px; color:var(--text-secondary);">No apps found matching your search.</p>`;
        return;
    }

    const fragment = document.createDocumentFragment();
    data.forEach(app => {
        const card = document.createElement('article');
        card.className = 'app-card';
        card.innerHTML = `
            <img src="${app.icon}" class="app-icon" loading="lazy" alt="${app.name}">
            <div class="app-info">
                <div class="app-name">${app.name}</div>
                <div class="app-meta">${app.size || 'Premium'} • Safe Build</div>
            </div>
            <button class="btn-get">GET</button>
            <div class="badge-rating">${app.rating || '4.8'} ★</div>
        `;
        card.addEventListener('click', () => openAppDetails(app));
        fragment.appendChild(card);
    });

    UI.appList.innerHTML = '';
    UI.appList.appendChild(fragment);
};

/**
 * Data Fetching (Optimized)
 */
async function loadData() {
    try {
        const snap = await getDocs(query(collection(db, "apps"), orderBy("name")));
        allApps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderApps(allApps);
        loadGlobalComments();
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

/**
 * Navigation Logic
 */
const openAppDetails = (app) => {
    UI.mainView.style.display = 'none';
    UI.detailsView.style.display = 'block';
    UI.detailsView.setAttribute('aria-hidden', 'false');
    window.scrollTo({ top: 0, behavior: 'instant' });

    const isAdmin = auth.currentUser && ADMIN_EMAILS.includes(auth.currentUser.email);

    UI.dynamicContent.innerHTML = `
        <div class="detail-header">
            <img src="${app.icon}" class="detail-icon" alt="${app.name}">
            <div class="detail-content">
                <h1 class="detail-title">${app.name}</h1>
                <p style="color:var(--text-secondary); margin-bottom:20px;">${app.size || 'Varies'} • Verified Mod • Safe & Secure</p>
                <button id="dl-trigger" class="btn-primary">Download (Direct Link)</button>
                <div id="prog-box" class="progress-box"><div id="prog-fill" class="progress-fill"></div></div>
                
                ${isAdmin ? `
                <div class="admin-actions">
                    <button class="btn-outline" id="admin-edit">Edit App</button>
                    <button class="btn-outline" style="color:var(--danger);" id="admin-delete">Delete</button>
                </div>
                ` : ''}
            </div>
        </div>
        <div class="app-description" style="margin-top:40px;">
            <h3 style="margin-bottom:16px;">Description & Features</h3>
            <div style="color:var(--text-secondary); white-space: pre-line;">${app.description}</div>
        </div>
    `;

    // Internal detail view listeners
    document.getElementById('dl-trigger').addEventListener('click', function() {
        const fill = document.getElementById('prog-fill');
        const box = document.getElementById('prog-box');
        this.style.display = 'none';
        box.style.display = 'block';
        
        let w = 0;
        const iv = setInterval(() => {
            w += Math.random() * 15;
            if(w >= 100) {
                clearInterval(iv);
                window.location.href = app.link;
            }
            fill.style.width = Math.min(w, 100) + '%';
        }, 80);
    });

    if(isAdmin) {
        document.getElementById('admin-delete').onclick = () => deleteApp(app.id);
        document.getElementById('admin-edit').onclick = () => prepareEdit(app);
    }
};

/**
 * Admin Logic
 */
async function addNewApp() {
    const btn = document.getElementById('admin-submit-btn');
    btn.disabled = true;
    btn.innerText = "Processing...";

    const data = {
        name: document.getElementById('new-app-name').value,
        rating: document.getElementById('new-app-rating').value,
        size: document.getElementById('new-app-size').value,
        icon: document.getElementById('new-app-icon').value,
        link: document.getElementById('new-app-link').value,
        description: document.getElementById('new-app-desc').value
    };

    try {
        await addDoc(collection(db, "apps"), data);
        location.reload();
    } catch (e) {
        btn.disabled = false;
        btn.innerText = "Error - Try Again";
    }
}

async function deleteApp(id) {
    if(confirm("Permanently remove this application?")) {
        await deleteDoc(doc(db, "apps", id));
        location.reload();
    }
}

const prepareEdit = (app) => {
    UI.adminModal.style.display = 'flex';
    document.getElementById('new-app-name').value = app.name;
    document.getElementById('new-app-rating').value = app.rating;
    document.getElementById('new-app-size').value = app.size;
    document.getElementById('new-app-icon').value = app.icon;
    document.getElementById('new-app-link').value = app.link;
    document.getElementById('new-app-desc').value = app.description;
    
    const submit = document.getElementById('admin-submit-btn');
    submit.innerText = "Update Application";
    submit.onclick = async () => {
        await updateDoc(doc(db, "apps", app.id), {
            name: document.getElementById('new-app-name').value,
            description: document.getElementById('new-app-desc').value,
            link: document.getElementById('new-app-link').value,
            icon: document.getElementById('new-app-icon').value,
            size: document.getElementById('new-app-size').value,
            rating: document.getElementById('new-app-rating').value
        });
        location.reload();
    };
};

/**
 * Global Event Listeners (Optimized Delegation)
 */
document.addEventListener('click', (e) => {
    // Dropdown toggle
    if (e.target.id === 'user-photo') {
        UI.userMenu.style.display = UI.userMenu.style.display === 'block' ? 'none' : 'block';
        return;
    }
    UI.userMenu.style.display = 'none';

    // Admin Modal Close
    if (e.target.id === 'admin-modal' || e.target.id === 'btn-close-admin') {
        UI.adminModal.style.display = 'none';
    }
});

UI.search.addEventListener('input', debounce((e) => {
    const q = e.target.value.toLowerCase();
    const filtered = allApps.filter(a => a.name.toLowerCase().includes(q));
    renderApps(filtered);
}));

document.getElementById('btn-open-admin').onclick = () => UI.adminModal.style.display = 'flex';
document.getElementById('btn-login').onclick = () => signInWithPopup(auth, new GoogleAuthProvider()).then(() => location.reload());
document.getElementById('btn-logout').onclick = () => signOut(auth).then(() => location.reload());
document.getElementById('btn-back').onclick = () => {
    UI.detailsView.style.display = 'none';
    UI.mainView.style.display = 'block';
};

// Category Filtering
document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', function() {
        document.querySelector('.chip.active').classList.remove('active');
        this.classList.add('active');
        const cat = this.dataset.category;
        const filtered = cat === 'all' ? allApps : allApps.filter(a => (a.category || '').includes(cat));
        renderApps(filtered);
    });
});

/**
 * Comments Logic
 */
async function loadGlobalComments() {
    const q = query(collection(db, "global_comments"), orderBy("timestamp", "desc"), limit(10));
    const snap = await getDocs(q);
    UI.commentsList.innerHTML = snap.docs.map(d => {
        const c = d.data();
        return `
            <div class="comment-item" style="padding:12px; border-bottom:1px solid var(--border-light);">
                <strong>${c.user}</strong>
                <p style="font-size:14px; color:var(--text-secondary);">${c.text}</p>
            </div>
        `;
    }).join('') || '<p style="text-align:center; padding:20px; color:var(--text-secondary);">No feedback yet.</p>';
}

document.getElementById('btn-post-feedback').onclick = async () => {
    const u = document.getElementById('home-comment-user');
    const t = document.getElementById('home-comment-text');
    if(!u.value || !t.value) return;

    await addDoc(collection(db, "global_comments"), {
        user: u.value,
        text: t.value,
        timestamp: Date.now()
    });
    u.value = ''; t.value = '';
    loadGlobalComments();
};

// Initial Init
document.addEventListener('DOMContentLoaded', loadData);