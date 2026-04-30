# Task 5-1: HTTP Client + Auth Store + Auth Pages

## Title
实现 HTTP 客户端、认证状态管理和登录/注册页面

## 描述
实现客户端的网络基础设施（Axios 封装 + JWT 拦截器）、认证状态管理（authStore + useAuth hook）、以及登录/注册页面 UI。

## 功能说明

### httpClient
- Axios 实例封装
- 请求拦截器：自动添加 Authorization Bearer token
- 响应拦截器：401 自动跳转登录页
- 统一错误处理

### authApi
- `register(name, email, password)` → POST /auth/register
- `login(email, password)` → POST /auth/login → 返回 JWT
- `getMe()` → GET /auth/me
- `updateMe(data)` → PUT /auth/me

### authStore (Zustand)
- `token: string | null` — JWT
- `user: IUser | null` — 当前用户
- `isAuthenticated: boolean` — 计算属性
- `login(token, user)` — 设置认证状态
- `logout()` — 清除状态 + localStorage
- 持久化到 localStorage

### useAuth hook
- 封装 authStore + TanStack Query
- `useLogin()` mutation
- `useRegister()` mutation
- `useCurrentUser()` query

### Auth Pages
- `AuthPage.tsx` — 登录 + 注册 tab 切换
- 表单使用 Zod 验证 (email, password min 8, username min 2)
- 成功后跳转 /lobby

### Profile Page
- `ProfilePage.tsx` — 用户信息展示 + 编辑
- 游戏历史列表

### 涉及文件
```
packages/client/src/
├── api/
│   ├── httpClient.ts
│   ├── authApi.ts
│   └── types.ts
├── hooks/
│   └── useAuth.ts
├── stores/
│   └── authStore.ts (已有骨架，补充实现)
├── pages/
│   ├── auth/
│   │   └── AuthPage.tsx
│   └── profile/
│       └── ProfilePage.tsx
└── components/
    └── ProtectedRoute.tsx (已有骨架，补充实现)
```

## 技术实现方案

1. 实现 httpClient (Axios + interceptors)
2. 实现 authApi (4 个 REST 调用)
3. 完善 authStore (Zustand + localStorage persist)
4. 实现 useAuth hook (TanStack Query mutations/queries)
5. 实现 AuthPage (shadcn Tabs + Form + Zod validation)
6. 实现 ProtectedRoute (beforeLoad redirect)
7. 实现 ProfilePage
8. 配置路由: /auth (public), /profile (protected)

## 测试要求

### 单元测试
- `authStore.test.ts`: login/logout/persist 状态正确
- `useAuth.test.ts`: renderHook 验证 mutation 调用

### 组件测试 (RTL)
- `AuthPage.test.tsx`:
  - 登录 tab 默认显示
  - 切换到注册 tab
  - 表单验证 (空字段, 邮箱格式, 密码长度)
  - 登录成功 mock → 跳转
  - 注册成功 mock → 跳转
  - 错误提示 toast
- `ProtectedRoute.test.tsx`:
  - 未认证 → redirect /auth
  - 已认证 → 渲染子组件
- `ProfilePage.test.tsx`:
  - 用户信息正确显示
  - 编辑表单提交

### E2E 可行性
- Auth 流程适合 E2E: 注册 → 登录 → 访问 /lobby → 验证认证状态
- 使用 MSW 或实际后端 (如果可用)

## 完成标准
- [ ] httpClient 拦截器工作
- [ ] 登录/注册 UI 完整可用
- [ ] JWT 持久化 + 自动附加
- [ ] ProtectedRoute 守卫工作
- [ ] 所有单测通过
