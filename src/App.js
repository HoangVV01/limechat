import React, { useState } from "react";
import { Layout, Typography } from "antd";
import UsernameEntry from "./components/UsernameEntry";
import Chat from "./components/Chat";
import "antd/dist/reset.css";

const { Header } = Layout;
const { Title } = Typography;

function App() {
  const [username, setUsername] = useState("");

  if (!username) {
    return <UsernameEntry setUsername={setUsername} />;
  }

  return (
    <Layout style={{ height: "100vh" }}>
      <Header
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#fff",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Title level={3} style={{ margin: 0, color: "#1890ff" }}>
          Real-time Chat ({username})
        </Title>
      </Header>
      <Chat username={username} />
    </Layout>
  );
}

export default App;
