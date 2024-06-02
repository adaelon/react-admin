import React, { useState, useEffect, useCallback } from 'react';
import { ConfigProvider } from 'antd';
import { Helmet } from 'react-helmet';
import { Provider } from 'react-redux';
import zhCN from 'antd/lib/locale-provider/zh_CN';
import moment from 'moment';
import 'moment/locale/zh-cn'; // 解决antd日期相关组件国际化问题
import { ComponentProvider, Loading, getLoginUser, setLoginUser /*queryParse,*/ } from '@ra-lib/admin';
import { isNoAuthPage } from 'src/commons';
import AppRouter from './router/AppRouter';
import { APP_NAME, CONFIG_HOC } from 'src/config';
import { store } from 'src/models';
import api from 'src/api';
import theme from 'src/theme.less';
import './App.less';

// 设置语言
moment.locale('zh-cn');

// 设置 Modal、Message、Notification rootPrefixCls。
ConfigProvider.config({
    prefixCls: theme.antPrefix,
});

export default function App(props) {
    const { children } = props;
    const [loading, setLoading] = useState(true);
    const [menus, setMenus] = useState([]);
   

    // 一些初始化工作
    useEffect(() => {
        // 不需要登录的页面不请求
        if (isNoAuthPage()) return setLoading(false);

        // 获取用户菜单、权限等
        (async () => {
            try {
                let loginUser = getLoginUser();
                if (!loginUser) {
                    
                    return setLoading(false);
                }

                

                // 获取用户菜单
                await api.getMenus().then(setMenus).catch(console.error);

            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // 加载完成后渲染，确保能拿到menu数据
    return (
        <Provider store={store}>
            <ConfigProvider locale={zhCN} prefixCls={theme.antPrefix}>
                <Helmet title={APP_NAME} />
                <ComponentProvider
                    prefixCls={theme.raLibPrefix}
                    layoutPageOtherHeight={CONFIG_HOC.pageOtherHeight}
                >
                    {loading ? (
                        <Loading progress={false} spin />
                    ) : children ? (
                        children
                    ) : (
                        <AppRouter menus={menus} />
                    )}
                    
                </ComponentProvider>
            </ConfigProvider>
        </Provider>
    );
}
