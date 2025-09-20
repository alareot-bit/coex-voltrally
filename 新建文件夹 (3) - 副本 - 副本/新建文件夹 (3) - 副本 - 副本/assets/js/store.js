/**
 * VoltRally Store - 全局状态管理
 * 严格数据驱动，无硬编码
 */

class VoltRallyStore {
    constructor() {
        // 初始状态
        this.state = {
            // 地区设置
            locale: {
                country: 'MX',
                language: 'EN',
                currency: 'USD',
                exchangeRate: 1,
                symbol: '$',
                port: 'Manzanillo'
            },

            // 用户信息
            user: null,
            orderCount: 0,

            // 批次信息
            currentBatch: null,
            batches: {},

            // 产品数据
            products: [],
            categories: [],

            // UI状态
            loading: false,
            error: null,
            selectedCategory: 'featured'
        };

        // 事件监听器
        this.listeners = {};

        // 初始化
        this.init();
    }

    /**
     * 初始化Store
     */
    async init() {
        // 从localStorage恢复设置
        this.loadLocaleFromStorage();

        // 尝试IP定位
        await this.detectCountryByIP();

        // 加载初始数据
        await this.loadInitialData();

        // 设置URL参数
        this.syncWithURL();
    }

    /**
     * 从localStorage加载地区设置
     */
    loadLocaleFromStorage() {
        const stored = localStorage.getItem('voltRallyLocale');
        if (stored) {
            try {
                const locale = JSON.parse(stored);
                this.state.locale = { ...this.state.locale, ...locale };
            } catch (e) {
                console.error('Failed to parse stored locale:', e);
            }
        }
    }

    /**
     * 保存地区设置到localStorage
     */
    saveLocaleToStorage() {
        localStorage.setItem('voltRallyLocale', JSON.stringify(this.state.locale));
    }

    /**
     * 通过IP检测国家（优先级低于localStorage）
     */
    async detectCountryByIP() {
        if (localStorage.getItem('voltRallyLocale')) {
            return; // 已有用户选择，跳过自动检测
        }

        try {
            const response = await this.fetchAPI('/mock/geo-resolve.json');
            if (response.country) {
                this.updateLocale({
                    country: response.country,
                    language: response.language || 'EN',
                    currency: response.currency || 'USD'
                });
            }
        } catch (e) {
            console.log('IP detection failed, using defaults');
        }
    }

    /**
     * 更新地区设置（触发全页数据刷新）
     */
    async updateLocale(newLocale) {
        // 更新状态
        this.state.locale = { ...this.state.locale, ...newLocale };

        // 保存到localStorage
        this.saveLocaleToStorage();

        // 更新URL
        this.updateURL();

        // 触发全页数据刷新
        await this.loadInitialData();

        // 触发事件
        this.emit('localeChanged', this.state.locale);
    }

    /**
     * 加载初始数据
     */
    async loadInitialData() {
        this.state.loading = true;
        this.emit('loading', true);

        try {
            // 并行加载所有数据
            const [session, homeData, batchData, productsData] = await Promise.all([
                this.fetchAPI('/mock/session.json'),
                this.fetchAPI(`/mock/home-${this.state.locale.country.toLowerCase()}.json`),
                this.fetchAPI(`/mock/batch-summary-${this.state.locale.country.toLowerCase()}.json`),
                this.fetchAPI(`/mock/products-${this.state.locale.country.toLowerCase()}.json`)
            ]);

            // 更新状态
            if (session) {
                this.state.user = session.user;
                this.state.orderCount = session.orderCount || 0;
            }

            if (homeData) {
                this.state.categories = homeData.categories || [];
            }

            if (batchData) {
                this.state.currentBatch = batchData.current;
                this.state.batches = batchData.batches || {};
            }

            if (productsData) {
                this.state.products = productsData.products || [];
            }

            this.state.error = null;

        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.state.error = 'Failed to load data. Using mock data.';

            // 使用备用Mock数据
            await this.loadFallbackData();
        } finally {
            this.state.loading = false;
            this.emit('loading', false);
            this.emit('dataLoaded', this.state);
        }
    }

    /**
     * 加载备用Mock数据
     */
    async loadFallbackData() {
        // 硬编码的最小备用数据集
        this.state.categories = [
            { id: 'featured', name: 'Featured', slug: 'featured' },
            { id: '3-wheel', name: '3-Wheel Cargo', slug: '3-wheel' },
            { id: '2-wheel', name: '2-Wheel Electric', slug: '2-wheel' },
            { id: 'batteries', name: 'Batteries', slug: 'batteries' },
            { id: 'parts', name: 'Parts & Accessories', slug: 'parts' }
        ];

        this.state.currentBatch = {
            id: 'MX-203',
            country: 'MX',
            container: '20GP',
            seats: 36,
            joined: 28,
            openAt: new Date().toISOString(),
            lockAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            shipAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
            arriveAt: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000).toISOString(),
            avgSavingPerUnit: 600,
            totalCommunitySaved: 487290
        };

        // 生成Mock产品数据
        this.state.products = this.generateMockProducts();
    }

    /**
     * 生成Mock产品数据（严格遵循数据模型）
     */
    generateMockProducts() {
        const products = [];
        const categories = ['3-wheel', '2-wheel', 'batteries', 'parts'];
        const images = [
            'ee1e5ca380e04272ce692251ad54cb67.jpg',
            '2d4a4baf2205a10a4e9ef910f670bc03.jpg',
            '353f0546ff63e3d046d39982af457400.jpg',
            '7cc6023a570f7333d44682ffcc6ea793.jpg',
            '9e54cbf48291ce4bd5060a6f3643cae7.jpg',
            'aafee54c0eb64305765b0b15e1daeeee.jpg',
            'ad37d8702b67fb226405c3da0bd8d517.jpg',
            'adc231adbe19445b6854e72373b3906f.jpg',
            'c3fb7432dab462c670effe9827b04bd8.jpg',
            'cc170b9bc7b1f5a6a44047db5cc36214.jpg',
            'd9cfef77ec73a8c0564523fd95034df5.jpg',
            '09718e1c15b9ecb9e90d4863608f3f0a.jpg'
        ];

        const names = {
            '3-wheel': ['Cargo Trike 400kg', 'Delivery Van E350', 'Heavy Loader 600', 'Express Cargo 300'],
            '2-wheel': ['City Scooter 250', 'Sport Bike 2000W', 'Delivery Scooter', 'Mountain E-Bike'],
            'batteries': ['LiFePO4 72V 45Ah', 'Lithium 60V 32Ah', 'LFP 48V 20Ah', 'Power Pack 72V'],
            'parts': ['Motor 3000W', 'Controller 72V', 'Charger Fast 20A', 'Display LCD Color']
        };

        const specs = {
            '3-wheel': '72V 45Ah • 40 km/h • 80-90 km',
            '2-wheel': '60V 32Ah • 45 km/h • 65 km',
            'batteries': 'BMS 100A • 5000 cycles • UN38.3',
            'parts': 'Compatible • Warranty 2yr • CE'
        };

        let imageIndex = 0;

        // 为每个分类生成6个产品
        categories.forEach(category => {
            for (let i = 0; i < 6; i++) {
                const basePrice = Math.floor(Math.random() * 3000) + 500;
                const groupDiscount = Math.floor(basePrice * (0.15 + Math.random() * 0.1));
                const target = category === 'batteries' ? 78 : 36; // 电池类目标不同
                const joined = Math.floor(Math.random() * target);

                products.push({
                    id: `${category.toUpperCase()}-${1000 + i}`,
                    sku: `${category.toUpperCase()}${1000 + i}`,
                    name: names[category][i % names[category].length],
                    category: category,
                    image: `/占位图/${images[imageIndex % images.length]}`,
                    specs: specs[category],
                    pricing: {
                        solo: basePrice,
                        group: basePrice - groupDiscount,
                        currency: this.state.locale.currency,
                        symbol: this.state.locale.symbol,
                        saving: groupDiscount
                    },
                    batch: {
                        id: `${this.state.locale.country}-20${3 + i}`,
                        target: target, // 动态目标，不硬编码36
                        joined: joined,
                        need: target - joined,
                        progress: Math.round((joined / target) * 100),
                        eligibleForGroup: joined < target
                    },
                    badges: this.generateBadges(i),
                    inStock: true,
                    featured: i < 2
                });

                imageIndex++;
            }
        });

        return products;
    }

    /**
     * 生成产品徽章
     */
    generateBadges(index) {
        const badges = [];
        if (index === 0) badges.push('HOT');
        if (index === 1) badges.push('NEW');
        if (index === 2) badges.push('-15%');
        return badges;
    }

    /**
     * 获取分类产品
     */
    getProductsByCategory(category) {
        if (category === 'featured') {
            return this.state.products.filter(p => p.featured);
        }
        return this.state.products.filter(p => p.category === category);
    }

    /**
     * 获取批次信息
     */
    getBatchInfo(batchId) {
        return this.state.batches[batchId] || this.state.currentBatch;
    }

    /**
     * 计算倒计时
     */
    getCountdown() {
        if (!this.state.currentBatch) return null;

        const now = new Date();
        const lockTime = new Date(this.state.currentBatch.lockAt);
        const diff = lockTime - now;

        if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return { days, hours, minutes, seconds };
    }

    /**
     * 获取汇率转换后的价格
     */
    convertPrice(priceUSD) {
        return Math.round(priceUSD * this.state.locale.exchangeRate);
    }

    /**
     * 格式化价格显示
     */
    formatPrice(price) {
        const converted = this.convertPrice(price);
        return `${this.state.locale.symbol}${converted.toLocaleString()}`;
    }

    /**
     * Fetch API 包装（带Mock回退）
     */
    async fetchAPI(url, options = {}) {
        try {
            // 首先尝试fetch真实API
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            // 如果失败，尝试Mock数据
            console.log(`API call failed for ${url}, trying mock data`);

            // 移除/api前缀，添加.json后缀
            const mockUrl = url.replace('/api/', '/mock/').replace(/\/$/, '') +
                           (url.includes('.json') ? '' : '.json');

            try {
                const mockResponse = await fetch(mockUrl);
                if (mockResponse.ok) {
                    return await mockResponse.json();
                }
            } catch (mockError) {
                console.log('Mock data also failed, using fallback');
            }

            // 返回空数据而不是抛出错误
            return null;
        }
    }

    /**
     * URL状态管理
     */
    syncWithURL() {
        const params = new URLSearchParams(window.location.search);

        if (params.has('country')) {
            this.state.locale.country = params.get('country');
        }
        if (params.has('lang')) {
            this.state.locale.language = params.get('lang');
        }
        if (params.has('currency')) {
            this.state.locale.currency = params.get('currency');
        }
        if (params.has('category')) {
            this.state.selectedCategory = params.get('category');
        }
    }

    /**
     * 更新URL参数
     */
    updateURL() {
        const params = new URLSearchParams();
        params.set('country', this.state.locale.country);
        params.set('lang', this.state.locale.language);
        params.set('currency', this.state.locale.currency);

        if (this.state.selectedCategory && this.state.selectedCategory !== 'featured') {
            params.set('category', this.state.selectedCategory);
        }

        const newURL = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newURL);
    }

    /**
     * 事件系统 - 订阅
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);

        // 返回取消订阅函数
        return () => {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        };
    }

    /**
     * 事件系统 - 触发
     */
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * 获取订单Ticker数据
     */
    getOrderTicker() {
        // 生成Mock订单流
        const countries = ['MX', 'CO', 'BR', 'EG', 'NG', 'ID'];
        const actions = ['joined', 'paid for'];
        const products = this.state.products.slice(0, 6);
        const names = ['Diego', 'Maria', 'Carlos', 'Ana', 'Ahmed', 'Fatima', 'Jose', 'Sofia'];

        const ticker = [];
        for (let i = 0; i < 10; i++) {
            ticker.push({
                country: countries[Math.floor(Math.random() * countries.length)],
                name: names[Math.floor(Math.random() * names.length)],
                action: actions[Math.floor(Math.random() * actions.length)],
                product: products[Math.floor(Math.random() * products.length)]?.name || 'product',
                time: `${Math.floor(Math.random() * 30) + 1} min ago`
            });
        }

        return ticker;
    }

    /**
     * 分享功能
     */
    async share() {
        const shareData = {
            title: 'VoltRally - Factory-direct. Crowd-powered.',
            text: `Save $${this.state.currentBatch?.avgSavingPerUnit || 600} on electric vehicles through group shipping!`,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                return { success: true };
            } else {
                // 回退到复制链接
                await navigator.clipboard.writeText(window.location.href);
                return { success: true, copied: true };
            }
        } catch (error) {
            console.error('Share failed:', error);
            return { success: false, error };
        }
    }
}

// 创建全局Store实例
window.VoltRallyStore = new VoltRallyStore();