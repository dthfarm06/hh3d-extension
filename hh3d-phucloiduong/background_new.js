// Background script cho PHÚC LỢI ĐƯỜNG extension
console.log('🚀 PHÚC LỢI ĐƯỜNG Background script khởi động');

// Lắng nghe sự kiện extension được cài đặt hoặc cập nhật
chrome.runtime.onInstalled.addListener((details) => {
    console.log('📦 Extension installed/updated:', details.reason);
    
    if (details.reason === 'install') {
        console.log('🎉 Lần đầu cài đặt PHÚC LỢI ĐƯỜNG extension');
    } else if (details.reason === 'update') {
        console.log('🔄 Extension đã được cập nhật');
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
        }
    });
});

console.log('✅ PHÚC LỢI ĐƯỜNG Background script initialized successfully');
