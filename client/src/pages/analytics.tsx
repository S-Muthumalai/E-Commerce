import React, { useEffect, useState } from "react";
import { Row, Col, Card, Typography, Spin } from "antd";
import { Pie, Column } from "@ant-design/plots";
import axios from "axios";
import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";

const { Title, Text } = Typography;

const AnalyticsPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [userStats, setUserStats] = useState({ totalUsers: 0, admins: 0, middlemen: 0, regularUsers: 0 });
    interface ProductCategory {
        category: string;
        count: number;
    }
    const [productStats, setProductStats] = useState<{ totalProducts: number; categories: ProductCategory[] }>({
        totalProducts: 0,
        categories: [],
    });
    interface OrderCategory {
        category: string;
        value: number;
    }
    const [orderStats, setOrderStats] = useState<{ totalOrders: number; ordersByCategory: OrderCategory[] }>({
        totalOrders: 0,
        ordersByCategory: [],
    });

    useEffect(() => {
        fetchAnalyticsData();
    }, []);

    const fetchAnalyticsData = async () => {
        setLoading(true);
        try {
            const response = await axios.get("/api/analytics"); // Replace with your analytics API endpoint
            const { users, products, orders } = response.data;
            console.log("Analytics data:", response.data);

            setUserStats({
                totalUsers: users?.totalUsers || 0,
                admins: users?.admins || 0,
                middlemen: users?.middlemen || 0,
                regularUsers: users?.regularUsers || 0,
            });

            setProductStats({
                totalProducts: products?.totalProducts || 0,
                categories: products?.categories || [],
            });

            setOrderStats({
                totalOrders: orders?.totalOrders || 0,
                ordersByCategory: orders?.ordersByCategory || [],
            });
        } catch (error) {
            console.error("Error fetching analytics data:", error);
        } finally {
            setLoading(false);
        }
    };

    const userPieConfig = {
        appendPadding: 5,
        data: [
            { type: "Admins", value: userStats.admins },
            { type: "Middlemen", value: userStats.middlemen },
            { type: "Regular Users", value: userStats.regularUsers },
        ].filter(item => item.value > 0), // Filter out zero values
        angleField: "value",
        colorField: "type",
        radius: 0.4,
        interactions: [{ type: "element-active" }],
        color: ["#1890ff", "#52c41a", "#faad14"],
    };

    const productColumnConfig = {
        data: productStats.categories.map(item => ({
            category: item.category,
            count: item.count || 0,
        })), // Ensure fallback values for missing properties
        xField: "category",
        yField: "count",
        color: "#9254de",
        label: {
            // position: "middle",
            style: { fill: "#fff" },
        },
        xAxis: {
            label: {
                autoRotate: true,
            },
        },
    };

    const orderDonutConfig = {
        appendPadding: 5,
        data: orderStats.ordersByCategory.map(item => ({
            category: item.category || "Unknown",
            value: item.value || 0,
        })).filter(item => item.value > 0), // Filter out zero values
        angleField: "value",
        colorField: "category",
        radius: 0.4,
        innerRadius: 0.2, // Donut chart
        interactions: [{ type: "element-active" }],
        color: ["#ff4d4f", "#36cfc9", "#ffc53d", "#73d13d", "#597ef7"],
    };
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <div className="flex flex-1">
                <Sidebar />
                <main className="flex-1 p-4 md:p-6 overflow-auto">
                    <Spin spinning={loading}>
                        <div style={{ padding: "20px" }}>
                            <Title level={2} style={{ textAlign: "center", marginBottom: "20px", color: "#001529" }}>
                                Analytics Dashboard
                            </Title>

                            {/* Summary Section */}
                            <Row gutter={[16, 16]} style={{ marginBottom: "20px" }}>
                                <Col span={8}>
                                    <Card
                                        bordered={false}
                                        style={{
                                            textAlign: "center",
                                            backgroundColor: "#e6f7ff",
                                            borderRadius: "10px",
                                            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                                        }}
                                    >
                                        <Title level={4} style={{ color: "#1890ff" }}>
                                            Total Users
                                        </Title>
                                        <Text strong style={{ fontSize: "24px", color: "#1890ff" }}>
                                            {userStats.totalUsers}
                                        </Text>
                                    </Card>
                                </Col>
                                <Col span={8}>
                                    <Card
                                        bordered={false}
                                        style={{
                                            textAlign: "center",
                                            backgroundColor: "#fffbe6",
                                            borderRadius: "10px",
                                            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                                        }}
                                    >
                                        <Title level={4} style={{ color: "#faad14" }}>
                                            Total Products
                                        </Title>
                                        <Text strong style={{ fontSize: "24px", color: "#faad14" }}>
                                            {productStats.totalProducts}
                                        </Text>
                                    </Card>
                                </Col>
                                <Col span={8}>
                                    <Card
                                        bordered={false}
                                        style={{
                                            textAlign: "center",
                                            backgroundColor: "#fff1f0",
                                            borderRadius: "10px",
                                            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                                        }}
                                    >
                                        <Title level={4} style={{ color: "#ff4d4f" }}>
                                            Total Orders
                                        </Title>
                                        <Text strong style={{ fontSize: "24px", color: "#ff4d4f" }}>
                                            {orderStats.totalOrders}
                                        </Text>
                                    </Card>
                                </Col>
                            </Row>

                            {/* User Details */}
                            <Row gutter={[16, 16]} style={{ marginBottom: "20px" }}>
                                <Col span={24}>
                                    <Card
                                        title="User Details"
                                        bordered={false}
                                        style={{
                                            backgroundColor: "#f0f5ff",
                                            borderRadius: "10px",
                                            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",padding: "20px", // Add padding inside the card
                                            minHeight: "300px", 
                                            // height:"200px",
                                        }}
                                    >
                                        {userStats.totalUsers > 0 ? (
                                            <Pie {...userPieConfig} autoFit/>
                                        ) : (
                                            <p>No user data available</p>
                                        )}
                                    </Card>
                                </Col>
                            </Row>

                            {/* Product Details */}
                            <Row gutter={[16, 16]} style={{ marginBottom: "20px" }}>
                                <Col span={24}>
                                    <Card
                                        title="Product Details"
                                        bordered={false}
                                        style={{
                                            backgroundColor: "#fff7e6",
                                            borderRadius: "10px",
                                            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                                        }}
                                    >
                                        {productStats.totalProducts > 0 ? (
                                            <Column {...productColumnConfig} />
                                        ) : (
                                            <p>No product data available</p>
                                        )}
                                    </Card>
                                </Col>
                            </Row>

                            {/* Order Details */}
                            <Row gutter={[10, 10]}>
                                <Col span={24}>
                                    <Card
                                        title="Order Details"
                                        bordered={false}
                                        style={{
                                            backgroundColor: "#fff1f0",
                                            borderRadius: "10px",
                                            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                                        }}
                                    >
                                        {orderStats.totalOrders > 0 ? (
                                            <Pie {...orderDonutConfig} />
                                        ) : (
                                            <p>No order data available</p>
                                        )}
                                    </Card>
                                </Col>
                            </Row>
                        </div>
                    </Spin>
                </main>
            </div>
        </div>
    );
};

export default AnalyticsPage;