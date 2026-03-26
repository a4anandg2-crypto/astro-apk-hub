// script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const ADMIN_EMAILS = ["a4anandg2@gmail.com", "per149209@gmail.com"];

const getSlug = (text) => text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

onAuthStateChanged(auth, (user) => {
    const adminDiv = document.getElementById('admin-controls');
    const guestDiv = document.getElementById('guest-controls');
    
    const isAdmin = user && ADMIN_EMAILS.includes(user.email);
    
    if (isAdmin) {
        if(adminDiv) adminDiv.style.display = 'block';
        if(guestDiv) guestDiv.style.display = 'none';
        document.getElementById('user-photo').src = user.photoURL;
    } else {
        if(adminDiv) adminDiv.style.display = 'none';
        if(guestDiv) guestDiv.style.display = 'block';
    }
});

async function loadApps() {
    try {
        const snap = await getDocs(collection(db, "apps"));
        allApps = snap.docs.map(d => ({id: d.id, ...d.data()}));
        renderApps(allApps);
        checkUrlAndRoute();
    } catch (e) { console.error(e); }
}

window.onpopstate = () => checkUrlAndRoute();

const checkUrlAndRoute = () => {
    const path = window.location.pathname.replace('/', '');
    
    if (!path || path === "" || path === "index.html") {
        return goBack(false);
    }

    if (path === 'privacy') return window.openPrivacy(false);
    if (path === 'terms') return window.openTerms(false);
    if (path === 'dmca') return window.openDMCA(false);

    const foundApp = allApps.find(app => getSlug(app.name) === path);
    if (foundApp) {
        openAppDetails(foundApp.name, foundApp.icon, foundApp.link, foundApp.description, foundApp.id, false);
    } else {
        goBack(false);
    }
};

window.filterApps = () => {
    const query = document.getElementById('main-search').value.toLowerCase().trim();
    const filtered = query ? allApps.filter(a => a.name.toLowerCase().includes(query)) : allApps;
    renderApps(filtered);
};

// --- REDESIGNED RENDER TEMPLATE (App Store Layout) ---
window.renderApps = (data) => {
    const list = document.getElementById('app-list');
    
    if(data.length === 0) {
        list.innerHTML = `<p style="color: var(--text-secondary); text-align: center; grid-column: 1/-1; padding: 40px 0;">No apps found matching your search.</p>`;
        return;
    }

    list.innerHTML = data.map(app => {
        const safeDesc = encodeURIComponent(app.description || '').replace(/'/g, "%27");
        const safeName = encodeURIComponent(app.name || '').replace(/'/g, "%27");
        const safeIcon = encodeURIComponent(app.icon || '').replace(/'/g, "%27");
        const safeLink = encodeURIComponent(app.link || '').replace(/'/g, "%27");
        
        // Cleaner short description stripping markdown
        const plainDesc = (app.description || '').replace(/[#*]/g, '').trim();
        const shortDesc = plainDesc ? plainDesc.substring(0, 60) + '...' : 'Premium Modded Experience';

        return `
        <article class="store-card" onclick="decodeAndOpen('${safeName}', '${safeIcon}', '${safeLink}', '${safeDesc}', '${app.id}')" tabindex="0" role="button" aria-label="View ${app.name}">
            <div class="store-icon-wrapper">
                <img src="${app.icon}" class="store-icon" alt="${app.name} icon" loading="lazy" onerror="this.src='https://cdn-icons-png.flaticon.com/512/873/873117.png'">
            </div>
            <div class="store-info">
                <h3 class="store-title">${app.name}</h3>
                <p class="store-desc">${shortDesc}</p>
            </div>
            <div class="store-action">
                <button class="btn-get" aria-label="Get ${app.name}">GET</button>
            </div>
        </article>
    `}).join('');
};

window.decodeAndOpen = (name, icon, link, desc, id) => {
    openAppDetails(decodeURIComponent(name), decodeURIComponent(icon), decodeURIComponent(link), decodeURIComponent(desc), id, true);
};

// --- REDESIGNED APP DETAILS TEMPLATE (App Store Layout) ---
window.openAppDetails = (name, icon, link, desc, id, updateHistory = true) => {
    selectedAppId = id;
    if (updateHistory) window.history.pushState({appId: id}, name, `/${getSlug(name)}`);

    // Dynamic Title & Meta update for SEO
    document.title = `${name} - Download Premium Mod | SmArT AStro HuB`;

    document.getElementById('main-view').style.display = 'none';
    document.getElementById('details-view').style.display = 'block';
    
    const formattedDesc = desc ? desc.split('\n').map(line => {
        if (line.startsWith('###')) return `<h3>${line.replace('###', '').trim()}</h3>`;
        if (line.startsWith('*')) return `<li>${line.replace('*', '').trim()}</li>`;
        if (line.trim() === "") return `<br/>`;
        return `<p>${line}</p>`;
    }).join('') : '<p>Unlock all premium features for the best mobile experience.</p>';

    const isAdmin = auth.currentUser && ADMIN_EMAILS.includes(auth.currentUser.email);

    document.getElementById('dynamic-content').innerHTML = `
        <div class="app-page-wrapper" style="animation: fadeIn 0.4s ease;">
            
            <header class="detail-header">
                <img src="${icon}" alt="${name} logo" class="detail-icon" onerror="this.src='https://cdn-icons-png.flaticon.com/512/873/873117.png'">
                <div class="detail-meta">
                    <h1 class="detail-title">${name}</h1>
                    <p class="detail-publisher">Verified Premium Mod</p>
                    
                    <div>
                        <button id="dl-btn" class="btn-primary">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            Get Application
                        </button>
                        <div id="prog-container" class="progress-box">
                            <div id="prog-bar" class="progress-fill"></div>
                        </div>
                        <p id="dl-status" style="font-size:12px; color:var(--text-secondary); margin-top:8px; display:none;">Connecting to secure server...</p>
                    </div>
                </div>
            </header>

            <div class="detail-stats">
                <div class="stat-item">
                    <span class="stat-val">4.9 ★</span>
                    <span class="stat-lbl">Rating</span>
                </div>
                <div class="stat-item">
                    <span class="stat-val">100%</span>
                    <span class="stat-lbl">Safe</span>
                </div>
                <div class="stat-item">
                    <span class="stat-val">Free</span>
                    <span class="stat-lbl">Price</span>
                </div>
                <div class="stat-item">
                    <span class="stat-val">Android</span>
                    <span class="stat-lbl">Platform</span>
                </div>
            </div>

            <section class="detail-about">
                <h3>About this Mod</h3>
                ${formattedDesc}
            </section>

            ${isAdmin ? 
                `<div class="admin-actions">
                    <button class="btn-outline" onclick="editExistingApp('${id}', '${encodeURIComponent(name)}', '${encodeURIComponent(icon)}', '${encodeURIComponent(link)}', '${encodeURIComponent(desc)}')">✏️ Edit Metadata</button>
                    <button class="btn-outline text-danger" style="border-color: rgba(239, 68, 68, 0.3);" onclick="deleteAppConfirm()">🗑️ Remove App</button>
                </div>` : ''}
        </div>
    `;

    document.getElementById('dl-btn').onclick = () => {
        const adLink = "https://otieu.com/4/10584243";
        document.getElementById('dl-btn').style.display = 'none';
        document.getElementById('prog-container').style.display = 'block';
        document.getElementById('dl-status').style.display = 'block';
        
        let w = 0;
        let itv = setInterval(() => {
            w += 4; // Smoother loader
            document.getElementById('prog-bar').style.width = w+'%';
            if(w >= 100) { 
                clearInterval(itv); 
                window.open(adLink, '_blank');
                setTimeout(() => { window.location.href = link; }, 300);
            }
        }, 120);
    };
    window.scrollTo(0,0);
};

window.editExistingApp = (id, name, icon, link, desc) => {
    document.getElementById('admin-modal').style.display = 'flex';
    document.querySelector('.modal-title').innerText = "Edit App Details";
    
    document.getElementById('new-app-name').value = decodeURIComponent(name);
    document.getElementById('new-app-icon').value = decodeURIComponent(icon);
    document.getElementById('new-app-link').value = decodeURIComponent(link);
    document.getElementById('new-app-desc').value = decodeURIComponent(desc);
    
    const btn = document.querySelector('.btn-primary.w-100');
    btn.innerText = "Save Changes";
    btn.onclick = async () => {
        const uName = document.getElementById('new-app-name').value;
        const uIcon = document.getElementById('new-app-icon').value;
        const uLink = document.getElementById('new-app-link').value;
        const uDesc = document.getElementById('new-app-desc').value;
        
        await updateDoc(doc(db, "apps", id), {
            name: uName, icon: uIcon, link: uLink, description: uDesc
        });
        location.reload();
    };
};

window.deleteAppConfirm = () => {
    if (!selectedAppId) return;
    if (!confirm("Are you sure you want to delete this app from the store?")) return;
    deleteDoc(doc(db, "apps", selectedAppId)).then(() => {
        goBack();
        loadApps();
    }).catch(e => console.error(e));
};

window.goBack = (updateHistory = true) => {
    if (updateHistory) window.history.pushState({}, "SmArT AStro HuB", "/");
    document.title = "SmArT AStro HuB 🚀 | Safe & Verified Premium APKs Store";
    document.getElementById('main-view').style.display = 'block';
    document.getElementById('details-view').style.display = 'none';
};

window.openPrivacy = (updateHistory = true) => {
    if (updateHistory) window.history.pushState({}, "Privacy Policy", "/privacy");
    document.getElementById('main-view').style.display = 'none';
    document.getElementById('details-view').style.display = 'block';
    document.getElementById('dynamic-content').innerHTML = `
        <div class="blur-bg" style="padding:40px; border-radius:var(--radius-lg); max-width: 800px; margin: 0 auto;">
            <h1 style="margin-bottom:20px; font-size: 28px;">🔒 Privacy Policy</h1>
            <p style="color:var(--text-secondary); margin-bottom: 24px;">At SmArT AStro HuB, your privacy is our priority. We do not collect or store unnecessary personal data.</p>
            <button onclick="goBack()" class="btn-outline">Return to Store</button>
        </div>`;
};

window.openTerms = (updateHistory = true) => {
    if (updateHistory) window.history.pushState({}, "Terms of Service", "/terms");
    document.getElementById('main-view').style.display = 'none';
    document.getElementById('details-view').style.display = 'block';
    document.getElementById('dynamic-content').innerHTML = `
        <div class="blur-bg" style="padding:40px; border-radius:var(--radius-lg); max-width: 800px; margin: 0 auto;">
            <h1 style="margin-bottom:20px; font-size: 28px;">📜 Terms of Service</h1>
            <p style="color:var(--text-secondary); margin-bottom: 24px;">Files provided are for educational and testing purposes. Users take full responsibility for app usage.</p>
            <button onclick="goBack()" class="btn-outline">Accept & Return</button>
        </div>`;
};

window.openDMCA = (updateHistory = true) => {
    if (updateHistory) window.history.pushState({}, "DMCA Policy", "/dmca");
    document.getElementById('main-view').style.display = 'none';
    document.getElementById('details-view').style.display = 'block';
    document.getElementById('dynamic-content').innerHTML = `
        <div class="blur-bg" style="padding:40px; border-radius:var(--radius-lg); max-width: 800px; margin: 0 auto;">
            <h1 style="margin-bottom:20px; font-size: 28px;">⚖️ DMCA Copyright</h1>
            <p style="color:var(--text-secondary); margin-bottom: 24px;">We respect intellectual property. If you own the rights to any content here, please contact: <b>a4anandg2@gmail.com</b> for removal.</p>
            <button onclick="goBack()" class="btn-outline">Return</button>
        </div>`;
};

window.addNewApp = async () => {
    const name = document.getElementById('new-app-name').value;
    const icon = document.getElementById('new-app-icon').value;
    const link = document.getElementById('new-app-link').value;
    const desc = document.getElementById('new-app-desc').value;
    if(!name || !link) return alert("App Name and Link are required!");
    await addDoc(collection(db, "apps"), { name, icon, link, description: desc });
    location.reload();
};

window.loginWithGoogle = () => signInWithPopup(auth, new GoogleAuthProvider()).then(() => location.reload());
window.logout = () => signOut(auth).then(() => location.reload());

window.toggleDropdown = (event) => {
    if (event) event.stopPropagation();
    const m = document.getElementById('user-menu');
    m.style.display = (m.style.display === 'block') ? 'none' : 'block';
};

document.addEventListener('click', (event) => {
    const menu = document.getElementById('user-menu');
    const avatar = document.getElementById('user-photo');
    if (menu && avatar && !avatar.contains(event.target) && !menu.contains(event.target)) menu.style.display = 'none';
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
};

window.closeAdmin = () => document.getElementById('admin-modal').style.display = 'none';

loadApps();

window.generateSitemap = () => {
    const baseUrl = "https://astroapkhub.in/";
    const pages = ["privacy", "terms", "dmca"];
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    xml += `  <url><loc>${baseUrl}</loc><priority>1.0</priority></url>\n`;
    pages.forEach(p => { xml += `  <url><loc>${baseUrl}${p}</loc><priority>0.8</priority></url>\n`; });
    allApps.forEach(app => {
        const slug = getSlug(app.name);
        xml += `  <url><loc>${baseUrl}${slug}</loc><priority>0.9</priority></url>\n`;
    });
    xml += `</urlset>`;
    const blob = new Blob([xml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
};