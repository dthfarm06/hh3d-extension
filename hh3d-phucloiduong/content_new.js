// Content script cho PHÚC LỢI ĐƯỜNG extension
console.log('🚀 PHÚC LỢI ĐƯỜNG Content script loaded');

// Tự động click rương khi vào trang phúc lợi đường
function autoAttendanceOnLoad() {
  const currentUrl = window.location.href;
  
  // Kiểm tra trang phúc lợi đường
  if (currentUrl.includes('hoathinh3d.mx/phuc-loi-duong') || 
      currentUrl.includes('mock-phucloiuong.html')) {
    console.log('🎁 Đã vào trang Phúc Lợi Đường, bắt đầu tự động click rương...');
    
    // Đợi trang load hoàn toàn
    setTimeout(() => {
      const result = autoClickTreasureChests();
      if (result) {
        console.log('✅ ' + result);
        showNotification('✅ ' + result, 'success');
      } else {
        console.log('❌ Không tìm thấy rương nào để mở');
        showNotification('❌ Không tìm thấy rương nào để mở trên trang này', 'error');
      }
    }, 2000);
  }
}

// Hiển thị thông báo
function showNotification(message, type = 'info') {
  // Tạo div thông báo
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    z-index: 10000;
    max-width: 400px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    transition: all 0.3s ease;
  `;
  
  // Styling theo type
  if (type === 'success') {
    notification.style.backgroundColor = '#4CAF50';
    notification.style.color = 'white';
  } else if (type === 'error') {
    notification.style.backgroundColor = '#f44336';
    notification.style.color = 'white';
  } else {
    notification.style.backgroundColor = '#2196F3';
    notification.style.color = 'white';
  }
  
  notification.textContent = message;
  
  // Thêm vào body
  document.body.appendChild(notification);
  
  // Tự động ẩn sau 5 giây
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 5000);
}

// Chạy khi DOM sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoAttendanceOnLoad);
} else {
  autoAttendanceOnLoad();
}

// Lắng nghe sự kiện auto-click rương từ background script
window.addEventListener('autoClickTreasureChests', () => {
  console.log('🎁 Nhận được lệnh auto-click rương từ background script');
  setTimeout(() => {
    const result = autoClickTreasureChests();
    if (result) {
      console.log('✅ ' + result);
      showNotification('✅ ' + result, 'success');
    } else {
      console.log('❌ Không tìm thấy rương nào để mở');
      showNotification('❌ Không tìm thấy rương nào để mở trên trang này', 'error');
    }
  }, 1000);
});

// Hàm force click element với nhiều phương pháp
function forceClickElement(element) {
    console.log('🎯 Bắt đầu force click element:', element);
    let success = false;
    
    // Phương pháp 1: Click trực tiếp
    try {
        element.click();
        console.log('✅ Method 1: Direct click - SUCCESS');
        success = true;
    } catch (e) {
        console.log('❌ Method 1: Direct click - FAILED:', e);
    }
    
    // Phương pháp 2: MouseEvent với tọa độ
    try {
        const rect = element.getBoundingClientRect();
        const event = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2
        });
        element.dispatchEvent(event);
        console.log('✅ Method 2: MouseEvent with coordinates - SUCCESS');
        success = true;
    } catch (e) {
        console.log('❌ Method 2: MouseEvent - FAILED:', e);
    }
    
    // Phương pháp 3: Mouse event sequence
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
        console.log('✅ Method 3: Mouse sequence - SUCCESS');
        success = true;
    } catch (e) {
        console.log('❌ Method 3: Mouse sequence - FAILED:', e);
    }
    
    // Phương pháp 4: Trigger onclick nếu có
    try {
        if (element.onclick && typeof element.onclick === 'function') {
            element.onclick();
            console.log('✅ Method 4: Trigger onclick - SUCCESS');
            success = true;
        }
    } catch (e) {
        console.log('❌ Method 4: Trigger onclick - FAILED:', e);
    }
    
    return success;
}

// Hàm tự động click rương phúc lợi theo thứ tự
function autoClickTreasureChests() {
    console.log('🎁 Bắt đầu tìm và click rương phúc lợi theo thứ tự...');
    
    // Thứ tự rương phải mở: Phàm Giới -> Thiên Cơ -> Địa Nguyên -> Chí Tôn
    const chestOrder = [
        { name: 'Phàm Giới', closeImage: 'pham-gioi-close.png', openImage: 'pham-gioi-open.png' },
        { name: 'Thiên Cơ', closeImage: 'thien-co-close.png', openImage: 'thien-co-open.png' },
        { name: 'Địa Nguyên', closeImage: 'dia-nguyen-close.png', openImage: 'dia-nguyen-open.png' },
        { name: 'Chí Tôn', closeImage: 'chi-ton-close.png', openImage: 'chi-ton-open.png' }
    ];
    
    let clickedChests = [];
    
    // Tìm tất cả các image elements
    const allImages = document.querySelectorAll('img');
    console.log(`📊 Tìm thấy ${allImages.length} image elements`);
    
    // Duyệt qua từng rương theo thứ tự
    for (const chest of chestOrder) {
        console.log(`🔍 Đang tìm rương ${chest.name}...`);
        
        // Tìm rương chưa mở (có ảnh -close.png)
        for (const img of allImages) {
            const imgSrc = img.src || '';
            const imgAlt = img.alt || '';
            const imgTitle = img.title || '';
            
            // Kiểm tra xem có phải rương chưa mở không
            if (imgSrc.includes(chest.closeImage)) {
                console.log(`✅ Tìm thấy rương ${chest.name} chưa mở:`, imgSrc);
                
                // Kiểm tra element có thể click được không
                if (img.offsetParent === null) {
                    console.log('❌ Rương bị ẩn, bỏ qua');
                    continue;
                }
                
                // Scroll đến rương
                img.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Click rương
                setTimeout(() => {
                    const success = forceClickElement(img);
                    if (success) {
                        console.log(`✅ Đã click rương ${chest.name} thành công`);
                        clickedChests.push(chest.name);
                        showNotification(`🎁 Đã mở rương ${chest.name}!`, 'success');
                    } else {
                        console.log(`❌ Không thể click rương ${chest.name}`);
                    }
                }, 500);
                
                // Chỉ click 1 rương mỗi lần, sau đó break để chuyển sang rương tiếp theo
                break;
            }
        }
        
        // Thêm delay giữa các lần click rương
        if (clickedChests.length > 0) {
            break; // Chỉ click 1 rương mỗi lần gọi hàm
        }
    }
    
    if (clickedChests.length > 0) {
        const message = `Đã click ${clickedChests.length} rương: ${clickedChests.join(', ')}`;
        
        // Nếu đã click được rương, tiếp tục tìm rương tiếp theo sau 2 giây
        setTimeout(() => {
            const nextResult = autoClickTreasureChests();
            if (!nextResult) {
                console.log('🎉 Đã hoàn thành click tất cả rương có thể mở');
                showNotification('🎉 Đã hoàn thành mở rương Phúc Lợi Đường!', 'success');
            }
        }, 2000);
        
        return message;
    } else {
        // Kiểm tra xem có rương nào đã mở chưa
        let openedChests = [];
        for (const chest of chestOrder) {
            for (const img of allImages) {
                const imgSrc = img.src || '';
                if (imgSrc.includes(chest.openImage)) {
                    openedChests.push(chest.name);
                    break;
                }
            }
        }
        
        if (openedChests.length > 0) {
            console.log(`📋 Các rương đã mở: ${openedChests.join(', ')}`);
            return `Tất cả rương có thể mở đã được mở. Rương đã mở: ${openedChests.join(', ')}`;
        } else {
            console.log('❌ Không tìm thấy rương nào để mở');
            return null;
        }
    }
}
