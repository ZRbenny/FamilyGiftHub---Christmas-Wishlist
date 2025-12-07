const API_BASE_URL = "http://localhost:5001/api";

let currentUser = null;
let currentFamily = null;

async function api(path, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers
    });

    const text = await response.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new Error(data.error || data.message || 'Request failed');
    }

    return data;
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId + 'Section').classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-section="${sectionId}"]`);
    if (activeBtn) activeBtn.classList.add('active');
}

function showError(message, elementId = 'authError') {
    const errorEl = document.getElementById(elementId);
    errorEl.textContent = message;
    errorEl.classList.add('show');
    setTimeout(() => {
        errorEl.classList.remove('show');
    }, 5000);
}

document.getElementById('joinTab').addEventListener('click', () => {
    document.getElementById('joinTab').classList.add('active');
    document.getElementById('createTab').classList.remove('active');
    document.getElementById('joinForm').style.display = 'block';
    document.getElementById('createForm').style.display = 'none';
});

document.getElementById('createTab').addEventListener('click', () => {
    document.getElementById('createTab').classList.add('active');
    document.getElementById('joinTab').classList.remove('active');
    document.getElementById('createForm').style.display = 'block';
    document.getElementById('joinForm').style.display = 'none';
});

document.getElementById('joinForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const familyCode = document.getElementById('joinFamilyCode').value.trim();
    const displayName = document.getElementById('joinDisplayName').value.trim();

    try {
        const data = await api('/auth/join', {
            method: 'POST',
            body: JSON.stringify({ familyCode, displayName })
        });

        localStorage.setItem('token', data.token);
        await loadUserData();
    } catch (error) {
        showError(error.message);
    }
});

document.getElementById('createForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('createFamilyName').value.trim();
    const displayName = document.getElementById('createDisplayName').value.trim();

    try {
        const data = await api('/families', {
            method: 'POST',
            body: JSON.stringify({ name, displayName })
        });

        localStorage.setItem('token', data.token);
        alert(`Family created! Share this code with your family: ${data.family.code}`);
        await loadUserData();
    } catch (error) {
        showError(error.message);
    }
});

async function loadUserData() {
    try {
        const data = await api('/me');
        currentUser = data.user;
        currentFamily = data.family;

        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('mainNav').style.display = 'flex';

        document.getElementById('userName').textContent = currentUser.displayName;
        document.getElementById('familyName').textContent = currentFamily.name;
        document.getElementById('familyCode').textContent = currentFamily.code;

        showSection('home');
        await loadHomeStats();
        await renderMyList();
        await renderFamilyLists();
    } catch (error) {
        console.error('Failed to load user data:', error);
        logout();
    }
}

async function loadHomeStats() {
    try {
        const myGifts = await api('/lists/me');
        const familyData = await api('/family/lists');

        document.getElementById('myGiftsCount').textContent = myGifts.length;
        document.getElementById('familyMembersCount').textContent = familyData.users.length;

        let reservedCount = 0;
        familyData.gifts.forEach(gift => {
            if (gift.reservedByUserId && String(gift.reservedByUserId) === String(currentUser._id)) {
                reservedCount++;
            }
        });
        document.getElementById('reservedCount').textContent = reservedCount;
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

document.getElementById('addGiftForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const giftData = {
        title: document.getElementById('giftTitle').value.trim(),
        description: document.getElementById('giftDescription').value.trim(),
        link: document.getElementById('giftLink').value.trim(),
        price: parseFloat(document.getElementById('giftPrice').value) || 0,
        priority: document.getElementById('giftPriority').value
    };

    try {
        await api('/lists/me/items', {
            method: 'POST',
            body: JSON.stringify(giftData)
        });

        document.getElementById('addGiftForm').reset();
        await renderMyList();
        await loadHomeStats();
    } catch (error) {
        alert('Failed to add gift: ' + error.message);
    }
});

async function renderMyList() {
    try {
        const gifts = await api('/lists/me');
        const container = document.getElementById('myGiftsList');

        if (!gifts || gifts.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6c757d;">No gifts yet. Add your first wish!</p>';
            return;
        }

        container.innerHTML = gifts.map(gift => `
            <div class="gift-card">
                <span class="priority-badge priority-${gift.priority}">${gift.priority.toUpperCase()}</span>
                <h3>${gift.title}</h3>
                ${gift.description ? `<p>${gift.description}</p>` : ''}
                ${gift.price && gift.price > 0 ? `<div class="gift-price">$${gift.price.toFixed(2)}</div>` : ''}
                ${gift.link ? `<a href="${gift.link}" target="_blank" class="gift-link">View Product →</a>` : ''}
                ${gift.reservedByUserId ? `<div class="reserved-badge">Reserved by ${gift.reservedByUser ? gift.reservedByUser.displayName : 'Someone'}</div>` : ''}
                <div class="gift-actions">
                    <button class="btn btn-danger" onclick="deleteGift('${gift._id}')">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load my list:', error);
    }
}

async function deleteGift(giftId) {
    if (!confirm('Are you sure you want to delete this gift?')) return;

    try {
        await api(`/gifts/${giftId}`, { method: 'DELETE' });
        await renderMyList();
        await loadHomeStats();
    } catch (error) {
        alert('Failed to delete gift: ' + error.message);
    }
}

async function renderFamilyLists() {
    try {
        const data = await api('/family/lists');
        const container = document.getElementById('familyListsContainer');

        const otherMembers = data.users.filter(u => String(u._id) !== String(currentUser._id));

        if (otherMembers.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6c757d;">No other family members yet. Share your family code!</p>';
            return;
        }

        const giftsByOwner = {};
        data.gifts.forEach(gift => {
            const ownerId = String(gift.ownerUserId);
            if (!giftsByOwner[ownerId]) giftsByOwner[ownerId] = [];
            giftsByOwner[ownerId].push(gift);
        });

        container.innerHTML = otherMembers.map(member => {
            const memberGifts = giftsByOwner[String(member._id)] || [];
            const giftsHtml = memberGifts.length === 0
                ? '<p style="color: #6c757d;">No gifts added yet</p>'
                : memberGifts.map(gift => `
                    <div class="gift-card ${gift.reservedByUserId ? 'reserved' : ''}">
                        <span class="priority-badge priority-${gift.priority}">${gift.priority.toUpperCase()}</span>
                        <h3>${gift.title}</h3>
                        ${gift.description ? `<p>${gift.description}</p>` : ''}
                        ${gift.price && gift.price > 0 ? `<div class="gift-price">$${gift.price.toFixed(2)}</div>` : ''}
                        ${gift.link ? `<a href="${gift.link}" target="_blank" class="gift-link">View Product →</a>` : ''}
                        ${gift.reservedByUserId
                        ? (String(gift.reservedByUserId) === String(currentUser._id)
                            ? `<div class="reserved-badge">Reserved by You</div>
                                       <button class="btn btn-danger" onclick="unreserveGift('${gift._id}')">Unreserve</button>`
                            : `<div class="reserved-badge">Already Reserved</div>`)
                        : `<button class="btn btn-success" onclick="reserveGift('${gift._id}')">Reserve Gift</button>`
                    }
                    </div>
                `).join('');

            return `
                <div class="family-member-section">
                    <h3>${member.displayName}'s Wishlist</h3>
                    <div class="gifts-grid">
                        ${giftsHtml}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Failed to load family lists:', error);
    }
}

async function reserveGift(giftId) {
    try {
        await api(`/gifts/${giftId}/reserve`, { method: 'POST' });
        await renderFamilyLists();
        await loadHomeStats();
    } catch (error) {
        alert('Failed to reserve gift: ' + error.message);
    }
}

async function unreserveGift(giftId) {
    try {
        await api(`/gifts/${giftId}/unreserve`, { method: 'POST' });
        await renderFamilyLists();
        await loadHomeStats();
    } catch (error) {
        alert('Failed to unreserve gift: ' + error.message);
    }
}

document.getElementById('loadIdeasBtn').addEventListener('click', async () => {
    const container = document.getElementById('giftIdeasGrid');
    container.innerHTML = '<p style="text-align: center;">Loading ideas...</p>';

    try {
        const response = await fetch('https://fakestoreapi.com/products?limit=12');
        const products = await response.json();

        container.innerHTML = products.map(product => `
            <div class="gift-card">
                <img src="${product.image}" alt="${product.title}" style="width: 100%; height: 200px; object-fit: contain; margin-bottom: 1rem;">
                <h3>${product.title}</h3>
                <div class="gift-price">$${product.price.toFixed(2)}</div>
                <p style="font-size: 0.9rem; color: #6c757d;">${product.description.substring(0, 100)}...</p>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<p style="color: red;">Failed to load gift ideas</p>';
    }
});

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        showSection(btn.dataset.section);
    });
});

document.getElementById('logoutBtn').addEventListener('click', logout);

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    currentFamily = null;
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('mainNav').style.display = 'none';
    showSection('login');
}

window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        loadUserData();
    }
});
