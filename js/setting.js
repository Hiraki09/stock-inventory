/* ผู้ใช้ที่ Login อยู่ (มาจาก js/layout.js) */
const currentUserObj = getCurrentUser();

// Theme Handling
const savedTheme = localStorage.getItem('appTheme') || 'dark';
updateThemeUI(savedTheme);

function setTheme(theme) {
    localStorage.setItem('appTheme', theme);
    if (theme === 'light') {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }
    updateThemeUI(theme);
}

function updateThemeUI(theme) {
    if (theme === 'light') {
        document.getElementById('lightThemeBtn').classList.add('active');
        document.getElementById('darkThemeBtn').classList.remove('active');
    } else {
        document.getElementById('darkThemeBtn').classList.add('active');
        document.getElementById('lightThemeBtn').classList.remove('active');
    }
}

async function logout() {
    try {
        await fetch('/api/history/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'LOGOUT',
                email: currentUserObj.email,
                user: currentUserObj.id
            })
        });
    } catch (e) {
        console.error(e);
    }
    localStorage.removeItem("loggedInUser");
    window.location.href = "Login.HTML";
}

