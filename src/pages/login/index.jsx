import React, {useState, useEffect, useCallback} from 'react';
import {Helmet} from 'react-helmet';
import {Button, Form} from 'antd';
import {LockOutlined, UserOutlined} from '@ant-design/icons';
import {FormItem, setLoginUser} from '@ra-lib/admin';
import config from 'src/commons/config-hoc';
import {useHistory} from 'react-router-dom';
import {toHome} from 'src/commons';
import {Logo} from 'src/components';
import {IS_DEV, IS_TEST, IS_PREVIEW} from 'src/config';
import s from './style.less';
import {encryptPassword} from 'src/utils/encryption'; //密码加密的函数

// 开发模式 默认填充的用户名密码
const formValues = {
    account: 'superadmin',
    password: 'Abc123456',
};

export default config({
    path: '/login',
    auth: false,
    layout: false,
})(function Login(props) {
    const [message, setMessage] = useState();
    const [isMount, setIsMount] = useState(false);
    const [form] = Form.useForm();
    const history = useHistory(); // 使用useHistory钩子

    const login = props.ajax.usePost('/mock/login');

    const handleSubmit = useCallback(
        (values) => {
            if (login.loading) return;

            const params = {
                ...values,
                password: values.password, // 加密密码
            };

            alert('TODO 登录');
            //login.run = async () => ({id: 1, name: '测试', token: 'test'});

            login
                .run(params, {errorTip: false})
                .then((res) => {
                   // 通过res访问实际的数据
                    const [status, data] = res;
                    console.log(data)
                    if (status === 200) {
                        const { id, account, token, ...others } = data;
                        var name = account
                        setLoginUser({
                            id, // 必须字段
                            name, // 必须字段
                            token,
                            ...others,
                            // 其他字段按需添加
                        });
                        toHome();
                    } else {
                        setMessage(data.message || '用户名或密码错误');
                    }
                })
                .catch((err) => {
                    console.error(err);
                    setMessage(err.response?.data?.message || '用户名或密码错误');
                });
        },
        [login],
    );

    useEffect(() => {
        // 开发时默认填入数据
        if (IS_DEV || IS_TEST || IS_PREVIEW) {
            form.setFieldsValue(formValues);
        }

        setTimeout(() => setIsMount(true), 300);
    }, [form]);

    const formItemClass = [s.formItem, {[s.active]: isMount}];

    // 跳转到注册页面的函数
    const handleRegister = useCallback(() => {
        history.push('/register');
    }, [history]);

    return (
        <div className={s.root}>
            <Helmet title="欢迎登录" />
            <div className={s.logo}>
                <Logo />
            </div>
           
            <div className={s.box}>
                <Form form={form} name="login" onFinish={handleSubmit}>
                    <div className={formItemClass}>
                        <h1 className={s.header}>欢迎登录</h1>
                    </div>
                    <div className={formItemClass}>
                        <FormItem
                            name="account"
                            allowClear
                            autoFocus
                            prefix={<UserOutlined />}
                            placeholder="请输入用户名"
                            rules={[{required: true, message: '请输入用户名！'}]}
                        />
                    </div>
                    <div className={formItemClass}>
                        <FormItem
                            type="password"
                            name="password"
                            prefix={<LockOutlined />}
                            placeholder="请输入密码"
                            rules={[
                                {required: true, message: '请输入密码！'},
                                {
                                    validator: (_, value) => {
                                        if (!value) {
                                            return Promise.resolve();
                                        }
                                        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,16}$/.test(value)) {
                                            return Promise.reject(
                                                '需含大小写字母和数字，长度为8-16位！'
                                            );
                                        }
                                        return Promise.resolve();
                                    },
                                },
                            ]}
                        />
                    </div>
                    <div className={formItemClass}>
                        <FormItem noStyle shouldUpdate style={{marginBottom: 0}}>
                            {() => (
                                <Button
                                    className={s.submitBtn}
                                    loading={login.loading}
                                    type="primary"
                                    htmlType="submit"
                                    disabled={
                                        // 用户没有操作过，或者没有setFieldsValue
                                        !form.isFieldsTouched(true) ||
                                        // 表单中存在错误
                                        form.getFieldsError().filter(({errors}) => errors.length).length
                                    }
                                >
                                    登录
                                </Button>
                            )}
                        </FormItem>
                    </div>
                    <div className={formItemClass}>
                        <Button
                            className={s.registerBtn}
                            type="link"
                            onClick={handleRegister}
                        >
                            注册
                        </Button>
                    </div>
                </Form>
                <div className={s.errorTip}>{message}</div>
            </div>
        </div>
    );
});
