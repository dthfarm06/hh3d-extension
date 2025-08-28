// Quick test script for VanDap Extension
console.log('🧪 Starting VanDap Extension Quick Test...');

// Test 1: Check if extension is loaded
setTimeout(() => {
    if (typeof window.vanDapHelper !== 'undefined') {
        console.log('✅ Extension loaded successfully');
        
        // Test 2: Check URL detection
        const isVanDap = window.vanDapHelper.isVanDapPage();
        console.log('🔗 Is VanDap Page:', isVanDap);
        
        // Test 3: Test question detection
        const question = window.vanDapHelper.detectCurrentQuestion();
        console.log('❓ Detected Question:', question || 'NONE');
        
        // Test 4: Test options detection
        const options = window.vanDapHelper.getAvailableOptions();
        console.log('📝 Detected Options:', options.length, 'options');
        options.forEach((opt, i) => console.log(`  ${i+1}. ${opt.text}`));
        
        // Test 5: Test answer finding
        if (question) {
            const answerData = window.vanDapHelper.findAnswer(question);
            console.log('💡 Found Answer:', answerData ? answerData.dap_an : 'NONE');
        }
        
        // Test 6: Full debug
        console.log('🔧 Running full debug...');
        const debugInfo = window.vanDapHelper.debugExtension();
        
        console.log('✅ All tests completed!');
        
    } else {
        console.log('❌ Extension not loaded');
        console.log('🔍 Checking for common issues...');
        
        // Check if we're on the right page
        console.log('Current URL:', window.location.href);
        
        // Check if content script is injected
        const scripts = Array.from(document.scripts);
        const hasContentScript = scripts.some(script => 
            script.src && script.src.includes('content.js')
        );
        console.log('Content script detected:', hasContentScript);
    }
}, 2000);

// Test selectors manually
console.log('🔍 Testing selectors manually...');

// Test question selectors
const questionSelectors = [
    '#question', '.question-text', '.quiz-question', '.question',
    'h1', 'h2', 'h3', 'p'
];

questionSelectors.forEach(selector => {
    try {
        const elements = document.querySelectorAll(selector);
        const questionsFound = Array.from(elements).filter(el => 
            el.textContent.includes('?') && el.textContent.trim().length > 10
        );
        if (questionsFound.length > 0) {
            console.log(`✅ Found ${questionsFound.length} questions with selector: ${selector}`);
            questionsFound.forEach(q => console.log(`   "${q.textContent.trim().substring(0, 100)}..."`));
        }
    } catch (error) {
        console.log(`❌ Error with selector ${selector}:`, error.message);
    }
});

// Test option selectors
const optionSelectors = [
    '.option', '.quiz-option', '.answer-option', '.choice', '.answer',
    'button', '[data-index]'
];

optionSelectors.forEach(selector => {
    try {
        const elements = document.querySelectorAll(selector);
        if (elements.length >= 2) {
            console.log(`✅ Found ${elements.length} potential options with selector: ${selector}`);
            Array.from(elements).slice(0, 4).forEach((opt, i) => 
                console.log(`   ${i+1}. "${opt.textContent.trim().substring(0, 50)}..."`)
            );
        }
    } catch (error) {
        console.log(`❌ Error with selector ${selector}:`, error.message);
    }
});

console.log('🧪 Quick test completed. Check results above.');