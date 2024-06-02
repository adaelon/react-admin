import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Form, Modal, Space, Tabs, Popconfirm } from 'antd';
import json5 from 'json5';
import { FormItem, Content, useHeight, useDebounceValidator } from '@ra-lib/admin';
import config from 'src/commons/config-hoc';
import { WITH_SYSTEMS } from 'src/config';
import options from 'src/options';
import styles from './style.less';
import {fetchMenuCount} from 'src/utils/menuData'; //异步获取菜单信息

const menuTargetOptions = options.menuTarget;

const TabPane = Tabs.TabPane;

export default config()(function MenuEdit(props) {
    const { isAdd, selectedMenu, onSubmit, onValuesChange } = props;

    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [addTabKey, setAddTabKey] = useState('1');
    const [textAreaHeight] = useHeight(null, 285);
    const contentRef = useRef(null);

    const hasSelectedMenu = selectedMenu && Object.keys(selectedMenu).length;
    const isAddTop = isAdd && !hasSelectedMenu;
    const isAddSub = isAdd && hasSelectedMenu;
    const title = (() => {
        if (isAddTop) return WITH_SYSTEMS ? '添加应用' : '添加顶级';

        return isAddSub ? '添加菜单' : '修改菜单';
    })();

    const { run: deleteMenu } = props.ajax.useDel('/menu/:id', null, { setLoading });
    const { run: saveMenu } = props.ajax.usePost('/menu/addMenu', null, { setLoading });
    const { run: branchSaveMenu } = props.ajax.usePost('/menu/addSubMenus', null, { setLoading });
    const { run: updateMenu } = props.ajax.usePost('/menu/updateMenuById', null, { setLoading });
    const { run: fetchMenuByName } = props.ajax.useGet('/menu/getOneMenu');
    const { run: saveRole } = props.ajax.usePost('/role/addRole', null, { setLoading });

    // 表单回显
    useEffect(() => {
        form.resetFields();
        let initialValues = { ...selectedMenu, order: selectedMenu?.ord };
        if (isAddTop) initialValues = { target: 'menu' };
        if (isAddSub)
            initialValues = {
                target: 'menu',
                parentId: selectedMenu.id,
                systemId: selectedMenu.systemId,
            };

        form.setFieldsValue(initialValues);
    }, [form, isAdd, isAddTop, isAddSub, selectedMenu]);

    const handleSubmit = useCallback(
        async (values) => {
            if (loading) return;
            //获取menu总数
            const menuCount = await fetchMenuCount().then((count) => {
                return count;
            });
            //添加顶级使用
            const params = {
                ...values,
                id:menuCount+1,
                type: 1, // 菜单
                sort: values.order,
                ord: values.order,
            };
            //update使用
            const params2 = {
                ...values,
                id:menuCount,
                type: 1, // 菜单
                sort: values.order,
                ord: values.order,
            };
            

            //添加子级使用
            const params3 = {
                ...values,
                id:menuCount+1,
                parentId: parseInt(selectedMenu.id) ,
                type: 1, // 菜单
                sort: values.order,
                ord: values.order,
            };
            console.log(params3)
            if (isAdd) {
                if (isAddSub) {
                    console.log("子级")
                    const res = await saveMenu(params3);
                    const { id } = res;
                    onSubmit && onSubmit({ id, isAdd: true });
                } else {
                    const res = await saveMenu(params);
                    console.log(res)
                    const { id } = res;
                    onSubmit && onSubmit({ ...params, id, isAdd: true });

                   
                }
            } else {
                await updateMenu(params2);
                onSubmit && onSubmit({ ...params, isUpdate: true });
            }
        },
        [addTabKey, branchSaveMenu, isAdd, isAddSub, isAddTop, loading, onSubmit, saveMenu, saveRole, updateMenu],
    );

    const checkName = useDebounceValidator(async (rule, value) => {
        if (!value) return;

        const menu = await fetchMenuByName({ name: value });
        if (!menu) return;

        const id = form.getFieldValue('id');
        const menuId = `${menu.id}`;
        if (isAdd && menu.name === value) throw Error('注册名称不能重复！');
        if (!isAdd && menuId !== id && menu.name === value) throw Error('注册名称不能重复！');
    });

    const handleDelete = useCallback(async () => {
        const id = selectedMenu?.id;
        await deleteMenu({ id });

        onSubmit && onSubmit({ id, isDelete: true });
    }, [deleteMenu, onSubmit, selectedMenu?.id]);

    const layout = {
        labelCol: { flex: '100px' },
    };

    return (
        <Form
            className={styles.pane}
            name={`menu-form`}
            form={form}
            onFinish={handleSubmit}
            onValuesChange={onValuesChange}
            initialValues={{ enabled: true }}
        >
            <h3 className={styles.title}>{title}</h3>
            <Content ref={contentRef} loading={loading} className={styles.content}>
                {isAddSub ? (
                    <Tabs activeKey={addTabKey} onChange={(key) => setAddTabKey(key)}>
                        <TabPane key="1" tab="单个添加" />
                    </Tabs>
                ) : null}
                <FormItem name="id" hidden />
                <FormItem name="parentId" hidden />
                {addTabKey === '1' ? (
                    <>
                        <FormItem
                            {...layout}
                            label="类型"
                            type="select"
                            name="target"
                            options={menuTargetOptions}
                            tooltip="应用菜单"
                            required
                            getPopupContainer={() => contentRef.current}
                        />
                        <FormItem {...layout} label="标题" name="title" required tooltip="菜单标题" />
                        <FormItem {...layout} type="number" label="排序" name="order" tooltip="降序，越大越靠前" />
                        <FormItem {...layout} label="路径" name="path" tooltip="菜单路径" />
                        <FormItem
                            {...layout}
                            type="switch"
                            label="启用"
                            name="enabled"
                            checkedChildren="启"
                            unCheckedChildren="禁"
                            tooltip="是否启用"
                        />
                        <FormItem shouldUpdate noStyle>
                            {({ getFieldValue }) => {


                                return (
                                    <FormItem
                                        {...layout}
                                        label="基础路径"
                                        name="basePath"
                                        tooltip="所有其子菜单路径将以此为前缀"
                                    />
                                );
                            }}
                        </FormItem>
                    </>
                ) : (
                    <FormItem
                        labelCol={{ flex: 0 }}
                        type="textarea"
                        name="menus"
                        rows={16}
                        rules={[{ required: true, message: '请输入菜单数据！' }]}
                        style={{ height: textAreaHeight }}
                        placeholder={`批量添加子菜单，结构如下：
[
    {id: 'system', title: '系统管理', order: 900},
    {id: 'user', parentId: 'system', title: '用户管理', path: '/users', order: 900},
    {id: 'menus', parentId: 'system', title: '菜单管理', path: '/menus', order: 900},
    {id: 'role', parentId: 'system', title: '角色管理', path: '/roles', order: 900},
   
]
                            `}
                    />
                )}
            </Content>
            <Space className={styles.footerAction}>
                {!isAdd ? (
                    <Popconfirm title={`您确定删除「${selectedMenu?.title}」？`} onConfirm={handleDelete}>
                        <Button loading={loading} danger>
                            删除
                        </Button>
                    </Popconfirm>
                ) : null}
                <Button loading={loading} type="primary" htmlType="submit">
                    保存
                </Button>
            </Space>
        </Form>
    );
});
