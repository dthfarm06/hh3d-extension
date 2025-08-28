// Force click utility - Tệp tiện ích để force click element
function forceClick(element) {
    console.log('🎯 Bắt đầu force click element:', element);
    
    // Phương pháp 1: Click trực tiếp
    try {
        element.click();
        console.log('✅ Method 1: Direct click - SUCCESS');
        return true;
    } catch (e) {
        console.log('❌ Method 1: Direct click - FAILED:', e);
    }
    
    // Phương pháp 2: MouseEvent với bubbles
    try {
        const event = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: element.getBoundingClientRect().left + element.offsetWidth / 2,
            clientY: element.getBoundingClientRect().top + element.offsetHeight / 2
        });
        element.dispatchEvent(event);
        console.log('✅ Method 2: MouseEvent - SUCCESS');
        return true;
    } catch (e) {
        console.log('❌ Method 2: MouseEvent - FAILED:', e);
    }
    
    // Phương pháp 3: Focus + Enter key
    try {
        element.focus();
        const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true
        });
        element.dispatchEvent(enterEvent);
        console.log('✅ Method 3: Focus + Enter - SUCCESS');
        return true;
    } catch (e) {
        console.log('❌ Method 3: Focus + Enter - FAILED:', e);
    }
    
    // Phương pháp 4: Mouse event sequence
    try {
        const rect = element.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        ['mousedown', 'mouseup', 'click'].forEach(eventType => {
            const event = new MouseEvent(eventType, {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: x,
                clientY: y
            });
            element.dispatchEvent(event);
        });
        console.log('✅ Method 4: Mouse sequence - SUCCESS');
        return true;
    } catch (e) {
        console.log('❌ Method 4: Mouse sequence - FAILED:', e);
    }
    
    // Phương pháp 5: Trigger onclick nếu có
    try {
        if (element.onclick) {
            element.onclick();
            console.log('✅ Method 5: Trigger onclick - SUCCESS');
            return true;
        }
    } catch (e) {
        console.log('❌ Method 5: Trigger onclick - FAILED:', e);
    }
    
    // Phương pháp 6: Submit form nếu element trong form
    try {
        const form = element.closest('form');
        if (form && (element.type === 'submit' || element.tagName === 'BUTTON')) {
            form.submit();
            console.log('✅ Method 6: Form submit - SUCCESS');
            return true;
        }
    } catch (e) {
        console.log('❌ Method 6: Form submit - FAILED:', e);
    }
    
    console.log('❌ Tất cả phương pháp click đều thất bại');
    return false;
}

// Xuất hàm để sử dụng
if (typeof module !== 'undefined' && module.exports) {
    module.exports = forceClick;
}
