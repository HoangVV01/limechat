import React, { useState, useEffect, useRef } from "react";
import {
  Layout,
  Input,
  Button,
  List,
  Avatar,
  Typography,
  message as antMessage,
} from "antd";
import { SendOutlined, UserOutlined } from "@ant-design/icons";
import { supabase } from "../supabaseClient";

const { Content, Footer } = Layout;
const { Text } = Typography;

const Chat = ({ username }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();

    // Set up real-time listener
    const channel = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          console.log("Realtime event received:", payload);

          if (payload.eventType === "INSERT") {
            // Add the new message to the list
            setMessages((previous) => [...previous, payload.new]);
          }
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        antMessage.error("Error loading messages");
      } else {
        console.log("Messages fetched:", data);
        setMessages(data || []);
      }
    } catch (err) {
      console.error("Exception fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === "") return;

    const messageContent = newMessage.trim();
    const tempId = `temp-${Date.now()}`;

    try {
      console.log("Sending message:", messageContent);

      // Add optimistic update
      const optimisticMessage = {
        id: tempId,
        content: messageContent,
        username: username,
        created_at: new Date().toISOString(),
        isOptimistic: true,
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      setNewMessage("");

      // Insert the message into Supabase
      const { error } = await supabase.from("messages").insert({
        content: messageContent,
        username: username,
      });

      if (error) {
        console.error("Error sending message:", error);

        // Keep the optimistic message but mark it as failed
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...msg, sendFailed: true } : msg
          )
        );
      } else {
        console.log("Message sent successfully");
        // Remove the optimistic message
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      }
    } catch (err) {
      console.error("Exception sending message:", err);

      // Mark message as failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, sendFailed: true } : msg
        )
      );
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Layout style={{ height: "100vh" }}>
      <Content
        style={{
          padding: "24px",
          overflowY: "auto",
          background: "#fff",
        }}
      >
        <List
          loading={loading}
          dataSource={messages}
          renderItem={(msg) => (
            <List.Item
              style={{
                justifyContent:
                  msg.username === username ? "flex-end" : "flex-start",
                padding: "8px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection:
                    msg.username === username ? "row-reverse" : "row",
                  alignItems: "flex-start",
                  maxWidth: "70%",
                }}
              >
                <Avatar
                  icon={<UserOutlined />}
                  style={{
                    backgroundColor:
                      msg.username === username ? "#1890ff" : "#f56a00",
                    marginLeft: msg.username === username ? "12px" : "0",
                    marginRight: msg.username === username ? "0" : "12px",
                  }}
                />
                <div
                  style={{
                    background:
                      msg.username === username ? "#1890ff" : "#f0f2f5",
                    color:
                      msg.username === username
                        ? "white"
                        : "rgba(0, 0, 0, 0.85)",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    opacity: msg.isOptimistic ? 0.7 : 1,
                  }}
                >
                  <Text
                    strong
                    style={{
                      color:
                        msg.username === username
                          ? "white"
                          : "rgba(0, 0, 0, 0.85)",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    {msg.username}
                    {msg.isOptimistic && !msg.sendFailed && " (sending...)"}
                    {msg.sendFailed && " (failed to send)"}
                  </Text>
                  <Text
                    style={{
                      color:
                        msg.username === username
                          ? "white"
                          : "rgba(0, 0, 0, 0.85)",
                      wordBreak: "break-word",
                    }}
                  >
                    {msg.content}
                  </Text>
                </div>
              </div>
            </List.Item>
          )}
        />
        <div ref={messagesEndRef} />
      </Content>
      <Footer style={{ padding: "12px 24px", background: "#f0f2f5" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onPressEnter={handleSendMessage}
            placeholder="Type a message..."
            size="large"
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            size="large"
            onClick={handleSendMessage}
          >
            Send
          </Button>
        </div>
      </Footer>
    </Layout>
  );
};

export default Chat;
