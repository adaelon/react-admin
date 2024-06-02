
/* eslint-disable import/first */
import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';
import React from 'react';
import ReactDOM from 'react-dom';
import { notification, Modal, message } from 'antd';
import App from './App';
import { initDB, executeSql,openDB } from './mock/web-sql';
// 开启mock
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_MOCK) {
    require('./mock/index');
    console.warn('mock is enabled!!!');
     // 初始化 mock 数据库
    openDB();
}

function getRootDom(props) {
    const rootId = '#root';
    const { container } = props;
    return container ? container.querySelector(rootId) : document.querySelector(rootId);
}

function render(props = {}) {
    ReactDOM.render(<App />, getRootDom(props));
}
render();