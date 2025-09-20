/**
 * VoltRally Homepage JavaScript
 * 完整的交互实现，严格数据驱动
 */

class VoltRallyHome {
    constructor() {
        this.store = window.VoltRallyStore;
        this.countdownInterval = null;
        this.tickerInterval = null;
        this.currentCategory = 'featured';

        // DOM元素缓存
        this.elements = {};

        // 初始化
        this.init();
    }

    /**
     * 初始化
     */
    async init() {
        // 缓存DOM元素
        this.cacheElements();

        // 绑定事件监听器
        this.bindEvents();

        // 订阅Store事件
        this.subscribeToStore();

        // 显示骨架屏
        this.showSkeleton();

        // 等待Store初始化
        await this.waitForStore();

        // 渲染初始内容
        this.render();

        // 启动动态更新
        this.startCountdown();
        this.startOrderTicker();

        // 初始化滚动监听
        this.initScrollSpy();
    }

    /**
     * 缓存DOM元素
     */
    cacheElements() {
        this.elements = {
            // Header
            countrySelector: document.querySelector('.selector-trigger'),
            countryDropdown: document.querySelector('.selector-dropdown'),
            countrySelect: document.getElementById('country-select'),
            languageSelect: document.getElementById('language-select'),
            currencySelect: document.getElementById('currency-select'),
            ordersCount: document.querySelector('.orders-count'),
            shareBtn: document.querySelector('[data-action="share"]'),
            loginBtn: document.querySelector('[data-action="login"]'),

            // Hero
            countryBadge: document.querySelector('.country-badge'),
            timeline: document.querySelectorAll('.timeline-item'),
            countdownDays: document.querySelector('[data-days]'),
            countdownHours: document.querySelector('[data-hours]'),
            countdownMinutes: document.querySelector('[data-minutes]'),
            progressJoined: document.querySelector('[data-joined]'),
            progressNeed: document.querySelector('[data-need]'),
            progressBar: document.querySelector('.progress-fill'),
            progressTarget: document.querySelector('[data-target]'),
            joinBtn: document.querySelector('[data-action="join-group"]'),
            buyBtn: document.querySelector('[data-action="buy-solo"]'),

            // Categories
            categoryTabs: document.querySelectorAll('.tab-item'),

            // Products
            productsGrids: document.querySelectorAll('[data-grid]'),

            // Stats
            statSaved: document.querySelector('[data-stat="saved"]'),
            statShipments: document.querySelector('[data-stat="shipments"]'),
            statMembers: document.querySelector('[data-stat="members"]'),

            // Ticker
            tickerTrack: document.querySelector('[data-ticker="orders"]'),

            // Mobile toolbar
            toolbarItems: document.querySelectorAll('.toolbar-item')
        };
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 国家选择器
        if (this.elements.countrySelector) {
            this.elements.countrySelector.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleCountryDropdown();
            });
        }

        // 国家/语言/货币选择
        if (this.elements.countrySelect) {
            this.elements.countrySelect.addEventListener('change', (e) => {
                this.handleCountryChange(e.target.value);
            });
        }

        if (this.elements.languageSelect) {
            this.elements.languageSelect.addEventListener('change', (e) => {
                this.handleLanguageChange(e.target.value);
            });
        }

        if (this.elements.currencySelect) {
            this.elements.currencySelect.addEventListener('change', (e) => {
                this.handleCurrencyChange(e.target.value);
            });
        }

        // 点击外部关闭下拉菜单
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.header-selector')) {
                this.closeCountryDropdown();
            }
        });

        // 分享按钮
        if (this.elements.shareBtn) {
            this.elements.shareBtn.addEventListener('click', () => {
                this.handleShare();
            });
        }

        // 登录按钮
        if (this.elements.loginBtn) {
            this.elements.loginBtn.addEventListener('click', () => {
                this.handleLogin();
            });
        }

        // 分类标签
        this.elements.categoryTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.handleCategoryClick(e.target.dataset.category);
            });
        });

        // 产品卡片按钮（使用事件委托）
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="join"]')) {
                this.handleJoinGroup(e.target.dataset.sku);
            } else if (e.target.matches('[data-action="details"]')) {
                this.handleViewDetails(e.target.dataset.sku);
            }
        });

        // Hero CTA按钮
        if (this.elements.joinBtn) {
            this.elements.joinBtn.addEventListener('click', () => {
                this.handleJoinNow();
            });
        }

        if (this.elements.buyBtn) {
            this.elements.buyBtn.addEventListener('click', () => {
                this.handleBuySolo();
            });
        }

        // 合规文档按钮
        document.querySelectorAll('.compliance-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.handleComplianceClick(e.currentTarget.dataset.doc);
            });
        });

        // 移动端工具栏
        this.elements.toolbarItems.forEach(item => {
            item.addEventListener('click', (e) => {
                this.handleToolbarClick(e.currentTarget.dataset.page);
            });
        });

        // 键盘导航
        this.setupKeyboardNavigation();
    }

    /**
     * 订阅Store事件
     */
    subscribeToStore() {
        this.store.on('localeChanged', (locale) => {
            this.handleLocaleChanged(locale);
        });

        this.store.on('dataLoaded', (state) => {
            this.render();
        });

        this.store.on('loading', (isLoading) => {
            if (isLoading) {
                this.showSkeleton();
            } else {
                this.hideSkeleton();
            }
        });
    }

    /**
     * 等待Store初始化完成
     */
    async waitForStore() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (!this.store.state.loading) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);

            // 超时处理
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
            }, 5000);
        });
    }

    /**
     * 渲染页面
     */
    render() {
        this.renderHeader();
        this.renderHero();
        this.renderProducts();
        this.renderStats();
        this.renderOrderTicker();
    }

    /**
     * 渲染头部
     */
    renderHeader() {
        const locale = this.store.state.locale;

        // 更新选择器显示
        if (this.elements.countrySelector) {
            this.elements.countrySelector.innerHTML = `
                <span class="selector-country">${locale.country}</span>
                <span class="selector-name">${this.getCountryName(locale.country)}</span>
                <span class="selector-currency">${locale.currency}</span>
            `;
        }

        // 更新订单数量
        if (this.elements.ordersCount) {
            const count = this.store.state.orderCount;
            if (count > 0) {
                this.elements.ordersCount.textContent = count;
                this.elements.ordersCount.style.display = 'inline-flex';
            } else {
                this.elements.ordersCount.style.display = 'none';
            }
        }
    }

    /**
     * 渲染Hero区域
     */
    renderHero() {
        const batch = this.store.state.currentBatch;
        if (!batch) return;

        // 更新国家徽章
        if (this.elements.countryBadge) {
            this.elements.countryBadge.textContent = this.getCountryName(batch.country);
        }

        // 更新时间轴
        this.updateTimeline(batch);

        // 更新进度
        if (this.elements.progressJoined) {
            this.elements.progressJoined.textContent = batch.joined;
        }
        if (this.elements.progressNeed) {
            this.elements.progressNeed.textContent = batch.seats - batch.joined;
        }
        if (this.elements.progressTarget) {
            this.elements.progressTarget.textContent = batch.seats;
        }

        const progress = Math.round((batch.joined / batch.seats) * 100);
        if (this.elements.progressBar) {
            this.elements.progressBar.style.width = `${progress}%`;

            // 如果接近满员，添加脉冲效果
            if (batch.seats - batch.joined <= 6) {
                this.elements.progressBar.classList.add('pulse');
            }
        }

        // 更新CTA按钮
        if (this.elements.joinBtn) {
            const saving = this.store.formatPrice(batch.avgSavingPerUnit);
            this.elements.joinBtn.innerHTML = `Join Group • Save ${saving}`;
        }
    }

    /**
     * 更新时间轴
     */
    updateTimeline(batch) {
        const now = new Date();
        const lockDate = new Date(batch.lockAt);
        const shipDate = new Date(batch.shipAt);
        const arriveDate = new Date(batch.arriveAt);

        this.elements.timeline.forEach(item => {
            const stage = item.dataset.stage;
            const dateEl = item.querySelector('.timeline-date');

            switch(stage) {
                case 'open':
                    item.classList.add('active');
                    if (dateEl) dateEl.textContent = 'Now';
                    break;
                case 'lock':
                    if (now >= lockDate) {
                        item.classList.add('active');
                    }
                    if (dateEl) dateEl.textContent = this.formatDate(lockDate);
                    break;
                case 'ship':
                    if (now >= shipDate) {
                        item.classList.add('active');
                    }
                    if (dateEl) dateEl.textContent = this.formatDate(shipDate);
                    break;
                case 'arrive':
                    if (now >= arriveDate) {
                        item.classList.add('active');
                    }
                    if (dateEl) dateEl.textContent = this.formatDate(arriveDate);
                    break;
            }
        });
    }

    /**
     * 渲染产品
     */
    renderProducts() {
        // 渲染每个分类的产品
        ['featured', '3-wheel', '2-wheel', 'batteries', 'parts'].forEach(category => {
            const grid = document.querySelector(`[data-grid="${category}"]`);
            if (!grid) return;

            const products = this.store.getProductsByCategory(category);

            // 清空现有内容
            grid.innerHTML = '';

            // 渲染产品卡片
            products.slice(0, 6).forEach(product => {
                grid.appendChild(this.createProductCard(product));
            });
        });
    }

    /**
     * 创建产品卡片
     */
    createProductCard(product) {
        const card = document.createElement('article');
        card.className = 'product-card';
        card.dataset.sku = product.sku;

        const badge = product.badges && product.badges[0]
            ? `<div class="product-badge">${product.badges[0]}</div>`
            : '';

        const saveAmount = this.store.formatPrice(product.pricing.saving);
        const groupPrice = this.store.formatPrice(product.pricing.group);
        const soloPrice = this.store.formatPrice(product.pricing.solo);

        card.innerHTML = `
            <div class="product-image">
                <img src="${product.image}"
                     alt="${product.name}"
                     loading="lazy">
                ${badge}
            </div>
            <div class="product-content">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-specs">${product.specs}</div>

                <div class="pricing-container">
                    <div class="price-option group-price">
                        <span class="price-label">Group</span>
                        <span class="price-value">${groupPrice}</span>
                        <span class="price-save">Save ${saveAmount}</span>
                    </div>
                    <div class="price-option solo-price">
                        <span class="price-label">Solo</span>
                        <span class="price-value">${soloPrice}</span>
                    </div>
                </div>

                <div class="card-progress">
                    <div class="progress-text">
                        <span><span data-joined>${product.batch.joined}</span> joined</span>
                        <span>Need <span data-need>${product.batch.need}</span></span>
                    </div>
                    <div class="progress-bar-mini"
                         role="progressbar"
                         aria-valuenow="${product.batch.progress}"
                         aria-valuemin="0"
                         aria-valuemax="100">
                        <div class="progress-fill ${product.batch.need <= 6 ? 'pulse' : ''}"
                             style="width: ${product.batch.progress}%;"></div>
                    </div>
                </div>

                <div class="product-actions">
                    <button type="button" class="btn-card-primary"
                            data-action="join"
                            data-sku="${product.sku}"
                            ${!product.batch.eligibleForGroup ? 'disabled' : ''}>
                        Join Group
                    </button>
                    <button type="button" class="btn-card-secondary"
                            data-action="details"
                            data-sku="${product.sku}">
                        Details
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    /**
     * 渲染统计数据
     */
    renderStats() {
        const batch = this.store.state.currentBatch;
        if (!batch) return;

        if (this.elements.statSaved) {
            this.elements.statSaved.textContent = this.store.formatPrice(batch.totalCommunitySaved);
        }

        // Mock数据
        if (this.elements.statShipments) {
            this.elements.statShipments.textContent = '142';
        }
        if (this.elements.statMembers) {
            this.elements.statMembers.textContent = '3,847';
        }
    }

    /**
     * 渲染订单Ticker
     */
    renderOrderTicker() {
        const ticker = this.store.getOrderTicker();
        if (!this.elements.tickerTrack) return;

        // 创建两份内容实现无缝滚动
        const tickerHTML = ticker.map(order => `
            <div class="ticker-item">
                <span class="ticker-country">${order.country}</span>
                <span class="ticker-text">${order.name} ${order.action} ${order.product}</span>
                <span class="ticker-time">${order.time}</span>
            </div>
        `).join('');

        this.elements.tickerTrack.innerHTML = tickerHTML + tickerHTML;
    }

    /**
     * 启动倒计时
     */
    startCountdown() {
        // 清除现有定时器
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }

        // 更新倒计时
        const updateCountdown = () => {
            const countdown = this.store.getCountdown();
            if (!countdown) return;

            if (this.elements.countdownDays) {
                this.elements.countdownDays.textContent = countdown.days;
            }
            if (this.elements.countdownHours) {
                this.elements.countdownHours.textContent = countdown.hours.toString().padStart(2, '0');
            }
            if (this.elements.countdownMinutes) {
                this.elements.countdownMinutes.textContent = countdown.minutes.toString().padStart(2, '0');
            }

            // 如果小于24小时，添加紧急样式
            if (countdown.days === 0 && countdown.hours < 24) {
                document.querySelector('.countdown-timer')?.classList.add('urgent');
            }
        };

        // 立即更新一次
        updateCountdown();

        // 每分钟更新
        this.countdownInterval = setInterval(updateCountdown, 60000);
    }

    /**
     * 启动订单Ticker
     */
    startOrderTicker() {
        // 每30分钟刷新一次Ticker内容
        if (this.tickerInterval) {
            clearInterval(this.tickerInterval);
        }

        this.tickerInterval = setInterval(() => {
            this.renderOrderTicker();
        }, 30 * 60 * 1000);
    }

    /**
     * 初始化滚动监听（分类高亮）
     */
    initScrollSpy() {
        const sections = document.querySelectorAll('.products-section');
        const navHeight = 150; // Header + Category tabs height

        const observerOptions = {
            rootMargin: `-${navHeight}px 0px -50% 0px`
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const category = entry.target.dataset.category;
                    this.setActiveCategory(category);
                }
            });
        }, observerOptions);

        sections.forEach(section => {
            observer.observe(section);
        });
    }

    /**
     * 设置活动分类
     */
    setActiveCategory(category) {
        this.elements.categoryTabs.forEach(tab => {
            if (tab.dataset.category === category) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        this.currentCategory = category;
        this.store.state.selectedCategory = category;
    }

    /**
     * 处理分类点击
     */
    handleCategoryClick(category) {
        // 平滑滚动到对应区域
        const section = document.getElementById(category);
        if (section) {
            const navHeight = 150;
            const targetPosition = section.offsetTop - navHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }

        // 更新URL
        this.store.state.selectedCategory = category;
        this.store.updateURL();
    }

    /**
     * 切换国家下拉菜单
     */
    toggleCountryDropdown() {
        const isExpanded = this.elements.countrySelector.getAttribute('aria-expanded') === 'true';

        if (isExpanded) {
            this.closeCountryDropdown();
        } else {
            this.openCountryDropdown();
        }
    }

    /**
     * 打开国家下拉菜单
     */
    openCountryDropdown() {
        this.elements.countrySelector.setAttribute('aria-expanded', 'true');
        this.elements.countryDropdown.setAttribute('aria-hidden', 'false');
        this.elements.countryDropdown.style.display = 'block';
    }

    /**
     * 关闭国家下拉菜单
     */
    closeCountryDropdown() {
        this.elements.countrySelector.setAttribute('aria-expanded', 'false');
        this.elements.countryDropdown.setAttribute('aria-hidden', 'true');
        this.elements.countryDropdown.style.display = 'none';
    }

    /**
     * 处理国家切换
     */
    async handleCountryChange(country) {
        // 显示加载状态
        this.showSkeleton();

        // 更新Store并触发数据刷新
        await this.store.updateLocale({ country });

        // 关闭下拉菜单
        this.closeCountryDropdown();
    }

    /**
     * 处理语言切换
     */
    async handleLanguageChange(language) {
        await this.store.updateLocale({ language });
    }

    /**
     * 处理货币切换
     */
    async handleCurrencyChange(currency) {
        await this.store.updateLocale({ currency });
    }

    /**
     * 处理地区变化
     */
    handleLocaleChanged(locale) {
        // 页面会自动重新渲染
        console.log('Locale changed:', locale);

        // 显示Toast提示
        this.showToast(`Switched to ${this.getCountryName(locale.country)}`);
    }

    /**
     * 处理分享
     */
    async handleShare() {
        const result = await this.store.share();

        if (result.success) {
            if (result.copied) {
                this.showToast('Link copied to clipboard!');
            }
        } else {
            this.showToast('Share failed. Please try again.');
        }
    }

    /**
     * 处理登录
     */
    handleLogin() {
        // 跳转到登录页面
        window.location.href = '/login.html';
    }

    /**
     * 处理加入团购
     */
    handleJoinGroup(sku) {
        console.log('Join group for:', sku);
        // 跳转到结账页面
        window.location.href = `/checkout.html?sku=${sku}&mode=group`;
    }

    /**
     * 处理查看详情
     */
    handleViewDetails(sku) {
        console.log('View details for:', sku);
        // 跳转到产品详情页
        window.location.href = `/product.html?sku=${sku}`;
    }

    /**
     * 处理立即加入
     */
    handleJoinNow() {
        // 滚动到产品区域
        this.handleCategoryClick('featured');
    }

    /**
     * 处理单独购买
     */
    handleBuySolo() {
        // 跳转到产品列表
        window.location.href = '/category/all.html?mode=solo';
    }

    /**
     * 处理合规文档点击
     */
    handleComplianceClick(docType) {
        console.log('View document:', docType);
        // 打开文档模态框或下载
        this.showToast(`Opening ${docType.toUpperCase()} document...`);
    }

    /**
     * 处理工具栏点击
     */
    handleToolbarClick(page) {
        // 更新活动状态
        this.elements.toolbarItems.forEach(item => {
            if (item.dataset.page === page) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // 导航到对应页面
        switch(page) {
            case 'home':
                window.scrollTo({ top: 0, behavior: 'smooth' });
                break;
            case 'categories':
                this.handleCategoryClick('featured');
                break;
            case 'groups':
                window.location.href = '/my-groups.html';
                break;
            case 'orders':
                window.location.href = '/my-orders.html';
                break;
            case 'account':
                window.location.href = '/account.html';
                break;
        }
    }

    /**
     * 设置键盘导航
     */
    setupKeyboardNavigation() {
        // Tab键导航优化
        document.addEventListener('keydown', (e) => {
            // Escape键关闭下拉菜单
            if (e.key === 'Escape') {
                this.closeCountryDropdown();
            }

            // 数字键快速跳转到分类
            if (e.key >= '1' && e.key <= '5' && !e.ctrlKey && !e.altKey) {
                const categories = ['featured', '3-wheel', '2-wheel', 'batteries', 'parts'];
                const index = parseInt(e.key) - 1;
                if (categories[index]) {
                    this.handleCategoryClick(categories[index]);
                }
            }
        });
    }

    /**
     * 显示骨架屏
     */
    showSkeleton() {
        // 为主要内容区域添加骨架屏效果
        document.querySelectorAll('.products-grid').forEach(grid => {
            if (grid.children.length === 0) {
                // 添加6个骨架卡片
                for (let i = 0; i < 6; i++) {
                    const skeleton = document.createElement('div');
                    skeleton.className = 'product-card skeleton';
                    skeleton.innerHTML = `
                        <div class="skeleton" style="height: 200px;"></div>
                        <div class="product-content">
                            <div class="skeleton" style="height: 24px; margin-bottom: 8px;"></div>
                            <div class="skeleton" style="height: 16px; width: 70%; margin-bottom: 16px;"></div>
                            <div class="skeleton" style="height: 60px; margin-bottom: 16px;"></div>
                            <div class="skeleton" style="height: 40px;"></div>
                        </div>
                    `;
                    grid.appendChild(skeleton);
                }
            }
        });
    }

    /**
     * 隐藏骨架屏
     */
    hideSkeleton() {
        // 移除所有骨架屏元素
        document.querySelectorAll('.skeleton').forEach(el => {
            if (el.parentElement?.classList.contains('product-card')) {
                el.parentElement.remove();
            }
        });
    }

    /**
     * 显示Toast提示
     */
    showToast(message, duration = 3000) {
        // 移除现有Toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        // 创建Toast元素
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background-color: var(--panel-bg);
            color: var(--text-primary);
            padding: var(--spacing-md) var(--spacing-xl);
            border-radius: var(--radius-full);
            border: 1px solid var(--gold-primary);
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            animation: slideUp 0.3s ease;
        `;

        document.body.appendChild(toast);

        // 自动移除
        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    /**
     * 获取国家名称
     */
    getCountryName(code) {
        const countries = {
            'MX': 'Mexico',
            'EG': 'Egypt',
            'NG': 'Nigeria',
            'ID': 'Indonesia',
            'PH': 'Philippines',
            'CO': 'Colombia',
            'BR': 'Brazil',
            'IN': 'India',
            'TH': 'Thailand',
            'VN': 'Vietnam'
        };
        return countries[code] || code;
    }

    /**
     * 格式化日期
     */
    formatDate(date) {
        const d = new Date(date);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[d.getMonth()]} ${d.getDate()}`;
    }
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }

    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(20px);
            opacity: 0;
        }
    }

    .urgent {
        animation: urgentPulse 1s ease-in-out infinite;
    }

    @keyframes urgentPulse {
        0%, 100% {
            box-shadow: 0 0 20px rgba(255, 92, 92, 0.3);
        }
        50% {
            box-shadow: 0 0 30px rgba(255, 92, 92, 0.5);
        }
    }
`;
document.head.appendChild(style);

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.VoltRallyHome = new VoltRallyHome();

    // 初始化价格选择器
    if (window.PriceSelector) {
        window.VoltRallyPriceSelector = new PriceSelector();
    }
});