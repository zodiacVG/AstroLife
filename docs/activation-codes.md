# 激活码机制（短数字，<=6位）

本文档说明前后端的激活码逻辑、环境变量、生成方式与接口约定。

## 总览

- 目标：作者可随时生成新激活码，后端用统一算法验证，成功后记录该码；同一个激活码再次被其他设备使用时，提示“已使用”。
- 码制：纯数字，长度 4–6 位（推荐 6 位）。最后 1 位为校验位。
- 环境变量：`ACTIVATION_SECRET`。未配置时（开发演示），后端跳过校验，前端会自动放行，不显示激活页。

## 算法

- 设激活码为 `d1 d2 ... d(n-1) dN`，其中 `dN` 是校验位，`n` 为总长度（4–6）。
- 校验位计算：`dN = HMAC_SHA256(secret, base) % 10`，其中 `base = d1...d(n-1)`。
- 后端校验流程：
  1. 仅接受全数字，长度 4–6。
  2. 取最后一位作为校验位；使用 `base` 计算期望校验位；若一致则有效，否则返回 `INVALID_CODE`。
  3. 检查是否已被占用：若同一设备再次使用同一码，返回成功（幂等）；若其它设备再次使用，返回 `ALREADY_USED`。

## 环境变量

在 `backend/.env` 设置：

```
ACTIVATION_SECRET=<你的强随机密钥>
```

- 未设置时：`/api/v1/activate` 返回 `success: true, message: "activation skipped (no secret)"`。
- 前端会在未激活时自动探测该行为并直接放行。

## 接口

`POST /api/v1/activate`

请求体：

```
{
  "code": "123456",         // 4–6 位纯数字，最后一位为校验位
  "device_id": "<可选>"      // 建议传，便于区分同一码是否同设备再次使用
}
```

响应：

- 成功：`{ success: true, message: "activated" }`
- 同设备已激活：`{ success: true, message: "already activated on this device" }`
- 未配置密钥（开发）：`{ success: true, message: "activation skipped (no secret)" }`
- 校验失败：HTTP 400，`{ code: "INVALID_CODE" }`
- 其他设备已使用：HTTP 409，`{ code: "ALREADY_USED" }`

## 生成激活码

使用脚本：`backend/scripts/generate_activation_code.py`

示例：

```
export ACTIVATION_SECRET='your-strong-secret'
python backend/scripts/generate_activation_code.py --count 1000 > codes.txt
```

- 默认生成 1000 个 6 位数字码（5 位 base + 1 位校验）。
- 可选参数：`--base-length` 控制 base 长度（3–5），总码长 = base + 1。

## 存储

- 后端把已使用激活码持久化在：`backend/app/data/activations.json`。
- 内容包含：`code`、`device_id`、`used_at`、`ip`。

## 前端行为

- 默认显示激活页；当后端未设置密钥时，前端探测到 `activation skipped`，自动放行并隐藏激活页。
- 输入框仅允许 0–9，长度 4–6（`pattern=\d{4,6}`），移动端键盘为数字。

## 获取激活码 / 关注作者

- 体验超过 2 次后会提示输入激活码。关注作者可获取最新激活码：
  - Xiaohongshu：在应用标题区域有“关注 / Follow”链接（当前为 https://xhslink.com/m/9Vmo5NJsG9L）。
