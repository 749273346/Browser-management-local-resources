如何在新电脑上使用：

1. 双击运行 `start-background.bat`
   - 如果电脑没有安装 Node.js，脚本会自动检测。
   - 【离线支持】已内置 Node.js 安装包 (resources/node-v18-x64.msi)，无需联网即可安装。
   - 输入 'Y' 确认安装，安装完成后再次运行本脚本即可。
   - 脚本会自动安装所需的依赖库（自动运行 npm install）。
   - 最后会在后台启动服务器。

2. 在 Chrome 浏览器中加载插件：
   - 打开 chrome://extensions
   - 开启右上角的 "开发者模式" (Developer mode)
   - 点击 "加载已解压的扩展程序" (Load unpacked)
   - 选择本目录下的 `extension\dist` 文件夹

常见问题：
- 问：安装 Node.js 后脚本报错说找不到 node？
  答：Windows 安装软件后需要重新打开命令行才能生效。请关闭黑色窗口，重新双击 `start-background.bat`。

- 问：服务器启动了吗？
  答：如果脚本显示 "[SUCCESS] Server is running!"，说明已经启动。即使关闭黑色窗口，它也会在后台继续运行。
  要停止它，请在任务管理器中结束 "Node.js" 进程。
