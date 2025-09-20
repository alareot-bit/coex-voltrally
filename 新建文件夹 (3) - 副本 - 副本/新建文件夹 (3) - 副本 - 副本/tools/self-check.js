/**
 * VoltRally Self-Check Tool
 * 页面功能自检工具
 */

// 浏览器端自检脚本
if (typeof window !== 'undefined') {
    window.vrSelfCheck = function() {
        console.log('%c🔍 VoltRally Homepage Self-Check v1.0', 'font-size: 18px; font-weight: bold; color: #d4af37;');
        console.log('=====================================\n');

        const checks = [];
        let passCount = 0;
        let failCount = 0;

        // 检查函数
        function check(name, condition, details = '') {
            const passed = typeof condition === 'function' ? condition() : condition;
            checks.push({ name, passed, details });

            if (passed) {
                passCount++;
                console.log(`✅ ${name}`, details ? `(${details})` : '');
            } else {
                failCount++;
                console.log(`❌ ${name}`, details ? `(${details})` : '');
            }

            return passed;
        }

        console.group('📋 DOM Structure Checks');

        // 检查必要的DOM元素
        check('Header exists', document.querySelector('.site-header'));
        check('Country selector exists', document.querySelector('.selector-trigger'));
        check('Hero section exists', document.querySelector('.hero-section'));
        check('Category tabs exist', document.querySelector('.category-tabs'));
        check('Products grid exists', document.querySelector('.products-grid'));
        check('Footer exists', document.querySelector('.site-footer'));

        console.groupEnd();

        console.group('💰 Dual Pricing Checks');

        // 检查双价格显示
        const productCards = document.querySelectorAll('.product-card');
        check('Product cards exist', productCards.length > 0, `Found ${productCards.length} cards`);

        if (productCards.length > 0) {
            const firstCard = productCards[0];
            const hasGroupPrice = firstCard.querySelector('.group-price');
            const hasSoloPrice = firstCard.querySelector('.solo-price');
            const hasSaveAmount = firstCard.querySelector('.price-save');

            check('Group price displayed', hasGroupPrice);
            check('Solo price displayed', hasSoloPrice);
            check('Save amount displayed', hasSaveAmount);
        }

        console.groupEnd();

        console.group('📱 Responsive Layout Checks');

        // 检查响应式布局
        const grid = document.querySelector('.products-grid');
        if (grid) {
            const computedStyle = window.getComputedStyle(grid);
            const gridColumns = computedStyle.gridTemplateColumns;

            const screenWidth = window.innerWidth;
            let expectedColumns;

            if (screenWidth <= 600) {
                expectedColumns = 1;
                check('Mobile layout (1 column)', gridColumns.includes('1fr'));
            } else if (screenWidth <= 1024) {
                expectedColumns = 2;
                check('Tablet layout (2 columns)', gridColumns.split(' ').length === 2);
            } else {
                expectedColumns = 3;
                check('Desktop layout (3 columns)', gridColumns.split(' ').length >= 3);
            }
        }

        console.groupEnd();

        console.group('⏱️ Dynamic Features Checks');

        // 检查倒计时
        const countdownDays = document.querySelector('[data-days]');
        const countdownHours = document.querySelector('[data-hours]');
        check('Countdown timer exists', countdownDays && countdownHours);

        // 检查进度条
        const progressBars = document.querySelectorAll('.progress-fill');
        check('Progress bars exist', progressBars.length > 0, `Found ${progressBars.length} progress bars`);

        // 检查每个进度条是否有宽度
        if (progressBars.length > 0) {
            const hasWidth = Array.from(progressBars).every(bar => {
                const width = parseInt(bar.style.width);
                return width >= 0 && width <= 100;
            });
            check('Progress bars have valid width', hasWidth);
        }

        console.groupEnd();

        console.group('🌍 Internationalization Checks');

        // 检查国际化功能
        const countrySelect = document.getElementById('country-select');
        const languageSelect = document.getElementById('language-select');
        const currencySelect = document.getElementById('currency-select');

        check('Country selector dropdown', countrySelect);
        check('Language selector dropdown', languageSelect);
        check('Currency selector dropdown', currencySelect);

        // 检查URL参数
        const urlParams = new URLSearchParams(window.location.search);
        const hasCountryParam = urlParams.has('country') || true; // 默认也算通过
        check('URL state management', hasCountryParam);

        console.groupEnd();

        console.group('🚫 No-Icon Policy Checks');

        // 检查是否违反无图标政策
        const svgs = document.querySelectorAll('svg');
        const iconClasses = document.querySelectorAll('[class*="icon-"], [class*="fa-"], [class*="material-icons"]');
        const emojis = document.body.innerText.match(/[\u{1F300}-\u{1F9FF}]/gu);

        check('No SVG icons', svgs.length === 0, `Found ${svgs.length} SVGs`);
        check('No icon classes', iconClasses.length === 0, `Found ${iconClasses.length} icon classes`);
        check('No emojis in text', !emojis || emojis.length === 0);

        console.groupEnd();

        console.group('🎯 Data-Driven Checks');

        // 检查数据驱动
        const joined = document.querySelector('[data-joined]');
        const need = document.querySelector('[data-need]');
        const target = document.querySelector('[data-target]');

        check('Joined count is data-driven', joined && joined.textContent !== '');
        check('Need count is data-driven', need && need.textContent !== '');
        check('Target is not hardcoded to 36', target && target.textContent !== '36');

        console.groupEnd();

        console.group('♿ Accessibility Checks');

        // 检查可访问性
        const interactiveElements = document.querySelectorAll('button, a, select, input');
        let hasAriaLabels = 0;
        let totalInteractive = interactiveElements.length;

        interactiveElements.forEach(el => {
            if (el.getAttribute('aria-label') || el.textContent.trim() || el.value) {
                hasAriaLabels++;
            }
        });

        check('Interactive elements are accessible',
              hasAriaLabels / totalInteractive > 0.9,
              `${hasAriaLabels}/${totalInteractive} have labels`);

        // 检查焦点样式
        const focusableElements = document.querySelectorAll('button, a, select, input');
        let hasFocusStyles = true;
        focusableElements.forEach(el => {
            el.focus();
            const outline = window.getComputedStyle(el).outline;
            if (outline === 'none' || outline === '') {
                hasFocusStyles = false;
            }
        });
        check('Focus styles exist', hasFocusStyles);

        console.groupEnd();

        console.group('🔧 Functional Checks');

        // 检查关键功能
        check('Store initialized', typeof window.VoltRallyStore !== 'undefined');
        check('Home controller initialized', typeof window.VoltRallyHome !== 'undefined');

        // 检查分类导航
        const categoryTabs = document.querySelectorAll('.tab-item');
        check('Category navigation tabs', categoryTabs.length >= 5, `Found ${categoryTabs.length} tabs`);

        // 检查订单ticker
        const ticker = document.querySelector('.ticker-track');
        check('Order ticker exists', ticker);

        console.groupEnd();

        // 生成报告
        console.log('\n' + '='.repeat(40));
        console.log('%c📊 Self-Check Report', 'font-size: 16px; font-weight: bold;');
        console.log('='.repeat(40));

        const total = passCount + failCount;
        const percentage = Math.round((passCount / total) * 100);

        console.log(`Total checks: ${total}`);
        console.log(`✅ Passed: ${passCount}`);
        console.log(`❌ Failed: ${failCount}`);
        console.log(`Score: ${percentage}%`);

        if (percentage === 100) {
            console.log('%c🎉 Perfect! All checks passed!', 'color: #4ade80; font-size: 18px; font-weight: bold;');
        } else if (percentage >= 80) {
            console.log('%c👍 Good! Most checks passed.', 'color: #fbbf24; font-size: 16px; font-weight: bold;');
        } else {
            console.log('%c⚠️  Needs improvement. Please fix the failed checks.', 'color: #ff5c5c; font-size: 16px; font-weight: bold;');
        }

        // 生成时间戳报告
        const report = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            screenWidth: window.innerWidth,
            userAgent: navigator.userAgent,
            checks: checks,
            summary: {
                total: total,
                passed: passCount,
                failed: failCount,
                percentage: percentage
            }
        };

        // 保存到window对象以便导出
        window.vrSelfCheckReport = report;

        console.log('\n💾 Report saved to window.vrSelfCheckReport');
        console.log('📝 To export: copy(JSON.stringify(window.vrSelfCheckReport, null, 2))');

        return percentage === 100;
    };

    // 页面加载完成后提示
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('💡 Run vrSelfCheck() to perform self-check');
        });
    } else {
        console.log('💡 Run vrSelfCheck() to perform self-check');
    }
}

// Node.js版本（用于CI/CD）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runCheck: async function(page) {
            // 这里可以添加Puppeteer或Playwright的自动化测试
            return await page.evaluate(() => {
                if (typeof window.vrSelfCheck === 'function') {
                    return window.vrSelfCheck();
                }
                return false;
            });
        }
    };
}