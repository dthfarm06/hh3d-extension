// HH3D Vấn Đáp Helper - Background Script
console.log('[VanDap Background] Service worker started');

// Lắng nghe khi extension được cài đặt
chrome.runtime.onInstalled.addListener(() => {
    console.log('[VanDap Background] HH3D Vấn Đáp Helper installed successfully');
});

// Tự động mở popup khi user vào trang vấn đáp
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Chỉ xử lý khi trang đã load xong
    if (changeInfo.status !== 'complete' || !tab.url) {
        return;
    }

    // Kiểm tra xem có phải trang vấn đáp không
    const isVanDapPage = tab.url.includes('hoathinh3d.mx/van-dap-tong-mon') || 
                         tab.url.includes('mock-vandap.html');
    
    if (isVanDapPage) {
        console.log('[VanDap Background] Detected vấn đáp page:', tab.url);
        
        try {
            // Đợi một chút để content script load xong
            setTimeout(() => {
                // Tự động mở popup
                chrome.action.openPopup();
                console.log('[VanDap Background] Auto-opened popup for vấn đáp page');
            }, 1000);
            
        } catch (error) {
            console.error('[VanDap Background] Error auto-opening popup:', error);
        }
    }
});

// Lắng nghe message từ content script hoặc popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[VanDap Background] Received message:', request);
    
    // Xử lý các message cụ thể nếu cần
    switch (request.action) {
        case 'openPopup':
            try {
                chrome.action.openPopup();
                sendResponse({ success: true });
            } catch (error) {
                console.error('[VanDap Background] Error opening popup:', error);
                sendResponse({ success: false, error: error.message });
            }
            break;
            
        case 'logEvent':
            console.log('[VanDap Background] Event logged:', request.data);
            sendResponse({ success: true });
            break;
            
        default:
            // Không xử lý, để content script hoặc popup xử lý
            break;
    }
    
    return true; // Keep message channel open
});

// Xử lý khi popup được mở
chrome.action.onClicked.addListener((tab) => {
    console.log('[VanDap Background] Extension icon clicked on tab:', tab.url);
    
    // Kiểm tra xem có phải trang vấn đáp không
    const isVanDapPage = tab.url.includes('hoathinh3d.mx/van-dap-tong-mon') || 
                         tab.url.includes('mock-vandap.html');
    
    if (!isVanDapPage) {
        console.log('[VanDap Background] Not on vấn đáp page, but popup will still open');
    }
});