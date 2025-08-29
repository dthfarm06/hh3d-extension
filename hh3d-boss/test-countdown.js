// Test parseCountdown function
function parseCountdown(timerText) {
    console.log(`Parsing: "${timerText}"`);
    
    const patterns = [
        /Chờ\s+(\d+)\s+phút\s+(\d+)\s+giây/i,
        /Còn\s+(\d+)\s+phút\s+(\d+)\s+giây/i,
        /(\d+)\s+phút\s+(\d+)\s+giây/i,
        /Còn\s+(\d+):(\d+)/,
        /(\d+):(\d+):(\d+)/,
        /(\d+):(\d+)/
    ];

    for (const pattern of patterns) {
        const match = timerText.match(pattern);
        if (match) {
            console.log(`Pattern matched:`, match);
            if (match.length === 4) {
                const totalSeconds = parseInt(match[1]) * 60 + parseInt(match[2]);
                console.log(`Result: ${totalSeconds} seconds`);
                return totalSeconds;
            } else if (match.length === 3) {
                const totalSeconds = parseInt(match[1]) * 60 + parseInt(match[2]);
                console.log(`Result: ${totalSeconds} seconds`);
                return totalSeconds;
            }
        }
    }
    console.log('No pattern matched');
    return 0;
}

// Test cases
const tests = [
    'Chờ 12 phút 53 giây để tấn công lần tiếp theo.',
    'Chờ 5 phút 30 giây để tấn công lần tiếp theo.',
    'Chờ 0 phút 45 giây',
    'Còn 10 phút 25 giây',
    '15 phút 30 giây',
    'Còn 5:30',
    '10:45',
    'No match text'
];

console.log('='.repeat(50));
console.log('🔍 Testing parseCountdown function');
console.log('='.repeat(50));

tests.forEach((test, i) => {
    console.log(`\n=== Test ${i+1} ===`);
    const result = parseCountdown(test);
    const expected = test.includes('12 phút 53') ? 773 :
                    test.includes('5 phút 30') ? 330 :
                    test.includes('0 phút 45') ? 45 :
                    test.includes('10 phút 25') ? 625 :
                    test.includes('15 phút 30') ? 930 :
                    test.includes('5:30') ? 330 :
                    test.includes('10:45') ? 645 : 0;
    
    console.log(`Expected: ${expected} seconds`);
    console.log(`Result: ${result === expected ? '✅ PASS' : '❌ FAIL'}`);
});

console.log('\n' + '='.repeat(50));
console.log('Test completed!');
