
import { convertToTree, findGenerationNodes } from '@ra-lib/admin'
import moment from 'moment';
import { initDB, executeSql } from './web-sql';
export default {
   
    // 获取用户菜单
    'get /authority/queryUserMenus': async (config) => {
        const { userId } = config.params;
        
        const userRoles = await executeSql('SELECT * from user_roles where userId = ?', [parseInt(userId)]);
        if (!userRoles?.length) return [200, []];

        const roleIds = userRoles.map((item) => item.roleId).join(',');

        console.log(roleIds)
        const roles = await executeSql(`SELECT *
                                        from roles
                                        where id = ?`,[parseInt(roleIds)]);
                                      

        console.log(roles && roles.some((item) => item.type === 1))
        // 是超级管理员，返回所有菜单数据
        if (roles && roles.some((item) => item.type === 1)) {
            const menus = await executeSql(`SELECT *
                                            from menus`);

            console.log(menus)

            return [200, Array.from(menus)];
        }

      

        const roleMenus = await executeSql(`SELECT *
                                            from role_menus
                                            where roleId = ?`,[parseInt(roleIds)]);

        

        if (!roleMenus?.length) return [200, []];

        console.log(roleMenus)
        const menusIds = roleMenus.map((item) => item.menuId);
        let allMenus = [];

        for (let menuId of menusIds) {
            const menus = await executeSql(`SELECT *
                                            FROM menus
                                            WHERE id = ?`, [parseInt(menuId)]);
            allMenus = allMenus.concat(menus);
        }

        return [200, Array.from(new Set(allMenus))]; // 确保结果唯一
    },
   
    // 获取所有
    'get /menu/queryMenus': async (config) => {
        const result = await executeSql('SELECT * from menus');

        return [200, result];
    },
    // 根据name获取
    'get /menu/getOneMenu': async (config) => {
        const { name } = config.params;

        const result = await executeSql('SELECT * from menus where name = ?', [name]);
        return [200, result[0]];
    },
   
    // 添加
    'post /menu/addMenu': async (config) => {
        const { keys, args, holders } = getMenuData(config);


        console.log(keys)
        console.log(args)
        console.log(holders)
        const result = await executeSql(
            `INSERT INTO menus (${keys})
            VALUES (${holders})
        `,
            args,
            true,
        );
        console.log(result)
       

        return [200, { id: result}];
    },
    
    // 修改
    'post /menu/updateMenuById': async (config) => {
        const { id } = JSON.parse(config.data);
        const { keys, args } = getMenuData(config);

        
        keys.push('updatedAt');
        args.push(moment().format('YYYY-MM-DD HH:mm:ss'));
        args.push(id);
        const arr = keys.map((key) => key + '=?');

        console.log(arr)
        console.log(args)
        await executeSql(
            `UPDATE menus SET ${arr} WHERE id = ?`,
            args,
        );

        return [200, true];
    },
    // 删除
    'delete re:/menu/.+': async (config) => {
        const id = parseInt(config.url.split('/')[2]);
       
        await executeSql(`DELETE FROM menus WHERE id =?`,[id]);
        await executeSql(`DELETE FROM role_menus WHERE menuId =?`,[id]);
        return [200, true];
    },
    
};

function getMenuData(config, parse = JSON.parse) {
    const {
        id = '',
        target = 'menu',
        parentId = '',
        title,
        basePath = '',
        path = '',
        sort = 0,
        name = '',
        entry = '',
        icon = '',
        code = '',
        type = 1,
        enabled = true,
    } = parse(config.data);
    const data = Object.entries({
        id,
        target,
        parentId,
        title,
        basePath,
        path,
        // eslint-disable-next-line
        sort,
        name,
        entry,
        icon,
        code,
        type,
        enabled: enabled ? 1 : 0,
    });

    const keys = data.map(([key]) => key);
    const args = data.map(([, value]) => value);
    const holders = data.map(() => '?');

    return { keys, args, holders };
}
