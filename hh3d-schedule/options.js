const $ = (id) => document.getElementById(id);

async function load() {
    const data = await chrome.storage.local.get(["delayMinutes", "openDwellMs", "replaceDwellMs", "urlPairs"]);
    const delayMinutes = Number.isFinite(data.delayMinutes) ? data.delayMinutes : 15;
    const openDwellMs = Number.isFinite(data.openDwellMs) ? data.openDwellMs : 60000;
    const replaceDwellMs = Number.isFinite(data.replaceDwellMs) ? data.replaceDwellMs : 10000;
    const pairs = Array.isArray(data.urlPairs) && data.urlPairs.length
        ? data.urlPairs
        : [
            { openUrl: "https://hoathinh3d.mx/phuc-loi-duong", replaceUrl: "https://hoathinh3d.mx/hoang-vuc?t=b3ddd" },
            { openUrl: "https://hoathinh3d.mx/tien-duyen?t=a3dd1", replaceUrl: "https://hoathinh3d.mx/do-thach-hh3d?t=e39b9" }
        ];

    $("delayMinutes").value = delayMinutes;
    $("openDwellMs").value = openDwellMs;
    $("replaceDwellMs").value = replaceDwellMs;
    $("pairs").value = pairs.map(p => `${p.openUrl},${p.replaceUrl}`).join("\n");
}

function parsePairs(text) {
    const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const out = [];
    for (const line of lines) {
        const [openUrl, replaceUrl] = line.split(",").map(s => s?.trim());
        if (!openUrl || !replaceUrl) throw new Error(`Dòng không hợp lệ: "${line}"`);
        out.push({ openUrl, replaceUrl });
    }
    return out;
}

async function save() {
    try {
        const delayMinutes = parseInt($("delayMinutes").value, 10);
        const openDwellMs = parseInt($("openDwellMs").value, 10);
        const replaceDwellMs = parseInt($("replaceDwellMs").value, 10);
        const urlPairs = parsePairs($("pairs").value);

        await chrome.storage.local.set({ delayMinutes, openDwellMs, replaceDwellMs, urlPairs });
        $("status").textContent = "Saved!";
        $("status").className = "ok";
    } catch (err) {
        $("status").textContent = err.message;
        $("status").className = "err";
    }
}

async function resetDefaults() {
    await chrome.storage.local.set({
        delayMinutes: 15,
        openDwellMs: 60000,
        replaceDwellMs: 10000,
        urlPairs: [
            { openUrl: "https://hoathinh3d.mx/phuc-loi-duong", replaceUrl: "https://hoathinh3d.mx/hoang-vuc?t=b3ddd" },
            { openUrl: "https://hoathinh3d.mx/tien-duyen?t=a3dd1", replaceUrl: "https://hoathinh3d.mx/do-thach-hh3d?t=e39b9" }
        ]
    });
    await load();
    $("status").textContent = "Reset to defaults.";
    $("status").className = "ok";
}

$("saveBtn").addEventListener("click", save);
$("resetBtn").addEventListener("click", resetDefaults);

load();
