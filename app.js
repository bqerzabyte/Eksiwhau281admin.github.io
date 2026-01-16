// Lebanese Marketing - Admin Web App Logic (v1.9 - FIXED LINK)

// الرابط الخاص بك تم تثبيته هنا لضمان العمل 100%
const FIXED_FIREBASE_URL = "https://extensionapjwuwhwtest-default-rtdb.firebaseio.com";

const deviceIdInput = document.getElementById("deviceIdInput");
const activateBtn = document.getElementById("activateBtn");
const devicesList = document.getElementById("devicesList");
const loadingStatus = document.getElementById("loadingStatus");

// Initialize on load
loadDevices();

// Load Devices from Firebase
async function loadDevices() {
    loadingStatus.style.display = "block";
    devicesList.innerHTML = "";

    try {
        const response = await fetch(`${FIXED_FIREBASE_URL}/devices.json`);
        const data = await response.json();

        loadingStatus.style.display = "none";

        if (!data) {
            devicesList.innerHTML = '<tr><td colspan="4" style="text-align:center;">لا توجد أجهزة مسجلة حالياً</td></tr>';
            return;
        }

        // Render devices
        Object.keys(data).forEach(id => {
            const device = data[id];
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${id}</td>
                <td>${device.activatedAt ? new Date(device.activatedAt).toLocaleString("ar-EG") : "-"}</td>
                <td><span class="status-active">مفعل ✅</span></td>
                <td><button class="btn-delete" onclick="deleteDevice('${id}')">حذف</button></td>
            `;
            devicesList.appendChild(row);
        });
    } catch (e) {
        loadingStatus.style.display = "none";
        console.error("Error loading devices:", e);
        alert("فشل في الاتصال بـ Firebase. تأكد من إعدادات الـ Rules في Firebase.");
    }
}

// Activate New Device
async function activateDevice() {
    const deviceId = deviceIdInput.value.trim();
    if (!deviceId) {
        alert("يرجى إدخال كود الجهاز");
        return;
    }

    try {
        const response = await fetch(`${FIXED_FIREBASE_URL}/devices/${deviceId}.json`, {
            method: "PATCH",
            body: JSON.stringify({
                activated: true,
                activatedAt: new Date().toISOString()
            })
        });

        if (response.ok) {
            alert(`تم تفعيل الجهاز ${deviceId} بنجاح!`);
            deviceIdInput.value = "";
            loadDevices(); // Refresh list
        } else {
            alert("فشل التفعيل. تأكد من اتصال الإنترنت.");
        }
    } catch (e) {
        alert("حدث خطأ أثناء التفعيل");
    }
}

// Delete Device
async function deleteDevice(id) {
    if (!confirm(`هل أنت متأكد من حذف تفعيل الجهاز ${id}؟`)) return;

    try {
        const response = await fetch(`${FIXED_FIREBASE_URL}/devices/${id}.json`, {
            method: "DELETE"
        });

        if (response.ok) {
            loadDevices(); // Refresh list
        }
    } catch (e) {
        alert("حدث خطأ أثناء الحذف");
    }
}

activateBtn.addEventListener("click", () => activateDevice());

// Expose delete function to global scope for onclick
window.deleteDevice = deleteDevice;

// Refresh list every 30 seconds
setInterval(loadDevices, 30000);
