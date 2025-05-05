import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '@/components/layout/sidebar';
import Navbar from '@/components/layout/navbar';
import { useAuth } from '@/hooks/use-auth';
import { Card, Typography, Spin, Table, Button, Modal, message, Row, Col } from 'antd';
const { Title, Text } = Typography;

interface Product {
  productId: number;
  productName: string;
  category: string;
  price: number;
  quantity: number;
}

interface CustomerDetails {
  name: string;
  address: string;
  contact: string;
}

interface Order {
  orderId: number;
  status: string;
  totalAmount: number;
  shippingAddress: string;
  deliveryDate: string;
  customerDetails: CustomerDetails;
  products: Product[];
}

const MiddlemanDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingOrderId, setProcessingOrderId] = useState<number | null>(null);
  const { user } = useAuth() as { user: { id: number; username: string; password: string; email: string | null; isAdmin: boolean } };

  useEffect(() => {
    fetchOrders();
  }, []);
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/Approvedorders');
      console.log('Fetched orders:', response.data);
      setOrders(response.data);
    } catch (err) {
      setError('Failed to fetch orders.');
    } finally {
      setLoading(false);
    }
  };
  const handleProcessOrder = async (orderId: number) => {
    setProcessingOrderId(orderId);
    try {
        console.log('Processing order:', orderId);
      const result =await axios.get(`/api/orders/statuschange/${orderId}`);
      console.log('Order processed:', result.data);
      message.success('Order processed successfully!');
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.orderId === orderId ? { ...order, status: result.data } : order
        )
      );
    } catch (err) {
      message.error('Failed to process the order.');
    } finally {
      setProcessingOrderId(null);
    }
  };
  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
    },
    {
      title: 'Customer Name',
      dataIndex: ['customerDetails', 'name'],
      key: 'customerName',
    },
    {
      title: 'Shipping Address',
      dataIndex: 'shippingAddress',
      key: 'shippingAddress',
      render: (address: string) => <Text>{address}</Text>,
    },
    {
      title: 'Contact Number',
      dataIndex: ['customerDetails', 'contact'],
      key: 'contactNumber',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Text type={status === 'processing' ? 'warning' : status === 'shipped' ? 'secondary' : 'success'} style={{ whiteSpace: 'nowrap' }}>
          {status}
          
        </Text>
      ),
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `$${amount.toFixed(2)}`,
    },
    {
      title: 'Delivery Date',
      dataIndex: 'deliveryDate',
      key: 'deliveryDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Order) => {
        if (record.status === 'delivered') {
          return <Button type='default' disabled>Delivered</Button>;
        } else {
          return (
            <Button
              type="primary"
              onClick={() => handleProcessOrder(record.orderId)}
              loading={processingOrderId === record.orderId}
            >
              {record.status === 'shipped' ? 'Deliver order' : 'Process Order'}
            </Button>
          );
        }
      },
    },
  ];

  const expandedRowRender = (order: Order) => {
    const productColumns = [
      {
        title: 'Product ID',
        dataIndex: 'productId',
        key: 'productId',
      },
      {
        title: 'Product Name',
        dataIndex: 'productName',
        key: 'productName',
      },
      {
        title: 'Category',
        dataIndex: 'category',
        key: 'category',
      },
      {
        title: 'Price',
        dataIndex: 'price',
        key: 'price',
        render: (price: number) => `$${price.toFixed(2)}`,
      },
      {
        title: 'Quantity',
        dataIndex: 'quantity',
        key: 'quantity',
      },
    ];

    return <Table dataSource={order.products} columns={productColumns} rowKey="productId" pagination={false} />;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <Text type="danger">{error}</Text>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-t from-blue-500 to-blue-50 flex flex-col">
                <Navbar />
                
                      <div className="flex flex-1">
                        {user.isAdmin && <Sidebar />}
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '20px' }}>
        Middleman Dashboard
      </Title>
      <Button
                                  type="primary"
                                  onClick={() => fetchOrders()}
                                  style={{ marginBottom: 16 }}
                              >
                                  Refresh Orders
                              </Button>
      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col span={6}>
          <Card bordered style={{ textAlign: 'center' }}>
            <Title level={4}>Total Orders</Title>
            <Text strong>{orders.length}</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered style={{ textAlign: 'center' }}>
            <Title level={4}>Processing Orders</Title>
            <Text strong>{orders.filter((order) => order.status === 'processing').length}</Text>
          </Card>
        </Col><Col span={6}>
          <Card bordered style={{ textAlign: 'center' }}>
            <Title level={4}>Shipped Orders</Title>
            <Text strong>{orders.filter((order) => order.status === 'shipped').length}</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered style={{ textAlign: 'center' }}>
            <Title level={4}>Delivered Orders</Title>
            <Text strong>{orders.filter((order) => order.status ==='delivered').length}</Text>
          </Card>
        </Col>
      </Row>

      {/* Orders Table */}
      <Card  className='shadow-md '>
        <Title level={4} className="text-lg font-semibold text-gray-800 mb-4">Orders</Title>
        <Table
        bordered={true}
        className="table-auto border border-blue-500"
          dataSource={orders}
          columns={columns}
          rowKey="orderId"
          expandable={{ expandedRowRender }}
          pagination={{ pageSize: 5 }}
          rowClassName={() => "border border-gray-300"}
        />
      </Card>
    </div>
    </div>
    </div>
  );
};
export default MiddlemanDashboard;