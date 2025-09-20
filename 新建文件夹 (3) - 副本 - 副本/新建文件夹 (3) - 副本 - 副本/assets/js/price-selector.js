/**
 * VoltRally Price Selector Module
 * 价格选择交互模块 - 为后期数据对接做准备
 */

class PriceSelector {
    constructor() {
        // 价格模式状态管理
        this.priceMode = {
            global: 'group', // 全局默认模式: 'group' | 'solo'
            products: {} // 每个产品的单独选择状态
        };

        // 价格选择变更回调
        this.callbacks = {
            onModeChange: [],
            onPriceSelect: [],
            onBeforeChange: []
        };

        // 统计数据
        this.analytics = {
            modeChanges: 0,
            lastChangeTime: null,
            preferredMode: null
        };

        // 初始化
        this.init();
    }

    /**
     * 初始化价格选择器
     */
    init() {
        // 从localStorage恢复用户偏好
        this.loadPreferences();

        // 绑定全局价格切换
        this.bindGlobalToggle();

        // 绑定产品卡片价格选择
        this.bindProductPriceSelectors();

        // 监听动态添加的产品卡片
        this.observeNewProducts();

        // 设置键盘快捷键
        this.setupKeyboardShortcuts();

        // 初始化价格显示
        this.updateAllPrices();
    }

    /**
     * 加载用户偏好设置
     */
    loadPreferences() {
        const saved = localStorage.getItem('voltRallyPricePreferences');
        if (saved) {
            try {
                const prefs = JSON.parse(saved);
                this.priceMode.global = prefs.global || 'group';
                this.priceMode.products = prefs.products || {};
                this.analytics.preferredMode = prefs.preferredMode;
            } catch (e) {
                console.error('Failed to load price preferences:', e);
            }
        }
    }

    /**
     * 保存用户偏好设置
     */
    savePreferences() {
        const prefs = {
            global: this.priceMode.global,
            products: this.priceMode.products,
            preferredMode: this.getMostUsedMode(),
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('voltRallyPricePreferences', JSON.stringify(prefs));
    }

    /**
     * 绑定全局价格切换控制
     */
    bindGlobalToggle() {
        // 创建全局切换按钮（如果需要）
        const heroSection = document.querySelector('.hero-section');
        if (heroSection && !document.getElementById('global-price-toggle')) {
            const toggleHtml = `
                <div class="global-price-toggle" id="global-price-toggle">
                    <span class="toggle-label">Price Mode:</span>
                    <div class="toggle-switch" role="switch" aria-checked="${this.priceMode.global === 'group'}">
                        <button type="button" class="toggle-option ${this.priceMode.global === 'group' ? 'active' : ''}" data-mode="group">
                            Group
                        </button>
                        <button type="button" class="toggle-option ${this.priceMode.global === 'solo' ? 'active' : ''}" data-mode="solo">
                            Solo
                        </button>
                    </div>
                </div>
            `;

            // 插入到Hero区域
            const container = heroSection.querySelector('.hero-container');
            if (container) {
                container.insertAdjacentHTML('beforeend', toggleHtml);

                // 绑定点击事件
                const toggleButtons = container.querySelectorAll('.toggle-option');
                toggleButtons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        this.setGlobalMode(btn.dataset.mode);
                    });
                });
            }
        }
    }

    /**
     * 绑定产品卡片价格选择器
     */
    bindProductPriceSelectors() {
        const productCards = document.querySelectorAll('.product-card');

        productCards.forEach(card => {
            const sku = card.dataset.sku;
            if (!sku) return;

            // 获取价格选项元素
            const groupOption = card.querySelector('.group-price');
            const soloOption = card.querySelector('.solo-price');

            if (!groupOption || !soloOption) return;

            // 设置初始状态
            const currentMode = this.getProductMode(sku);
            this.updateProductPriceDisplay(card, currentMode);

            // 绑定点击事件
            groupOption.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectProductPrice(sku, 'group', card);
            });

            soloOption.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectProductPrice(sku, 'solo', card);
            });

            // 添加键盘支持
            [groupOption, soloOption].forEach(option => {
                option.setAttribute('tabindex', '0');
                option.setAttribute('role', 'radio');

                option.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        option.click();
                    }
                });
            });
        });
    }

    /**
     * 选择产品价格模式
     */
    selectProductPrice(sku, mode, cardElement) {
        // 触发变更前回调
        const shouldContinue = this.triggerCallback('onBeforeChange', {
            sku,
            oldMode: this.getProductMode(sku),
            newMode: mode
        });

        if (shouldContinue === false) return;

        // 更新状态
        this.priceMode.products[sku] = mode;

        // 更新显示
        this.updateProductPriceDisplay(cardElement, mode);

        // 更新按钮状态
        this.updateProductButtons(cardElement, mode);

        // 记录统计
        this.analytics.modeChanges++;
        this.analytics.lastChangeTime = new Date();

        // 保存偏好
        this.savePreferences();

        // 触发回调
        this.triggerCallback('onPriceSelect', {
            sku,
            mode,
            element: cardElement,
            pricing: this.getProductPricing(cardElement, mode)
        });

        // 触发自定义事件
        this.dispatchPriceChangeEvent(sku, mode, cardElement);

        // 显示反馈
        this.showPriceFeedback(cardElement, mode);
    }

    /**
     * 更新产品价格显示
     */
    updateProductPriceDisplay(card, mode) {
        const groupOption = card.querySelector('.group-price');
        const soloOption = card.querySelector('.solo-price');

        if (!groupOption || !soloOption) return;

        // 移除所有选中状态
        groupOption.classList.remove('selected');
        soloOption.classList.remove('selected');

        // 添加切换动画
        groupOption.classList.add('switching');
        soloOption.classList.add('switching');

        // 设置选中状态
        if (mode === 'group') {
            groupOption.classList.add('selected');
            groupOption.setAttribute('aria-checked', 'true');
            soloOption.setAttribute('aria-checked', 'false');
            card.dataset.priceMode = 'GROUP';
        } else {
            soloOption.classList.add('selected');
            soloOption.setAttribute('aria-checked', 'true');
            groupOption.setAttribute('aria-checked', 'false');
            card.dataset.priceMode = 'SOLO';
        }

        // 移除动画类
        setTimeout(() => {
            groupOption.classList.remove('switching');
            soloOption.classList.remove('switching');
        }, 300);
    }

    /**
     * 更新产品按钮状态
     */
    updateProductButtons(card, mode) {
        const joinBtn = card.querySelector('[data-action="join"]');
        if (!joinBtn) return;

        // 更新按钮文本和样式
        if (mode === 'group') {
            joinBtn.textContent = 'Join Group';
            joinBtn.dataset.mode = 'group';
            joinBtn.removeAttribute('data-mode');
        } else {
            joinBtn.textContent = 'Buy Solo';
            joinBtn.dataset.mode = 'solo';
        }

        // 如果是solo模式且批次已满，仍可购买
        const progressBar = card.querySelector('.progress-bar-mini .progress-fill');
        if (progressBar) {
            const progress = parseInt(progressBar.style.width);
            if (progress >= 100 && mode === 'group') {
                joinBtn.disabled = true;
                joinBtn.textContent = 'Batch Full';
            } else {
                joinBtn.disabled = false;
            }
        }
    }

    /**
     * 设置全局价格模式
     */
    setGlobalMode(mode) {
        if (this.priceMode.global === mode) return;

        this.priceMode.global = mode;

        // 更新所有产品卡片
        document.querySelectorAll('.product-card').forEach(card => {
            const sku = card.dataset.sku;
            if (sku && !this.priceMode.products[sku]) {
                this.updateProductPriceDisplay(card, mode);
                this.updateProductButtons(card, mode);
            }
        });

        // 更新全局切换按钮状态
        this.updateGlobalToggle(mode);

        // 保存偏好
        this.savePreferences();

        // 触发回调
        this.triggerCallback('onModeChange', {
            mode,
            isGlobal: true
        });

        // 显示提示
        this.showGlobalModeFeedback(mode);
    }

    /**
     * 更新全局切换按钮
     */
    updateGlobalToggle(mode) {
        const toggleOptions = document.querySelectorAll('.toggle-option');
        toggleOptions.forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        const toggleSwitch = document.querySelector('.toggle-switch');
        if (toggleSwitch) {
            toggleSwitch.setAttribute('aria-checked', mode === 'group');
        }
    }

    /**
     * 获取产品当前价格模式
     */
    getProductMode(sku) {
        return this.priceMode.products[sku] || this.priceMode.global;
    }

    /**
     * 获取产品价格信息
     */
    getProductPricing(card, mode) {
        const groupPrice = card.querySelector('.group-price .price-value');
        const soloPrice = card.querySelector('.solo-price .price-value');
        const saveAmount = card.querySelector('.price-save');

        return {
            mode,
            price: mode === 'group' ? groupPrice?.textContent : soloPrice?.textContent,
            saving: mode === 'group' ? saveAmount?.textContent : null,
            groupPrice: groupPrice?.textContent,
            soloPrice: soloPrice?.textContent
        };
    }

    /**
     * 监听动态添加的产品卡片
     */
    observeNewProducts() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        if (node.classList?.contains('product-card')) {
                            this.bindProductPriceSelector(node);
                        } else if (node.querySelector) {
                            const cards = node.querySelectorAll('.product-card');
                            cards.forEach(card => this.bindProductPriceSelector(card));
                        }
                    }
                });
            });
        });

        // 监听产品网格容器
        document.querySelectorAll('.products-grid').forEach(grid => {
            observer.observe(grid, {
                childList: true,
                subtree: true
            });
        });
    }

    /**
     * 绑定单个产品卡片
     */
    bindProductPriceSelector(card) {
        const sku = card.dataset.sku;
        if (!sku) return;

        const groupOption = card.querySelector('.group-price');
        const soloOption = card.querySelector('.solo-price');

        if (!groupOption || !soloOption) return;

        // 避免重复绑定
        if (groupOption.dataset.bound) return;
        groupOption.dataset.bound = 'true';

        const currentMode = this.getProductMode(sku);
        this.updateProductPriceDisplay(card, currentMode);

        groupOption.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectProductPrice(sku, 'group', card);
        });

        soloOption.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectProductPrice(sku, 'solo', card);
        });
    }

    /**
     * 设置键盘快捷键
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Alt + G: 切换到Group模式
            if (e.altKey && e.key === 'g') {
                e.preventDefault();
                this.setGlobalMode('group');
            }
            // Alt + S: 切换到Solo模式
            else if (e.altKey && e.key === 's') {
                e.preventDefault();
                this.setGlobalMode('solo');
            }
            // Alt + T: 切换模式
            else if (e.altKey && e.key === 't') {
                e.preventDefault();
                const newMode = this.priceMode.global === 'group' ? 'solo' : 'group';
                this.setGlobalMode(newMode);
            }
        });
    }

    /**
     * 显示价格选择反馈
     */
    showPriceFeedback(card, mode) {
        // 创建反馈元素
        const feedback = document.createElement('div');
        feedback.className = 'price-feedback';
        feedback.textContent = mode === 'group'
            ? 'Group price selected - Save more!'
            : 'Solo price selected';

        feedback.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--gold-gradient);
            color: var(--text-inverse);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            z-index: 100;
            pointer-events: none;
            animation: feedbackPop 0.5s ease;
        `;

        card.appendChild(feedback);

        // 移除反馈
        setTimeout(() => {
            feedback.remove();
        }, 1000);
    }

    /**
     * 显示全局模式反馈
     */
    showGlobalModeFeedback(mode) {
        const message = mode === 'group'
            ? 'Switched to Group Pricing - Maximum Savings!'
            : 'Switched to Solo Pricing';

        // 使用现有的toast功能
        if (window.VoltRallyHome?.showToast) {
            window.VoltRallyHome.showToast(message);
        }
    }

    /**
     * 更新所有价格显示
     */
    updateAllPrices() {
        document.querySelectorAll('.product-card').forEach(card => {
            const sku = card.dataset.sku;
            if (sku) {
                const mode = this.getProductMode(sku);
                this.updateProductPriceDisplay(card, mode);
                this.updateProductButtons(card, mode);
            }
        });
    }

    /**
     * 获取最常用的模式
     */
    getMostUsedMode() {
        const counts = { group: 0, solo: 0 };
        Object.values(this.priceMode.products).forEach(mode => {
            counts[mode]++;
        });
        return counts.group >= counts.solo ? 'group' : 'solo';
    }

    /**
     * 触发回调函数
     */
    triggerCallback(type, data) {
        const callbacks = this.callbacks[type];
        if (!callbacks) return true;

        let result = true;
        callbacks.forEach(callback => {
            if (typeof callback === 'function') {
                const callbackResult = callback(data);
                if (callbackResult === false) {
                    result = false;
                }
            }
        });
        return result;
    }

    /**
     * 注册回调函数
     */
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }

    /**
     * 移除回调函数
     */
    off(event, callback) {
        if (this.callbacks[event]) {
            const index = this.callbacks[event].indexOf(callback);
            if (index > -1) {
                this.callbacks[event].splice(index, 1);
            }
        }
    }

    /**
     * 分发自定义事件
     */
    dispatchPriceChangeEvent(sku, mode, element) {
        const event = new CustomEvent('priceSelectionChange', {
            detail: {
                sku,
                mode,
                element,
                pricing: this.getProductPricing(element, mode),
                timestamp: new Date().toISOString()
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * 获取当前选择状态统计
     */
    getStatistics() {
        const stats = {
            globalMode: this.priceMode.global,
            productSelections: { ...this.priceMode.products },
            totalChanges: this.analytics.modeChanges,
            lastChange: this.analytics.lastChangeTime,
            preferredMode: this.getMostUsedMode(),
            groupCount: 0,
            soloCount: 0
        };

        Object.values(this.priceMode.products).forEach(mode => {
            if (mode === 'group') {
                stats.groupCount++;
            } else {
                stats.soloCount++;
            }
        });

        return stats;
    }

    /**
     * 重置所有选择
     */
    resetAll() {
        this.priceMode.products = {};
        this.setGlobalMode('group');
        this.savePreferences();
    }

    /**
     * 导出价格选择数据（用于后期数据对接）
     */
    exportSelectionData() {
        const data = [];
        document.querySelectorAll('.product-card').forEach(card => {
            const sku = card.dataset.sku;
            if (sku) {
                const mode = this.getProductMode(sku);
                const pricing = this.getProductPricing(card, mode);
                data.push({
                    sku,
                    mode,
                    pricing,
                    timestamp: new Date().toISOString()
                });
            }
        });
        return data;
    }
}

// 添加价格反馈动画样式
const feedbackStyle = document.createElement('style');
feedbackStyle.textContent = `
    @keyframes feedbackPop {
        0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
        }
        50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
        }
    }

    .global-price-toggle {
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-md);
        margin-top: var(--spacing-xl);
        padding: var(--spacing-md);
        background: var(--panel-bg);
        border-radius: var(--radius-lg);
        border: 1px solid var(--line-color);
    }

    .toggle-label {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .toggle-switch {
        display: flex;
        background: var(--bg-primary);
        border-radius: var(--radius-md);
        padding: 2px;
    }

    .toggle-option {
        padding: var(--spacing-sm) var(--spacing-lg);
        background: transparent;
        border: none;
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
        font-weight: 500;
        cursor: pointer;
        transition: all var(--transition-base);
        border-radius: var(--radius-sm);
    }

    .toggle-option.active {
        background: var(--gold-gradient);
        color: var(--text-inverse);
    }

    .toggle-option:hover:not(.active) {
        color: var(--text-primary);
    }
`;
document.head.appendChild(feedbackStyle);

// 初始化价格选择器
document.addEventListener('DOMContentLoaded', () => {
    window.VoltRallyPriceSelector = new PriceSelector();

    // 注册到全局Store（如果存在）
    if (window.VoltRallyStore) {
        window.VoltRallyStore.priceSelector = window.VoltRallyPriceSelector;
    }

    console.log('💰 Price Selector initialized. Use Alt+G for Group, Alt+S for Solo, Alt+T to toggle.');
});