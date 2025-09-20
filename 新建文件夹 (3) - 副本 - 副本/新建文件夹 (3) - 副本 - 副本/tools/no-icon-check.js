/**
 * VoltRally No-Icon Validation Tool
 * 检查是否违反无图标政策
 */

const fs = require('fs');
const path = require('path');

class NoIconChecker {
    constructor() {
        // 禁用的模式列表
        this.forbiddenPatterns = [
            // SVG相关
            { pattern: /<svg/gi, description: 'SVG element found' },
            { pattern: /<\/svg>/gi, description: 'SVG closing tag found' },
            { pattern: /<use\s+xlink:href=/gi, description: 'SVG use element found' },

            // 图标类
            { pattern: /<i\s+class="[^"]*icon[^"]*"/gi, description: 'Icon class found' },
            { pattern: /class="[^"]*\s*fa-[^"]*"/gi, description: 'FontAwesome class found' },
            { pattern: /class="[^"]*material-icons[^"]*"/gi, description: 'Material Icons class found' },
            { pattern: /class="[^"]*icon-[^"]*"/gi, description: 'Icon prefix class found' },

            // 图标字体
            { pattern: /fontawesome/gi, description: 'FontAwesome reference found' },
            { pattern: /font-awesome/gi, description: 'Font-Awesome reference found' },
            { pattern: /material-icons/gi, description: 'Material Icons reference found' },
            { pattern: /iconfont/gi, description: 'Icon font reference found' },

            // CSS伪元素图标
            { pattern: /content:\s*["']\\[ef]/gi, description: 'Icon unicode in CSS content found' },

            // Emoji
            { pattern: /[\u{1F300}-\u{1F9FF}]/gu, description: 'Emoji character found' },
            { pattern: /[\u{2600}-\u{26FF}]/gu, description: 'Symbol emoji found' },
            { pattern: /[\u{2700}-\u{27BF}]/gu, description: 'Dingbat emoji found' },

            // 背景图标
            { pattern: /background-image:\s*url\([^)]*icon[^)]*\)/gi, description: 'Background icon image found' },

            // 外部图标CDN
            { pattern: /unpkg\.com[^"'\s]*icon/gi, description: 'Unpkg icon CDN found' },
            { pattern: /cdnjs\.cloudflare\.com[^"'\s]*icon/gi, description: 'CDNJS icon CDN found' },
            { pattern: /jsdelivr\.net[^"'\s]*icon/gi, description: 'jsDelivr icon CDN found' }
        ];

        this.checkedFiles = 0;
        this.violations = [];
        this.excludePaths = [
            'node_modules',
            '.git',
            'dist',
            'build',
            '.vscode',
            'tools'
        ];
    }

    /**
     * 检查单个文件
     */
    checkFile(filePath) {
        const ext = path.extname(filePath);

        // 只检查相关文件类型
        if (!['.html', '.css', '.js', '.jsx'].includes(ext)) {
            return;
        }

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const fileName = path.relative(process.cwd(), filePath);

            this.forbiddenPatterns.forEach(({ pattern, description }) => {
                const matches = content.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        // 查找行号
                        const lines = content.substring(0, content.indexOf(match)).split('\n');
                        const lineNumber = lines.length;

                        this.violations.push({
                            file: fileName,
                            line: lineNumber,
                            description: description,
                            match: match.substring(0, 100) // 截取前100个字符
                        });
                    });
                }
            });

            this.checkedFiles++;

        } catch (error) {
            console.error(`Error reading file ${filePath}:`, error.message);
        }
    }

    /**
     * 递归检查目录
     */
    checkDirectory(dirPath) {
        try {
            const items = fs.readdirSync(dirPath);

            items.forEach(item => {
                const fullPath = path.join(dirPath, item);

                // 跳过排除的路径
                if (this.excludePaths.some(exclude => fullPath.includes(exclude))) {
                    return;
                }

                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    this.checkDirectory(fullPath);
                } else if (stat.isFile()) {
                    this.checkFile(fullPath);
                }
            });
        } catch (error) {
            console.error(`Error reading directory ${dirPath}:`, error.message);
        }
    }

    /**
     * 运行检查
     */
    run(targetPath = '.') {
        console.log('🔍 VoltRally No-Icon Checker v1.0');
        console.log('==================================\n');

        const fullPath = path.resolve(targetPath);
        console.log(`Checking: ${fullPath}\n`);

        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            this.checkDirectory(fullPath);
        } else {
            this.checkFile(fullPath);
        }

        this.printReport();
    }

    /**
     * 打印报告
     */
    printReport() {
        console.log('\n📊 Check Report');
        console.log('==============\n');

        console.log(`Files checked: ${this.checkedFiles}`);
        console.log(`Violations found: ${this.violations.length}\n`);

        if (this.violations.length > 0) {
            console.log('❌ VIOLATIONS FOUND:\n');

            // 按文件分组
            const groupedViolations = {};
            this.violations.forEach(violation => {
                if (!groupedViolations[violation.file]) {
                    groupedViolations[violation.file] = [];
                }
                groupedViolations[violation.file].push(violation);
            });

            // 打印每个文件的违规
            Object.entries(groupedViolations).forEach(([file, violations]) => {
                console.log(`📄 ${file}:`);
                violations.forEach(v => {
                    console.log(`   Line ${v.line}: ${v.description}`);
                    console.log(`   Found: "${v.match}"`);
                });
                console.log('');
            });

            console.log('⚠️  Please replace all icon usage with text labels!');
            console.log('📚 Examples:');
            console.log('   Instead of: <i class="fa-search"></i>');
            console.log('   Use: <span>Search</span>\n');
            console.log('   Instead of: 🛒 (emoji)');
            console.log('   Use: <span>Cart</span>\n');

            process.exit(1);
        } else {
            console.log('✅ All clear! No icon violations found.');
            console.log('👍 Your code follows the no-icon policy.\n');
        }
    }
}

// 浏览器端版本（用于在页面中运行）
if (typeof window !== 'undefined') {
    window.NoIconChecker = class BrowserNoIconChecker {
        constructor() {
            this.violations = [];
        }

        /**
         * 检查当前页面DOM
         */
        checkDOM() {
            // 检查SVG元素
            const svgs = document.querySelectorAll('svg');
            svgs.forEach(svg => {
                this.violations.push({
                    element: svg,
                    type: 'SVG element',
                    suggestion: 'Replace with text label'
                });
            });

            // 检查图标类
            const iconClasses = [
                '[class*="icon"]',
                '[class*="fa-"]',
                '[class*="material-icons"]'
            ];

            iconClasses.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    this.violations.push({
                        element: el,
                        type: `Icon class: ${el.className}`,
                        suggestion: 'Replace with text label'
                    });
                });
            });

            // 检查伪元素内容
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                const before = window.getComputedStyle(el, '::before').content;
                const after = window.getComputedStyle(el, '::after').content;

                if (before && before.match(/[\\e\\f]/)) {
                    this.violations.push({
                        element: el,
                        type: 'Icon in ::before pseudo-element',
                        suggestion: 'Remove icon content'
                    });
                }

                if (after && after.match(/[\\e\\f]/)) {
                    this.violations.push({
                        element: el,
                        type: 'Icon in ::after pseudo-element',
                        suggestion: 'Remove icon content'
                    });
                }
            });

            return this.violations;
        }

        /**
         * 运行检查并在控制台输出结果
         */
        run() {
            console.log('%c🔍 VoltRally No-Icon DOM Checker', 'font-size: 16px; font-weight: bold; color: #d4af37;');
            console.log('====================================\n');

            this.checkDOM();

            if (this.violations.length > 0) {
                console.log(`%c❌ Found ${this.violations.length} violations:`, 'color: #ff5c5c; font-weight: bold;\n');

                this.violations.forEach((violation, index) => {
                    console.group(`Violation #${index + 1}`);
                    console.log('Type:', violation.type);
                    console.log('Element:', violation.element);
                    console.log('Suggestion:', violation.suggestion);
                    console.groupEnd();
                });

                console.log('\n%c⚠️  Please replace all icons with text labels!', 'color: #fbbf24; font-weight: bold;');
            } else {
                console.log('%c✅ All clear! No icon violations found in DOM.', 'color: #4ade80; font-weight: bold;');
            }

            return this.violations.length === 0;
        }
    };

    // 自动运行检查（在页面加载完成后）
    document.addEventListener('DOMContentLoaded', () => {
        const checker = new window.NoIconChecker();
        window.noIconCheck = () => checker.run();
        console.log('💡 Tip: Run noIconCheck() in console to check for icon violations.');
    });
}

// Node.js CLI执行
if (typeof module !== 'undefined' && require.main === module) {
    const checker = new NoIconChecker();
    const targetPath = process.argv[2] || '.';
    checker.run(targetPath);
}