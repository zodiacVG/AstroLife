

### **星航预言家 - 最终设计系统规范 (Astro-Oracle - Final Design System) v1.0**

#### **1. 核心哲学：高保真双色辉光终端 (High-Fidelity Duotone Glow Terminal)**

  * **核心理念:** 我们的应用是一个“高保真”的复古未来主义终端。它不是对过去的简单模仿，而是将那个时代的质感与现代设计的精致相结合。
  * **用户体验:** 创造一种沉浸式的“操作感”。用户不是在浏览页面，而是在与一个充满神秘感的、来自“曾经的未来”的机器进行交互。
  * **叙事驱动:** 设计服务于叙事。荧光绿代表客观的“系统运算”，琥珀色代表充满智慧的“神谕启示”，通过色彩引导用户的情感体验。

#### **2. 设计语言 (Design Language)**

  * **2.1 色彩规范 (Color Palette):**

      * `--color-bg: #0A0A0A;` (背景) - 深邃、略带温度的近黑色，作为所有元素的画布。
      * `--c-system-glow: #33FF33;` (系统辉光) - 用于UI、数据、边框等所有“过程性”信息。
      * `--c-oracle-glow: #FFB000;` (神谕辉光) - **专用于**最终解读模块，代表“智慧”和“启示”。
      * `--c-system-border: rgba(51, 255, 51, 0.3);` (系统边框)
      * `--c-oracle-border: rgba(255, 176, 0, 0.4);` (神谕边框)

  * **2.2 字体规范 (Typography):**

      * **主字体:** `'VT323', monospace` - 具有强烈像素颗粒感和复古气质的核心字体。
      * **屏幕标题 (Screen Title):** `24px`, Uppercase, Letter-spacing: 2px, 琥珀色。
      * **反色标题 (Inverted Header):** `24px`, Letter-spacing: 2px, 纯黑文字。
      * **标准标题 (Standard Header):** `22px`。
      * **正文/段落 (Body/Paragraph):** `20px` (基于VT323的优化尺寸)，Line-height: 1.6。
      * **数据文本 (Data List):** `18px`。

  * **2.3 布局与间距 (Layout & Spacing):**

      * **基础单位:** `8px`。所有间距都是其倍数。
      * **容器内边距 (`.screen`):** `24px`。
      * **模块内边距 (`.module`):** `24px`。
      * **模块间距 (`.module`):** `24px`。

  * **2.4 视觉效果 (Visual Effects):**

      * **辉光 (Glow):** 所有文字都带有轻微的 `text-shadow`，模拟磷光体发光。
      * **闪烁 (Flicker):** 屏幕背景有一个几乎不可见的、模拟电流不稳的微妙闪烁动画。
      * **光标 (Cursor):** 经典的闪烁方块光标，是界面的灵魂。

#### **3. 组件库 (Component Library)**

以下是构成我们应用的所有核心组件的定义和规范。

  * **3.1 屏幕容器 (`.screen`)**

      * **用途:** 作为每个独立视图（如“输入界面”、“结果界面”）的根容器。
      * **样式:** 带有系统色边框和半透明深色背景。

  * **3.2 屏幕标题 (`.screen-title`)**

      * **用途:** 每个屏幕的最高级别标题。
      * **样式:** 大号、大写、琥珀色，带有下划线，极具仪式感。

  * **3.3 模块 (`.module`)**

      * **用途:** 承载独立信息区块的基本单元。
      * **样式:** 带有系统色边框和标准内外边距。

  * **3.4 标题 (`.header-inverted` / `.header-standard`)**

      * **用途:** 模块的标题。
      * **样式:** 分为两种：“反色铭牌”样式用于最高级别的模块（如神谕解读），“标准下划线”样式用于次级模块。

  * **3.5 数据列表 (`.data-list`)**

      * **用途:** 展示键值对信息，如三艘星舟的档案。
      * **样式:** 采用双列文本布局，通过标签和值进行区分。

  * **3.6 输入区域 (`.input-area`)**

      * **用途:** 供用户输入文本。
      * **样式:** 带有边框和深色背景，包含提示符`>`和闪烁光标。

  * **3.7 按钮 (`.button`)**

      * **用途:** 触发核心操作。
      * **样式:** 线框按钮，悬停时变为反色，提供清晰的交互反馈。

-----

### **4. 最终实现代码 (Final Implementation Code)**

这份HTML代码本身就是一份“活的”设计规范文档，它展示了所有组件，并用这些组件搭建了完整的应用流程界面。

```html
<!DOCTYPE html>
<html lang="zh-CN">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>星航预言家 | 设计系统 v1.0</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet">

    <style>
        /* --- 2.1 色彩规范 --- */
        :root {
            --color-bg: #0A0A0A;
            --font-terminal: 'VT323', monospace;
            --c-system-glow: #33FF33;
            --c-oracle-glow: #FFB000;
            --c-system-border: rgba(51, 255, 51, 0.3);
            --c-oracle-border: rgba(255, 176, 0, 0.4);
        }

        /* --- 基础样式 --- */
        body {
            background-color: var(--color-bg);
            font-family: var(--font-terminal);
            color: var(--c-system-glow);
            text-shadow: 0 0 5px rgba(51, 255, 51, 0.3);
            margin: 0;
            padding: 2rem;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
        }

        /* --- 3.1 屏幕容器 --- */
        .screen {
            border: 1px solid var(--c-system-border);
            padding: 24px;
            margin-bottom: 48px;
            background: rgba(10, 10, 10, 0.5);
        }

        /* --- 3.2 屏幕标题 --- */
        .screen-title {
            font-size: 24px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: var(--c-oracle-glow);
            text-shadow: 0 0 5px rgba(255, 176, 0, 0.5);
            margin: 0 0 24px 0;
            border-bottom: 1px solid var(--c-oracle-border);
            padding-bottom: 16px;
        }

        /* --- 3.3 模块 --- */
        .module {
            border: 1px solid var(--c-system-border);
            padding: 24px;
            margin-bottom: 24px;
            font-size: 20px;
            line-height: 1.6;
        }
        .module p { margin: 0 0 16px 0; }
        .module p:last-child { margin-bottom: 0; }

        /* --- 3.4 标题 --- */
        .header-inverted {
            font-size: 24px;
            letter-spacing: 2px;
            padding: 8px 16px;
            display: inline-block;
            margin-bottom: 24px;
            background-color: var(--c-oracle-glow);
            color: #000;
            text-shadow: none;
        }
        .header-standard {
            font-size: 22px;
            margin: 0 0 16px 0;
            border-bottom: 1px solid var(--c-system-border);
            padding-bottom: 8px;
        }

        /* --- 3.5 数据列表 --- */
        .data-list .data-row {
            display: flex;
            font-size: 18px;
            margin-bottom: 8px;
        }
        .data-list .data-label {
            white-space: nowrap;
            padding-right: 16px;
            color: #aaa;
        }
        .data-list .data-value {
            word-break: break-all;
        }

        /* --- 3.7 按钮 --- */
        .button {
            padding: 12px 24px;
            font-size: 18px;
            font-family: var(--font-terminal);
            border: 1px solid var(--c-system-glow);
            color: var(--c-system-glow);
            text-shadow: inherit;
            background: transparent;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 2px;
            transition: background-color 0.2s, color 0.2s;
        }
        .button:hover {
            background-color: var(--c-system-glow);
            color: #000;
            text-shadow: none;
        }

        /* --- 3.6 输入区域 --- */
        .input-area {
            border: 1px solid var(--c-system-border);
            padding: 16px;
            background: rgba(0, 0, 0, 0.3);
            font-size: 20px;
        }
        .input-area .prompt {
            margin-right: 8px;
        }

        /* --- 3.8 进度指示器 --- */
        .progress-bar {
            font-size: 18px;
        }

        /* --- 3.9 光标 --- */
        .cursor {
            width: 1ch;
            height: 1em;
            background-color: var(--c-system-glow);
            display: inline-block;
            vertical-align: text-bottom;
            animation: blink 1s step-end infinite;
        }

        @keyframes blink {
            50% { opacity: 0; }
        }
    </style>
</head>

<body>

    <div class="container">
        <div class="screen">
            <h1 class="screen-title">Design System v1.0 - Components</h1>
            
            <div class="module">
                <p>// Component: Inverted Header</p>
                <div class="header-inverted">Oracle Decryption</div>
            </div>
            <div class="module">
                <p>// Component: Standard Header</p>
                <h2 class="header-standard">SYSTEM LOG</h2>
                <p>Log content goes here.</p>
            </div>
            <div class="module">
                <p>// Component: Data List</p>
                <div class="data-list">
                    <div class="data-row"><span class="data-label">本命星舟 :</span><span class="data-value">[ID:011] HUBBLE</span></div>
                </div>
            </div>
            <div class="module">
                 <p>// Component: Input Area & Cursor</p>
                 <div class="input-area">
                    <span class="prompt">></span><span>请输入指令...</span><span class="cursor"></span>
                 </div>
            </div>
            <div class="module">
                 <p>// Component: Button</p>
                 <button class="button">Execute Query</button>
            </div>
        </div>

        <div class="screen">
            <h1 class="screen-title">Blueprint: Command Input</h1>
            <h2 class="header-standard">Awaiting command</h2>
            <div class="input-area">
                <p><span class="prompt">> ENTER BIRTH DATE (YYYY-MM-DD):</span><span>1990-04-10</span></p>
            </div>
            <br>
            <div class="input-area">
                <p><span class="prompt">> ENTER QUERY:</span><span>我是否应该放弃稳定的工作去创业？</span><span class="cursor"></span></p>
            </div>
            <br>
            <button class="button">Execute Query</button>
        </div>

        <div class="screen">
            <h1 class="screen-title">Blueprint: Resonance Analysis</h1>
            <h2 class="header-standard">SYSTEM LOG</h2>
            <p>... Tri-Body Alignment in progress ...</p>
            <p class="progress-bar">[▆▆▆▆▆▆____] 60%</p>
            <p>... Lock: Starship of Origin [ID:011] HUBBLE</p>
            <p>... Lock: Starship of Inquiry [ID:001] SPUTNIK 1</p>
            <p>... Lock: Starship of the Celestial Moment [ID:010] VOYAGER 1</p>
            <p>... DECRYPTION COMPLETE. <span class="cursor"></span></p>
        </div>

        <div class="screen">
            <h1 class="screen-title">Blueprint: Oracle Decryption</h1>
            <div class="module">
                <h2 class="header-standard">Resonance Matrix</h2>
                <div class="data-list">
                    <div class="data-row"><span class="data-label">本命星舟 :</span><span class="data-value">[ID:011] HUBBLE</span></div>
                    <div class="data-row"><span class="data-label">问道星舟 :</span><span class="data-value">[ID:001] SPUTNIK 1</span></div>
                    <div class="data-row"><span class="data-label">天时星舟 :</span><span class="data-value">[ID:010] VOYAGER 1</span></div>
                </div>
            </div>
            <div class="module" style="border-color: var(--c-oracle-border); color: var(--c-oracle-glow); text-shadow: 0 0 5px rgba(255, 176, 0, 0.5);">
                <div class="header-inverted">Oracle Counsel</div>
                <p>指令：你的“哈勃”飞船被要求执行一次“史普尼克”式的闪电任务... <span class="cursor" style="background-color: var(--c-oracle-glow);"></span></p>
            </div>
        </div>
    </div>
</body>
</html>
```