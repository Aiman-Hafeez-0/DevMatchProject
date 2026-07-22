import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { FaSmile, FaPaperclip, FaPaperPlane, FaUsers, FaTimes, FaArrowLeft } from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";

const SOCKET_URL = `${API_URL}`;

// consistent colour per user id so every user always has the same colour
const AVATAR_COLORS = ["#2952A3","#4B6FCE","#0EA5E9","#10B981","#F59E0B","#EF4444","#EC4899","#14B8A6"];
const avatarColor = (id) => AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];
const avatarLetter = (name) => (name || "?").charAt(0).toUpperCase();

// format timestamp smartly
const formatTime = (ts) => {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};
const formatDateDivider = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
};

export default function ChatRoom({ projectId, projectTitle: propTitle }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [roomId, setRoomId]         = useState(null);
  const [ownerId, setOwnerId]       = useState(null);
  const [members, setMembers]       = useState([]);
  const [projectTitle, setProjectTitle] = useState(propTitle || "");
  const [messages, setMessages]     = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmoji, setShowEmoji]   = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const socketRef      = useRef(null);
  const fileInputRef   = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  // Step 1: resolve room + members
  useEffect(() => {
    fetch(`${SOCKET_URL}/chat/room/${projectId}`, { credentials: "include" })
      .then((res) => {
        if (res.status === 403) throw new Error("access_denied");
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data) => {
        setRoomId(data.room_id);
        setOwnerId(data.owner_id);
        setMembers(data.members || []);
        if (!propTitle && data.project_title) setProjectTitle(data.project_title);
      })
      .catch((err) => {
        setError(err.message === "access_denied"
          ? "You are not a member of this project chat."
          : "Could not load chat room.");
        setLoading(false);
      });
  }, [projectId]);

  // Step 2: load history + socket
  useEffect(() => {
    if (!roomId) return;

    fetch(`${SOCKET_URL}/chat/messages/${roomId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { setMessages(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));

    const socket = io(SOCKET_URL, { withCredentials: true });
    socket.emit("join_room", { room_id: roomId });
    socket.on("new_message", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("error", (err) => toast.error(err.message));
    socketRef.current = socket;
    return () => socket.disconnect();
  }, [roomId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const [uploading, setUploading] = useState(false);

  const sendMessage = () => {
    const text = newMessage.trim();
    if (!text || !socketRef.current || !roomId) return;
    socketRef.current.emit("send_message", { room_id: roomId, message: text });
    setNewMessage("");
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !roomId) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large — max 10 MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);

    try {
      const res = await fetch(`${SOCKET_URL}/chat/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Upload failed"); return; }

      socketRef.current.emit("send_message", {
        room_id:       roomId,
        message:       "",
        file_url:      data.file_url,
        original_name: data.original_name,
      });
      toast.success("File sent!");
    } catch {
      toast.error("Upload failed — please try again");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from this project?`)) return;
    try {
      const res = await fetch(`${SOCKET_URL}/projects/${projectId}/members/${memberId}`, {
        method: "DELETE", credentials: "include",
      });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        toast.success(`${memberName} removed`);
      } else {
        const d = await res.json();
        toast.error(d.error || "Could not remove member");
      }
    } catch { toast.error("Server error"); }
  };

  // group consecutive messages from the same sender
  const groupedMessages = messages.reduce((acc, msg, i) => {
    const prev = messages[i - 1];
    const sameDay = prev && new Date(msg.sent_at).toDateString() === new Date(prev.sent_at).toDateString();
    const sameSender = prev && prev.sender_id === msg.sender_id;
    const within2min = prev && (new Date(msg.sent_at) - new Date(prev.sent_at)) < 2 * 60 * 1000;
    acc.push({ ...msg, showDate: !sameDay, showAvatar: !sameSender || !within2min });
    return acc;
  }, []);

  if (error) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
      <div className="text-center">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate("/chats")}>
          ← Back to Chats
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 60px)", background: "#EEF2FB" }}>

      {/* ── Header ── */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #D0DAEE",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 1px 4px rgba(41,82,163,0.08)",
        flexShrink: 0,
      }}>
        <button
          onClick={() => navigate("/chats")}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#2952A3", padding: 4 }}
        >
          <FaArrowLeft />
        </button>

        {/* Room avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: avatarColor(projectId), color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: "bold", fontSize: "1rem", flexShrink: 0,
        }}>
          {avatarLetter(projectTitle)}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1E2B4A" }}>
            {projectTitle || "Project Chat"}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#999" }}>
            {members.length} member{members.length !== 1 ? "s" : ""}
          </div>
        </div>

        <button
          onClick={() => setShowMembers((v) => !v)}
          style={{
            background: showMembers ? "#2952A3" : "transparent",
            border: "1px solid #2952A3",
            borderRadius: 8,
            color: showMembers ? "#fff" : "#2952A3",
            padding: "5px 10px",
            cursor: "pointer",
            fontSize: "0.8rem",
            display: "flex", alignItems: "center", gap: 5,
            transition: "all 0.2s",
          }}
        >
          <FaUsers /> Members
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}>
          {loading && (
            <div className="text-center mt-4">
              <div className="spinner-border spinner-border-sm" style={{ color: "#2952A3" }} />
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div className="text-center mt-5" style={{ color: "#bbb" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>👋</div>
              <div>No messages yet — say hello!</div>
            </div>
          )}

          {groupedMessages.map((msg, i) => {
            const isMine = msg.sender_id === user?.id;

            return (
              <React.Fragment key={i}>
                {/* Date divider */}
                {msg.showDate && (
                  <div style={{ textAlign: "center", margin: "16px 0 8px", position: "relative" }}>
                    <span style={{
                      background: "#fff",
                      border: "1px solid #D0DAEE",
                      borderRadius: 20,
                      padding: "3px 14px",
                      fontSize: "0.72rem",
                      color: "#8A9BBC",
                    }}>
                      {formatDateDivider(msg.sent_at)}
                    </span>
                  </div>
                )}

                {/* Message row */}
                <div style={{
                  display: "flex",
                  flexDirection: isMine ? "row-reverse" : "row",
                  alignItems: "flex-end",
                  gap: 8,
                  marginTop: msg.showAvatar ? 10 : 2,
                }}>
                  {/* Avatar (other user only) */}
                  {!isMine && (
                    <div style={{ width: 32, flexShrink: 0 }}>
                      {msg.showAvatar && (
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: avatarColor(msg.sender_id),
                          color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.8rem", fontWeight: "bold",
                        }}>
                          {avatarLetter(msg.sender_name)}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ maxWidth: "65%", display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}>
                    {/* Sender name — only show for others, only on first in group */}
                    {!isMine && msg.showAvatar && (
                      <div style={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: avatarColor(msg.sender_id),
                        marginBottom: 3,
                        marginLeft: 2,
                      }}>
                        {msg.sender_name}
                      </div>
                    )}

                    {/* Bubble */}
                    <div style={{
                      background: isMine ? "#2952A3" : "#fff",
                      color: isMine ? "#fff" : "#1E2B4A",
                      borderRadius: isMine
                        ? "18px 18px 4px 18px"
                        : "18px 18px 18px 4px",
                      padding: msg.file_url && !msg.message ? "6px" : "9px 14px",
                      fontSize: "0.88rem",
                      lineHeight: 1.5,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                      wordBreak: "break-word",
                      overflow: "hidden",
                    }}>
                      {/* Image preview */}
                      {msg.file_url && /\.(png|jpe?g|gif|webp)$/i.test(msg.file_url) && (
                        <a href={msg.file_url} target="_blank" rel="noreferrer">
                          <img
                            src={msg.file_url}
                            alt="shared"
                            style={{
                              maxWidth: 240,
                              maxHeight: 200,
                              borderRadius: 12,
                              display: "block",
                              cursor: "pointer",
                            }}
                          />
                        </a>
                      )}

                      {/* Non-image file download card */}
                      {msg.file_url && !/\.(png|jpe?g|gif|webp)$/i.test(msg.file_url) && (
                        <a
                          href={msg.file_url}
                          target="_blank"
                          rel="noreferrer"
                          download
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "8px 12px",
                            background: isMine ? "rgba(255,255,255,0.15)" : "#f8f0f3",
                            borderRadius: 10,
                            textDecoration: "none",
                            color: isMine ? "#fff" : "#1E2B4A",
                            minWidth: 180,
                          }}
                        >
                          <span style={{ fontSize: "1.6rem" }}>
                            {/\.pdf$/i.test(msg.file_url) ? "📄"
                              : /\.docx?$/i.test(msg.file_url) ? "📝"
                              : /\.zip$/i.test(msg.file_url) ? "📦"
                              : /\.mp4$/i.test(msg.file_url) ? "🎬"
                              : /\.mp3$/i.test(msg.file_url) ? "🎵"
                              : "📎"}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: "0.8rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
                              {msg.original_name || msg.file_url.split("/").pop()}
                            </div>
                            <div style={{ fontSize: "0.68rem", opacity: 0.7 }}>
                              Click to download
                            </div>
                          </div>
                        </a>
                      )}

                      {/* Text message (may accompany a file) */}
                      {msg.message && (
                        <div style={{ marginTop: msg.file_url ? 6 : 0 }}>
                          {msg.message}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div style={{
                      fontSize: "0.68rem",
                      color: "#bbb",
                      marginTop: 3,
                      marginLeft: isMine ? 0 : 4,
                      marginRight: isMine ? 4 : 0,
                    }}>
                      {formatTime(msg.sent_at)}
                    </div>
                  </div>

                  {/* My avatar placeholder for spacing */}
                  {isMine && <div style={{ width: 32, flexShrink: 0 }} />}
                </div>
              </React.Fragment>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Members Sidebar ── */}
        {showMembers && (
          <div style={{
            width: 220,
            background: "#fff",
            borderLeft: "1px solid #D0DAEE",
            padding: "16px 12px",
            overflowY: "auto",
            flexShrink: 0,
          }}>
            <p style={{ fontWeight: 700, fontSize: "0.8rem", color: "#A0B3DF", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Members · {members.length}
            </p>
            {members.map((m, i) => (
              <div key={m.id} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
                padding: "6px 8px",
                borderRadius: 8,
                background: m.id === user?.id ? "#EEF2FB" : "transparent",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: avatarColor(m.id), color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.8rem", fontWeight: "bold", flexShrink: 0,
                  }}>
                    {avatarLetter(m.user_name)}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1E2B4A" }}>
                      {m.user_name}
                      {m.id === user?.id && (
                        <span style={{ fontSize: "0.65rem", color: "#8A9BBC", marginLeft: 4 }}>(you)</span>
                      )}
                    </div>
                    {m.id === ownerId && (
                      <div style={{ fontSize: "0.65rem", color: "#2952A3" }}>Owner</div>
                    )}
                  </div>
                </div>
                {/* Remove button — only visible to project owner */}
                {user?.id === ownerId && m.id !== user?.id && (
                  <button
                    onClick={() => handleRemoveMember(m.id, m.user_name)}
                    title={`Remove ${m.user_name}`}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "#ddd", padding: 2, borderRadius: 4,
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#e74c3c")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#ddd")}
                  >
                    <FaTimes size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Input Footer ── */}
      <div style={{
        background: "#fff",
        borderTop: "1px solid #D0DAEE",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexShrink: 0,
        position: "relative",
      }}>
        {showEmoji && (
          <div style={{ position: "absolute", bottom: 68, left: 16, zIndex: 100 }}>
            <EmojiPicker
              onEmojiClick={(e) => { setNewMessage((p) => p + e.emoji); inputRef.current?.focus(); }}
              height={350}
            />
          </div>
        )}

        <button
          onClick={() => setShowEmoji((v) => !v)}
          style={{
            background: showEmoji ? "#EEF2FB" : "none",
            border: "none", cursor: "pointer",
            color: showEmoji ? "#2952A3" : "#bbb",
            padding: 6, borderRadius: 8,
            fontSize: "1.1rem",
            transition: "all 0.15s",
          }}
          title="Emoji"
        >
          <FaSmile />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Type a message..."
          style={{
            flex: 1,
            border: "1.5px solid #D0DAEE",
            borderRadius: 24,
            padding: "9px 16px",
            fontSize: "0.88rem",
            outline: "none",
            background: "#F2F5FC",
            transition: "border 0.2s",
          }}
          onFocus={(e) => { e.target.style.borderColor = "#2952A3"; setShowEmoji(false); }}
          onBlur={(e) => { e.target.style.borderColor = "#D0DAEE"; }}
        />

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="image/*,.pdf,.doc,.docx,.txt,.csv,.zip,.mp4,.mp3"
          onChange={handleFileUpload}
        />
        <button
          onClick={() => fileInputRef.current.click()}
          disabled={uploading}
          style={{
            background: "none", border: "none",
            cursor: uploading ? "not-allowed" : "pointer",
            color: uploading ? "#2952A3" : "#bbb",
            padding: 6, fontSize: "1rem"
          }}
          title="Attach file"
        >
          {uploading ? <span className="spinner-border spinner-border-sm" /> : <FaPaperclip />}
        </button>

        <button
          onClick={sendMessage}
          disabled={!newMessage.trim()}
          style={{
            background: newMessage.trim() ? "#2952A3" : "#D0DAEE",
            border: "none",
            borderRadius: "50%",
            width: 38, height: 38,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: newMessage.trim() ? "pointer" : "default",
            color: newMessage.trim() ? "#fff" : "#ccc",
            transition: "all 0.2s",
            flexShrink: 0,
          }}
          title="Send"
        >
          <FaPaperPlane size={14} />
        </button>
      </div>
    </div>
  );
}
