// Lebanese Marketing - Admin Web App Logic (v1.6)

const firebaseUrlInput = document.getElementById("firebaseUrl");
const connectBtn = document.getElementById("connectBtn");
const deviceIdInput = document.getElementById("deviceIdInput");
const activateBtn = document.getElementById("activateBtn");
const devicesList = document.getElementById("devicesList");
const loadingStatus = document.getElementById("loadingStatus");

let currentDbUrl = localStorage.getItem("firebaseDbUrl") || "";

// Initialize on load
if (currentDbUrl) {
    firebaseUrlInput.value = currentDbUrl;
    loadDevices();
}

// Connect/Save Firebase URL
connectBtn.addEventListener("click", () => {
    const url = firebaseUrlInput.value.trim();
    if (!url) {
        alert("يرجى إدخال رابط Firebase");
        return;
    }
    currentDbUrl = url.endsWith("/") ? url.slice(0, -1) : url;
    localStorage.setItem("firebaseDbUrl", currentDbUrl);
    alert("تم حفظ الإعدادات بنجاح!");
    loadDevices();
});

// Load Devices from Firebase
async function loadDevices() {
    if (!currentDbUrl) return;

    loadingStatus.style.display = "block";
    devicesList.innerHTML = "";

    try {
        const response = await fetch(`${currentDbUrl}/devices.json`);
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
        alert("فشل في تحميل البيانات. تأكد من رابط Firebase ومن إعدادات الـ Rules.");
    }
}

// Activate New Device
async function activateDevice(id) {
    if (!currentDbUrl) {
        alert("يرجى إعداد رابط Firebase أولاً");
        return;
    }

    const deviceId = id || deviceIdInput.value.trim();
    if (!deviceId) {
        alert("يرجى إدخال كود الجهاز");
        return;
    }

    try {
        const response = await fetch(`${currentDbUrl}/devices/${deviceId}.json`, {
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
        }
    } catch (e) {
        alert("حدث خطأ أثناء التفعيل");
    }
}

// Delete Device
async function deleteDevice(id) {
    if (!confirm(`هل أنت متأكد من حذف تفعيل الجهاز ${id}؟`)) return;

    try {
        const response = await fetch(`${currentDbUrl}/devices/${id}.json`, {
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
