import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import Navbar from '@/components/layout/navbar';
import Sidebar from '@/components/layout/sidebar';

const { Option } = Select;

const OrderDashboard: React.FC = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingOrder, setEditingOrder] = useState<any>(null);

    useEffect(() => {
        fetchOrders();
        console.log('Fetching orders...');
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await axios.get("/api/ordersforadmin");
            console.log(response.data);
            setOrders(response.data);
        } catch (error) {
            message.error('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };
    const handleApprove = async (id: number) => {
        try {
            await axios.put(`/api/orders/${id}/approve`);
            message.success('Order approved successfully');
            fetchOrders();
        } catch (error) {
            message.error('Failed to approve order');
        }
    };

    const handleEdit = (record: any) => {
        setEditingOrder(record);
        setIsModalVisible(true);
    };

    const handleDelete = async (id: string) => {
        try {
            console.log('Deleting order with ID:', id);
            await axios.delete(`/api/orders/${id}`);
            message.success('Order deleted successfully');
            fetchOrders();
        } catch (error) {
            message.error('Failed to delete order');
        }
    };

    const handleModalOk = async (values: any) => {
        try {
            if (editingOrder) {
                await axios.put(`/api/orders/${editingOrder.id}`, values);
                message.success('Order updated successfully');
            } else {
                await axios.post('/api/orders', values);
                message.success('Order created successfully');
            }
            fetchOrders();
            setIsModalVisible(false);
            setEditingOrder(null);
        } catch (error) {
            message.error('Failed to save order');
        }
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
        setEditingOrder(null);
    };

    const columns = [
        {
            title: 'Order ID',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Customer Name',
            dataIndex: ['user', 'username'], // Assuming the backend sends `user.username`
            key: 'username',
        },
        {
            title: 'Items',
            dataIndex: 'items',
            key: 'items',
            render: (items: any[]) => items.map(item => item.product.name).join(', '), // Display product names
        },
        {
            title: 'Total Amount',
            dataIndex: 'total',
            key: 'total',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (text: any, record: any) => (
                <>{record.status === 'pending' && (
                    <Button
                        type="primary"
                        onClick={() => handleApprove(record.id)}
                        // disabled={record.status !== 'Pending'}
                        style={{ marginRight: 8 }}
                    >
                        Approve
                    </Button>
                )}
                  {record.status !== 'delivered' && (  <Button
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        style={{ marginRight: 8 }}
                    />)}
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
                        <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
                        <Button
                            type="primary"
                            onClick={() => fetchOrders()}
                            style={{ marginBottom: 16 }}
                        >
                            Refresh Orders
                        </Button>
                    </div>

                    <Table
                        columns={columns}
                        dataSource={orders}
                        loading={loading}
                        rowKey="id"
                    />

                    <Modal
                        title={editingOrder ? 'Edit Order' : 'Add Order'}
                        visible={isModalVisible}
                        onCancel={handleModalCancel}
                        footer={null}
                    >
                        <Form
                            initialValues={editingOrder || {}}
                            onFinish={handleModalOk}
                            layout="vertical"
                        >
                            <Form.Item
                                name="customerName"
                                label="Customer Name"
                                rules={[{ required: true, message: 'Please enter customer name' }]}
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item
                                name="status"
                                label="Status"
                                rules={[{ required: true, message: 'Please select status' }]}
                            >
                                <Select>
                                    <Option value="Pending">Pending</Option>
                                    <Option value="Completed">Completed</Option>
                                    <Option value="Cancelled">Cancelled</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item
                                name="totalAmount"
                                label="Total Amount"
                                rules={[{ required: true, message: 'Please enter total amount' }]}
                            >
                                <Input type="number" />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" htmlType="submit">
                                    {editingOrder ? 'Update' : 'Create'}
                                </Button>
                            </Form.Item>
                        </Form>
                    </Modal>
                </main>
            </div>
        </div>
    );
};

export default OrderDashboard; 