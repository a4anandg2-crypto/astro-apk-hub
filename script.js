import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
    // Ab ye check karega ki user ki email list mein hai ya nahi
    const isAdmin = user && ADMIN_EMAILS.includes(user.email);
    
    document.getElementById('admin-controls').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('guest-controls').style.display = isAdmin ? 'none' : 'block';
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

window.renderApps = (data) => {
    const list = document.getElementById('app-list');
    list.innerHTML = data.map(app => {
        const safeDesc = encodeURIComponent(app.description || '');
        const safeName = encodeURIComponent(app.name);
        const safeIcon = encodeURIComponent(app.icon);
        const safeLink = encodeURIComponent(app.link);

        return `
        <div class="app-card" onclick="decodeAndOpen('${safeName}', '${safeIcon}', '${safeLink}', '${safeDesc}', '${app.id}')">
            <img src="${app.icon}" class="app-icon" onerror="this.src='https://via.placeholder.com/150'">
            <span class="app-name">${app.name}</span>
            <span style="font-size:10px; color:#f97316; font-weight:bold;">VERIFIED APK</span>
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
                ${auth.currentUser?.email === ADMIN_EMAIL ? 
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
            <p style="color:#eee; margin-bottom:20px; text-align:center;">Welcome to <b>SmArT  AStro HuB</b>! We want you to feel safe while downloading your favorite apps.</p>
            <div style="margin-bottom:15px;"><h3 style="color:#8b5cf6;">1. We Respect Your Privacy</h3><ul style="color:#ccc; padding-left:20px;"><li>We don't ask for your name, phone number, address or any other things to download apps.</li><li>If you are just a visitor, we don't collect any personal secrets about you.</li></ul></div>
            <div style="margin-bottom:15px;"><h3 style="color:#8b5cf6;">2. About Mod Apps (Important!)</h3><ul style="color:#ccc; padding-left:20px;"><li>We share Mod APKs so you can enjoy premium features for free.</li><li><b>Please Note:</b> These Mods are made by other developers, not by us.</li><li>We find these mods on the internet and share them with you. Because we didn't make them, we cannot give a 100% guarantee of how they work.</li></ul></div>
            <div style="margin-bottom:15px;"><h3 style="color:#ef4444;">3. Use at Your Own Risk</h3><ul style="color:#ccc; padding-left:20px;"><li>If a Mod app causes any problem with your phone, game account ban, or anything happens, <b>SmArT  AStro HuB will not be responsible</b>.</li><li>We recommend using Mods on a "guest account" or a secondary phone for extra safety.</li></ul></div>
            <div style="margin-bottom:15px;"><h3 style="color:#8b5cf6;">4. We Also Provide Original Apps</h3><ul style="color:#ccc; padding-left:20px;"><li>For your 100% safety, we also provide Official/Original APKs.</li><li>These original files are untouched and come directly from safe sources.</li></ul></div>
            <div style="margin-bottom:15px;"><h3 style="color:#8b5cf6;">5. Links to Other Places</h3><ul style="color:#ccc; padding-left:20px;"><li>Sometimes you will see links to Telegram or other download websites.</li><li>Once you click those links and leave our site, we don't have control over what happens there. Please be careful on other websites.</li></ul></div>
            <div style="margin-top:20px; border-top: 1px solid #333; padding-top:10px;"><p style="font-size:13px; color:#9ca3af;"><b>Consent:</b> By using SmArT  AStro HuB, you agree that you understand these points and you are okay with the risks of using Mod apps.</p></div>
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
            <p style="color:#eee; margin-bottom:20px; text-align:center;">By using <b>SmArT  AStro HuB</b>, you agree to follow these simple rules. If you don't agree, please do not use our website.</p>
            <div style="margin-bottom:15px;"><h3 style="color:#8b5cf6;">1. Educational Purpose Only</h3><ul style="color:#ccc; padding-left:20px;"><li>Everything we share here (Apps and Mods) is for learning and testing purposes only.</li><li>We want users to see how premium features work before they buy official subscriptions.</li></ul></div>
            <div style="margin-bottom:15px;"><h3 style="color:#8b5cf6;">2. Respect Original Creators</h3><ul style="color:#ccc; padding-left:20px;"><li>We do not own any of these apps. All rights and credit go to the original developers.</li><li>If you like an app, we always suggest you download it from the official store to support the creators.</li></ul></div>
            <div style="margin-bottom:15px;"><h3 style="color:#ef4444;">3. No Guarantee</h3><ul style="color:#ccc; padding-left:20px;"><li>We try our best to provide working files, but we cannot promise that every app will work on every phone.</li><li>Apps are provided "as is" – meaning we don't change them ourselves.</li></ul></div>
            <div style="margin-bottom:15px;"><h3 style="color:#8b5cf6;">4. Fair Use</h3><ul style="color:#ccc; padding-left:20px;"><li>You agree not to use our website for any illegal activities.</li><li>You are responsible for any app you download and how you use it on your device.</li></ul></div>
            <div style="margin-bottom:15px;"><h3 style="color:#8b5cf6;">5. Changes to Site</h3><ul style="color:#ccc; padding-left:20px;"><li>We can add, remove, or update any app or rule on this site at any time without asking anyone.</li></ul></div>
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
            <p style="color:#eee; margin-bottom:15px;">At <b>SmArT  AStro HuB</b>, we respect the hard work of original creators and copyright owners. We do not want to keep any file on our site that breaks copyright laws.</p>
            <h3 style="color:#8b5cf6;">1. Notice to Copyright Owners</h3><p style="color:#ccc;">• All the apps and files shared on this website are collected from different places on the internet.<br>• We do not host these files on our own main server in most cases; we only provide links.</p>
            <h3 style="color:#8b5cf6; margin-top:15px;">2. How to Request Removal?</h3><p style="color:#ccc;">• If you are the owner of an app and you don't want it to be on our site, please don't strike us directly.<br>• Just send us a simple email at: <b>a4anandg2@gmail.com</b>.</p>
            <h3 style="color:#8b5cf6; margin-top:15px;">3. What to Include in Your Email?</h3><p style="color:#ccc;">• Your name and the name of your app.<br>• The link to the page on our site where your app is listed.<br>• Proof that you are the real owner.</p>
            <h3 style="color:#ef4444; margin-top:15px;">4. Our Action</h3><p style="color:#ccc;">• Once we get your email and verify it, we will remove the requested content within <b>24 to 48 hours</b>. We believe in peaceful cooperation with developers.</p>
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