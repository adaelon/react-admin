import ajax from 'src/commons/ajax';
import { getLoginUser, isLoginPage, formatMenus, getContainerId } from '@ra-lib/admin';
import { isNoAuthPage } from 'src/commons';
import {fetchAndCacheMenuData} from 'src/utils/menuData'; //密码加密的函数
let returnData
export default {
    
    /**
     * 获取菜单
     * @returns {Promise<*[]|*>}
     */
    async getMenuData() {
        // 非登录页面，不加载菜单
        if (isNoAuthPage()) return [];

        
            
        console.log(getLoginUser().id)
        
        const returnData = await fetchAndCacheMenuData().then((data) => {
            console.log('Final data:', data); // 这里可以访问到处理后的数据
            return data;
        });
        return returnData;
      

       

        // 前端硬编码菜单
         return [
             {id: 1, title: '系统管理', order: 900, type: 1},
             {id: 2, parentId: 1, title: '用户管理', path: '/users', order: 900, type: 1},
             {id: 3, parentId: 1, title: '角色管理', path: '/roles', order: 900, type: 1},
             {id: 4, parentId: 1, title: '菜单管理', path: '/menus', order: 900, type: 1},
         ];
    },
    /**
     * 获取系统菜单
     * @returns {Promise<T[]>}
     */
    async getMenus() {
        // mock时，做个延迟处理，否则菜单请求无法走mock
        if (process.env.REACT_APP_MOCK) await new Promise((resolve) => setTimeout(resolve));

        const serverMenus = await this.getMenuData();
        const menus = serverMenus
            .filter((item) => !item.type || item.type === 1)
            .map((item) => {
                return {
                    ...item,
                    id: `${item.id}`,
                    parentId: `${item.parentId}`,
                };
            });

        return formatMenus(menus);
    },
    
};
