import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
// Naya admin update kar diya gaya hai
const ADMIN_EMAILS = ["a4anandg2@gmail.com", "per149209@gmail.com"];
let isAdmin = false;

// --- Firebase Auth & Admin Check ---
onAuthStateChanged(auth, (user) => {
    const adminBtn = document.getElementById('admin-btn');
    if (user && ADMIN_EMAILS.includes(user.email)) {
        isAdmin = true;
        if(adminBtn) adminBtn.style.display = 'block';
    } else {
        isAdmin = false;
        if(adminBtn) adminBtn.style.display = 'none';
    }
    loadApps();
});

window.adminLogin = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(err => console.error("Login Failed:", err));
};

window.adminLogout = () => {
    signOut(auth).then(() => { isAdmin = false; location.reload(); });
};

window.openAdminPanel = () => { 
    const modal = document.getElementById('admin-modal');
    if(modal) modal.style.display = 'flex'; 
};

window.closeAdmin = () => { 
    const modal = document.getElementById('admin-modal');
    if(modal) modal.style.display = 'none'; 
};

// --- Firestore CRUD (Dynamic App Loading) ---
async function loadApps() {
    try {
        const querySnapshot = await getDocs(collection(db, "apps"));
        allApps = [];
        querySnapshot.forEach((docSnap) => {
            allApps.push({ id: docSnap.id, ...docSnap.data() });
        });
        renderApps(allApps);
    } catch (error) {
        console.error("Error loading apps:", error);
    }
}

function renderApps(apps) {
    const container = document.getElementById("apps-container");
    if (!container) return;
    container.innerHTML = "";
    
    apps.forEach(app => {
        // Naye design ke classes use kiye gaye hain
        const card = document.createElement('div');
        card.className = 'featured-card app-card'; 
        
        let adminControls = isAdmin ? `
            <button onclick="deleteApp('${app.id}')" style="background:red; color:white; border:none; padding:8px; border-radius:5px; margin-top:10px; cursor:pointer; width:100%; font-weight:bold; z-index: 10;">Delete App</button>
        ` : '';

        card.innerHTML = `
            <img src="${app.icon}" alt="${app.name}" class="featured-icon app-icon" loading="lazy">
            <div class="featured-info">
                <h3>${app.name}</h3>
                <p>${app.desc ? app.desc.substring(0, 60) + '...' : ''}</p>
                <a href="${app.link}" target="_blank" class="action-btn" style="text-decoration:none; display:block; text-align:center; margin-top:15px; z-index: 10; position: relative;">Download</a>
                ${adminControls}
            </div>
        `;
        container.appendChild(card);
    });
}

window.addNewApp = async () => {
    if (!isAdmin) return alert("Admin access required!");
    
    const name = document.getElementById("new-app-name").value;
    const icon = document.getElementById("new-app-icon").value;
    const link = document.getElementById("new-app-link").value;
    const desc = document.getElementById("new-app-desc").value;

    if (!name || !link) return alert("App Name and Download Link are mandatory!");

    try {
        await addDoc(collection(db, "apps"), { name, icon, link, desc, timestamp: Date.now() });
        alert("App published successfully! 🚀");
        document.getElementById("new-app-name").value = '';
        document.getElementById("new-app-icon").value = '';
        document.getElementById("new-app-link").value = '';
        document.getElementById("new-app-desc").value = '';
        closeAdmin();
        loadApps();
    } catch (e) {
        console.error("Error publishing app: ", e);
    }
};

window.deleteApp = async (id) => {
    if (!isAdmin) return;
    if (confirm("Are you sure you want to delete this app?")) {
        try {
            await deleteDoc(doc(db, "apps", id));
            loadApps();
        } catch (error) {
            console.error("Error deleting app: ", error);
        }
    }
};

// --- Search Functionality ---
const searchInput = document.getElementById('search-input');
if(searchInput) {
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allApps.filter(app => app.name.toLowerCase().includes(term));
        renderApps(filtered);
    });
}

// --- UI & Visual Features (Stars & Ripple) ---
function generateStars() {
    const container = document.getElementById("stars-container");
    if(!container) return;
    for (let i = 0; i < 100; i++) {
        const star = document.createElement("div");
        star.className = "star";
        star.style.width = star.style.height = Math.random() * 3 + "px";
        star.style.top = Math.random() * 100 + "%";
        star.style.left = Math.random() * 100 + "%";
        star.style.animationDuration = (Math.random() * 3 + 2) + "s";
        container.appendChild(star);
    }
}

document.addEventListener("click", (e) => {
    const card = e.target.closest(".app-card, .featured-card");
    if (!card) return;
    const ripple = document.createElement("span");
    const rect = card.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `
        position:absolute; width:${size}px; height:${size}px;
        left:${e.clientX - rect.left - size/2}px; top:${e.clientY - rect.top - size/2}px;
        background:rgba(0,212,255,0.12); border-radius:50%;
        pointer-events:none; transform:scale(0);
        animation:rippleAnim 0.5s ease forwards; z-index:99;
    `;
    card.style.position = "relative";
    card.style.overflow = "hidden";
    card.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
});

if (!document.getElementById("rippleStyle")) {
    const s = document.createElement("style");
    s.id = "rippleStyle";
    s.textContent = `@keyframes rippleAnim { to { transform:scale(2.5); opacity:0; } }`;
    document.head.appendChild(s);
}

// --- Sitemap Generator ---
window.generateSitemap = () => {
    const baseUrl = "https://astroapkhub.in/";
    const pages = ["privacy", "terms", "dmca"];
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    xml += `  <url><loc>${baseUrl}</loc><priority>1.0</priority></url>\n`;
    pages.forEach(p => { xml += `  <url><loc>${baseUrl}${p}</loc><priority>0.8</priority></url>\n`; });
    allApps.forEach(app => {
        xml += `  <url><loc>${baseUrl}?app=${app.id}</loc><priority>0.9</priority></url>\n`;
    });
    xml += `</urlset>`;
    console.log(xml);
    alert("Sitemap browser console mein generate ho gaya hai. Wahan se copy kar lijiye.");
};

// Initialize UI
document.addEventListener("DOMContentLoaded", () => {
    generateStars();
});