// Lebanese Marketing - Admin Web App Logic (v2.0 - STABLE & INTERACTIVE)

const FIXED_FIREBASE_URL = "https://extensionapjwuwhwtest-default-rtdb.firebaseio.com";

// دالة التحميل عند فتح الصفحة
document.addEventListener('DOMContentLoaded', () => {
    console.log("Admin Panel Loaded");
    loadDevices();
    
    const activateBtn = document.getElementById("activateBtn");
    if (activateBtn) {
        activateBtn.onclick = activateDevice;
    } else {
        console.error("Activate button not found!");
    }
});

// دالة تحميل الأجهزة من السحابة
async function loadDevices() {
    const devicesList = document.getElementById("devicesList");
    const loadingStatus = document.getElementById("loadingStatus");
    
    if (loadingStatus) loadingStatus.style.display = "block";
    if (devicesList) devicesList.innerHTML = "";

    try {
        const response = await fetch(`${FIXED_FIREBASE_URL}/devices.json`);
        if (!response.ok) throw new Error("Network response was not ok");
        
        const data = await response.json();
        if (loadingStatus) loadingStatus.style.display = "none";

        if (!data) {
            if (devicesList) devicesList.innerHTML = '<tr><td colspan="4" style="text-align:center;">لا توجد أجهزة مسجلة حالياً</td></tr>';
            return;
        }

        Object.keys(data).forEach(id => {
            const device = data[id];
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${id}</td>
                <td>${device.activatedAt ? new Date(device.activatedAt).toLocaleString("ar-EG") : "-"}</td>
                <td><span class="status-active" style="color: #25D366; font-weight: bold;">مفعل ✅</span></td>
                <td><button class="btn-delete" onclick="deleteDevice('${id}')" style="border: 1px solid #e74c3c; color: #e74c3c; background: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">حذف</button></td>
            `;
            if (devicesList) devicesList.appendChild(row);
        });
    } catch (e) {
        if (loadingStatus) loadingStatus.style.display = "none";
        console.error("Error loading devices:", e);
    }
}

// دالة تفعيل جهاز جديد
async function activateDevice() {
    const deviceIdInput = document.getElementById("deviceIdInput");
    const deviceId = deviceIdInput ? deviceIdInput.value.trim() : "";

    if (!deviceId) {
        alert("⚠️ يرجى إدخال كود الجهاز أولاً!");
        return;
    }

    // تغيير حالة الزر أثناء المعالجة
    const activateBtn = document.getElementById("activateBtn");
    const originalText = activateBtn.innerText;
    activateBtn.innerText = "جاري التفعيل...";
    activateBtn.disabled = true;

    try {
        console.log("Attempting to activate:", deviceId);
        const response = await fetch(`${FIXED_FIREBASE_URL}/devices/${deviceId}.json`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                activated: true,
                activatedAt: new Date().toISOString()
            })
        });

        if (response.ok) {
            alert(`✅ تم تفعيل الجهاز (${deviceId}) بنجاح!`);
            if (deviceIdInput) deviceIdInput.value = "";
            loadDevices(); // تحديث القائمة
        } else {
            alert("❌ فشل التفعيل. تأكد من إعدادات Firebase (Rules).");
        }
    } catch (e) {
        console.error("Activation error:", e);
        alert("❌ حدث خطأ في الاتصال بالسحابة. تأكد من الإنترنت.");
    } finally {
        activateBtn.innerText = originalText;
        activateBtn.disabled = false;
    }
}

// دالة حذف جهاز
async function deleteDevice(id) {
    if (!confirm(`هل أنت متأكد من حذف تفعيل الجهاز ${id}؟`)) return;

    try {
        const response = await fetch(`${FIXED_FIREBASE_URL}/devices/${id}.json`, {
            method: "DELETE"
        });

        if (response.ok) {
            alert("✅ تم حذف الجهاز بنجاح.");
            loadDevices();
        } else {
            alert("❌ فشل الحذف.");
        }
    } catch (e) {
        alert("❌ حدث خطأ أثناء الحذف.");
    }
}

// جعل دالة الحذف متاحة عالمياً
window.deleteDevice = deleteDevice;

// تحديث تلقائي كل دقيقة
setInterval(loadDevices, 60000);
