import moment from 'moment';

const now = moment().format('YYYY-MM-DD HH:mm:ss');

export default `
    CREATE TABLE IF NOT EXISTS menus (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        parentId  INTEGER                             NULL,
        title     VARCHAR(50)                         NULL,
        icon      VARCHAR(50)                         NULL,
        basePath  VARCHAR(200)                        NULL,
        path      VARCHAR(200)                        NULL,
        target    VARCHAR(50)                         NULL,
        sort      INTEGER   DEFAULT 0                 NULL,
        type      INTEGER   DEFAULT 1                 NOT NULL,
        enabled   TINYINT(1)                          NOT NULL,
        code      VARCHAR(50)                         NULL,
        name      VARCHAR(50)                         NULL,
        entry     VARCHAR(200)                        NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NULL,
        CONSTRAINT menus_id_uindex UNIQUE (id)
    );
    CREATE TABLE IF NOT EXISTS user_collect_menus (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        userId    INTEGER                             NOT NULL,
        menuId    INTEGER                             NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        CONSTRAINT user_collect_menus_id_uindex UNIQUE (id)
    );
    CREATE TABLE IF NOT EXISTS role_menus (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        roleId    INTEGER                             NOT NULL,
        menuId    INTEGER                             NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        CONSTRAINT role_menus_id_uindex UNIQUE (id)
    );
    CREATE TABLE IF NOT EXISTS roles (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        type      INTEGER,
        systemId  INTEGER,
        enabled   TINYINT(1)                          NOT NULL,
        name      VARCHAR(50)                         NOT NULL,
        remark    VARCHAR(200)                        NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NULL,
        CONSTRAINT roles_id_uindex UNIQUE (id)
    );
    CREATE TABLE IF NOT EXISTS user_roles (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        userId    INTEGER                             NOT NULL,
        roleId    INTEGER                             NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        CONSTRAINT user_roles_id_uindex UNIQUE (id)
    );
    CREATE TABLE IF NOT EXISTS users (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        account   VARCHAR(50)                         NOT NULL,
        name      VARCHAR(50)                         NULL,
        password  VARCHAR(20)                         NULL,
        mobile    VARCHAR(20)                         NULL,
        email     VARCHAR(50)                         NULL,
        enabled   TINYINT(1)                          NOT NULL,
        CONSTRAINT users_account_uindex UNIQUE (account),
        CONSTRAINT users_id_uindex UNIQUE (id)
    );
`;

export const initRolesSql = `
    INSERT INTO roles (id, type, enabled, name, remark, createdAt, updatedAt)
    VALUES (1, 1, 1, '超级管理员', '超级管理员拥有系统所有权限', '${now}', '${now}');
    INSERT INTO roles (id, type, enabled, name, remark, createdAt, updatedAt)
    VALUES (2, 2, 1, '商品管理员', '商品管理员只能查看和操作商品', '${now}', '${now}');
    INSERT INTO roles (id, type, enabled, name, remark, createdAt, updatedAt)
    VALUES (3, 3, 1, '订单管理员', '订单管理员只能查看和操作商品', '${now}', '${now}');
`;

export const initRoleMenusSql = `
    INSERT INTO role_menus (id, roleId, menuId, createdAt, updatedAt)
    VALUES (1, 1, 1, '${now}', '${now}');
    INSERT INTO role_menus (id, roleId, menuId, createdAt, updatedAt)
    VALUES (2, 1, 2, '${now}', '${now}');
    INSERT INTO role_menus (id, roleId, menuId, createdAt, updatedAt)
    VALUES (3, 1, 3, '${now}', '${now}');
    INSERT INTO role_menus (id, roleId, menuId, createdAt, updatedAt)
    VALUES (4, 1, 4, '${now}', '${now}');
    INSERT INTO role_menus (id, roleId, menuId, createdAt, updatedAt)
    VALUES (5, 1, 5, '${now}', '${now}');
`;

export const initUsersSql = `
    INSERT INTO users (id, account, name, password, mobile, email, enabled)
    VALUES (1111, 'superadmin', '超级管理员', '7828d7aa6efcf983b850025a6ceccad25905f5ecfa1758edbd1715d012747f2e', '18888888888', 'email@qq.com', 1);
    INSERT INTO users (id, account, name, password, mobile, email, enabled)
    VALUES (1112, 'product', '商品管理员', '7828d7aa6efcf983b850025a6ceccad25905f5ecfa1758edbd1715d012747f2e', '18888888888', 'email@qq.com', 1);
    INSERT INTO users (id, account, name, password, mobile, email, enabled)
    VALUES (1113, 'order', '订单管理员', '7828d7aa6efcf983b850025a6ceccad25905f5ecfa1758edbd1715d012747f2e', '18888888888', 'email@qq.com', 1);
`;

export const initUserRolesSql = `
    INSERT INTO user_roles (id, userId, roleId, createdAt, updatedAt)
    VALUES (1, 1111, 1, '${now}', '${now}');
    INSERT INTO user_roles (id, userId, roleId, createdAt, updatedAt)
    VALUES (2, 1112, 2, '${now}', '${now}');
    INSERT INTO user_roles (id, userId, roleId, createdAt, updatedAt)
    VALUES (2, 1113, 3, '${now}', '${now}');
`;

export const initMenuSql = `
    INSERT INTO menus (id, enabled, parentId, title, icon, basePath, path, target, sort, type, code, name, entry, createdAt, updatedAt)
    VALUES (1, 1, NULL, '系统管理', NULL, NULL, NULL, 'menu', 0, 1, NULL, NULL, NULL, '${now}', '${now}');
    INSERT INTO menus (id, enabled, parentId, title, icon, basePath, path, target, sort, type, code, name, entry, createdAt, updatedAt)
    VALUES (2, 1, 1, '用户管理', NULL, NULL, '/users', 'menu', 0, 1, NULL, NULL, NULL, '${now}', '${now}');
    INSERT INTO menus (id, enabled, parentId, title, icon, basePath, path, target, sort, type, code, name, entry, createdAt, updatedAt)
    VALUES (3, 1, 1, '角色管理', NULL, NULL, '/roles', 'menu', 0, 1, NULL, NULL, NULL, '${now}', '${now}');
    INSERT INTO menus (id, enabled, parentId, title, icon, basePath, path, target, sort, type, code, name, entry, createdAt, updatedAt)
    VALUES (4, 1, 1, '菜单管理', NULL, NULL, '/menus', 'menu', 0, 1, NULL, NULL, NULL, '${now}', '${now}');
    INSERT INTO menus (id, enabled, parentId, title, icon, basePath, path, target, sort, type, code, name, entry, createdAt, updatedAt)
    VALUES (5, 1, 2, '添加用户', NULL, NULL, NULL, NULL, 0, 2, 'ADD_USER', NULL, NULL, '${now}', '${now}');
    INSERT INTO menus (id, enabled, parentId, title, icon, basePath, path, target, sort, type, code, name, entry, createdAt, updatedAt)
    VALUES (6, 1, 2, '删除用户', NULL, NULL, NULL, NULL, 0, 2, 'UPDATE_USER', NULL, NULL, '${now}', '${now}');
`;

export const initUserCollectMenusSql = `
    INSERT INTO user_collect_menus (userId, menuId, createdAt, updatedAt)
    VALUES (1, 2, '${now}', '${now}');
`;

export const initDataSql = {
    menus: initMenuSql,
    roles: initRolesSql,
    users: initUsersSql,
    role_menus: initRoleMenusSql,
    user_roles: initUserRolesSql,
    user_collect_menus: initUserCollectMenusSql,
};
