

VoltRally 前端强约束开发规则（面向 Claude）

目标：任何页面都必须是可交互、可配置、可接后端的成品，不是静态演示。
底线：可用性 > 速度 > 漂亮。禁止一切“图标/emoji/图标字体/SVG/图片小图标”。

⸻

0. 永久贴纸（必须牢记）
	•	✅ 禁止图标：不准使用 <svg>、<i class="icon…">、<img> 充当 UI 图标、Emoji（🙂）、Icon Font（FontAwesome/Material）、背景图当图标（background-image:url(...)）等任何形式。
	•	替代方案：
	•	文本标签（如 “Share” “Orders 3” “Save $300”）。
	•	文本徽章（Badge）：“NEW”“HOT”“-15%”。
	•	有语义的按钮文案（“Join Group”“Buy 1–4 (Solo)”）。
	•	进度用 <meter> 或带 role="progressbar" 的文本进度条。
	•	✅ 不得提交静态页面：页面必须接 Mock 或 API 并可交互（筛选/排序/分页/对比/收藏/快速查看/加入团购等）。
	•	✅ 所有交互可以键盘完成，有清晰焦点样式与 aria-*。
	•	✅ URL 可分享/可刷新：筛选、排序、分页、国家/语言/币种等，均写入 QueryString 并可恢复。
	•	✅ 所有数据位都保留 API 端口（见第 5 节），并提供 Mock 回退。
	•	✅ 响应式完成度：移动 1 列、桌面 3 列（首页产品区/列表页），首屏每类≥ 6 张卡片。

违反以上任一项，视为不达标。

⸻

1. 设计系统（无图标版本）
	•	色板（只用这些 Token）
	•	--bg:#0f1114 --panel:#15181d --line:#20242a
	•	--text:#e7ebf0 --muted:#8b96a8 --accent:#f3c24b --danger:#ff5c5c
	•	排版
	•	H1 32/40，H2 24/32，H3 20/28，正文 16/24，说明 14/22。只用系统字体栈。
	•	间距/圆角
	•	间距：4/8/12/16/24/32；卡片圆角 12，按钮圆角 10。
	•	按钮
	•	主按钮（黑金）：深底 + --accent 渐变描边（或纯色）+ 文本；次按钮深底浅字；文本按钮带下划线。
	•	禁用元素
	•	图标、图标字库、Emoji、装饰性 SVG/PNG、背景纹理图。
	•	允许元素
	•	产品/场景大图（内容图片，不是 UI 图标），表格、进度条、文本徽章。

⸻

2. 结构与路由（文件/路由统一）
	•	index.html 首页（国家/语言/币种切换、类目入口、推荐产品）
	•	category.html 类目着陆（文案+子类目跳转）
	•	product-list.html 列表页（筛选/排序/分页/对比/收藏/QuickView）
	•	product.html 详情页（多变体、联动图、数量叠加、加入团购/单买、参数/合规/工厂模块）
	•	checkout.html 结账（地址/发票/TT 支付/条款）
	•	orders.html 我的订单列表
	•	order.html 订单详情（时间线/文件/状态）
	•	login.html register.html forgot-password.html
	•	account-dashboard.html account-settings.html address-book.html invoice-profiles.html
	•	support-tickets.html notifications.html
	•	资源：/assets，Mock：/mock，工具：/tools。

已有文件名不一致时，新增统一路由的别名页并301/跳转到统一命名。

⸻

3. 首页（只写关键点，详规见《首页 UX 规范》）
	•	顶栏：左 LOGO，居中“Auto 国家/语言/币种”选择器（文本），右侧 “Share / Orders / Sign in”。
	•	首屏：国家标语 + 时间线（Open/Lock/Ship/Arrive）+ Join Now / Buy 1–4，不可用图标，仅文本。
	•	分类吸顶：Featured / 3-Wheel Cargo / 2-Wheel Electric / Batteries / Parts & Accessories / Why VoltRally
	•	产品区（重点）：
	•	每类至少 6 个卡片；卡片并排显示 Group 价与 Solo 价（文本徽章显示“Save $X”）。
	•	移动 1 列，桌面 3 列。
	•	国家覆盖模块：文本列表/表格，不用地图图标。
	•	Why 模块：四项卖点用标题+两行说明文字，不使用任何小图。
	•	底部：文本导航 + 法务。

⸻

4. 交互与状态（全站通用）
	•	URL 状态：筛选、排序、分页、国家/语言/币种、视图模式等，都写入 Query（?country=MX&lang=es&currency=MXN&sort=popular&page=2...）。
	•	滚动恢复：从详情返回列表，恢复滚动位置（sessionStorage.catalogScrollTop）。
	•	键盘：Tab 遍历、Enter 触发主要动作、Space 切换勾选；焦点清晰。
	•	语义：进度条 <meter> 或 role="progressbar"，徽章用 <span class="badge"> 文本。
	•	空态：提供“Clear filters / Back to category / Back to home”与推荐 4 个产品。
	•	错误：接口报错显示错误码+重试；连续 3 次失败自动切 Mock。
	•	收藏：仅本地 localStorage.favorites=[sku...]，右上“Saved (N)”跳收藏聚合页。
	•	对比：吸底对比栏（最多 3 条），对比页为表格（文本字段），禁止任何图标。

⸻

5. 接口端口（必须预留）

前端先接 Mock，接口准备好后直接替换 Base URL 即可。字段命名不得再随意变动。

	•	GET /api/locale/bootstrap → { country, lang, currency, rate, symbol, countries:[...], languages:[...], currencies:[...] }
	•	GET /api/home → 首页文案、Banner 文本、推荐列表（各类 6 条）、国家覆盖数据。
	•	GET /api/catalog（列表页）
	•	入参：cat、country、lang、currency、q、sort、page/per、voltage[]/speedMin/speedMax/rangeMin/rangeMax/payloadMin/payloadMax、group 等
	•	出参：items[]（含 groupPrice/soloPrice/target/joined/groupEligible）、facets、page/per/total/hasMore
	•	GET /api/catalog/compare?skus=... → 对比字段
	•	GET /api/product/:id → 详情页（多变体、库存、每变体 target）
	•	POST /api/cart/add、POST /api/group/join（入参带 sku/qty/country/currency）
	•	GET /api/orders、GET /api/order/:id
	•	POST /api/tt/upload-proof
	•	POST /api/analytics（埋点）

注意：不同 SKU 的 target（拼箱数量）可不同，必须从接口字段读取，不得硬编码 36。

⸻

6. Mock 数据（Claude 必须提供）
	•	/mock/home.json、/mock/catalog-3w.json、-2w.json、-batt.json、-parts.json、/mock/product/*.json
	•	每大类 ≥ 24 条，每国家（MX/CO/EG 起步）≥ 6 条可售卖项；首屏至少渲染 6 个。
	•	商品字段必须含：id,name,thumb,specs{...},soloPrice,groupPrice,currency,groupEligible,joined,target,country,tags[]。
	•	错误/空态样本：每类提供 1 份空结果与 1 份 500 错误响应，验证兜底。

⸻

7. 性能、A11y 与 QA
	•	性能预算（移动中档机）：FCP < 2.5s，LCP < 3.5s，首屏 JS ≤ 150KB（gzip 后）。
	•	懒加载：图片阈值 200px；有 srcset(320/640/960)。
	•	可达性：对比度 ≥4.5:1，语义标签、aria-label 完整。
	•	自检脚本：/tools/self-check.js 提供 window.vrSelfCheck()：
	•	检查 DOM 必备区域是否存在；
	•	URL ↔ UI 同步；
	•	首屏卡片数 ≥ 6，且每张都有 Group & Solo 价格；
	•	进度条 aria 正确；
	•	输出 reports/overview.md（时间戳、接口耗时、缓存命中、错误次数、Lighthouse 关键指标）。

⸻

8. 自动“禁用图标”扫描（必须运行）

提交前运行 /tools/no-icon-check.js（或简单的 grep 脚本），匹配以下禁用特征，命中即失败：
	•	<svg、</svg>、<i class=、class="icon、fa-、material-icons、<use xlink:href=
	•	background-image:、url(（若非产品内容图片路径需豁免说明）
	•	content:"\f（伪元素使用图标字库）
	•	🛒、🔍 等 Emoji 字符
	•	远程 icon-font / CDN（如 fontawesome/unpkg material-icons）

任何命中都必须改为文本实现（例如 “Search”“View”“Orders 3” 等）。

⸻

9. 交付物与 Definition of Done
	•	页面：上述所有路由页可交互版本 + 响应式完成 + URL/滚动恢复完成。
	•	数据：完整 Mock 集 + 错误/空态样本。
	•	工具：/tools/self-check.js、/tools/no-icon-check.js。
	•	报告：/reports/overview.md（自检结果）、/reports/upgrade-summary.md（相对上一版的改动点）。
	•	DoD 勾选：
	•	未使用任何图标/图标字库/Emoji；no-icon-check 全绿
	•	首屏每类 ≥ 6 卡；Group & Solo 价格并排可见
	•	URL 可分享并可恢复状态；返回列表可恢复滚动
	•	Mock 齐全、空态/错误兜底齐全
	•	可键盘操作、aria 合规
	•	自检脚本通过并提交报告

⸻

10. 常见偷懒红线（见到就回退）
	•	❌ 图标/Emoji/小贴纸、用图片当 UI 控件
	•	❌ 静态 HTML 卡片、硬编码价格/进度/目标数
	•	❌ 筛选仅“样子货”，不联动 URL 与数据
	•	❌ 移动端只缩放不重排
	•	❌ 详情页无变体联动与数量叠加逻辑
	•	❌ 拼箱目标写死 36（应读每 SKU 的 target）

