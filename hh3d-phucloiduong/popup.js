// popup.js - Chỉ giữ lại chức năng PHÚC LỢI ĐƯỜNG

// Hàm updateResult global để có thể sử dụng ở mọi nơi
function updateResult(message, type = 'info') {
    const resultElement = document.getElementById('resultText');
    if (resultElement) {
        resultElement.innerHTML = message;
        
        // Đổi màu dựa trên loại thông báo
        if (type === 'error') {
            resultElement.className = 'error';
        } else if (type === 'success') {
            resultElement.className = 'success';
        } else {
            resultElement.className = 'info';
        }
    }
}

// Hàm quản lý state persistent cho Phúc Lợi Đường
async function getPhucLoiDuongState() {
    const result = await chrome.storage.local.get(['phucLoiDuongState']);
    return result.phucLoiDuongState || {
        isRunning: false,
        currentCycle: 0,
        maxCycles: 4,
        endTime: null,
        lastUpdateTime: null
    };
}

async function savePhucLoiDuongState(state) {
    state.lastUpdateTime = Date.now();
    await chrome.storage.local.set({ phucLoiDuongState: state });
}

async function clearPhucLoiDuongState() {
    await chrome.storage.local.remove(['phucLoiDuongState']);
    // Dừng icon timer khi clear state
    sendMessageToBackground('STOP_ICON_TIMER');
}

// ==================== ICON FUNCTIONS ====================

// Hàm gửi message đến background để cập nhật icon
function sendMessageToBackground(type, data = {}) {
    chrome.runtime.sendMessage({ type, ...data }, (response) => {
        if (chrome.runtime.lastError) {
            console.log('❌ Error sending message to background:', chrome.runtime.lastError.message);
        } else {
            console.log('✅ Message sent to background:', type, response);
        }
    });
}

// Hàm cập nhật icon dựa trên state
async function updateIconBasedOnState(state) {
    if (!state || !state.isRunning) {
        // Không chạy - reset về icon mặc định
        sendMessageToBackground('STOP_ICON_TIMER');
        return;
    }
    
    if (state.endTime) {
        const now = Date.now();
        const timeLeft = Math.max(0, Math.floor((state.endTime - now) / 1000));
        const minutesLeft = Math.floor(timeLeft / 60);
        
        if (timeLeft > 0) {
            // Còn thời gian - hiển thị phút còn lại
            sendMessageToBackground('UPDATE_ICON', {
                minutes: minutesLeft,
                cyclesLeft: null,
                isCompleted: false
            });
        } else {
            // Hết thời gian chu trình hiện tại
            const cyclesRemaining = state.maxCycles - state.currentCycle;
            if (cyclesRemaining > 0) {
                // Còn chu trình - hiển thị số lượt còn lại (icon xanh)
                sendMessageToBackground('UPDATE_ICON', {
                    minutes: null,
                    cyclesLeft: cyclesRemaining,
                    isCompleted: false
                });
            } else {
                // Hết tất cả chu trình (icon xanh với số 0)
                sendMessageToBackground('UPDATE_ICON', {
                    minutes: null,
                    cyclesLeft: null,
                    isCompleted: true
                });
            }
        }
    }
}

// ==================== PHÚC LỢI ĐƯỜNG FUNCTIONS ====================

// Hàm chính Phúc Lợi Đường
async function phucLoiDuong() {
    const state = await getPhucLoiDuongState();
    
    if (state.isRunning) {
        // Dừng chu trình nếu đang chạy
        if (window.phucLoiDuongInterval) {
            clearInterval(window.phucLoiDuongInterval);
            window.phucLoiDuongInterval = null;
        }
        await clearPhucLoiDuongState();
        updateResult('⏹️ Đã dừng chu trình Phúc Lợi Đường', 'info');
        await updatePhucLoiDuongButtonUI();
        return;
    }
    
    // Bắt đầu chu trình mới
    const newState = {
        isRunning: true,
        currentCycle: 1,
        maxCycles: 4,
        endTime: Date.now() + (30 * 60 * 1000), // 30 phút
        lastUpdateTime: Date.now()
    };
    
    await savePhucLoiDuongState(newState);
    updateResult('🎁 Bắt đầu chu trình Phúc Lợi Đường (1/4)', 'info');
    
    // Bắt đầu icon timer
    sendMessageToBackground('START_ICON_TIMER');
    
    // Mở trang và click rương
    performPhucLoiDuongClick();
    
    // Bắt đầu timer và cập nhật UI
    startPhucLoiDuongTimer();
    await updatePhucLoiDuongButtonUI();
}

// Hàm thực hiện click rương và mở trang phúc lợi đường
async function performPhucLoiDuongClick() {
    try {
        const url = CONFIG.getPhucLoiDuongUrl();
        console.log('🎁 Mở trang Phúc Lợi Đường:', url);
        
        // Mở trang phúc lợi đường trong tab hiện tại
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.update(tabs[0].id, {url: url}, function() {
                console.log('✅ Đã mở trang Phúc Lợi Đường, chờ auto-click rương');
            });
        });
        
    } catch (error) {
        console.error('❌ Lỗi mở trang Phúc Lợi Đường:', error);
        updateResult('❌ Lỗi mở trang Phúc Lợi Đường: ' + error.message, 'error');
    }
}

// Hàm cập nhật UI button Phúc Lợi Đường
async function updatePhucLoiDuongButtonUI() {
    const button = document.getElementById('phucLoiDuongButton');
    if (!button) return;
    
    const state = await getPhucLoiDuongState();
    
    if (!state.isRunning) {
        // Trạng thái bình thường
        button.innerHTML = 'PHÚC LỢI ĐƯỜNG';
        button.style.background = 'linear-gradient(to right, #9C27B0, #673AB7)';
        return;
    }
    
    if (state.endTime) {
        // Đang trong thời gian đếm ngược
        const now = Date.now();
        const timeLeft = Math.max(0, Math.floor((state.endTime - now) / 1000));
        
        if (timeLeft > 0) {
            const totalMinutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            
            let timeDisplay;
            if (totalMinutes > 0) {
                if (seconds > 0) {
                    timeDisplay = `${totalMinutes}p ${seconds}s`;
                } else {
                    timeDisplay = `${totalMinutes} phút`;
                }
            } else {
                timeDisplay = `${seconds} giây`;
            }
            
            button.innerHTML = `PHÚC LỢI ĐƯỜNG ${state.currentCycle}/4<br><span class="countdown">${timeDisplay}</span><br><small style="font-size: 12px; opacity: 0.8;">(Click để dừng)</small>`;
            button.style.background = 'linear-gradient(to right, #9C27B0, #673AB7)';
            
            // Cập nhật icon với số phút còn lại
            updateIconBasedOnState();
        } else {
            // Hết thời gian, chuyển sang chu trình tiếp theo
            state.currentCycle++;
            if (state.currentCycle >= state.maxCycles) {
                // Hoàn thành tất cả chu trình
                if (window.phucLoiDuongInterval) {
                    clearInterval(window.phucLoiDuongInterval);
                    window.phucLoiDuongInterval = null;
                }
                await clearPhucLoiDuongState();
                button.innerHTML = 'PHÚC LỢI ĐƯỜNG';
                button.style.background = 'linear-gradient(to right, #4CAF50, #2E8B57)';
                updateResult('🎉 Hoàn thành tất cả 4 chu trình Phúc Lợi Đường!', 'success');
                
                // Cập nhật icon thành hoàn thành
                updateIconBasedOnState();
                
                // Reset về trạng thái ban đầu sau 5 giây
                setTimeout(async () => {
                    button.style.background = 'linear-gradient(to right, #9C27B0, #673AB7)';
                    await updatePhucLoiDuongButtonUI();
                    updateIconBasedOnState(); // Reset icon về trạng thái bình thường
                }, 5000);
            } else {
                // Bắt đầu chu trình tiếp theo
                state.endTime = Date.now() + (30 * 60 * 1000); // 30 phút cho chu trình tiếp theo
                await savePhucLoiDuongState(state);
                
                // Cập nhật icon cho chu trình mới
                updateIconBasedOnState();
                
                updateResult(`🔄 Bắt đầu chu trình ${state.currentCycle}/4`, 'info');
                performPhucLoiDuongClick();
                startPhucLoiDuongTimer();
            }
        }
    } else {
        // Đang chạy chu trình (chưa có endTime)
        button.innerHTML = `ĐANG CHẠY ${state.currentCycle}/4<br><small style="font-size: 12px; opacity: 0.8;">(Click để dừng)</small>`;
        button.style.background = 'linear-gradient(to right, #f44336, #d32f2f)';
    }
}

// Hàm bắt đầu timer cho phúc lợi đường
function startPhucLoiDuongTimer() {
    // Clear existing timer nếu có
    if (window.phucLoiDuongInterval) {
        clearInterval(window.phucLoiDuongInterval);
    }
    
    window.phucLoiDuongInterval = setInterval(async () => {
        await updatePhucLoiDuongButtonUI();
        
        const state = await getPhucLoiDuongState();
        if (!state.isRunning || !state.endTime) {
            clearInterval(window.phucLoiDuongInterval);
            window.phucLoiDuongInterval = null;
        }
    }, 1000); // Cập nhật mỗi giây
}

// Hàm khôi phục trạng thái Phúc Lợi Đường khi popup được mở lại
async function restorePhucLoiDuongState() {
    try {
        const state = await getPhucLoiDuongState();
        if (state.isRunning && state.endTime) {
            const now = Date.now();
            const remainingTime = state.endTime - now;
            
            if (remainingTime > 0) {
                // Vẫn còn thời gian, khôi phục countdown
                console.log(`🔄 Khôi phục Phúc Lợi Đường: Cycle ${state.currentCycle}/4, còn ${Math.ceil(remainingTime / 60000)} phút`);
                await updatePhucLoiDuongButtonUI();
                
                // Bắt đầu interval để cập nhật UI
                startPhucLoiDuongTimer();
                updateIconBasedOnState(); // Cập nhật icon khi khôi phục state
            } else {
                // Hết thời gian, chuyển sang cycle tiếp theo hoặc hoàn thành
                if (state.currentCycle >= state.maxCycles) {
                    if (window.phucLoiDuongInterval) {
                        clearInterval(window.phucLoiDuongInterval);
                        window.phucLoiDuongInterval = null;
                    }
                    await clearPhucLoiDuongState();
                    updateResult('🎉 Hoàn thành tất cả 4 chu trình Phúc Lợi Đường!', 'success');
                    updateIconBasedOnState(); // Cập nhật icon khi hoàn thành
                } else {
                    state.currentCycle++;
                    state.endTime = Date.now() + (30 * 60 * 1000);
                    await savePhucLoiDuongState(state);
                    updateResult(`🔄 Bắt đầu chu trình ${state.currentCycle}/4`, 'info');
                    performPhucLoiDuongClick();
                    startPhucLoiDuongTimer();
                    updateIconBasedOnState(); // Cập nhật icon cho chu trình mới
                }
                await updatePhucLoiDuongButtonUI();
                updateIconBasedOnState(); // Cập nhật icon sau khi thay đổi state
            }
        }
    } catch (error) {
        console.error('❌ Lỗi khôi phục trạng thái Phúc Lợi Đường:', error);
    }
}

// ==================== END PHÚC LỢI ĐƯỜNG FUNCTIONS ====================

// Hàm setup mode toggle
function setupModeToggle() {
    const toggle = document.getElementById('testModeToggle');
    const currentModeDiv = document.getElementById('currentMode');
    
    // Set initial state
    toggle.checked = CONFIG.TEST_MODE;
    updateModeDisplay();
    
    // Handle toggle change
    toggle.addEventListener('change', function() {
        CONFIG.TEST_MODE = this.checked;
        updateModeDisplay();
        
        // Update message
        const mode = CONFIG.TEST_MODE ? 'Test Mode' : 'Production Mode';
        updateResult(`🔄 Switched to ${mode}`, 'info');
        
        console.log(`🔧 Mode changed to: ${mode}`);
    });
    
    function updateModeDisplay() {
        const mode = CONFIG.TEST_MODE ? 'TEST' : 'PROD';
        const phucLoiDuongUrl = CONFIG.getPhucLoiDuongUrl();
        
        currentModeDiv.innerHTML = `
            📍 Mode: <strong>${mode}</strong><br>
            🎁 Phúc lợi đường: ${phucLoiDuongUrl.includes('file://') ? 'Local File' : 'Online'}
        `;
    }
}

// Event listeners khi DOM loaded
document.addEventListener('DOMContentLoaded', function() {
    // Chỉ giữ lại event listener cho Phúc Lợi Đường
    document.getElementById('phucLoiDuongButton').addEventListener('click', phucLoiDuong);
    
    // Khôi phục trạng thái khi popup được mở
    restorePhucLoiDuongState();
    
    // Cập nhật icon ngay khi popup mở
    updateIconBasedOnState();
    
    // Setup mode toggle
    setupModeToggle();
});
