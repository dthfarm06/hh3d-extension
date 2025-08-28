// HH3D Vấn Đáp Helper - Popup Script
class VanDapPopup {
    constructor() {
        this.currentState = null;
        this.updateInterval = null;
        this.isPinned = false;
        this.init();
    }

    init() {
        console.log('[VanDap Popup] Initializing...');
        this.loadPersistedState();
        this.setupEventListeners();
        this.startPeriodicUpdate();
        this.requestStateUpdate();
    }

    /**
     * Load persisted state from chrome.storage.
     */
    loadPersistedState() {
        try {
            chrome.storage.local.get(['pinned'], (result) => {
                if (result.pinned) {
                    this.togglePin(true);
                }
            });
        } catch (e) {
            console.warn('[VanDap Popup] Could not load persisted state:', e);
        }
    }

    setupEventListeners() {
        // Close button
        const closeBtn = document.getElementById('closeBtn');
        closeBtn?.addEventListener('click', () => {
            window.close();
        });

        // Pin button
        const pinBtn = document.getElementById('pinBtn');
        pinBtn?.addEventListener('click', () => {
            this.togglePin();
        });

        // Auto mode toggle
        const autoModeToggle = document.getElementById('autoModeToggle');
        autoModeToggle?.addEventListener('change', (e) => {
            // Cập nhật class cho visual feedback
            const toggleContainer = e.target.closest('.toggle');
            if (e.target.checked) {
                toggleContainer.classList.add('checked');
            } else {
                toggleContainer.classList.remove('checked');
            }
            
            this.setAutoMode(e.target.checked);
        });

        // Manual click answer button
        const clickAnswerBtn = document.getElementById('clickAnswerBtn');
        clickAnswerBtn?.addEventListener('click', () => {
            this.clickAnswerManually();
        });

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        refreshBtn?.addEventListener('click', () => {
            this.refreshQuestion();
        });

        // Stop auto button
        const stopAutoBtn = document.getElementById('stopAutoBtn');
        stopAutoBtn?.addEventListener('click', () => {
            this.stopAutoMode();
        });

        // Restart button
        const restartBtn = document.getElementById('restartBtn');
        restartBtn?.addEventListener('click', () => {
            this.restartQuiz();
        });

        console.log('[VanDap Popup] Event listeners setup complete');
    }

    // Bắt đầu cập nhật định kỳ
    startPeriodicUpdate() {
        // Cập nhật ngay lập tức
        this.requestStateUpdate();
        
        // Cập nhật mỗi 2 giây
        this.updateInterval = setInterval(() => {
            this.requestStateUpdate();
        }, 2000);
    }

    // Yêu cầu cập nhật state từ content script
    requestStateUpdate() {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {action: 'getState'}, (response) => {
                    if (chrome.runtime.lastError) {
                        console.log('[VanDap Popup] Error getting state:', chrome.runtime.lastError.message);
                        this.updateUI({
                            isVanDapPage: false,
                            question: null,
                            answer: null,
                            questionCount: 0,
                            maxQuestions: 5,
                            availableOptions: []
                        });
                        return;
                    }
                    
                    if (response) {
                        this.updateUI(response);
                    }
                });
            }
        });
    }

    // Cập nhật giao diện
    updateUI(state) {
        this.currentState = state;

        // Cập nhật URL status
        const urlStatus = document.getElementById('urlStatus');
        if (state.isVanDapPage) {
            urlStatus.textContent = '✅ Đang ở trang vấn đáp';
            urlStatus.className = 'url-status success';
        } else {
            urlStatus.textContent = '❌ Không phải trang vấn đáp';
            urlStatus.className = 'url-status error';
        }

        // Cập nhật question status
        const questionStatus = document.getElementById('questionStatus');
        if (state.question) {
            questionStatus.textContent = '✅ Đã phát hiện câu hỏi';
            questionStatus.className = 'question-status success';
        } else {
            questionStatus.textContent = '⏳ Chờ câu hỏi...';
            questionStatus.className = 'question-status waiting';
        }

        // Cập nhật câu hỏi hiện tại
        const currentQuestion = document.getElementById('currentQuestion');
        if (state.question) {
            currentQuestion.textContent = state.question;
            currentQuestion.className = 'current-question active';
        } else {
            currentQuestion.textContent = 'Chưa phát hiện câu hỏi';
            currentQuestion.className = 'current-question inactive';
        }

        // Cập nhật đáp án
        const currentAnswer = document.getElementById('currentAnswer');
        const clickAnswerBtn = document.getElementById('clickAnswerBtn');
        if (state.answer) {
            currentAnswer.textContent = state.answer;
            currentAnswer.className = 'current-answer found';
            clickAnswerBtn.disabled = false;
            clickAnswerBtn.textContent = '🎯 Nhấn đáp án';
        } else {
            currentAnswer.textContent = 'Chưa tìm thấy đáp án';
            currentAnswer.className = 'current-answer not-found';
            clickAnswerBtn.disabled = true;
            clickAnswerBtn.textContent = '❌ Không có đáp án';
        }

        // Cập nhật auto mode toggle
        const autoModeToggle = document.getElementById('autoModeToggle');
        if (autoModeToggle) {
            autoModeToggle.checked = state.autoMode;
            
            // Cập nhật class visual cho toggle
            const toggleContainer = autoModeToggle.closest('.toggle');
            if (state.autoMode) {
                toggleContainer.classList.add('checked');
            } else {
                toggleContainer.classList.remove('checked');
            }
        }

        // Cập nhật visibility của stop button
        const stopAutoBtn = document.getElementById('stopAutoBtn');
        if (stopAutoBtn) {
            stopAutoBtn.style.display = state.autoMode ? 'inline-block' : 'none';
        }

        // Cập nhật counter
        const questionCounter = document.getElementById('questionCounter');
        if (questionCounter) {
            questionCounter.textContent = `${state.questionCount}/${state.maxQuestions}`;
            
            if (state.questionCount >= state.maxQuestions) {
                questionCounter.className = 'counter complete';
            } else if (state.questionCount > 0) {
                questionCounter.className = 'counter active';
            } else {
                questionCounter.className = 'counter waiting';
            }
        }

        // Cập nhật available options
        this.updateAvailableOptions(state.availableOptions);

        // Log update
        this.addLogMessage(`📊 Cập nhật: ${state.questionCount}/5 câu - ${state.answer ? 'Có đáp án' : 'Chưa có đáp án'}`);
    }

    // Cập nhật danh sách options có sẵn
    updateAvailableOptions(options) {
        const optionsSection = document.getElementById('optionsSection');
        const availableOptions = document.getElementById('availableOptions');
        
        if (options && options.length > 0) {
            optionsSection.style.display = 'block';
            availableOptions.innerHTML = '';
            
            options.forEach((option, index) => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'option-item';
                optionDiv.textContent = `${index + 1}. ${option}`;
                availableOptions.appendChild(optionDiv);
            });
        } else {
            optionsSection.style.display = 'none';
        }
    }

    /**
     * Toggle pin popup state and persist to storage.
     * @param {boolean} forceState - Optional force state instead of toggle.
     */
    togglePin(forceState = null) {
        this.isPinned = forceState !== null ? forceState : !this.isPinned;
        const pinBtn = document.getElementById('pinBtn');
        const body = document.body;
        
        if (this.isPinned) {
            body.classList.add('pinned');
            pinBtn.classList.add('pinned');
            pinBtn.title = 'Bỏ ghim popup';
            pinBtn.textContent = '📍'; // Đổi icon khi được pin
            if (forceState === null) { // Only log when user manually toggles
                this.addLogMessage('📌 Đã ghim popup - sẽ không tự đóng khi click đáp án');
            }
        } else {
            body.classList.remove('pinned');
            pinBtn.classList.remove('pinned');
            pinBtn.title = 'Ghim popup';
            pinBtn.textContent = '📌'; // Icon bình thường
            if (forceState === null) { // Only log when user manually toggles
                this.addLogMessage('📌 Đã bỏ ghim popup - sẽ tự đóng sau khi click đáp án');
            }
        }
        
        // Persist to storage
        try {
            chrome.storage.local.set({ pinned: this.isPinned });
        } catch (e) {
            console.warn('[VanDap Popup] Could not persist pin state:', e);
        }
    }

    // Đặt auto mode
    setAutoMode(enabled) {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'setAutoMode',
                    enabled: enabled
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('[VanDap Popup] Error setting auto mode:', chrome.runtime.lastError.message);
                        return;
                    }
                    
                    this.addLogMessage(`🚀 Chế độ tự động hoàn toàn: ${enabled ? 'BẬT' : 'TẮT'}`);
                    
                    if (enabled) {
                        this.addLogMessage('🎯 Extension sẽ tự động tìm đáp án, click và chuyển câu hỏi tiếp theo');
                    }
                });
            }
        });
    }

    // Dừng auto mode
    stopAutoMode() {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'stopAutoMode'
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('[VanDap Popup] Error stopping auto mode:', chrome.runtime.lastError.message);
                        return;
                    }
                    
                    this.addLogMessage('⏹️ Đã dừng tất cả hoạt động tự động');
                    
                    // Cập nhật UI
                    const autoModeToggle = document.getElementById('autoModeToggle');
                    
                    if (autoModeToggle) {
                        autoModeToggle.checked = false;
                        autoModeToggle.closest('.toggle').classList.remove('checked');
                    }
                });
            }
        });
    }

    // Khởi động lại quiz
    restartQuiz() {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'restartQuiz'
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('[VanDap Popup] Error restarting quiz:', chrome.runtime.lastError.message);
                        return;
                    }
                    
                    this.addLogMessage('🔄 Đã khởi động lại quiz từ đầu');
                    
                    if (response) {
                        this.updateUI(response);
                    }
                });
            }
        });
    }

    // Click đáp án thủ công
    clickAnswerManually() {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {action: 'clickAnswer'}, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('[VanDap Popup] Error clicking answer:', chrome.runtime.lastError.message);
                        this.addLogMessage('❌ Lỗi khi click đáp án');
                        return;
                    }
                    
                    if (response && response.success) {
                        if (this.isPinned) {
                            this.addLogMessage('✅ Đã click đáp án - popup được giữ mở do đã ghim');
                        } else {
                            this.addLogMessage('✅ Đã click đáp án - popup sẽ đóng sau 1 giây');
                            // Chỉ đóng popup nếu không được pin
                            setTimeout(() => {
                                window.close();
                            }, 1000); // Đợi 1 giây để người dùng thấy thông báo
                        }
                    } else {
                        this.addLogMessage('❌ Không thể click đáp án');
                    }
                });
            }
        });
    }

    // Làm mới câu hỏi
    refreshQuestion() {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {action: 'refreshQuestion'}, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('[VanDap Popup] Error refreshing:', chrome.runtime.lastError.message);
                        return;
                    }
                    
                    this.addLogMessage('🔄 Đã làm mới');
                    if (response) {
                        this.updateUI(response);
                    }
                });
            }
        });
    }

    // Thêm log message
    addLogMessage(message) {
        const logMessages = document.getElementById('logMessages');
        if (!logMessages) return;

        const logItem = document.createElement('div');
        logItem.className = 'log-item';
        
        const timestamp = new Date().toLocaleTimeString('vi-VN');
        logItem.innerHTML = `<span class="timestamp">${timestamp}</span> ${message}`;
        
        // Thêm vào đầu danh sách
        logMessages.insertBefore(logItem, logMessages.firstChild);
        
        // Giới hạn số lượng log (giữ 20 dòng cuối)
        while (logMessages.children.length > 20) {
            logMessages.removeChild(logMessages.lastChild);
        }
    }

    // Cleanup khi đóng popup
    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Lắng nghe message từ content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'questionUpdate') {
        console.log('[VanDap Popup] Received question update:', request);
        
        // Popup có thể đã được khởi tạo, cập nhật UI
        if (window.vanDapPopup) {
            window.vanDapPopup.updateUI({
                isVanDapPage: request.isVanDapPage,
                question: request.question,
                answer: request.answer,
                questionCount: request.questionCount,
                maxQuestions: request.maxQuestions,
                availableOptions: request.availableOptions || []
            });
        }
    }
});

// Khởi tạo khi DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.vanDapPopup = new VanDapPopup();
});

// Cleanup khi đóng
window.addEventListener('beforeunload', () => {
    if (window.vanDapPopup) {
        window.vanDapPopup.cleanup();
    }
});