import React, { useState } from "react";
import { Card, Input, Button, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";

const { Title } = Typography;

const UsernameEntry = ({ setUsername }) => {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = () => {
    if (inputValue.trim()) {
      setUsername(inputValue.trim());
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#f0f2f5",
      }}
    >
      <Card style={{ width: 400, padding: "20px" }}>
        <Title level={3} style={{ textAlign: "center" }}>
          Enter Chat
        </Title>
        <Input
          size="large"
          placeholder="Enter your username"
          prefix={<UserOutlined />}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPressEnter={handleSubmit}
          style={{ marginBottom: "20px" }}
        />
        <Button
          type="primary"
          block
          size="large"
          onClick={handleSubmit}
          disabled={!inputValue.trim()}
        >
          Join Chat
        </Button>
      </Card>
    </div>
  );
};

export default UsernameEntry;
