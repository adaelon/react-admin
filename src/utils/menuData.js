import ajax from 'src/commons/ajax';
import { getLoginUser, isLoginPage, formatMenus, getContainerId } from '@ra-lib/admin';
async function fetchAndCacheMenuData() {
    

    try {
        // 获取服务端数据
        const res = await ajax.get('/authority/queryUserMenus', { userId: getLoginUser().id });
        console.log('Response from /authority/queryUserMenus:', res); // 打印 res

        // 解构响应数据
        const [status, data] = res;

        // 处理并返回数据
         
        const formattedData = data.map((item) => {
            const formattedItem = {
                id: parseInt(item.id),
                title: item.title,
                order: item.order ?? item.ord ?? item.sort ?? 0,
                type: parseInt(item.type) || 1,
            };
        
            if (item.parentId !== 'NULL') {
                formattedItem.parentId = parseInt(item.parentId);
            }
        
            if (item.path !== 'NULL') {
                formattedItem.path = item.path;
            }
        
            return formattedItem;
        });
        

      

        console.log('Formatted data:', formattedData);

        return formattedData;
    } catch (error) {
        console.error('Error fetching user menus:', error); // 打印错误信息
        return [];
    }
}
async function fetchMenuCount() {
    

    try {
        // 获取服务端数据
        const res = await ajax.get('/authority/queryUserMenus', { userId: getLoginUser().id });
        console.log('Response from /authority/queryUserMenus:', res); // 打印 res

        // 解构响应数据
        const [status, data] = res;

        // 处理并返回数据
         
        const count=data.length
        

      

        console.log('menu count:', count);

        return count;
    } catch (error) {
        console.error('Error fetching user menus:', error); // 打印错误信息
        return [];
    }
}

export{fetchAndCacheMenuData,fetchMenuCount}
