# 孕婴健康守护 - 移动端构建指南

## 前置环境要求

### 通用环境
- **Node.js**: v18.x 或更高版本
- **npm**: v9.x 或更高版本
- **Git**: 最新稳定版

### iOS 开发环境
- **macOS**: Ventura 13.0 或更高版本
- **Xcode**: 15.0 或更高版本
- **CocoaPods**: 1.12.0 或更高版本（`sudo gem install cocoapods`）
- **Apple Developer 账号**: 用于签名和发布

### Android 开发环境
- **Android Studio**: Flamingo 2022.2.1 或更高版本
- **JDK**: 17（推荐使用 Android Studio 自带的 JDK）
- **Android SDK**: API Level 33 或更高
- **Gradle**: 8.0 或更高版本（项目自带 gradlew）

---

## iOS 构建步骤

### 1. 安装前端依赖
```bash
cd /workspace
npm install
```

### 2. 构建前端资源
```bash
npm run build
```

### 3. 同步 Capacitor 资源到 iOS 项目
```bash
npx cap sync ios
```

### 4. 使用 Xcode 打开项目
```bash
npx cap open ios
```
或手动打开 `/workspace/ios/App/App.xcproj`

### 5. 配置签名
1. 在 Xcode 中选择 **App** 项目
2. 选择 **Signing & Capabilities** 标签页
3. 勾选 **Automatically manage signing**
4. 选择你的 **Team**（Apple Developer 账号）
5. 确保 Bundle Identifier 为 `com.health.maternity`

### 6. 添加 HealthKit Capability
1. 在 **Signing & Capabilities** 标签页中点击 **+ Capability**
2. 搜索并添加 **HealthKit**
3. 确认 `App.entitlements` 中包含 `com.apple.developer.healthkit`

### 7. 运行到真机
1. 连接 iPhone 设备（HealthKit 不支持模拟器）
2. 在 Xcode 顶部选择你的设备
3. 点击 **Run** 按钮（⌘R）或 **Product → Run**

> **注意**: HealthKit 功能必须在真机上测试，模拟器不支持 HealthKit。

---

## Android 构建步骤

### 1. 安装前端依赖
```bash
cd /workspace
npm install
```

### 2. 构建前端资源
```bash
npm run build
```

### 3. 同步 Capacitor 资源到 Android 项目
```bash
npx cap sync android
```

### 4. 使用 Android Studio 打开项目
```bash
npx cap open android
```
或手动打开 `/workspace/android/`

### 5. 同步 Gradle
Android Studio 打开项目后会自动同步 Gradle，等待同步完成。

### 6. 运行到真机
1. 在手机上开启 **开发者模式** 和 **USB 调试**
2. 连接手机到电脑
3. 在 Android Studio 顶部选择你的设备
4. 点击 **Run** 按钮（绿色三角形）

---

## HealthKit 配置（iOS）

### Apple Developer 后台配置
1. 登录 [Apple Developer](https://developer.apple.com/)
2. 进入 **Certificates, Identifiers & Profiles**
3. 选择 **Identifiers** → 找到 `com.health.maternity`
4. 在 **Capabilities** 中勾选 **HealthKit**
5. 重新生成 Provisioning Profile

### 证书配置
1. 确保 `App.entitlements` 文件包含 HealthKit 权限声明
2. 在 Xcode 的 **Signing & Capabilities** 中确认 HealthKit 已添加
3. 如需读取临床数据，还需在 HealthKit capability 中勾选相应选项

### 隐私描述
以下隐私描述已在 `Info.plist` 中配置：
- `NSHealthShareUsageDescription`: 读取健康数据的说明
- `NSHealthUpdateUsageDescription`: 访问健康数据的说明
- `NSCameraUsageDescription`: 使用相机的说明
- `NSPhotoLibraryUsageDescription`: 访问相册的说明

---

## Google Fit 配置（Android）

### Google API Console 配置
1. 登录 [Google API Console](https://console.developers.google.com/)
2. 创建新项目或选择现有项目
3. 启用 **Fitness API**：
   - 进入 **API 和服务 → 库**
   - 搜索 **Fitness API** 并启用
4. 创建 OAuth 2.0 凭据：
   - 进入 **API 和服务 → 凭据**
   - 点击 **创建凭据 → OAuth 客户端 ID**
   - 应用类型选择 **Android**
   - 输入包名 `com.health.maternity`
   - 添加 SHA-1 签名证书指纹（通过 `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android` 获取）

### 权限说明
以下权限已在 `AndroidManifest.xml` 中配置：
- `ACTIVITY_RECOGNITION`: 读取步数等运动数据
- `BODY_SENSORS`: 读取心率等传感器数据
- `CAMERA`: 拍摄检查报告单
- `READ_EXTERNAL_STORAGE`: 读取相册照片
- `INTERNET`: 网络访问

---

## 常见问题排查

### iOS 相关问题

**Q: HealthKit 授权失败，提示 "HealthKit 不可用"**
A: HealthKit 仅支持 iPhone，不支持 iPad 和模拟器。请确保在 iPhone 真机上运行。

**Q: 编译报错 "Use of unresolved identifier 'HKHealthStore'"**
A: 确保在 Xcode 项目的 **Frameworks, Libraries, and Embedded Content** 中添加了 HealthKit.framework。在 Signing & Capabilities 中添加 HealthKit capability 后会自动关联。

**Q: 运行时授权弹窗没有出现**
A: 检查 `Info.plist` 中是否配置了 `NSHealthShareUsageDescription` 和 `NSHealthUpdateUsageDescription`。同时确认 Apple Developer 后台的 App ID 已启用 HealthKit。

**Q: entitlements 文件未被识别**
A: 在 Xcode 中检查 **Build Settings → Code Signing Entitlements** 是否设置为 `App/App.entitlements`。

### Android 相关问题

**Q: Gradle 同步失败**
A: 确保 JDK 版本为 17，检查 `JAVA_HOME` 环境变量是否正确。可在 Android Studio 的 **File → Settings → Build → Gradle → Gradle JDK** 中确认。

**Q: Google Fit 数据读取返回空**
A: 当前 `GoogleFitPlugin.java` 为框架实现，实际数据读取需要集成 Google Fit SDK。请参考 [Google Fit API 文档](https://developers.google.com/fit) 完成实现。

**Q: 权限请求未弹出**
A: Android 13+ 需要在运行时动态请求 `ACTIVITY_RECOGNITION` 和 `BODY_SENSORS` 权限。确保在调用 Google Fit API 前已完成权限请求。

### 通用问题

**Q: `npx cap sync` 报错**
A: 确保先执行 `npm run build` 生成 `dist` 目录。检查 `capacitor.config.ts` 中的 `webDir` 配置是否正确。

**Q: 前端页面白屏**
A: 检查 `dist` 目录是否正确生成，确认 `npx cap sync` 已成功执行。在 Xcode/Android Studio 中清理项目后重新构建。

**Q: 插件方法调用无响应**
A: 确认 `capacitor.config.json` 中的 `packageClassList` 包含 `HealthKitPlugin`（iOS）和 Android 的 `capacitor.plugins.json` 包含 `GoogleFitPlugin`。
