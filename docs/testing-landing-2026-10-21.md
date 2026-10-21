# Landing 匿名浏览器验收 · 2026-10-21

状态：八组自动检查通过；截图需结合人工审阅。

执行：2026-10-21T11:14:08.615Z → 2026-10-21T11:14:16.814Z。READY 由主代理明确通知后执行。
目标：http://127.0.0.1:3000/；Chrome Chrome/155.0.8059.85；独立 CDP 9243；构建 o6qaqxYzmx_I8xa6HVlhK；构建起止一致：通过。

范围：320 / 375 / 768 / 1280px × 浅/深色，视口高 900，DPR 1；小于768使用mobile模拟，中文公开落地页。每组首屏、adaptive、history原始浏览器截图；真实指针点击main内全部登录CTA，验证登录页标题及redirect=/dashboard；不提交登录。登录UI使用OAuth按钮，不以form元素作为成功条件。

隔离：新Chrome临时profile，无登录cookie、无鉴权token、无.env和数据库连接。拦截所有非GET/HEAD/OPTIONS请求与站外HTTP请求。未改产品、未build、未启停应用或数据库。仅关闭本脚本启动的浏览器。

自动检查：main文本/可访问名称/伪元素无emoji，已渲染元素/伪元素无CSS blur与SVG Gaussian blur；页面及main元素/文字Range无横向越界；整页h1唯一且id=landing-title；浅深色实际生效；hero“界面示例”、adaptive“阅读计划示例”、history“四周记录示例”及“示意数据，非用户统计”。

自动结果：8/8，目标8；截图24张。

|组合|Emoji|Blur|横向溢出|唯一h1|Adaptive示例|History示例/非用户统计|CTA实跳|主题|构建|结果|
|---|---|---|---|---|---|---|---|---|---|---|
|320-zh-light|通过|通过|通过|通过|通过|通过|通过|通过|通过|通过|
|320-zh-dark|通过|通过|通过|通过|通过|通过|通过|通过|通过|通过|
|375-zh-light|通过|通过|通过|通过|通过|通过|通过|通过|通过|通过|
|375-zh-dark|通过|通过|通过|通过|通过|通过|通过|通过|通过|通过|
|768-zh-light|通过|通过|通过|通过|通过|通过|通过|通过|通过|通过|
|768-zh-dark|通过|通过|通过|通过|通过|通过|通过|通过|通过|通过|
|1280-zh-light|通过|通过|通过|通过|通过|通过|通过|通过|通过|通过|
|1280-zh-dark|通过|通过|通过|通过|通过|通过|通过|通过|通过|通过|

## 失败证据

当前执行范围未发现自动检查失败。

## 截图与人工视觉审查

脚本只报告实际DOM与截图结果；人工视觉结论由审阅者补充，不能把自动通过等同于完整视觉验收。
- 320-zh-light: [first-screen](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-320-zh-light-first-screen.png) · [adaptive](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-320-zh-light-adaptive.png) · [history](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-320-zh-light-history.png)
- 320-zh-dark: [first-screen](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-320-zh-dark-first-screen.png) · [adaptive](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-320-zh-dark-adaptive.png) · [history](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-320-zh-dark-history.png)
- 375-zh-light: [first-screen](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-375-zh-light-first-screen.png) · [adaptive](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-375-zh-light-adaptive.png) · [history](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-375-zh-light-history.png)
- 375-zh-dark: [first-screen](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-375-zh-dark-first-screen.png) · [adaptive](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-375-zh-dark-adaptive.png) · [history](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-375-zh-dark-history.png)
- 768-zh-light: [first-screen](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-768-zh-light-first-screen.png) · [adaptive](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-768-zh-light-adaptive.png) · [history](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-768-zh-light-history.png)
- 768-zh-dark: [first-screen](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-768-zh-dark-first-screen.png) · [adaptive](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-768-zh-dark-adaptive.png) · [history](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-768-zh-dark-history.png)
- 1280-zh-light: [first-screen](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-1280-zh-light-first-screen.png) · [adaptive](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-1280-zh-light-adaptive.png) · [history](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-1280-zh-light-history.png)
- 1280-zh-dark: [first-screen](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-1280-zh-dark-first-screen.png) · [adaptive](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-1280-zh-dark-adaptive.png) · [history](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-1280-zh-dark-history.png)

## 方法限制

本地生产构建、CDP模拟视口和主题，不是真机、线上测速或所有浏览器兼容性测试。只检查匿名公开landing；不测试登录提交或任何写入。示例标记验证是文案检查，不核验真实用户统计。blur检查针对当前已渲染样式；没有把未应用的CSS声明当作运行中装饰。

## 原始证据

```json
{
  "startedAt": "2026-10-21T11:14:08.615Z",
  "runId": "2026-10-21T11-14-08-611Z",
  "base": "http://127.0.0.1:3000",
  "port": 9243,
  "quick": false,
  "cases": [
    {
      "id": "320-zh-light",
      "width": 320,
      "theme": "light",
      "checks": {
        "theme": {
          "pass": true,
          "actual": "light",
          "expected": "light"
        },
        "anonymous": {
          "pass": true,
          "note": "Fresh browser profile, no auth cookie inserted; anonymous CTA independently required."
        },
        "heading": {
          "pass": true,
          "h1s": [
            {
              "text": "每天一点，时间会放大。",
              "id": "landing-title",
              "visible": true
            }
          ]
        },
        "emoji": {
          "pass": true,
          "matches": [],
          "pseudoMatches": []
        },
        "blur": {
          "pass": true,
          "matches": []
        },
        "overflow": {
          "pass": true,
          "width": 320,
          "scrollWidth": 320,
          "elements": [],
          "text": []
        },
        "adaptive": {
          "pass": true,
          "labels": [
            "阅读计划示例"
          ],
          "disclaimerPresent": true,
          "heading": "同一件事，不必每天做一样多。"
        },
        "history": {
          "pass": true,
          "labels": [
            "四周记录示例\n\n示意数据，非用户统计。",
            "四周记录示例"
          ],
          "disclaimerPresent": true,
          "heading": "看见积累，也看见停下来的日子。"
        },
        "heroSample": {
          "pass": true,
          "labels": [
            "今日行动\n界面示例",
            "界面示例"
          ],
          "disclaimerPresent": true
        },
        "ctaLinks": {
          "pass": true,
          "links": [
            {
              "text": "进入我的行动",
              "href": "http://127.0.0.1:3000/signin?redirect=%2Fdashboard",
              "pass": true
            }
          ]
        },
        "build": {
          "pass": true,
          "expected": "o6qaqxYzmx_I8xa6HVlhK",
          "actual": "o6qaqxYzmx_I8xa6HVlhK"
        },
        "ctaNavigation": {
          "pass": true,
          "results": [
            {
              "pass": true,
              "url": "http://127.0.0.1:3000/signin?redirect=%2Fdashboard",
              "title": "Sign In to Habit Runner",
              "authButtons": [],
              "authAlert": "No authentication provider configured in this environment. Please contact the administrator."
            }
          ]
        },
        "diagnostics": {
          "pass": true,
          "browserErrors": 0,
          "httpErrors": 0,
          "blockedWrites": 0
        }
      },
      "screenshots": [
        {
          "name": "first-screen",
          "path": "/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-320-zh-light-first-screen.png"
        },
        {
          "name": "adaptive",
          "path": "/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-320-zh-light-adaptive.png"
        },
        {
          "name": "history",
          "path": "/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-320-zh-light-history.png"
        }
      ],
      "pass": true
    },
    {
      "id": "320-zh-dark",
      "width": 320,
      "theme": "dark",
      "checks": {
        "theme": {
          "pass": true,
          "actual": "dark",
          "expected": "dark"
        },
        "anonymous": {
          "pass": true,
          "note": "Fresh browser profile, no auth cookie inserted; anonymous CTA independently required."
        },
        "heading": {
          "pass": true,
          "h1s": [
            {
              "text": "每天一点，时间会放大。",
              "id": "landing-title",
              "visible": true
            }
          ]
        },
        "emoji": {
          "pass": true,
          "matches": [],
          "pseudoMatches": []
        },
        "blur": {
          "pass": true,
          "matches": []
        },
        "overflow": {
          "pass": true,
          "width": 320,
          "scrollWidth": 320,
          "elements": [],
          "text": []
        },
        "adaptive": {
          "pass": true,
          "labels": [
            "阅读计划示例"
          ],
          "disclaimerPresent": true,
          "heading": "同一件事，不必每天做一样多。"
        },
        "history": {
          "pass": true,
          "labels": [
            "四周记录示例\n\n示意数据，非用户统计。",
            "四周记录示例"
          ],
          "disclaimerPresent": true,
          "heading": "看见积累，也看见停下来的日子。"
        },
        "heroSample": {
          "pass": true,
          "labels": [
            "今日行动\n界面示例",
            "界面示例"
          ],
          "disclaimerPresent": true
        },
        "ctaLinks": {
          "pass": true,
          "links": [
            {
              "text": "进入我的行动",
              "href": "http://127.0.0.1:3000/signin?redirect=%2Fdashboard",
              "pass": true
            }
          ]
        },
        "build": {
          "pass": true,
          "expected": "o6qaqxYzmx_I8xa6HVlhK",
          "actual": "o6qaqxYzmx_I8xa6HVlhK"
        },
        "ctaNavigation": {
          "pass": true,
          "results": [
            {
              "pass": true,
              "url": "http://127.0.0.1:3000/signin?redirect=%2Fdashboard",
              "title": "Sign In to Habit Runner",
              "authButtons": [],
              "authAlert": "No authentication provider configured in this environment. Please contact the administrator."
            }
          ]
        },
        "diagnostics": {
          "pass": true,
          "browserErrors": 0,
          "httpErrors": 0,
          "blockedWrites": 0
        }
      },
      "screenshots": [
        {
          "name": "first-screen",
          "path": "/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-320-zh-dark-first-screen.png"
        },
        {
          "name": "adaptive",
          "path": "/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-320-zh-dark-adaptive.png"
        },
        {
          "name": "history",
          "path": "/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-320-zh-dark-history.png"
        }
      ],
      "pass": true
    },
    {
      "id": "375-zh-light",
      "width": 375,
      "theme": "light",
      "checks": {
        "theme": {
          "pass": true,
          "actual": "light",
          "expected": "light"
        },
        "anonymous": {
          "pass": true,
          "note": "Fresh browser profile, no auth cookie inserted; anonymous CTA independently required."
        },
        "heading": {
          "pass": true,
          "h1s": [
            {
              "text": "每天一点，时间会放大。",
              "id": "landing-title",
              "visible": true
            }
          ]
        },
        "emoji": {
          "pass": true,
          "matches": [],
          "pseudoMatches": []
        },
        "blur": {
          "pass": true,
          "matches": []
        },
        "overflow": {
          "pass": true,
          "width": 375,
          "scrollWidth": 375,
          "elements": [],
          "text": []
        },
        "adaptive": {
          "pass": true,
          "labels": [
            "阅读计划示例"
          ],
          "disclaimerPresent": true,
          "heading": "同一件事，不必每天做一样多。"
        },
        "history": {
          "pass": true,
          "labels": [
            "四周记录示例\n\n示意数据，非用户统计。",
            "四周记录示例"
          ],
          "disclaimerPresent": true,
          "heading": "看见积累，也看见停下来的日子。"
        },
        "heroSample": {
          "pass": true,
          "labels": [
            "今日行动\n界面示例",
            "界面示例"
          ],
          "disclaimerPresent": true
        },
        "ctaLinks": {
          "pass": true,
          "links": [
            {
              "text": "进入我的行动",
              "href": "http://127.0.0.1:3000/signin?redirect=%2Fdashboard",
              "pass": true
            }
          ]
        },
        "build": {
          "pass": true,
          "expected": "o6qaqxYzmx_I8xa6HVlhK",
          "actual": "o6qaqxYzmx_I8xa6HVlhK"
        },
        "ctaNavigation": {
          "pass": true,
          "results": [
            {
              "pass": true,
              "url": "http://127.0.0.1:3000/signin?redirect=%2Fdashboard",
              "title": "Sign In to Habit Runner",
              "authButtons": [],
              "authAlert": "No authentication provider configured in this environment. Please contact the administrator."
            }
          ]
        },
        "diagnostics": {
          "pass": true,
          "browserErrors": 0,
          "httpErrors": 0,
          "blockedWrites": 0
        }
      },
      "screenshots": [
        {
          "name": "first-screen",
          "path": "/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-375-zh-light-first-screen.png"
        },
        {
          "name": "adaptive",
          "path": "/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-375-zh-light-adaptive.png"
        },
        {
          "name": "history",
          "path": "/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-375-zh-light-history.png"
        }
      ],
      "pass": true
    },
    {
      "id": "375-zh-dark",
      "width": 375,
      "theme": "dark",
      "checks": {
        "theme": {
          "pass": true,
          "actual": "dark",
          "expected": "dark"
        },
        "anonymous": {
          "pass": true,
          "note": "Fresh browser profile, no auth cookie inserted; anonymous CTA independently required."
        },
        "heading": {
          "pass": true,
          "h1s": [
            {
              "text": "每天一点，时间会放大。",
              "id": "landing-title",
              "visible": true
            }
          ]
        },
        "emoji": {
          "pass": true,
          "matches": [],
          "pseudoMatches": []
        },
        "blur": {
          "pass": true,
          "matches": []
        },
        "overflow": {
          "pass": true,
          "width": 375,
          "scrollWidth": 375,
          "elements": [],
          "text": []
        },
        "adaptive": {
          "pass": true,
          "labels": [
            "阅读计划示例"
          ],
          "disclaimerPresent": true,
          "heading": "同一件事，不必每天做一样多。"
        },
        "history": {
          "pass": true,
          "labels": [
            "四周记录示例\n\n示意数据，非用户统计。",
            "四周记录示例"
          ],
          "disclaimerPresent": true,
          "heading": "看见积累，也看见停下来的日子。"
        },
        "heroSample": {
          "pass": true,
          "labels": [
            "今日行动\n界面示例",
            "界面示例"
          ],
          "disclaimerPresent": true
        },
        "ctaLinks": {
          "pass": true,
          "links": [
            {
              "text": "进入我的行动",
              "href": "http://127.0.0.1:3000/signin?redirect=%2Fdashboard",
              "pass": true
            }
          ]
        },
        "build": {
          "pass": true,
          "expected": "o6qaqxYzmx_I8xa6HVlhK",
          "actual": "o6qaqxYzmx_I8xa6HVlhK"
        },
        "ctaNavigation": {
          "pass": true,
          "results": [
            {
              "pass": true,
              "url": "http://127.0.0.1:3000/signin?redirect=%2Fdashboard",
              "title": "Sign In to Habit Runner",
              "authButtons": [],
              "authAlert": "No authentication provider configured in this environment. Please contact the administrator."
            }
          ]
        },
        "diagnostics": {
          "pass": true,
          "browserErrors": 0,
          "httpErrors": 0,
          "blockedWrites": 0
        }
      },
      "screenshots": [
        {
          "name": "first-screen",
          "path": "/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-375-zh-dark-first-screen.png"
        },
        {
          "name": "adaptive",
          "path": "/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-375-zh-dark-adaptive.png"
        },
        {
          "name": "history",
          "path": "/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-375-zh-dark-history.png"
        }
      ],
      "pass": true
    },
    {
      "id": "768-zh-light",
      "width": 768,
      "theme": "light",
      "checks": {
        "theme": {
          "pass": true,
          "actual": "light",
          "expected": "light"
        },
        "anonymous": {
          "pass": true,
          "note": "Fresh browser profile, no auth cookie inserted; anonymous CTA independently required."
        },
        "heading": {
          "pass": true,
          "h1s": [
            {
              "text": "每天一点，时间会放大。",
              "id": "landing-title",
              "visible": true
            }
          ]
        },
        "emoji": {
          "pass": true,
          "matches": [],
          "pseudoMatches": []
        },
        "blur": {
          "pass": true,
          "matches": []
        },
        "overflow": {
          "pass": true,
          "width": 768,
          "scrollWidth": 768,
          "elements": [],
          "text": []
        },
        "adaptive": {
          "pass": true,
          "labels": [
            "阅读计划示例"
          ],
          "disclaimerPresent": true,
          "heading": "同一件事，不必每天做一样多。"
        },
        "history": {
          "pass": true,
          "labels": [
            "四周记录示例\n\n示意数据，非用户统计。",
            "四周记录示例"
          ],
          "disclaimerPresent": true,
          "heading": "看见积累，也看见停下来的日子。"
        },
        "heroSample": {
          "pass": true,
          "labels": [
            "今日行动\n界面示例",
            "界面示例"
          ],
          "disclaimerPresent": true
        },
        "ctaLinks": {
          "pass": true,
          "links": [
            {
              "text": "进入我的行动",
              "href": "http://127.0.0.1:3000/signin?redirect=%2Fdashboard",
              "pass": true
            }
          ]
        },
        "build": {
          "pass": true,
          "expected": "o6qaqxYzmx_I8xa6HVlhK",
          "actual": "o6qaqxYzmx_I8xa6HVlhK"
        },
        "ctaNavigation": {
          "pass": true,
          "results": [
            {
              "pass": true,
              "url": "http://127.0.0.1:3000/signin?redirect=%2Fdashboard",
              "title": "Sign In to Habit Runner",
              "authButtons": [],
              "authAlert": "No authentication provider configured in this environment. Please contact the administrator."
            }
          ]
        },
        "diagnostics": {
          "pass": true,
          "browserErrors": 0,
          "httpErrors": 0,
          "blockedWrites": 0
        }
      },
      "screenshots": [
        {
          "name": "first-screen",
          "path": "/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-768-zh-light-first-screen.png"
        },
        {
          "name": "adaptive",
          "path": "/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-768-zh-light-adaptive.png"
        },
        {
          "name": "history",
          "path": "/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-768-zh-light-history.png"
        }
      ],
      "pass": true
    },
    {
      "id": "768-zh-dark",
      "width": 768,
      "theme": "dark",
      "checks": {
        "theme": {
          "pass": true,
          "actual": "dark",
          "expected": "dark"
        },
        "anonymous": {
          "pass": true,
          "note": "Fresh browser profile, no auth cookie inserted; anonymous CTA independently required."
        },
        "heading": {
          "pass": true,
          "h1s": [
            {
              "text": "每天一点，时间会放大。",
              "id": "landing-title",
              "visible": true
            }
          ]
        },
        "emoji": {
          "pass": true,
          "matches": [],
          "pseudoMatches": []
        },
        "blur": {
          "pass": true,
          "matches": []
        },
        "overflow": {
          "pass": true,
          "width": 768,
          "scrollWidth": 768,
          "elements": [],
          "text": []
        },
        "adaptive": {
          "pass": true,
          "labels": [
            "阅读计划示例"
          ],
          "disclaimerPresent": true,
          "heading": "同一件事，不必每天做一样多。"
        },
        "history": {
          "pass": true,
          "labels": [
            "四周记录示例\n\n示意数据，非用户统计。",
            "四周记录示例"
          ],
          "disclaimerPresent": true,
          "heading": "看见积累，也看见停下来的日子。"
        },
        "heroSample": {
          "pass": true,
          "labels": [
            "今日行动\n界面示例",
            "界面示例"
          ],
          "disclaimerPresent": true
        },
        "ctaLinks": {
          "pass": true,
          "links": [
            {
              "text": "进入我的行动",
              "href": "http://127.0.0.1:3000/signin?redirect=%2Fdashboard",
              "pass": true
            }
          ]
        },
        "build": {
          "pass": true,
          "expected": "o6qaqxYzmx_I8xa6HVlhK",
          "actual": "o6qaqxYzmx_I8xa6HVlhK"
        },
        "ctaNavigation": {
          "pass": true,
          "results": [
            {
              "pass": true,
              "url": "http://127.0.0.1:3000/signin?redirect=%2Fdashboard",
              "title": "Sign In to Habit Runner",
              "authButtons": [],
              "authAlert": "No authentication provider configured in this environment. Please contact the administrator."
            }
          ]
        },
        "diagnostics": {
          "pass": true,
          "browserErrors": 0,
          "httpErrors": 0,
          "blockedWrites": 0
        }
      },
      "screenshots": [
        {
          "name": "first-screen",
          "path": "/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-768-zh-dark-first-screen.png"
        },
        {
          "name": "adaptive",
          "path": "/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-768-zh-dark-adaptive.png"
        },
        {
          "name": "history",
          "path": "/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-768-zh-dark-history.png"
        }
      ],
      "pass": true
    },
    {
      "id": "1280-zh-light",
      "width": 1280,
      "theme": "light",
      "checks": {
        "theme": {
          "pass": true,
          "actual": "light",
          "expected": "light"
        },
        "anonymous": {
          "pass": true,
          "note": "Fresh browser profile, no auth cookie inserted; anonymous CTA independently required."
        },
        "heading": {
          "pass": true,
          "h1s": [
            {
              "text": "每天一点，时间会放大。",
              "id": "landing-title",
              "visible": true
            }
          ]
        },
        "emoji": {
          "pass": true,
          "matches": [],
          "pseudoMatches": []
        },
        "blur": {
          "pass": true,
          "matches": []
        },
        "overflow": {
          "pass": true,
          "width": 1280,
          "scrollWidth": 1280,
          "elements": [],
          "text": []
        },
        "adaptive": {
          "pass": true,
          "labels": [
            "阅读计划示例"
          ],
          "disclaimerPresent": true,
          "heading": "同一件事，不必每天做一样多。"
        },
        "history": {
          "pass": true,
          "labels": [
            "四周记录示例\n\n示意数据，非用户统计。",
            "四周记录示例"
          ],
          "disclaimerPresent": true,
          "heading": "看见积累，也看见停下来的日子。"
        },
        "heroSample": {
          "pass": true,
          "labels": [
            "今日行动\n界面示例",
            "界面示例"
          ],
          "disclaimerPresent": true
        },
        "ctaLinks": {
          "pass": true,
          "links": [
            {
              "text": "进入我的行动",
              "href": "http://127.0.0.1:3000/signin?redirect=%2Fdashboard",
              "pass": true
            }
          ]
        },
        "build": {
          "pass": true,
          "expected": "o6qaqxYzmx_I8xa6HVlhK",
          "actual": "o6qaqxYzmx_I8xa6HVlhK"
        },
        "ctaNavigation": {
          "pass": true,
          "results": [
            {
              "pass": true,
              "url": "http://127.0.0.1:3000/signin?redirect=%2Fdashboard",
              "title": "Sign In to Habit Runner",
              "authButtons": [],
              "authAlert": "No authentication provider configured in this environment. Please contact the administrator."
            }
          ]
        },
        "diagnostics": {
          "pass": true,
          "browserErrors": 0,
          "httpErrors": 0,
          "blockedWrites": 0
        }
      },
      "screenshots": [
        {
          "name": "first-screen",
          "path": "/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-1280-zh-light-first-screen.png"
        },
        {
          "name": "adaptive",
          "path": "/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-1280-zh-light-adaptive.png"
        },
        {
          "name": "history",
          "path": "/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-1280-zh-light-history.png"
        }
      ],
      "pass": true
    },
    {
      "id": "1280-zh-dark",
      "width": 1280,
      "theme": "dark",
      "checks": {
        "theme": {
          "pass": true,
          "actual": "dark",
          "expected": "dark"
        },
        "anonymous": {
          "pass": true,
          "note": "Fresh browser profile, no auth cookie inserted; anonymous CTA independently required."
        },
        "heading": {
          "pass": true,
          "h1s": [
            {
              "text": "每天一点，时间会放大。",
              "id": "landing-title",
              "visible": true
            }
          ]
        },
        "emoji": {
          "pass": true,
          "matches": [],
          "pseudoMatches": []
        },
        "blur": {
          "pass": true,
          "matches": []
        },
        "overflow": {
          "pass": true,
          "width": 1280,
          "scrollWidth": 1280,
          "elements": [],
          "text": []
        },
        "adaptive": {
          "pass": true,
          "labels": [
            "阅读计划示例"
          ],
          "disclaimerPresent": true,
          "heading": "同一件事，不必每天做一样多。"
        },
        "history": {
          "pass": true,
          "labels": [
            "四周记录示例\n\n示意数据，非用户统计。",
            "四周记录示例"
          ],
          "disclaimerPresent": true,
          "heading": "看见积累，也看见停下来的日子。"
        },
        "heroSample": {
          "pass": true,
          "labels": [
            "今日行动\n界面示例",
            "界面示例"
          ],
          "disclaimerPresent": true
        },
        "ctaLinks": {
          "pass": true,
          "links": [
            {
              "text": "进入我的行动",
              "href": "http://127.0.0.1:3000/signin?redirect=%2Fdashboard",
              "pass": true
            }
          ]
        },
        "build": {
          "pass": true,
          "expected": "o6qaqxYzmx_I8xa6HVlhK",
          "actual": "o6qaqxYzmx_I8xa6HVlhK"
        },
        "ctaNavigation": {
          "pass": true,
          "results": [
            {
              "pass": true,
              "url": "http://127.0.0.1:3000/signin?redirect=%2Fdashboard",
              "title": "Sign In to Habit Runner",
              "authButtons": [],
              "authAlert": "No authentication provider configured in this environment. Please contact the administrator."
            }
          ]
        },
        "diagnostics": {
          "pass": true,
          "browserErrors": 0,
          "httpErrors": 0,
          "blockedWrites": 0
        }
      },
      "screenshots": [
        {
          "name": "first-screen",
          "path": "/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-1280-zh-dark-first-screen.png"
        },
        {
          "name": "adaptive",
          "path": "/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-1280-zh-dark-adaptive.png"
        },
        {
          "name": "history",
          "path": "/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021/2026-10-21T11-14-08-611Z-1280-zh-dark-history.png"
        }
      ],
      "pass": true
    }
  ],
  "errors": [],
  "browserErrors": [],
  "httpErrors": [],
  "blockedWrites": [],
  "blockedExternal": [],
  "expectedBuildId": "o6qaqxYzmx_I8xa6HVlhK",
  "browserVersion": "Chrome/155.0.8059.85",
  "buildUnchanged": true,
  "finishedAt": "2026-10-21T11:14:16.814Z",
  "passed": 8,
  "complete": true
}
```
