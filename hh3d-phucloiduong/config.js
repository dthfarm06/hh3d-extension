// Configuration for extension URLs - PHÚC LỢI ĐƯỜNG Only
// Set TEST_MODE = true để sử dụng file local test
// Set TEST_MODE = false để sử dụng URLs thực

const CONFIG = {
    TEST_MODE: false, // Thay đổi thành false khi deploy thực
    
    // URLs for testing (local files)
    TEST_URLS: {
        PHUC_LOI_DUONG: 'file:///c:/Users/huand/Desktop/temp/auto-click/templates/mock-phucloiuong.html'
    },
    
    // URLs for production (real website)
    PROD_URLS: {
        PHUC_LOI_DUONG: 'https://hoathinh3d.mx/phuc-loi-duong'
    },
    
    // Helper functions
    getPhucLoiDuongUrl() {
        return this.TEST_MODE ? this.TEST_URLS.PHUC_LOI_DUONG : this.PROD_URLS.PHUC_LOI_DUONG;
    },
    
    // Check if current URL is a phuc loi duong page
    isPhucLoiDuongPage(url) {
        if (this.TEST_MODE) {
            return url.includes('mock-phucloiuong.html') || 
                   url.includes('hoathinh3d.mx/phuc-loi-duong');
        } else {
            return url.includes('hoathinh3d.mx/phuc-loi-duong');
        }
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

console.log(`🔧 Config loaded: ${CONFIG.TEST_MODE ? 'TEST MODE' : 'PRODUCTION MODE'}`);
console.log(`🎁 Phúc lợi đường URL: ${CONFIG.getPhucLoiDuongUrl()}`);
