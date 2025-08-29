// Background script cho PHÚC LỢI ĐƯỜNG extension
console.log('🚀 PHÚC LỢI ĐƯỜNG Background script khởi động');

// Biến để track icon update interval
let iconUpdateInterval = null;

// Hàm tạo icon động với text
function createDynamicIcon(text, backgroundColor = '#9C27B0', textColor = '#FFFFFF') {
    console.log(`🎨 Creating dynamic icon with text: "${text}", bg: ${backgroundColor}`);
    
    // Tạo canvas 128x128 (kích thước icon lớn nhất)
    const canvas = new OffscreenCanvas(128, 128);
    const ctx = canvas.getContext('2d');
    
    // Vẽ nền
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, 128, 128);
    
    // Vẽ border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 124, 124);
    
    // Vẽ text
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Điều chỉnh font size dựa trên độ dài text
    let fontSize = text.length <= 2 ? 60 : (text.length <= 3 ? 45 : 35);
    ctx.font = `bold ${fontSize}px Arial`;
    
    ctx.fillText(text, 64, 64);
    
    return canvas;
}

// Hàm cập nhật icon extension
async function updateExtensionIcon(minutes = null, cyclesLeft = null, isCompleted = false) {
    try {
        let iconData;
        
        if (isCompleted) {
            // Hoàn thành tất cả - icon xanh với số 0
            iconData = createDynamicIcon('0', '#4CAF50', '#FFFFFF');
        } else if (minutes !== null && minutes > 0) {
            // Đang đếm ngược - icon tím với số phút
            iconData = createDynamicIcon(minutes.toString(), '#9C27B0', '#FFFFFF');
        } else if (cyclesLeft !== null && cyclesLeft > 0) {
            // Hết thời gian chu trình hiện tại - icon xanh với số lượt còn lại
            iconData = createDynamicIcon(cyclesLeft.toString(), '#4CAF50', '#FFFFFF');
        } else {
            // Hết tất cả lượt - icon đỏ với số 0
            iconData = createDynamicIcon('0', '#f44336', '#FFFFFF');
        }
        
        // Tạo ImageData cho các size khác nhau
        const imageData128 = iconData.getContext('2d').getImageData(0, 0, 128, 128);
        
        // Tạo canvas nhỏ hơn cho các size 48x48 và 16x16
        const canvas48 = new OffscreenCanvas(48, 48);
        const ctx48 = canvas48.getContext('2d');
        ctx48.drawImage(iconData, 0, 0, 48, 48);
        const imageData48 = ctx48.getImageData(0, 0, 48, 48);
        
        const canvas16 = new OffscreenCanvas(16, 16);
        const ctx16 = canvas16.getContext('2d');
        ctx16.drawImage(iconData, 0, 0, 16, 16);
        const imageData16 = ctx16.getImageData(0, 0, 16, 16);
        
        // Cập nhật icon
        chrome.action.setIcon({
            imageData: {
                '16': imageData16,
                '48': imageData48,
                '128': imageData128
            }
        }, () => {
            if (chrome.runtime.lastError) {
                console.log('❌ Error updating icon:', chrome.runtime.lastError.message);
            } else {
                console.log(`✅ Icon updated successfully`);
            }
        });
        
    } catch (error) {
        console.error('❌ Error creating dynamic icon:', error);
    }
}

// Hàm reset icon về mặc định
function resetIconToDefault() {
    chrome.action.setIcon({
        path: {
            '16': 'images/icon16.png',
            '48': 'images/icon48.png',
            '128': 'images/icon128.png'
        }
    }, () => {
        if (chrome.runtime.lastError) {
            console.log('❌ Error resetting icon:', chrome.runtime.lastError.message);
        } else {
            console.log('✅ Icon reset to default');
        }
    });
}

// Hàm bắt đầu update icon theo thời gian thực
function startIconUpdateTimer() {
    // Clear existing interval
    if (iconUpdateInterval) {
        clearInterval(iconUpdateInterval);
    }
    
    console.log('⏰ Starting icon update timer');
    
    iconUpdateInterval = setInterval(async () => {
        try {
            const result = await chrome.storage.local.get(['phucLoiDuongState']);
            const state = result.phucLoiDuongState;
            
            if (!state || !state.isRunning) {
                // Không chạy - dùng icon mặc định
                resetIconToDefault();
                return;
            }
            
            if (state.endTime) {
                const now = Date.now();
                const timeLeft = Math.max(0, Math.floor((state.endTime - now) / 1000));
                const minutesLeft = Math.floor(timeLeft / 60);
                
                if (timeLeft > 0) {
                    // Còn thời gian - hiển thị phút còn lại
                    updateExtensionIcon(minutesLeft);
                } else {
                    // Hết thời gian chu trình hiện tại
                    const cyclesRemaining = state.maxCycles - state.currentCycle;
                    if (cyclesRemaining > 0) {
                        // Còn chu trình - hiển thị số lượt còn lại
                        updateExtensionIcon(null, cyclesRemaining);
                    } else {
                        // Hết tất cả chu trình
                        updateExtensionIcon(null, null, true);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error in icon update timer:', error);
        }
    }, 5000); // Update mỗi 5 giây
}

// Hàm dừng update icon timer
function stopIconUpdateTimer() {
    if (iconUpdateInterval) {
        clearInterval(iconUpdateInterval);
        iconUpdateInterval = null;
        console.log('⏹️ Stopped icon update timer');
    }
    resetIconToDefault();
}

// Lắng nghe sự kiện extension được cài đặt hoặc cập nhật
chrome.runtime.onInstalled.addListener((details) => {
    console.log('📦 Extension installed/updated:', details.reason);
    
    if (details.reason === 'install') {
        console.log('🎉 Lần đầu cài đặt PHÚC LỢI ĐƯỜNG extension');
        // Reset icon về mặc định khi cài đặt
        resetIconToDefault();
    } else if (details.reason === 'update') {
        console.log('🔄 Extension đã được cập nhật');
        // Khôi phục icon nếu có state đang chạy
        chrome.storage.local.get(['phucLoiDuongState'], (result) => {
            if (result.phucLoiDuongState && result.phucLoiDuongState.isRunning) {
                startIconUpdateTimer();
            } else {
                resetIconToDefault();
            }
        });
    }
});

// Lắng nghe sự kiện tab được cập nhật để tự động trigger phúc lợi đường
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Chỉ xử lý khi tab đã load hoàn toàn
    if (changeInfo.status === 'complete' && tab.url) {
        console.log(`📍 Tab ${tabId} loaded: ${tab.url}`);
        
        // Kiểm tra xem có phải trang phúc lợi đường không
        if (tab.url.includes('hoathinh3d.mx/phuc-loi-duong') || 
            tab.url.includes('mock-phucloiuong.html')) {
            console.log('🎁 Detected Phúc Lợi Đường page, triggering auto-click...');
            
            // Delay một chút để trang load hoàn toàn
            setTimeout(() => {
                triggerAutoClickTreasureChests(tabId);
            }, 2000);
        }
    }
});

// Hàm trigger auto-click rương từ background
function triggerAutoClickTreasureChests(tabId) {
    console.log('🎁 Triggering auto-click treasure chests on tab:', tabId);
    
    // Gửi message đến content script để thực hiện auto-click
    chrome.tabs.sendMessage(tabId, {
        type: 'AUTO_CLICK_TREASURES'
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.log('❌ Error sending message to content script:', chrome.runtime.lastError.message);
        } else if (response) {
            console.log('✅ Content script response:', response);
        }
    });
    
    // Backup: dispatch event trực tiếp nếu sendMessage không hoạt động
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
            window.dispatchEvent(new CustomEvent('autoClickTreasureChests'));
        }
    }, (results) => {
        if (chrome.runtime.lastError) {
            console.log('❌ Error executing script:', chrome.runtime.lastError.message);
        } else {
            console.log('✅ Auto-click event dispatched successfully');
        }
    });
}

// Xử lý messages từ popup hoặc content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('📨 Background received message:', message);
    
    if (message.type === 'UPDATE_ICON') {
        // Cập nhật icon từ popup
        const { minutes, cyclesLeft, isCompleted } = message;
        updateExtensionIcon(minutes, cyclesLeft, isCompleted);
        sendResponse({success: true});
        return true;
    }
    
    if (message.type === 'START_ICON_TIMER') {
        // Bắt đầu icon timer
        startIconUpdateTimer();
        sendResponse({success: true});
        return true;
    }
    
    if (message.type === 'STOP_ICON_TIMER') {
        // Dừng icon timer
        stopIconUpdateTimer();
        sendResponse({success: true});
        return true;
    }
    
    if (message.type === 'TRIGGER_PHUC_LOI_DUONG') {
        // Được gọi từ popup để trigger phúc lợi đường
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                triggerAutoClickTreasureChests(tabs[0].id);
                sendResponse({success: true});
            } else {
                sendResponse({success: false, error: 'No active tab found'});
            }
        });
        return true; // Keep message channel open
    }
    
    if (message.type === 'GET_PHUC_LOI_DUONG_STATUS') {
        // Trả về trạng thái hiện tại của phúc lợi đường
        chrome.storage.local.get(['phucLoiDuongState'], (result) => {
            sendResponse({
                success: true,
                state: result.phucLoiDuongState || null
            });
        });
        return true; // Keep message channel open
    }
    
    return false;
});

// Xử lý khi extension khởi động
chrome.runtime.onStartup.addListener(() => {
    console.log('🔄 Extension startup detected');
    
    // Kiểm tra và khôi phục trạng thái phúc lợi đường nếu có
    chrome.storage.local.get(['phucLoiDuongState'], (result) => {
        if (result.phucLoiDuongState && result.phucLoiDuongState.isRunning) {
            console.log('🔄 Restoring Phúc Lợi Đường state:', result.phucLoiDuongState);
            startIconUpdateTimer();
        } else {
            resetIconToDefault();
        }
    });
});

console.log('✅ PHÚC LỢI ĐƯỜNG Background script initialized successfully');
