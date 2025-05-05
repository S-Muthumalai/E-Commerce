import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Spin, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import Navbar from '@/components/layout/navbar';
import Sidebar from '@/components/layout/sidebar';
import { User } from 'lucide-react';

const { Option } = Select;

const AdminUserDashboard: React.FC = () => {
    interface User {
        id: string;
        name: string;
        email: string;
        role: string;
        lastLogin?: string;
    }

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/users`); // Replace with your API endpoint
            console.log("API response",response.data);
            if (Array.isArray(response.data.users)) {
                setUsers(response.data.users);
            } else {
                console.error('Expected an array but got:', response.data.users);
                message.error('Invalid data format received from the server');
            }
        } catch (error) {
            message.error('Failed to fetch user data');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (record: any) => {
        setEditingUser(record);
        setIsModalVisible(true);
    };

    const handleDelete = async (id: string) => {
        try {
            console.log("Deleting user with ID:", id);
            setLoading(true);
            await axios.delete(`/api/user/${id}`);
            message.success('User deleted successfully');
            fetchUsers();
            setLoading(false);
        } catch (error) {
            message.error('Failed to delete user');
        }
    };

    const handleModalOk = async (values: any) => {
        try {
            if (editingUser) {
                await axios.put(`/api/users/${editingUser.id}`, values);
                message.success('User updated successfully');
            } else {
                await axios.post('/api/users', values);
                message.success('User created successfully');
            }
            fetchUsers();
            setIsModalVisible(false);
            setEditingUser(null);
        } catch (error) {
            message.error('Failed to save user');
        }
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
        setEditingUser(null);
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Name',
            dataIndex: 'username',
            key: 'name',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
        },
        {
            title: 'Wishlist Items',
            dataIndex: 'wishlistCount', // Use the "wishlistCount" field from the API response
            key: 'wishlistCount',
        },
        {
            title: 'Cart Items',
            dataIndex: 'cartItemCount', // Use the "cartItemCount" field from the API response
            key: 'cartItemCount',
        },
        {
            title: 'Orders',
            dataIndex: 'numberOfOrder', // Use the "numberOfOrder" field from the API response
            key: 'numberOfOrder',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (text: any, record: any) => (
                <>
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        style={{ marginRight: 8 }}
                    />
                    <Button
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() => handleDelete(record.id)}
                    />
                </>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <div className="flex flex-1">
                <Sidebar />

                <main className="flex-1 p-4 md:p-6 overflow-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    </div>

                    {loading ? (
                        <Spin size="large" />
                    ) : (
                        <Table
                            columns={columns}
                            dataSource={Array.isArray(users) ? users : []}
                            rowKey="id"
                            pagination={{ pageSize: 10 }}
                        />
                    )}

                    <Modal
                        title={editingUser ? 'Edit User' : 'Add User'}
                        visible={isModalVisible}
                        onCancel={handleModalCancel}
                        footer={null}
                    >
                        <Form
                            initialValues={editingUser || {}}
                            onFinish={handleModalOk}
                            layout="vertical"
                        >
                            <Form.Item
                                name="name"
                                label="Name"
                                rules={[{ required: true, message: 'Please enter name' }]}
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item
                                name="email"
                                label="Email"
                                rules={[{ required: true, message: 'Please enter email' }]}
                            >
                                <Input type="email" />
                            </Form.Item>
                            <Form.Item
                                name="role"
                                label="Role"
                                rules={[{ required: true, message: 'Please select role' }]}
                            >
                                <Select>
                                    <Option value="Admin">Admin</Option>
                                    <Option value="User">User</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" htmlType="submit">
                                    {editingUser ? 'Update' : 'Create'}
                                </Button>
                            </Form.Item>
                        </Form>
                    </Modal>
                </main>
            </div>
        </div>
    );
};

export default AdminUserDashboard;