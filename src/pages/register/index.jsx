import React, {useState, useEffect, useCallback} from 'react';
import {Helmet} from 'react-helmet';
import {Button, Form} from 'antd';
import {LockOutlined, UserOutlined, MailOutlined} from '@ant-design/icons';
import {FormItem} from '@ra-lib/admin';
import config from 'src/commons/config-hoc';
import {Logo} from 'src/components';
import s from './style.less';
import {encryptPassword} from 'src/utils/encryption'; // 密码加密的函数

export default config({
    path: '/register',
    auth: false,
    layout: false,
})(function Register(props) {
    const [message, setMessage] = useState();
    const [isMount, setIsMount] = useState(false);
    const [form] = Form.useForm();

    const register = props.ajax.usePost('/mock/register');

    const handleSubmit = useCallback(
        (values) => {
            if (register.loading) return;

            const params = {
                ...values,
                account:values.account,
                email:values.email,
                //password: encryptPassword(values.password), // 加密密码
                password: values.password,
            };
            alert('TODO 注册');
            //register.run = async () => ({id: 1, name: '测试', token: 'test'});
            register
                .run(params, {errorTip: false})
                .then((res) => {
                    console.log(res)
                    const [status, data] = res;
                    if(status===200){
                        alert('注册成功，请登录！');
                        props.history.push('/login');
                    }else if (status===400) {
                        alert(data.message)
                    }
                    
                })
                .catch((err) => {
                    console.error(err);
                    setMessage(err.response?.data?.message || '注册失败，请重试');
                });
        },
        [register, props.history],
    );

    useEffect(() => {
        setTimeout(() => setIsMount(true), 300);
    }, []);

    const formItemClass = [s.formItem, {[s.active]: isMount}];

    return (
        <div className={s.root}>
            <Helmet title="欢迎注册" />
            <div className={s.logo}>
                <Logo />
            </div>
            <div className={s.box}>
                <Form form={form} name="register" onFinish={handleSubmit}>
                    <div className={formItemClass}>
                        <h1 className={s.header}>欢迎注册</h1>
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
                            name="email"
                            allowClear
                            prefix={<MailOutlined />}
                            placeholder="请输入邮箱"
                            rules={[
                                {required: true, message: '请输入邮箱！'},
                                {type: 'email', message: '邮箱格式不正确！'},
                            ]}
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
                        <FormItem
                            type="password"
                            name="confirmPassword"
                            prefix={<LockOutlined />}
                            placeholder="请确认密码"
                            rules={[
                                {required: true, message: '请确认密码！'},
                                ({getFieldValue}) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject('两次输入的密码不一致！');
                                    },
                                }),
                            ]}
                        />
                    </div>
                    <div className={formItemClass}>
                        <FormItem noStyle shouldUpdate style={{marginBottom: 0}}>
                            {() => (
                                <Button
                                    className={s.submitBtn}
                                    loading={register.loading}
                                    type="primary"
                                    htmlType="submit"
                                    disabled={
                                        // 用户没有操作过，或者没有setFieldsValue
                                        !form.isFieldsTouched(true) ||
                                        // 表单中存在错误
                                        form.getFieldsError().filter(({errors}) => errors.length).length
                                    }
                                >
                                    注册
                                </Button>
                            )}
                        </FormItem>
                    </div>
                </Form>
                <div className={s.errorTip}>{message}</div>
            </div>
        </div>
    );
});
