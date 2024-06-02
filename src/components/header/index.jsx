import {useState} from 'react';
import {Space, Dropdown, Menu, Avatar} from 'antd';
import {DownOutlined, LockOutlined, LogoutOutlined} from '@ant-design/icons';
import config from 'src/commons/config-hoc';
import {toLogin} from 'src/commons';
import styles from './style.less';

export default config({
    router: true,
})(function Header(props) {
    const {loginUser = {}} = props;
    const [passwordVisible, setPasswordVisible] = useState(false);

    async function handleLogout() {
        try {
            // await props.ajax.post('/logout', null, {errorTip: false});
            alert('TODO 退出登录接口！');
        } finally {
            // 无论退出成功失败，都跳转登录页面
            toLogin();
        }
    }

    const menu = (
        <Menu>
            
            <Menu.Item key="logout" danger icon={<LogoutOutlined />} onClick={handleLogout}>
                退出登录
            </Menu.Item>
        </Menu>
    );

    const {avatar, name = ''} = loginUser;

    return (
        <Space
            className={styles.root}
            size={16}
            style={{
                paddingRight: 0,
            }}
        >
            

            <Dropdown overlay={menu}>
                <div className={styles.action}>
                   
                    <>
                        <span className={styles.userName}>{name}</span>
                        <DownOutlined />
                    </>
                </div>
            </Dropdown>
            
        </Space>
    );
});
