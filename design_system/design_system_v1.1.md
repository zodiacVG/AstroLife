### 星航预言家 - 设计系统规范 v1.1（扩展版）

本版本在 v1.0 的基础上补充设计令牌（Design Tokens）、状态规范、可访问性、响应式、组件细则与页面模板，确保后续新增组件与页面能一致演进。

—

#### 0. 命名与作用域（Naming & Scope）

- 前缀：使用 `ao-` 作为 BEM 命名前缀（Astro Oracle）。示例：`ao-screen`、`ao-module`、`ao-button`、`ao-card--starship`。
- 语义主题：通过 `data-tone="system|oracle"` 切换系统/神谕两种语义色层；组件默认 `system`，在神谕语义区域内继承 `oracle`。
- 变量前缀：设计令牌统一使用 `--ao-...`，组件变量使用 `--c-...` 并引用令牌。

—

#### 1. 设计令牌（Design Tokens）

- 颜色（Duotone Terminal）
  - `--ao-color-bg: #0A0A0A`（画布）
  - `--ao-color-system: #33FF33`（系统辉光）
  - `--ao-color-oracle: #FFB000`（神谕辉光）
  - `--ao-border-system: rgba(51,255,51,0.30)`、`--ao-border-oracle: rgba(255,176,0,0.40)`
  - 辅助：`--ao-color-muted: #A9B39F`（标签/弱化）、`--ao-color-danger: #FF4D4F`、`--ao-color-warning: #FFC53D`、`--ao-color-success: #52C41A`

- 字体（Typography）
  - `--ao-font-terminal: 'VT323', monospace`
  - 尺寸刻度（px）：`12, 14, 16, 18, 20, 22, 24, 28`
  - 行高：`--ao-lh-tight: 1.3`、`--ao-lh-normal: 1.6`
  - 字间距：`--ao-ls-wide: 2px`（屏幕标题/铭牌）

- 间距（Spacing，8pt 系统）
  - `--ao-space-1: 4px`、`--ao-space-2: 8px`、`--ao-space-3: 12px`、`--ao-space-4: 16px`
  - `--ao-space-5: 24px`、`--ao-space-6: 32px`、`--ao-space-7: 40px`、`--ao-space-8: 48px`

- 轮廓与分隔（Outline & Divider）
  - `--ao-radius-0: 0px`（锐角为主）
  - 线宽：`--ao-border-1: 1px`

- 光晕与阴影（Glow & Shadow）
  - 系统文本辉光：`--ao-glow-system: 0 0 5px rgba(51,255,51,.30)`
  - 神谕文本辉光：`--ao-glow-oracle: 0 0 5px rgba(255,176,0,.50)`
  - 模块内面：`--ao-surface: rgba(10,10,10,.50)`

- 动效（Motion）
  - 时长：`--ao-dur-fast: 120ms`、`--ao-dur-med: 200ms`、`--ao-dur-slow: 320ms`
  - 缓动：`--ao-ease: cubic-bezier(.22,.61,.36,1)`（自然减速）
  - 光标闪烁：`1s step-end infinite`；尊重 `prefers-reduced-motion`

- 层级（Z-Index）
  - `--ao-z-base: 0`、`--ao-z-overlay: 1000`、`--ao-z-toast: 1100`、`--ao-z-modal: 1200`

- 断点（Breakpoints）
  - `--ao-bp-sm: 480px`、`--ao-bp-md: 768px`、`--ao-bp-lg: 1024px`、`--ao-bp-xl: 1280px`

—

#### 2. 主题语义与状态（Tone & States）

- 语义切换
  - 容器上使用：`[data-tone="system"]`（默认）/`[data-tone="oracle"]`
  - 文本/边框/光晕随 tone 切换（系统=绿色、神谕=琥珀色）

- 交互状态（统一规则）
  - `:hover`：背景由透明过渡至语义色 8% 不透明度；文本保持语义色
  - `:active`：背景 16% 不透明度；轻微缩放 `0.98`
  - `:focus-visible`：1px 语义边框 + 外发光（系统/神谕）；确保键盘可见
  - `:disabled`：不透明度 0.5；禁用指针；移除发光
  - 校验状态：danger/warning/success 以边框、标签、提示文本呈现（避免大量红色文本）

—

#### 3. 基础组件（Primitives）

- 屏幕容器 `ao-screen`
  - 内边距：`--ao-space-5`；背景：`--ao-surface`；边框：tone 边框
  - 标题 `ao-screen__title`：24px、全大写、`--ao-ls-wide`、tone 文本与下划线

- 模块 `ao-module`
  - 结构：`ao-module` + 标题（两类）+ 内容
  - 标题-铭牌 `ao-header--inverted`：24px、底色=tone 文本色、字色=黑、无阴影
  - 标题-标准 `ao-header--standard`：22px、底部 1px 分隔线= tone 边框

- 数据列表 `ao-data-list`
  - 行 `ao-data-row`：左右两列；`label` 采用弱化色；`value` 自动换行
  - 用途：三舟档案、系统日志键值

- 输入域 `ao-input` / `ao-textarea`
  - 统一内边距、边框、背景、占位符色；支持 `error|success` 修饰类
  - 终端提示符作为独立元素：`ao-prompt`；光标元素 `ao-cursor`

- 按钮 `ao-button`
  - 线框为主；hover 反色；支持 `--size-sm|md|lg`、`--variant-ghost|solid`（默认 ghost）

- 进度 `ao-progress`
  - 文本进度条或格栅样式，等宽字体对齐

- 标签/徽标 `ao-tag`
  - 用于关键词（StarshipsPage）；tone 影响边框与文本色

—

#### 4. 复合组件（Patterns）

- 卡片：星舟卡 `ao-card ao-card--starship`
  - 标题（中文名）+ 官方名 + 基础信息区 + 关键词标签组 + 神谕文本
  - 与 `frontend/src/pages/StarshipsPage.tsx` 的 `starship-card` 映射，建议迁移命名/样式至 `ao-card--starship`

- 栅格：星舟栅格 `ao-grid ao-grid--starships`
  - 响应式列数：`1 / 2 / 3` 于 `sm/md/lg`

- 三体共振摘要 `ao-resonance`
  - 三个卡片（本命/天时/问道）对齐展示；状态位（loading/error/success）统一样式
  - 对应 `frontend/src/pages/CalculatePage.tsx` 的 `starships-grid` 与 `starship-card [destiny|timely|question]`

- 神谕解读模块 `ao-oracle`
  - 使用 `data-tone="oracle"`，内含铭牌标题 + 解读正文；强调文本发光与滚动阅读的可读性

- 系统日志 `ao-log`
  - 单色等宽文本，逐行追加；可选“打字机”过渡；尊重 reduced motion

—

#### 5. 页面模板（Page Blueprints）

- 指令输入（Command Input）
  - 结构：`ao-screen` > `ao-header--standard` > 两个输入域（出生日期、问题）> 主按钮
  - 辅助：键盘导航顺序、必填校验、错误提示（下方轻提示）

- 共振分析（Resonance Analysis）
  - 结构：日志模块 + 文字进度条；完成后滚动停留到“解密完成”

- 神谕解读（Oracle Decryption）
  - 结构：共振矩阵（数据列表）+ 神谕模块（铭牌+正文）；`data-tone="oracle"`

—

#### 6. 可访问性（A11y）

- 对比度：系统/神谕文本相对 `#0A0A0A` 均满足 4.5:1（正文 18px 可放宽至 3:1，但建议保持 4.5:1）
- 焦点可见：所有可交互元素实现 `:focus-visible` 环（边框+外发光）
- 键盘：Tab 顺序与视觉一致；Enter/Space 激活按钮；Esc 关闭浮层
- 减少动效：`@media (prefers-reduced-motion: reduce)` 降低闪烁/打字机/平移动画
- ARIA：终端区域可使用 `role="log" aria-live="polite"`；进度 `role="progressbar" aria-valuenow`

—

#### 7. 文案与排版（Content）

- 中英文混排：英文与数字默认等宽；中文正文 20px，数据 18px
- 大写使用：仅用于屏幕标题/铭牌；正文保持自然大小写
- 日期与数字：全部采用 `YYYY-MM-DD` 与半角数字；与 `shared/constants/astro.constants.ts` 中常量一致

—

#### 8. 代码落地（Implementation Map）

- 样式落地
  - 新建全局样式文件：`frontend/src/styles/ao-design.css`（收敛变量与通用组件样式）
  - 页面内旧类名对照：
    - `starships-grid` → `ao-grid ao-grid--starships`
    - `starship-card` → `ao-card ao-card--starship`
    - `calculate-form` → `ao-form`
    - `oracle-section/oracle-text` → `ao-oracle`

- 组件分层
  - Primitives：`AoScreen`、`AoModule`、`AoHeader`、`AoButton`、`AoDataList`、`AoInput`
  - Patterns：`AoStarshipCard`、`AoResonance`、`AoOracle`

- React 使用建议
  - 语义 tone：在神谕区域容器加 `data-tone="oracle"`
  - 焦点管理：按钮与输入统一 `:focus-visible`
  - Loading/Error：与 `CalculatePage` 的三步状态统一到 `ao-card` 的修饰类（`is-loading|is-error|is-success`）

—

#### 9. 样例变量与样式（可直接拷贝至 ao-design.css）

```css
:root {
  --ao-color-bg:#0A0A0A; --ao-color-system:#33FF33; --ao-color-oracle:#FFB000;
  --ao-border-system:rgba(51,255,51,.3); --ao-border-oracle:rgba(255,176,0,.4);
  --ao-color-muted:#A9B39F; --ao-color-danger:#FF4D4F; --ao-color-warning:#FFC53D; --ao-color-success:#52C41A;
  --ao-font-terminal:'VT323',monospace; --ao-lh-normal:1.6; --ao-ls-wide:2px;
  --ao-space-2:8px; --ao-space-4:16px; --ao-space-5:24px; --ao-space-8:48px;
  --ao-glow-system:0 0 5px rgba(51,255,51,.30); --ao-glow-oracle:0 0 5px rgba(255,176,0,.50);
}

[data-tone="system"], body { color: var(--ao-color-system); text-shadow: var(--ao-glow-system); }
[data-tone="oracle"] { color: var(--ao-color-oracle); text-shadow: var(--ao-glow-oracle); }

.ao-screen { border:1px solid var(--ao-border-system); padding:var(--ao-space-5); background:rgba(10,10,10,.5); }
[data-tone="oracle"] .ao-screen { border-color: var(--ao-border-oracle); }
.ao-screen__title { font: 24px/1 var(--ao-font-terminal); letter-spacing: var(--ao-ls-wide); text-transform: uppercase; padding-bottom: var(--ao-space-4); border-bottom:1px solid var(--ao-border-oracle); }

.ao-module { border:1px solid var(--ao-border-system); padding:var(--ao-space-5); margin-bottom:var(--ao-space-5); font: 20px/var(--ao-lh-normal) var(--ao-font-terminal); }
[data-tone="oracle"] .ao-module { border-color: var(--ao-border-oracle); }
.ao-header--inverted { font-size:24px; letter-spacing:var(--ao-ls-wide); padding:8px 16px; background:var(--ao-color-oracle); color:#000; text-shadow:none; display:inline-block; margin-bottom:var(--ao-space-5); }
.ao-header--standard { font-size:22px; padding-bottom:8px; border-bottom:1px solid var(--ao-border-system); margin:0 0 var(--ao-space-4); }

.ao-data-row { display:flex; gap:var(--ao-space-4); font-size:18px; margin-bottom:8px; }
.ao-data-row .label { color: var(--ao-color-muted); white-space:nowrap; }
.ao-data-row .value { word-break:break-all; }

.ao-button { padding:12px 24px; font:18px var(--ao-font-terminal); border:1px solid currentColor; background:transparent; cursor:pointer; text-transform:uppercase; letter-spacing:var(--ao-ls-wide); transition: background-color .2s, color .2s; }
.ao-button:hover { background: currentColor; color:#000; text-shadow:none; }
.ao-button:focus-visible { outline:0; box-shadow:0 0 0 1px currentColor, 0 0 8px currentColor; }
.ao-button:disabled { opacity:.5; cursor:not-allowed; text-shadow:none; }

.ao-input, .ao-textarea { width:100%; border:1px solid var(--ao-border-system); background:rgba(0,0,0,.3); color:inherit; padding:var(--ao-space-4); font:20px var(--ao-font-terminal); }
.ao-input:focus-visible, .ao-textarea:focus-visible { outline:0; box-shadow:0 0 0 1px currentColor, 0 0 8px currentColor; }
.ao-input.is-error, .ao-textarea.is-error { border-color: var(--ao-color-danger); }

.ao-grid--starships { display:grid; grid-template-columns:1fr; gap:var(--ao-space-5); }
@media(min-width:768px){ .ao-grid--starships{ grid-template-columns:1fr 1fr; } }
@media(min-width:1024px){ .ao-grid--starships{ grid-template-columns:1fr 1fr 1fr; } }

.ao-card { border:1px solid var(--ao-border-system); padding:var(--ao-space-5); }
.ao-card.is-loading, .ao-card.is-error { opacity:.85; }
.ao-card--starship .name { font-size:22px; margin-bottom:8px; }
.ao-tag { display:inline-block; border:1px solid currentColor; padding:2px 8px; margin:0 8px 8px 0; font:18px var(--ao-font-terminal); }

.ao-cursor { width:1ch; height:1em; display:inline-block; vertical-align:text-bottom; background: currentColor; animation: blink 1s step-end infinite; }
@media (prefers-reduced-motion: reduce){ .ao-cursor{ animation: none; } }
@keyframes blink { 50% { opacity:0; } }
```

—

#### 10. 集成清单（短期落地建议）

1) 新建 `frontend/src/styles/ao-design.css` 并粘贴第 9 节样式
2) 页面替换类名（逐步）：
   - `StarshipsPage.tsx`：`starships-grid`→`ao-grid ao-grid--starships`；`starship-card`→`ao-card ao-card--starship`
   - `CalculatePage.tsx`：按钮→`ao-button`；表单输入→`ao-input/ao-textarea`；结果区容器→`ao-screen`/`ao-module`
3) 神谕解读容器加 `data-tone="oracle"`，其内文本和边框自动切换为琥珀色
4) 为可交互元素加入统一 `:focus-visible` 样式，提升可访问性

—

参考：
- 现有设计示例 `design_system/designv1.html`
- 页面实现 `frontend/src/pages/StarshipsPage.tsx`、`frontend/src/pages/CalculatePage.tsx`
- 常量定义 `shared/constants/astro.constants.ts`

