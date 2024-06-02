import { Loading } from '@ra-lib/admin';
import loadable from '@loadable/component';
import { checkPath } from '../commons';
import pageConfigs from 'src/pages/page-configs';

// 检测路由配置是否有冲突
checkPath(pageConfigs);

// 抓取到的页面路由
const pageRoutes = pageConfigs.filter(({ path }) => !!path);

// 所有人都可以访问的页面
export const commonPaths = ['/', '/login','/register'];

/*
 * 非脚本抓取的路由，可以在这里编辑，
 * 脚本抓取的路由在./src/pages/page-configs.js中
 * */
export default [
    
]
    .concat(pageRoutes)
    .map((item) => {
        return {
            ...item,
            component: loadable(item.component, { fallback: <Loading /> }),
        };
    });
