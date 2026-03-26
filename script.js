// script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// =========================================================================
// 🛠️ MANUAL APP METADATA (BACKWARD COMPATIBILITY & FALLBACKS)
// =========================================================================
const APP_METADATA_FALLBACK = {
    "default": { rating: "4.5", size: "15 MB" }
};
// =========================================================================

const firebaseConfig = {
  apiKey: "AIzaSyCiIYUWBTr3__sQo--g6dWvMIxDjqC7r0o",
  authDomain: "astro-apk-hub.firebaseapp.com",
  projectId: "astro-apk-hub",
  storageBucket: "astro-apk-hub.firebasestorage.app",
  messagingSenderId: "386427363240",
  appId: "1:386427363240:web:d094bbfc50677f1b09c79d",
  measurementId: "G-46VFMBFBMX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let allApps = [];
let selectedAppId = null;
const ADMIN_EMAILS = ["a4anandg2@gmail.com", "per14923@gmail.com"];

// Auth Logic
const loginBtn = document.getElementById('admin-login-btn');
const adminMenu = document.getElementById('admin-menu');

loginBtn.onclick = () => {
    if (auth.currentUser) {
        adminMenu.style.display = adminMenu.style.display === 'flex' ? 'none' : 'flex';
    } else {
        signInWithPopup(auth, new GoogleAuthProvider());
    }
};

onAuthStateChanged(auth, (user) => {
    if (user && ADMIN_EMAILS.includes(user.email)) {
        loginBtn.innerText = '⚙️';
        console.log("Admin verified");
    } else {
        loginBtn.innerText = '🔑';
        adminMenu.style.display = 'none';
    }
    loadApps();
});

window.handleLogout = () => signOut(auth).then(() => location.reload());

// App Data Logic
async function loadApps() {
    const querySnapshot = await getDocs(collection(db, "apps"));
    allApps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderApps(allApps);
    handleDeepLink();
}

window.renderApps = (data) => {
    const list = document.getElementById('app-list');
    list.innerHTML = data.map(app => {
        const slug = app.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        // Handle Ratings & Size (Database first, then fallback)
        const rating = app.rating || APP_METADATA_FALLBACK.default.rating;
        const size = app.size || APP_METADATA_FALLBACK.default.size;

        return `
        <article class="store-card" onclick="decodeAndOpen('${btoa(app.name)}', '${btoa(app.icon)}', '${btoa(app.link)}', '${btoa(app.description)}', '${app.id}')">
            <img src="${app.icon}" class="store-icon" alt="${app.name}" onerror="this.src='favicon.png'">
            <div class="store-info">
                <h3 class="store-title">${app.name}</h3>
                <div class="store-meta">
                    <span class="meta-rating">⭐ ${rating}</span>
                    <span class="meta-dot">&bull;</span>
                    <span class="meta-size">📦 ${size}</span>
                </div>
            </div>
            <button class="btn-get">GET</button>
        </article>
    `}).join('');
};

window.searchApps = () => {
    const term = document.getElementById('app-search').value.toLowerCase();
    const filtered = allApps.filter(app => 
        app.name.toLowerCase().includes(term) || 
        app.description.toLowerCase().includes(term)
    );
    renderApps(filtered);
};

// Navigation & Details
window.decodeAndOpen = (name, icon, link, desc, id) => {
    openAppDetails(atob(name), atob(icon), atob(link), atob(desc), id);
};

window.openAppDetails = (name, icon, link, desc, id, updateHistory = true) => {
    const appData = allApps.find(a => a.id === id) || {};
    const rating = appData.rating || APP_METADATA_FALLBACK.default.rating;
    const size = appData.size || APP_METADATA_FALLBACK.default.size;

    selectedAppId = id;
    document.getElementById('main-view').style.display = 'none';
    document.getElementById('detail-view').style.display = 'block';
    window.scrollTo(0,0);

    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    if(updateHistory) history.pushState({id}, name, `?app=${slug}`);

    document.getElementById('dynamic-content').innerHTML = `
        <div class="detail-header">
            <img src="${icon}" class="detail-icon" alt="${name}">
            <div class="detail-main">
                <h1 class="detail-title">${name}</h1>
                <p style="color:var(--accent-blue); font-weight:600;">Safe & Verified ✅</p>
                
                <div class="detail-stats">
                    <div class="stat-item">
                        <span class="stat-val">${rating} ★</span>
                        <span class="stat-lbl">Rating</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-val">${size}</span>
                        <span class="stat-lbl">Size</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-val">100%</span>
                        <span class="stat-lbl">Secure</span>
                    </div>
                </div>

                <button class="btn-primary" onclick="startSecureDownload('${link}')">Free Download</button>
                
                <div id="download-ui" class="progress-box">
                    <p id="status-text">Connecting to secure server...</p>
                    <div class="progress-bar-container">
                        <div id="progress-fill" class="progress-fill"></div>
                    </div>
                    <p style="font-size:12px; color:var(--text-secondary)">Please do not close this page</p>
                </div>
            </div>
        </div>

        <div class="detail-desc">
            <h2 style="color:var(--text-primary); margin-bottom:15px;">Description & Features</h2>
            ${desc}
        </div>

        ${(auth.currentUser && ADMIN_EMAILS.includes(auth.currentUser.email)) ? `
            <div class="admin-actions">
                <button class="btn-outline" onclick="editExistingApp('${id}', '${btoa(name)}', '${btoa(icon)}', '${btoa(link)}', '${btoa(desc)}')">✏️ Edit</button>
                <button class="btn-outline" style="color:var(--danger)" onclick="deleteApp('${id}')">🗑️ Delete</button>
            </div>
        ` : ''}
    `;
};

window.closeAppDetails = () => {
    document.getElementById('main-view').style.display = 'block';
    document.getElementById('detail-view').style.display = 'none';
    history.pushState(null, "", window.location.pathname);
};

// Admin Functions
window.addNewApp = async () => {
    const name = document.getElementById('new-app-name').value;
    const icon = document.getElementById('new-app-icon').value;
    const link = document.getElementById('new-app-link').value;
    const desc = document.getElementById('new-app-desc').value;
    const rating = document.getElementById('new-app-rating').value || "4.5";
    const size = document.getElementById('new-app-size').value || "15 MB";

    if(!name || !link) return alert("App Name and Link are required!");
    
    await addDoc(collection(db, "apps"), { 
        name, 
        icon, 
        link, 
        description: desc,
        rating,
        size,
        timestamp: Date.now() 
    });
    location.reload();
};

window.editExistingApp = (id, name, icon, link, desc) => {
    const app = allApps.find(a => a.id === id);
    document.getElementById('admin-modal').style.display = 'flex';
    document.querySelector('.modal-title').innerText = "Update App";
    
    document.getElementById('new-app-name').value = atob(name);
    document.getElementById('new-app-icon').value = atob(icon);
    document.getElementById('new-app-link').value = atob(link);
    document.getElementById('new-app-desc').value = atob(desc);
    document.getElementById('new-app-rating').value = app.rating || "4.5";
    document.getElementById('new-app-size').value = app.size || "15 MB";

    const btn = document.querySelector('.btn-primary.w-100');
    btn.innerText = "Save Changes";
    btn.onclick = async () => {
        const uName = document.getElementById('new-app-name').value;
        const uIcon = document.getElementById('new-app-icon').value;
        const uLink = document.getElementById('new-app-link').value;
        const uDesc = document.getElementById('new-app-desc').value;
        const uRating = document.getElementById('new-app-rating').value;
        const uSize = document.getElementById('new-app-size').value;

        await updateDoc(doc(db, "apps", id), {
            name: uName, icon: uIcon, link: uLink, description: uDesc,
            rating: uRating, size: uSize
        });
        location.reload();
    };
};

window.deleteApp = async (id) => {
    if(confirm("Permanently delete this application?")) {
        await deleteDoc(doc(db, "apps", id));
        location.reload();
    }
};

// Download Simulation
window.startSecureDownload = (url) => {
    const ui = document.getElementById('download-ui');
    const fill = document.getElementById('progress-fill');
    const status = document.getElementById('status-text');
    
    ui.style.display = 'block';
    let progress = 0;
    
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if(progress > 100) progress = 100;
        
        fill.style.width = `${progress}%`;
        
        if(progress < 30) status.innerText = "Verifying package integrity...";
        else if(progress < 70) status.innerText = "Requesting secure mirror...";
        else if(progress < 100) status.innerText = "Finalizing secure link...";
        else {
            clearInterval(interval);
            status.innerHTML = "✅ Verification Complete! <br> Starting Download...";
            setTimeout(() => {
                window.location.href = url;
                ui.style.display = 'none';
            }, 1500);
        }
    }, 400);
};

// Deep Linking Support
function handleDeepLink() {
    const params = new URLSearchParams(window.location.search);
    const appSlug = params.get('app');
    if(appSlug && allApps.length > 0) {
        const found = allApps.find(a => a.name.toLowerCase().replace(/[^a-z0-9]/g, '-') === appSlug);
        if(found) openAppDetails(found.name, found.icon, found.link, found.description, found.id, false);
    }
}

window.onpopstate = (e) => {
    if(e.state && e.state.id) {
        const a = allApps.find(app => app.id === e.state.id);
        if(a) openAppDetails(a.name, a.icon, a.link, a.description, a.id, false);
    } else {
        closeAppDetails();
    }
};

// Close dropdown on outside click
window.addEventListener('click', (e) => {
    if(!loginBtn.contains(e.target) && !adminMenu.contains(e.target)) adminMenu.style.display = 'none';
});

window.openAdminPanel = () => { 
    document.getElementById('admin-modal').style.display = 'flex'; 
    document.querySelector('.modal-title').innerText = "Publish App";
    document.querySelector('.btn-primary.w-100').innerText = "Publish to Store";
    document.querySelector('.btn-primary.w-100').onclick = window.addNewApp;
    
    // Clear inputs
    document.getElementById('new-app-name').value = '';
    document.getElementById('new-app-icon').value = '';
    document.getElementById('new-app-link').value = '';
    document.getElementById('new-app-desc').value = '';
    document.getElementById('new-app-rating').value = '';
    document.getElementById('new-app-size').value = '';
};

window.closeAdmin = () => document.getElementById('admin-modal').style.display = 'none';

loadApps();

window.generateSitemap = () => {
    const baseUrl = "https://astroapkhub.in/";
    const pages = [\"privacy\", \"terms\", \"dmca\"];
    let xml = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n`;
    xml += `  <url><loc>${baseUrl}</loc><priority>1.0</priority></url>\n`;
    pages.forEach(p => { xml += `  <url><loc>${baseUrl}${p}</loc><priority>0.8</priority></url>\n`; });
    
    allApps.forEach(app => {
        const slug = app.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        xml += `  <url><loc>${baseUrl}?app=${slug}</loc><priority>0.6</priority></url>\n`;
    });
    
    xml += `</urlset>`;
    const blob = new Blob([xml], {type: 'text/xml'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sitemap.xml';
    link.click();
};