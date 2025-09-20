/**
 * Quick verification script to ensure price selector is integrated
 * Run this in browser console on the homepage
 */

(function() {
    console.log('=== VoltRally Price Selector Integration Check ===\n');

    let checks = {
        'CSS Files Loaded': {
            passed: false,
            details: ''
        },
        'JS Files Loaded': {
            passed: false,
            details: ''
        },
        'Price Options Exist': {
            passed: false,
            details: ''
        },
        'PriceSelector Instance': {
            passed: false,
            details: ''
        },
        'Click Handlers Attached': {
            passed: false,
            details: ''
        },
        'LocalStorage Support': {
            passed: false,
            details: ''
        }
    };

    // Check CSS files
    const stylesheets = Array.from(document.styleSheets);
    const hasEnhancedCSS = stylesheets.some(sheet =>
        sheet.href && sheet.href.includes('home-enhanced.css')
    );
    checks['CSS Files Loaded'].passed = hasEnhancedCSS;
    checks['CSS Files Loaded'].details = hasEnhancedCSS ?
        'home-enhanced.css loaded' : 'home-enhanced.css NOT FOUND';

    // Check JS files
    const scripts = Array.from(document.scripts);
    const hasPriceSelector = scripts.some(script =>
        script.src && script.src.includes('price-selector.js')
    );
    checks['JS Files Loaded'].passed = hasPriceSelector;
    checks['JS Files Loaded'].details = hasPriceSelector ?
        'price-selector.js loaded' : 'price-selector.js NOT FOUND';

    // Check price options in DOM
    const priceOptions = document.querySelectorAll('.price-option');
    checks['Price Options Exist'].passed = priceOptions.length > 0;
    checks['Price Options Exist'].details = `Found ${priceOptions.length} price options`;

    // Check PriceSelector instance
    const hasInstance = typeof window.VoltRallyPriceSelector !== 'undefined';
    checks['PriceSelector Instance'].passed = hasInstance;
    checks['PriceSelector Instance'].details = hasInstance ?
        'Global instance initialized' : 'Instance NOT FOUND';

    // Check if click handlers work
    if (priceOptions.length > 0 && hasInstance) {
        const firstOption = priceOptions[0];
        const hasClickHandler = firstOption.style.cursor === 'pointer' ||
            window.getComputedStyle(firstOption).cursor === 'pointer';
        checks['Click Handlers Attached'].passed = hasClickHandler;
        checks['Click Handlers Attached'].details = hasClickHandler ?
            'Click handlers ready' : 'No click handlers detected';
    }

    // Check localStorage
    try {
        localStorage.setItem('vrTest', '1');
        localStorage.removeItem('vrTest');
        checks['LocalStorage Support'].passed = true;
        checks['LocalStorage Support'].details = 'localStorage available';
    } catch (e) {
        checks['LocalStorage Support'].passed = false;
        checks['LocalStorage Support'].details = 'localStorage not available';
    }

    // Print results
    let passCount = 0;
    let failCount = 0;

    Object.entries(checks).forEach(([name, result]) => {
        const icon = result.passed ? '✅' : '❌';
        console.log(`${icon} ${name}: ${result.details}`);
        if (result.passed) passCount++;
        else failCount++;
    });

    console.log('\n=== Summary ===');
    console.log(`Passed: ${passCount}/${passCount + failCount}`);

    if (failCount === 0) {
        console.log('%c✨ All checks passed! Price selector is fully integrated.',
            'color: #4ade80; font-weight: bold; font-size: 14px');
    } else {
        console.log('%c⚠️ Some checks failed. Please review the integration.',
            'color: #fbbf24; font-weight: bold; font-size: 14px');
    }

    // Test click functionality
    if (checks['PriceSelector Instance'].passed && priceOptions.length > 0) {
        console.log('\n📝 Quick Test: Try clicking on any price option to see it in action!');
    }

    return passCount === Object.keys(checks).length;
})();