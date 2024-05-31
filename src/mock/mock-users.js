import moment from 'moment';
import { initDB, executeSql } from './web-sql';
import { encryptPassword, verifyPassword } from 'src/utils/encryption';

export default {
     // 重置数据库
     'post /initDB': async (config) => {
        await initDB(true);
        return [200, true];
    },
    // 用户登录
    'post /mock/login': async (config) => {
        const { account, password } = JSON.parse(config.data);
    
        // 获取存储的用户信息
        const result = await executeSql('SELECT * FROM users WHERE account = ?', [account]);

        
        const user = result[0];
        console.log(user)
        if(!user){
            return [400, { message: '用户名错误' }];
        }
       
        const hashedPassword = user.password;
        console.log(hashedPassword)
    
        // 验证密码
        if (!verifyPassword(password, hashedPassword)) {
            return [400, { message: '密码错误' }];
        }
    
        user.token = 'test token';
    
        return [200, user];
    },
    
    // 用户注册
    'post /mock/register': async (config) => {
        const { account, password, email } = JSON.parse(config.data);

        // 检查用户名是否已存在
        const existingUser = await executeSql('SELECT * FROM users WHERE account = ?', [account]);
        console.log(existingUser)
        if (existingUser?.length) {
            return [400, { message: '用户名已存在' }];
        }
        const hashedPassword = encryptPassword(password);
        console.log(hashedPassword)
        // 插入新用户
        const args = { account, password:hashedPassword, email, enabled: 1 };
        console.log(args)
      
        
        const result = await executeSql(
            'INSERT INTO users (account, password, email, enabled) VALUES (?, ?, ?, ?)',
            [account, hashedPassword, email, 1],
            true
        );
        // 检查插入结果
        if (!result) {
            return [500, { message: '用户注册失败' }];
        }
        // 获取插入的用户ID
        const userId = result.lastInsertRowid;


        var name = account
        // 返回新用户数据
        const newUser = {
            id: userId,
            account,
            name,
            email,
            token: 'test token'
        };

        return [200, newUser];
    },

    // 退出登录
    'post /logout': {},
    // 获取列表
    'get /user/queryUsersByPage': async (config) => {
        const { pageSize = 10, pageNum = 1, account = '', name = '', mobile = '' } = config.params;

        const where = `
            where name like '%${name}%'
                and mobile like '%${mobile}%'
                and account like '%${account}%'
        `;

        const list = await executeSql(
            `
            SELECT *
            from users ${where}
            limit ? offset ?`,
            [pageSize, (pageNum - 1) * pageSize],
        );

        const countResult = await executeSql(`
            SELECT count(*)
            from users ${where}
        `);

        const total = countResult[0]['count(*)'] || 0;

        return [
            200,
            {
                totalElements: total,
                content: list,
            },
        ];
    },
    // 获取详情
    'get user/getUserById': async (config) => {
        const { id } = config.params;

        const result = await executeSql('SELECT * from users where id = ?', [id]);

        if (!result[0]) return [200, null];

        const userRoles = await executeSql('SELECT * from user_roles where userId = ?', [id]);
        result[0].roleIds = userRoles.map((item) => item.roleId);

        return [200, result[0]];
    },
    // 根据account获取
    'get /user/getOneUser': async (config) => {
        const { account } = config.params;

        const result = await executeSql('SELECT * from users where account = ?', [account]);
        return [200, result[0]];
    },
    // 保存用户
    'post /user/addUser': async (config) => {
        const { account, name, password, email, mobile, roleIds } = JSON.parse(config.data);
        const args = [account, name, password, mobile, email, 1];
        const result = await executeSql(
            'INSERT INTO users (account, name, password, mobile, email, enabled) VALUES (?, ?, ?, ?, ?, ?)',
            args,
            true,
        );
        const { insertId: userId } = result;

        if (roleIds?.length) {
            for (let roleId of roleIds) {
                await executeSql('INSERT INTO user_roles (roleId, userId) VALUES (?,?)', [roleId, userId]);
            }
        }

        return [200, userId];
    },
    // 修改用户
    'post /user/updateUserById': async (config) => {
        const { id, account, name, password, email, mobile, roleIds } = JSON.parse(config.data);
        const args = [account, name, password, mobile, email, moment().format('YYYY-MM-DD HH:mm:ss'), id];

        await executeSql(
            'UPDATE users SET account=?, name=?, password=?, mobile=?, email=?, updatedAt=? WHERE id=?',
            args,
        );
        await executeSql('DELETE FROM user_roles WHERE userId=?', [id]);

        if (roleIds?.length) {
            for (let roleId of roleIds) {
                await executeSql('INSERT INTO user_roles (roleId, userId) VALUES (?,?)', [roleId, id]);
            }
        }

        return [200, true];
    },
    // 删除用户
    'delete re:/user/.+': async (config) => {
        const id = config.url.split('/')[2];
        await executeSql('DELETE FROM users WHERE id=?', [id]);
        await executeSql('DELETE FROM user_roles WHERE userId=?', [id]);
        return [200, true];
    },
};
