/* ล้างค่าเก่าที่เคยทำให้ขึ้น "already logged in elsewhere" (ไม่ใช้แล้ว) */
localStorage.removeItem("activeLogins");

/* ถ้ามีคน Login อยู่แล้ว ให้เข้า Dashboard ทันที */
if (localStorage.getItem("loggedInUser")) {
    window.location.href = "main.HTML";
}

/* SHOW / HIDE PASSWORD */
function togglePassword() {
    const password = document.getElementById("password");
    const button = document.getElementById("toggleButton");

    if (password.type === "password") {
        password.type = "text";
        button.textContent = "🙈";
    } else {
        password.type = "password";
        button.textContent = "👁";
    }
}

/* LOGIN (ให้เซิร์ฟเวอร์เป็นคนตรวจสอบการล็อกอินซ้ำจากตาราง active_sessions) */
async function login(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const error = document.getElementById("error");

    error.style.display = "none";

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (result.success) {

            const currentUser = {
                id: result.user.id,
                email: result.user.email
            };

            localStorage.setItem("loggedInUser", JSON.stringify(currentUser));

            /* บันทึกประวัติ LOGIN */
            try {
                await fetch('/api/history/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'LOGIN',
                        email: currentUser.email,
                        user: currentUser.id
                    })
                });
            } catch (err) {
                console.error('Login history error:', err);
            }

            window.location.href = "main.HTML";

        } else {
            error.textContent = result.message || "Invalid E-mail or Password";
            error.style.display = "block";
        }

    } catch (err) {
        console.error('Connection error:', err);
        error.textContent = "Cannot connect to server";
        error.style.display = "block";
    }
}
