import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCiIYUWBTr3__sQo--g6dWvMIxDjqC7r0o",
  authDomain: "astro-apk-hub.firebaseapp.com",
  projectId: "astro-apk-hub",
  storageBucket: "astro-apk-hub.firebasestorage.app"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let allApps = [];
const ADMIN_EMAIL = "a4anandg2@gmail.com";
const getSlug = (text) => text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');

onAuthStateChanged(auth, (user) => {
    document.getElementById('admin-controls').style.display = (user && user.email === ADMIN_EMAIL) ? 'block' : 'none';
    document.getElementById('guest-controls').style.display = (user && user.email === ADMIN_EMAIL) ? 'none' : 'block';
});

async function loadApps() {
    try {
        const snap = await getDocs(collection(db, "apps"));
        allApps = snap.docs.map(d => ({id: d.id, ...d.data()}));
        renderApps(allApps);
        checkUrlAndRoute();
    } catch (e) { console.error("Error loading apps:", e); }
}

const checkUrlAndRoute = () => {
    const path = window.location.pathname.replace('/', '');
    if (!path || path === "index.html") return goBack(false);
    
    const foundApp = allApps.find(a => getSlug(a.name) === path);
    if (foundApp) openAppDetails(foundApp.name, foundApp.icon, foundApp.link, foundApp.description, foundApp.id, false);
    else goBack(false);
};

window.onpopstate = () => checkUrlAndRoute();

// OPTIMIZED RENDER FUNCTION (MODERN CARDS)
window.renderApps = (data) => {
    const list = document.getElementById('app-list');
    list.innerHTML = data.map(app => {
        const safeDesc = encodeURIComponent(app.description || '');
        const safeName = encodeURIComponent(app.name);
        const safeIcon = encodeURIComponent(app.icon);
        const safeLink = encodeURIComponent(app.link);
        
        return `
        <div class="app-card-modern" onclick="decodeAndOpen('${safeName}', '${safeIcon}', '${safeLink}', '${safeDesc}', '${app.id}')">
            <div class="card-header">
                <img src="${app.icon}" onerror="this.src='https://via.placeholder.com/150'">
                <div class="header-info">
                    <span class="app-name">${app.name}</span>
                    <span class="rating">★ 4.9 <span class="verified-dot"></span></span>
                </div>
            </div>
            <p class="app-desc-preview">${app.description || 'Premium Modded App with unlocked features...'}</p>
            <div class="card-footer">
                <div class="meta-info">
                    <span>🔄 v${app.version || 'Latest'}</span>
                    <span>💾 ${app.size || 'Optimized'}</span>
                </div>
                <button class="dl-btn">Download</button>
            </div>
        </div>
    `}).join('');
};

window.decodeAndOpen = (name, icon, link, desc, id) => {
    openAppDetails(decodeURIComponent(name), decodeURIComponent(icon), decodeURIComponent(link), decodeURIComponent(desc), id, true);
};

window.openAppDetails = (name, icon, link, desc, id, updateHistory = true) => {
    if (updateHistory) window.history.pushState({appId: id}, name, `/${getSlug(name)}`);
    document.getElementById('main-view').style.display = 'none';
    document.getElementById('details-view').style.display = 'block';
    
    // Details Page Template (Keeping your exact setup)
    document.getElementById('dynamic-content').innerHTML = `
        <div style="max-width:800px; margin:0 auto; text-align:center;">
            <img src="${icon}" style="width:120px; border-radius:24px; margin-bottom:20px; border:3px solid #f97316;">
            <h1 style="font-size:2rem; font-weight:800; margin-bottom:20px;">${name}</h1>
            <button id="main-dl-btn" class="action-btn" style="max-width:300px; font-size:1.1rem;">📥 Download APK</button>
            <div id="prog-container" style="display:none; margin-top:15px; background:#1e293b; height:10px; border-radius:10px; overflow:hidden;">
                <div id="prog-bar" style="width:0%; height:100%; background:#10b981; transition:width 0.2s;"></div>
            </div>
            <div style="text-align:left; background:#1e293b; padding:30px; border-radius:20px; margin-top:30px; line-height:1.6; color:#cbd5e1;">
                ${desc.replace(/\n/g, '<br>')}
            </div>
        </div>
    `;

    document.getElementById('main-dl-btn').onclick = () => {
        document.getElementById('main-dl-btn').style.display = 'none';
        document.getElementById('prog-container').style.display = 'block';
        let w = 0;
        let itv = setInterval(() => {
            w += 5;
            document.getElementById('prog-bar').style.width = w+'%';
            if(w >= 100) { 
                clearInterval(itv); 
                window.open("https://otieu.com/4/10584243", '_blank');
                setTimeout(() => { window.location.href = link; }, 300);
            }
        }, 150);
    };
    window.scrollTo(0,0);
};

window.goBack = (updateHistory = true) => {
    if (updateHistory) window.history.pushState({}, "SmArT AStro HuB", "/");
    document.getElementById('main-view').style.display = 'block';
    document.getElementById('details-view').style.display = 'none';
};

window.loginWithGoogle = () => signInWithPopup(auth, new GoogleAuthProvider()).then(() => location.reload());
window.logout = () => signOut(auth).then(() => location.reload());

loadApps();