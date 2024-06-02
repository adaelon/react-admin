# 第三次作业-张佳讯-21301025

基于React、Ant Design和ra-lib组件库的react信息管理系统。

## 注意

+ 若第一次打开网页出现：![image-20240602153137711](C:\Users\Lenovo\AppData\Roaming\Typora\typora-user-images\image-20240602153137711.png)请再刷新一次。

## 安装依赖

- node v12.14.0
- yarn 1.22.10

```bash
yarn
```

## 运行启动

```
yarn dev 
```

## 项目结构

```
├── public              // 静态文件
├── src                 // 项目源码目录
│   ├── commons         // 项目公共文件目录，公共js
│   ├── components      // 项目公共组件
│   ├── config          // 项目配置
│   ├── mock            // mock数据
│   ├── models          // 数据管理，基于redux
│   ├── pages           // 页面文件
│   ├── router          // 路由相关
│   ├── util            // 工具方法
│   ├── App.jsx         // 根组件，初始化工作
│   ├── App.less        // 全局样式
│   ├── index.js        // 项目入口文件
│   └── theme.less      // 主题变量
├── craco.config.js     // webpack等构建相关配置
├── package.json            
├── README.md
└── yarn.lock
```

## 使用插件

+ React
+ Antd
+ ra-lib
+ indexedDB
+ redux

## indexedDB

系统使用indexedDB进行数据存储，初次运行会自动创建如下数据库：

![image-20240602164454949](C:\Users\Lenovo\AppData\Roaming\Typora\typora-user-images\image-20240602164454949.png)

详见src/mock

## 登录注册

系统自动在初次启动时存放了如下三个user：

![image-20240602164640571](C:\Users\Lenovo\AppData\Roaming\Typora\typora-user-images\image-20240602164640571.png)

密码加密存放。（三个user的密码都是：“Abc123456”）

登录页面如下：

![image-20240602164921193](C:\Users\Lenovo\AppData\Roaming\Typora\typora-user-images\image-20240602164921193.png)

密码进行了复杂度校验。

注册页面：

![image-20240602165125909](C:\Users\Lenovo\AppData\Roaming\Typora\typora-user-images\image-20240602165125909.png)

需要添加邮箱，并且进行了格式校验。

## 菜单管理

使用indexedDB中menu表进行存储。

![image-20240602165347681](C:\Users\Lenovo\AppData\Roaming\Typora\typora-user-images\image-20240602165347681.png)

| 字段     | 必须 | 说明                         |
| -------- | ---- | ---------------------------- |
| id       | 是   | 需要唯一                     |
| parentId | 否   | 用于关联父级                 |
| path     | 是   | 菜单对应的路由地址           |
| title    | 是   | 菜单标题                     |
| icon     | 否   | 菜单图标配置                 |
| target   | 否   | 配合url使用                  |
| order    | 否   | 菜单排序，数值越大越靠前显示 |

菜单管理页面：

![image-20240602171526361](C:\Users\Lenovo\AppData\Roaming\Typora\typora-user-images\image-20240602171526361.png)

点击菜单列表中的菜单可以修改或删除，还可以添加顶级或子级。

## 用户管理

使用users表进行存储。

页面：

![image-20240602171548173](C:\Users\Lenovo\AppData\Roaming\Typora\typora-user-images\image-20240602171548173.png)

可以增删改查，并且分配角色。

## 角色管理

使用roles表进行存储。

页面：

![image-20240602171719812](C:\Users\Lenovo\AppData\Roaming\Typora\typora-user-images\image-20240602171719812.png)

点击编辑可以分配菜单权限。

## 权限管理

使用role_menus和user_roles表进行存储管理。

页面：

![image-20240602171748154](C:\Users\Lenovo\AppData\Roaming\Typora\typora-user-images\image-20240602171748154.png)

用户只能看到有权限看到的菜单

例如：商品管理员的页面：

![image-20240602171836834](C:\Users\Lenovo\AppData\Roaming\Typora\typora-user-images\image-20240602171836834.png)

