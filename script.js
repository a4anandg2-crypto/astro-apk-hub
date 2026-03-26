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
    
    // Multiple Admin Support Fix
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

// ERROR 2 FIXED: Search Function added
window.filterApps = () => {
    const query = document.getElementById('main-search').value.toLowerCase().trim();
    const filtered = query ? allApps.filter(a => a.name.toLowerCase().includes(query)) : allApps;
    renderApps(filtered);
};

window.renderApps = (data) => {
    const list = document.getElementById('app-list');
    list.innerHTML = data.map(app => {
        // ERROR 1 FIXED: Replaced single quotes so they don't break the onclick HTML
        const safeDesc = encodeURIComponent(app.description || '').replace(/'/g, "%27");
        const safeName = encodeURIComponent(app.name || '').replace(/'/g, "%27");
        const safeIcon = encodeURIComponent(app.icon || '').replace(/'/g, "%27");
        const safeLink = encodeURIComponent(app.link || '').replace(/'/g, "%27");
        
        // ERROR 3 FIXED: Added short description to the card
        const shortDesc = app.description ? app.description.substring(0, 50) + '...' : 'Premium Modded App...';

        return `
        <div class="app-card" onclick="decodeAndOpen('${safeName}', '${safeIcon}', '${safeLink}', '${safeDesc}', '${app.id}')">
            <img src="${app.icon}" class="app-icon" onerror="this.src='https://via.placeholder.com/150'">
            <span class="app-name">${app.name}</span>
            <p style="font-size:12px; color:#9ca3af; margin: 5px 0;">${shortDesc}</p>
            <span style="font-size:10px; color:#f97316; font-weight:bold;">✅ VERIFIED APK</span>
        </div>
    `}).join('');
};

window.decodeAndOpen = (name, icon, link, desc, id) => {
    openAppDetails(decodeURIComponent(name), decodeURIComponent(icon), decodeURIComponent(link), decodeURIComponent(desc), id, true);
};

window.openAppDetails = (name, icon, link, desc, id, updateHistory = true) => {
    selectedAppId = id;
    if (updateHistory) window.history.pushState({appId: id}, name, `/${getSlug(name)}`);

    document.getElementById('main-view').style.display = 'none';
    document.getElementById('details-view').style.display = 'block';
    
    const formattedDesc = desc ? desc.split('\n').map(line => {
        if (line.startsWith('###')) return `<h3 style="color:var(--primary-orange); margin: 25px 0 12px 0; font-size:22px; font-weight:700; border-left:4px solid var(--primary-orange); padding-left:15px;">${line.replace('###', '').trim()}</h3>`;
        if (line.startsWith('*')) return `<li style="margin-left:20px; color:#cbd5e1; margin-bottom:8px; list-style-type: '🚀 '; font-size:16px;">${line.replace('*', '').trim()}</li>`;
        if (line.trim() === "") return `<br/>`;
        return `<p style="margin-bottom:15px; color:#94a3b8; line-height:1.7; font-size:16px;">${line}</p>`;
    }).join('') : '<p>Premium features unlocked for best experience.</p>';

    // Multiple admin button display fix
    const isAdmin = auth.currentUser && ADMIN_EMAILS.includes(auth.currentUser.email);

    document.getElementById('dynamic-content').innerHTML = `
        <div class="app-detail-card" style="max-width:900px; margin: 0 auto; animation: fadeIn 0.5s ease;">
            <div class="glass" style="padding:40px; border-radius:35px; margin-bottom:25px; display:flex; flex-direction:column; align-items:center; text-align:center; position:relative; overflow:hidden;">
                <div style="position:absolute; top:-50px; right:-50px; width:150px; height:150px; background:var(--primary-orange); filter:blur(100px); opacity:0.2;"></div>
                <img src="${icon}" style="width:140px; height:140px; border-radius:30px; border:4px solid var(--primary-orange); box-shadow: 0 20px 40px rgba(0,0,0,0.4); margin-bottom:20px; z-index:1;">
                <h1 style="font-size:38px; font-weight:800; margin-bottom:10px; color:white; letter-spacing:-0.5px;">${name}</h1>
                <div style="display:flex; gap:12px; margin-bottom:25px; flex-wrap:wrap; justify-content:center;">
                    <span style="background:rgba(34, 197, 94, 0.1); color:#22c55e; padding:6px 16px; border-radius:100px; font-size:13px; font-weight:700; border:1px solid rgba(34, 197, 94, 0.3);">✅ VERIFIED SAFE</span>
                    <span style="background:rgba(249, 115, 22, 0.1); color:#f97316; padding:6px 16px; border-radius:100px; font-size:13px; font-weight:700; border:1px solid rgba(249, 115, 22, 0.3);">💎 PREMIUM MOD</span>
                    <span style="background:rgba(139, 92, 246, 0.1); color:#8b5cf6; padding:6px 16px; border-radius:100px; font-size:13px; font-weight:700; border:1px solid rgba(139, 92, 246, 0.3);">⚡ FAST LOAD</span>
                </div>
                <div id="download-box" style="width:100%; max-width:450px; background:rgba(255,255,255,0.03); padding:25px; border-radius:25px; border:1px solid rgba(255,255,255,0.05);">
                    <div id="prog-container" style="display:none; margin-bottom:15px;" class="progress-wrapper">
                        <div id="prog-bar" class="progress-fill"></div>
                        <p style="font-size:12px; margin-top:10px; color:var(--primary-orange);">Connecting to secure server...</p>
                    </div>
                    <button id="dl-btn" class="action-btn" style="width:100%; font-weight:800; letter-spacing:1px; box-shadow: 0 10px 20px rgba(249, 115, 22, 0.3);">
                        📥 DOWNLOAD APK NOW
                    </button>
                    <p style="font-size:12px; color:#64748b; margin-top:12px;">File Size: Optimized | Support: Android 5.0+</p>
                </div>
            </div>
            <div class="glass" style="padding:40px; border-radius:35px; text-align:left;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:20px;">
                    <div style="width:8px; height:25px; background:var(--primary-orange); border-radius:10px;"></div>
                    <h2 style="font-size:24px; font-weight:700;">Application Details</h2>
                </div>
                <div class="description-body" style="border-radius:20px;">
                    ${formattedDesc}
                </div>
                ${isAdmin ? 
                    `<div style="margin-top:40px; padding-top:30px; border-top:1px solid rgba(255,255,255,0.1); display:flex; gap:15px; justify-content:center;">
                        <button onclick="editExistingApp('${id}', '${encodeURIComponent(name)}', '${encodeURIComponent(icon)}', '${encodeURIComponent(link)}', '${encodeURIComponent(desc)}')" style="background:#f97316; color:white; border:none; padding:12px 25px; border-radius:15px; font-weight:700; cursor:pointer;">✏️ Edit Mod</button>
                        <button onclick="deleteAppConfirm()" style="background:rgba(239, 68, 68, 0.1); color:#ef4444; border:1px solid #ef4444; padding:12px 25px; border-radius:15px; font-weight:700; cursor:pointer;">🗑️ Delete</button>
                    </div>` : ''}
            </div>
        </div>
    `;

    document.getElementById('dl-btn').onclick = () => {
        const adLink = "https://otieu.com/4/10584243";
        document.getElementById('dl-btn').style.display = 'none';
        document.getElementById('prog-container').style.display = 'block';
        let w = 0;
        let itv = setInterval(() => {
            w += 5;
            document.getElementById('prog-bar').style.width = w+'%';
            if(w >= 100) { 
                clearInterval(itv); 
                window.open(adLink, '_blank');
                setTimeout(() => { window.location.href = link; }, 300);
            }
        }, 150);
    };
    window.scrollTo(0,0);
};

window.editExistingApp = (id, name, icon, link, desc) => {
    document.getElementById('admin-modal').style.display = 'flex';
    document.querySelector('#admin-modal h2').innerText = "Edit App Details";
    
    document.getElementById('new-app-name').value = decodeURIComponent(name);
    document.getElementById('new-app-icon').value = decodeURIComponent(icon);
    document.getElementById('new-app-link').value = decodeURIComponent(link);
    document.getElementById('new-app-desc').value = decodeURIComponent(desc);
    
    const btn = document.querySelector('#admin-modal .action-btn');
    btn.innerText = "SAVE CHANGES";
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
    if (!confirm("Delete this app from the database?")) return;
    deleteDoc(doc(db, "apps", selectedAppId)).then(() => {
        goBack();
        loadApps();
    }).catch(e => console.error(e));
};

window.goBack = (updateHistory = true) => {
    if (updateHistory) window.history.pushState({}, "SmArT  AStro HuB", "/");
    document.getElementById('main-view').style.display = 'block';
    document.getElementById('details-view').style.display = 'none';
};

window.openPrivacy = (updateHistory = true) => {
    if (updateHistory) window.history.pushState({}, "Privacy Policy", "/privacy");
    document.getElementById('main-view').style.display = 'none';
    document.getElementById('details-view').style.display = 'block';
    document.getElementById('dynamic-content').innerHTML = `
        <div class="glass" style="padding:30px; border-radius:20px; text-align:left; line-height:1.6;">
            <h1 style="color:#f97316; font-size:28px; margin-bottom:15px; text-align:center;">🔒 Privacy & Safety</h1>
            <p style="color:#eee; margin-bottom:20px; text-align:center;">Welcome to <b>SmArT  AStro HuB</b>!</p>
            <div style="margin-bottom:15px;"><h3 style="color:#8b5cf6;">1. We Respect Your Privacy</h3><ul style="color:#ccc; padding-left:20px;"><li>We don't ask for your personal info.</li></ul></div>
            <button onclick="goBack()" class="action-btn" style="max-width:150px; margin-top:20px; display:block; margin-left:auto; margin-right:auto;">I Understand</button>
        </div>`;
};

window.openTerms = (updateHistory = true) => {
    if (updateHistory) window.history.pushState({}, "Terms & Conditions", "/terms");
    document.getElementById('main-view').style.display = 'none';
    document.getElementById('details-view').style.display = 'block';
    document.getElementById('dynamic-content').innerHTML = `
        <div class="glass" style="padding:30px; border-radius:20px; text-align:left; line-height:1.6;">
            <h1 style="color:#f97316; font-size:28px; margin-bottom:15px; text-align:center;">📜 Terms & Conditions</h1>
            <p style="color:#eee; margin-bottom:20px; text-align:center;">By using <b>SmArT  AStro HuB</b>, you agree to follow these simple rules.</p>
            <div style="margin-bottom:15px;"><h3 style="color:#8b5cf6;">1. Educational Purpose Only</h3><ul style="color:#ccc; padding-left:20px;"><li>Everything we share here is for testing purposes only.</li></ul></div>
            <button onclick="goBack()" class="action-btn" style="max-width:150px; margin-top:20px; display:block; margin-left:auto; margin-right:auto;">Accept Rules</button>
        </div>`;
};

window.openDMCA = (updateHistory = true) => {
    if (updateHistory) window.history.pushState({}, "DMCA Policy", "/dmca");
    document.getElementById('main-view').style.display = 'none';
    document.getElementById('details-view').style.display = 'block';
    document.getElementById('dynamic-content').innerHTML = `
        <div class="glass" style="padding:30px; border-radius:20px; text-align:left; line-height:1.6;">
            <h1 style="color:#f97316; font-size:28px; text-align:center; margin-bottom:15px;">⚖️ Copyright DMCA</h1>
            <p style="color:#eee; margin-bottom:15px;">At <b>SmArT  AStro HuB</b>, we respect original creators.</p>
            <h3 style="color:#8b5cf6;">Contact</h3><p style="color:#ccc;">Email us at: <b>a4anandg2@gmail.com</b></p>
            <button onclick="goBack()" class="action-btn" style="max-width:150px; margin-top:20px; display:block; margin: 0 auto;">Close</button>
        </div>`;
};

window.addNewApp = async () => {
    const name = document.getElementById('new-app-name').value;
    const icon = document.getElementById('new-app-icon').value;
    const link = document.getElementById('new-app-link').value;
    const desc = document.getElementById('new-app-desc').value;
    if(!name || !link) return alert("Fill Name & Link!");
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
window.openAdminPanel = () => { document.getElementById('admin-modal').style.display = 'flex'; };
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