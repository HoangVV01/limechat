import React, { useState } from "react";
import { Card, Form, Input, Button, Typography, Tabs, message } from "antd";
import { UserOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import { supabase } from "../supabaseClient";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const Auth = ({ setUser }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleLogin = async (values) => {
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      message.error(error.message);
      setLoading(false);
    } else {
      setUser(data.user);
    }
  };

  const handleSignup = async (values) => {
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    });

    if (error) {
      message.error(error.message);
    } else if (data.user) {
      message.success("Check your email for the confirmation link!");
      form.resetFields();
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#f0f2f5",
      }}
    >
      <Card
        style={{
          width: 400,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          borderRadius: "8px",
        }}
      >
        <Title level={2} style={{ textAlign: "center", marginBottom: 32 }}>
          Supabase Chat
        </Title>

        <Tabs defaultActiveKey="login">
          <TabPane tab="Login" key="login">
            <Form
              form={form}
              name="login"
              onFinish={handleLogin}
              layout="vertical"
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: "Please input your email!" },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="Email"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: "Please input your password!" },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Password"
                  size="large"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                >
                  Log in
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab="Sign Up" key="signup">
            <Form
              form={form}
              name="signup"
              onFinish={handleSignup}
              layout="vertical"
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: "Please input your email!" },
                  { type: "email", message: "Please enter a valid email!" },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="Email"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: "Please input your password!" },
                  {
                    min: 6,
                    message: "Password must be at least 6 characters!",
                  },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Password"
                  size="large"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                >
                  Sign up
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
