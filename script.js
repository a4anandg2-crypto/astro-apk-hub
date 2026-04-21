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

const FALLBACK_ICON = "https://cdn-icons-png.flaticon.com/512/873/873117.png";
const APP_HOME_TITLE = "SmArT AStro HuB | Safe & Verified Premium APK Store";
const ADMIN_EMAILS = ["a4anandg2@gmail.com", "per149209@gmail.com"];

let allApps = [];
let selectedAppId = null;
let currentCategory = "All";

const getSlug = (text) => String(text || "").toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
const normalizePath = (path) => { try { return decodeURIComponent(path).replace(/^\/+|\/+$/g, ""); } catch (_) { return String(path || "").replace(/^\/+|\/+$/g, ""); } };
const isAdminUser = (user) => Boolean(user && ADMIN_EMAILS.includes(user.email));
const assertAdmin = () => { if (isAdminUser(auth.currentUser)) return true; alert("Admin access required."); return false; };
const safeUrl = (value, fallback = "") => { const raw = String(value || "").trim(); if (!raw) return fallback; try { const parsed = new URL(raw, window.location.origin); return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : fallback; } catch (_) { return fallback; } };
const createEl = (tag, className, text) => { const el = document.createElement(tag); if (className) el.className = className; if (text !== undefined) el.textContent = text; return el; };
const applyImageFallback = (img) => { img.onerror = null; img.src = FALLBACK_ICON; };

const resetAdminForm = () => {
    ["new-app-name", "new-app-icon", "new-app-link", "new-app-desc", "new-app-rating", "new-app-size"].forEach(id => {
        document.getElementById(id).value = "";
    });
    document.getElementById("new-app-category").value = "Tools";
};

const setPageTitle = (title) => { document.title = title; };

const buildPageView = (title, body) => `
    <div class="blur-bg" style="padding:50px; border-radius:var(--radius-lg); max-width: 900px; margin: 0 auto; border: 1px solid var(--accent-purple);">
        <h1 class="gradient-text cosmic-glow" style="margin-bottom:25px; font-size: 36px;">${title}</h1>
        <div style="color:var(--text-secondary); margin-bottom: 30px; font-size: 16px; line-height: 1.8;">${body}</div>
    </div>
`;

const appendDescription = (container, desc) => {
    const normalized = String(desc || "").replace(/\r\n/g, "\n").trim();
    if (!normalized) { container.appendChild(createEl("p", "", "Unlock premium features for the ultimate experience.")); return; }
    let list = null;
    normalized.split("\n").forEach((rawLine) => {
        const line = rawLine.trim();
        if (!line) { list = null; return; }
        if (line.startsWith("###")) { list = null; const heading = line.replace(/^###\s*/, ""); if (heading) container.appendChild(createEl("h3", "", heading)); return; }
        if (line.startsWith("*")) { if (!list) { list = createEl("ul"); container.appendChild(list); } const item = line.replace(/^\*\s*/, ""); if (item) list.appendChild(createEl("li", "", item)); return; }
        list = null; container.appendChild(createEl("p", "", line));
    });
};

onAuthStateChanged(auth, (user) => {
    const adminDiv = document.getElementById("admin-controls");
    const guestDiv = document.getElementById("guest-controls");
    const userPhoto = document.getElementById("user-photo");
    const isAdmin = isAdminUser(user);
    if (adminDiv) adminDiv.style.display = isAdmin ? "block" : "none";
    if (guestDiv) guestDiv.style.display = isAdmin ? "none" : "block";
    if (userPhoto) userPhoto.src = user?.photoURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
});

async function loadApps() {
    try {
        const snap = await getDocs(collection(db, "apps"));
        allApps = snap.docs.map((d) => ({ id: d.id, category: "Tools", rating: "4.8", size: "Unknown", ...d.data() }));
        window.filterApps();
        checkUrlAndRoute();
    } catch (e) { console.error(e); }
}

window.onpopstate = () => checkUrlAndRoute();

const checkUrlAndRoute = () => {
    const path = normalizePath(window.location.pathname);
    if (!path || path === "index.html") return window.goHome(false);
    if (path === "privacy") return window.openPrivacy(null, false);
    if (path === "terms") return window.openTerms(null, false);
    if (path === "dmca") return window.openDMCA(null, false);
    if (path === "about") return window.openAbout(false);
    if (path === "contact") return window.openContact(false);
    if (path === "categories") return window.openCategories(false);

    const foundApp = allApps.find((a) => getSlug(a.name) === path);
    if (foundApp) { openAppDetails(foundApp, false); } else { window.goHome(false); }
};

window.setCategoryFilter = (cat, el) => {
    currentCategory = cat;
    document.querySelectorAll(".cat-chip").forEach(c => c.classList.remove("active"));
    if (el) el.classList.add("active");
    window.filterApps();
};

window.filterApps = () => {
    const query = document.getElementById("main-search").value.toLowerCase().trim();
    let filtered = allApps;
    if (currentCategory !== "All") {
        filtered = filtered.filter(a => a.category === currentCategory);
    }
    if (query) {
        filtered = filtered.filter((a) => String(a.name || "").toLowerCase().includes(query));
    }
    renderApps(filtered);
};

window.renderApps = (data) => {
    const list = document.getElementById("app-list");
    list.replaceChildren();
    if (data.length === 0) {
        const emptyState = createEl("p", "", "No apps found in this sector of the cosmos.");
        emptyState.style.cssText = "color: var(--text-secondary); text-align: center; grid-column: 1/-1; padding: 40px 0; font-size: 16px;";
        list.appendChild(emptyState);
        return;
    }
    const cards = data.map((appItem) => {
        const appName = String(appItem.name || "Untitled App");
        const plainDesc = String(appItem.description || "").replace(/[#*]/g, "").replace(/\s+/g, " ").trim();
        const shortDesc = plainDesc ? `${plainDesc.slice(0, 65)}${plainDesc.length > 65 ? "..." : ""}` : "Premium modded experience";
        
        const article = createEl("article", "store-card");
        article.tabIndex = 0; article.setAttribute("role", "button"); article.setAttribute("aria-label", `View ${appName}`);
        article.addEventListener("click", () => openAppDetails(appItem, true));
        article.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openAppDetails(appItem, true); }});
        
        const iconWrapper = createEl("div", "store-icon-wrapper");
        const img = createEl("img", "store-icon");
        img.src = safeUrl(appItem.icon, FALLBACK_ICON); img.alt = appName; img.loading = "lazy"; img.onerror = () => applyImageFallback(img);
        iconWrapper.appendChild(img);
        
        const info = createEl("div", "store-info");
        info.appendChild(createEl("h3", "store-title", appName));
        
        const meta = createEl("div", "store-meta");
        const rateChip = createEl("span", "meta-chip");
        rateChip.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="#00f3ff" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> ${appItem.rating || "4.8"}`;
        const sizeChip = createEl("span", "meta-chip", appItem.size || "VARIES");
        meta.append(rateChip, sizeChip);
        
        info.appendChild(meta);
        info.appendChild(createEl("p", "store-desc", shortDesc));
        
        const action = createEl("div", "store-action");
        const button = createEl("button", "btn-get", "GET"); button.type = "button";
        action.appendChild(button);
        article.append(iconWrapper, info, action);
        return article;
    });
    list.append(...cards);
};

const hideAllViews = () => {
    document.getElementById("main-view").style.display = "none";
    document.getElementById("details-view").style.display = "none";
    document.getElementById("page-view").style.display = "none";
};

window.goHome = (updateHistory = true) => {
    selectedAppId = null;
    if (updateHistory) window.history.pushState({}, APP_HOME_TITLE, "/");
    setPageTitle(APP_HOME_TITLE);
    hideAllViews();
    document.getElementById("main-view").style.display = "block";
    window.scrollTo(0, 0);
};

window.goBack = () => window.goHome();

window.openCategories = (updateHistory = true) => {
    if (updateHistory) window.history.pushState({}, "Categories", "/categories");
    setPageTitle("Categories | SmArT AStro HuB");
    hideAllViews();
    document.getElementById("main-view").style.display = "block";
    document.getElementById("main-search").focus();
    window.scrollTo(0, 0);
};

window.openPage = (path, title, content, updateHistory = true) => {
    if (updateHistory) window.history.pushState({}, title, `/${path}`);
    setPageTitle(`${title} | SmArT AStro HuB`);
    hideAllViews();
    document.getElementById("page-view").style.display = "block";
    document.getElementById("static-content").innerHTML = buildPageView(title, content);
    window.scrollTo(0, 0);
};

window.openAbout = (updateHistory = true) => window.openPage("about", "About Us", "<p>Welcome to <strong>SmArT AStro HuB</strong>. We are a passionate team dedicated to delivering the safest, fastest, and most reliable premium APK modifications across the digital cosmos.</p><p>Our infrastructure is built for speed and security, ensuring every application meets strict verification protocols before launch.</p>", updateHistory);
window.openContact = (e, updateHistory = true) => { if (e) e.preventDefault(); window.openPage("contact", "Contact Command", "<p>Encountered a black hole? Need a specific mod? Reach out to our command center.</p><p>Email: <a href='mailto:a4anandg2@gmail.com' style='color:var(--accent-neon)'>a4anandg2@gmail.com</a></p><p>Telegram: <a href='https://t.me/+IQLcSRo_2y5mZGVl' style='color:var(--accent-neon)'>Astro Community</a></p>", updateHistory); };
window.openPrivacy = (e, updateHistory = true) => { if (e) e.preventDefault(); window.openPage("privacy", "Privacy Protocol", "<p>Your coordinates and personal data remain strictly confidential. We deploy advanced encryption and do not harvest unnecessary telemetry data.</p>", updateHistory); };
window.openTerms = (e, updateHistory = true) => { if (e) e.preventDefault(); window.openPage("terms", "Terms of Engagement", "<p>All files provided within the Hub are for educational exploration and testing. Pilots assume full responsibility for their device's trajectory.</p>", updateHistory); };
window.openDMCA = (e, updateHistory = true) => { if (e) e.preventDefault(); window.openPage("dmca", "DMCA Copyright", "<p>We respect intellectual property. If you own the rights to any artifact in our database, transmit a takedown request to our command email.</p>", updateHistory); };

window.openAppDetails = (appItem, updateHistory = true) => {
    const { id, name, icon, link, description, rating, size, category } = appItem;
    selectedAppId = id;
    if (updateHistory) window.history.pushState({ appId: id }, name, `/${getSlug(name)}`);
    setPageTitle(`${name} Premium Mod | SmArT AStro HuB`);
    hideAllViews();
    document.getElementById("details-view").style.display = "block";
    
    const dynamicContent = document.getElementById("dynamic-content");
    dynamicContent.replaceChildren();
    
    const header = createEl("header", "detail-header");
    const detailIcon = createEl("img", "detail-icon"); detailIcon.src = safeUrl(icon, FALLBACK_ICON); detailIcon.alt = name; detailIcon.onerror = () => applyImageFallback(detailIcon);
    
    const detailMeta = createEl("div", "detail-meta");
    detailMeta.appendChild(createEl("h1", "detail-title gradient-text", name));
    detailMeta.appendChild(createEl("p", "detail-publisher", category || "Verified Premium Mod"));
    
    const ctaWrap = createEl("div");
    const dlBtn = createEl("button", "btn-primary cosmic-shadow", "Initialize Download"); dlBtn.type = "button";
    const progressBox = createEl("div", "progress-box"); const progressBar = createEl("div", "progress-fill"); progressBox.appendChild(progressBar);
    const dlStatus = createEl("p", "", "Establishing secure connection..."); dlStatus.style.cssText = "font-size: 13px; color: var(--accent-neon); margin-top: 10px; display: none; font-weight: 500;";
    
    ctaWrap.append(dlBtn, progressBox, dlStatus);
    detailMeta.appendChild(ctaWrap);
    header.append(detailIcon, detailMeta);
    
    const stats = createEl("div", "detail-stats");
    [["⭐ " + (rating || "4.8"), "Rating"], [size || "VARIES", "Size"], ["100%", "Safe"], ["Free", "Access"]].forEach(([value, label]) => {
        const item = createEl("div", "stat-item");
        item.appendChild(createEl("span", "stat-val", value));
        item.appendChild(createEl("span", "stat-lbl", label));
        stats.appendChild(item);
    });
    
    const about = createEl("section", "detail-about");
    about.appendChild(createEl("h3", "", "Transmission Data"));
    appendDescription(about, description);
    
    dynamicContent.append(header, stats, about);
    
    if (isAdminUser(auth.currentUser)) {
        const adminActions = createEl("div", "admin-actions");
        const editButton = createEl("button", "btn-outline", "Edit Metadata"); editButton.type = "button"; editButton.onclick = () => editExistingApp(appItem);
        const deleteButton = createEl("button", "btn-outline text-danger", "Purge from Hub"); deleteButton.type = "button"; deleteButton.style.borderColor = "var(--danger)"; deleteButton.onclick = () => deleteAppConfirm();
        adminActions.append(editButton, deleteButton);
        dynamicContent.appendChild(adminActions);
    }
    
    dlBtn.onclick = () => {
        const safeDownloadLink = safeUrl(link);
        if (!safeDownloadLink) { alert("Invalid hyperspace link."); return; }
        const adLink = "https://otieu.com/4/10584243";
        dlBtn.style.display = "none"; progressBox.style.display = "block"; dlStatus.style.display = "block";
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5; progressBar.style.width = `${progress}%`;
            if (progress >= 100) { clearInterval(interval); window.open(adLink, "_blank", "noopener,noreferrer"); setTimeout(() => window.location.href = safeDownloadLink, 400); }
        }, 100);
    };
    window.scrollTo(0, 0);
};

window.editExistingApp = (appItem) => {
    if (!assertAdmin()) return;
    document.getElementById("admin-modal").style.display = "flex";
    document.querySelector(".modal-title").innerText = "Edit Configuration";
    document.getElementById("new-app-name").value = appItem.name || "";
    document.getElementById("new-app-icon").value = appItem.icon || "";
    document.getElementById("new-app-link").value = appItem.link || "";
    document.getElementById("new-app-desc").value = appItem.description || "";
    document.getElementById("new-app-rating").value = appItem.rating || "";
    document.getElementById("new-app-size").value = appItem.size || "";
    document.getElementById("new-app-category").value = appItem.category || "Tools";
    
    const button = document.querySelector(".btn-primary.w-100");
    button.innerText = "Save Coordinates";
    button.onclick = async () => {
        if (!assertAdmin()) return;
        const uName = document.getElementById("new-app-name").value.trim();
        const uLink = document.getElementById("new-app-link").value.trim();
        if (!uName || !uLink) { alert("Name and Link required."); return; }
        await updateDoc(doc(db, "apps", appItem.id), {
            name: uName, icon: document.getElementById("new-app-icon").value.trim(), link: uLink,
            description: document.getElementById("new-app-desc").value,
            rating: document.getElementById("new-app-rating").value.trim() || "4.8",
            size: document.getElementById("new-app-size").value.trim() || "VARIES",
            category: document.getElementById("new-app-category").value
        });
        location.reload();
    };
};

window.deleteAppConfirm = () => {
    if (!assertAdmin() || !selectedAppId) return;
    if (!confirm("Initiate permanent purge sequence?")) return;
    deleteDoc(doc(db, "apps", selectedAppId)).then(() => { window.goHome(); loadApps(); }).catch(console.error);
};

window.addNewApp = async () => {
    if (!assertAdmin()) return;
    const name = document.getElementById("new-app-name").value.trim();
    const link = document.getElementById("new-app-link").value.trim();
    if (!name || !link) { alert("Name and Link required."); return; }
    await addDoc(collection(db, "apps"), {
        name, link,
        icon: document.getElementById("new-app-icon").value.trim(),
        description: document.getElementById("new-app-desc").value,
        rating: document.getElementById("new-app-rating").value.trim() || "4.8",
        size: document.getElementById("new-app-size").value.trim() || "VARIES",
        category: document.getElementById("new-app-category").value
    });
    location.reload();
};

window.loginWithGoogle = () => signInWithPopup(auth, new GoogleAuthProvider()).then(() => location.reload());
window.logout = () => signOut(auth).then(() => location.reload());

window.toggleDropdown = (e) => { if (e) e.stopPropagation(); const m = document.getElementById("user-menu"); m.style.display = m.style.display === "block" ? "none" : "block"; };
document.addEventListener("click", (e) => { const m = document.getElementById("user-menu"), a = document.getElementById("user-photo"); if (m && a && !a.contains(e.target) && !m.contains(e.target)) m.style.display = "none"; });

window.openAdminPanel = () => {
    if (!assertAdmin()) return;
    document.getElementById("admin-modal").style.display = "flex";
    document.querySelector(".modal-title").innerText = "Publish App";
    const b = document.querySelector(".btn-primary.w-100"); b.innerText = "Deploy to Hub"; b.onclick = window.addNewApp;
    resetAdminForm();
};
window.closeAdmin = () => document.getElementById("admin-modal").style.display = "none";

window.downloadSitemapPreview = () => {
    if (!assertAdmin()) return;
    const baseUrl = "https://astroapkhub.in/";
    const pages = ["privacy", "terms", "dmca", "about", "contact", "categories"];
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    xml += `  <url><loc>${baseUrl}</loc><priority>1.0</priority></url>\n`;
    pages.forEach(p => xml += `  <url><loc>${baseUrl}${p}</loc><priority>0.8</priority></url>\n`);
    allApps.forEach(a => xml += `  <url><loc>${baseUrl}${getSlug(a.name)}</loc><priority>0.9</priority></url>\n`);
    xml += "</urlset>";
    const blob = new Blob([xml], { type: "text/xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = "sitemap.xml"; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};

window.generateRobotsTxt = () => {
    const text = `User-agent: *\nAllow: /\nSitemap: https://astroapkhub.in/sitemap.xml`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = "robots.txt"; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};

loadApps();