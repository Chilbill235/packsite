"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { MessageSquare, Send, SearchX, User as UserIcon } from "lucide-react";

type Message = {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
};

type UserPartner = {
  id: string;
  username: string;
  image?: string | null;
};

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const recipientId = searchParams.get("userId") || searchParams.get("username");

  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<UserPartner | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!recipientId || recipientId === "undefined" || recipientId.trim() === "") {
      setLoading(false);
      setMessages([]);
      return;
    }

    let isMounted = true;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
          recipientId
        );
        const queryParam = isUUID ? `userId=${recipientId}` : `username=${recipientId}`;

        const res = await fetch(`/api/messages?${queryParam}`);
        
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setMessages(Array.isArray(data) ? data : data.messages || []);
            setPartner(data.otherUser || null);
          }
        } else {
          if (isMounted) setMessages([]);
        }
      } catch (err) {
        console.error("FAILED_TO_FETCH_MESSAGES", err);
        if (isMounted) setMessages([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [recipientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending || !recipientId || recipientId === "undefined") return;

    const messageContent = inputText;
    setInputText("");
    setSending(true);

    try {
      const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        recipientId
      );

      const payload = isUUID
        ? { recipientId, content: messageContent }
        : { recipientIdentifier: recipientId, content: messageContent };

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const newMsg = data.message || data;
        setMessages((prev) => [...prev, newMsg]);
      }
    } catch (err) {
      console.error("SEND_MESSAGE_ERROR", err);
    } finally {
      setSending(false);
    }
  };

  if (!recipientId || recipientId === "undefined") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900/80 border border-white/10 rounded-3xl p-8 backdrop-blur-xl text-center space-y-4 shadow-2xl">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-amber-400 border border-white/5">
            <SearchX className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">No Conversation Selected</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Please choose a user profile from the directory or click message on a profile to start chatting.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 font-sans">
      <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 backdrop-blur-xl flex flex-col h-[75vh] shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 border border-white/5 overflow-hidden">
            {partner?.image ? (
              <img src={partner.image} alt={partner.username} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{partner?.username || "Chat Session"}</h3>
            <span className="text-[10px] font-mono text-slate-400">Target: {recipientId}</span>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {loading ? (
            <div className="flex h-full items-center justify-center text-xs font-mono text-slate-400">
              Loading conversation...
            </div>
          ) : messages.length > 0 ? (
            messages.map((msg) => {
              const isMe = msg.senderId !== recipientId;
              return (
                <div
                  key={msg.id || Math.random()}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`p-3 rounded-2xl max-w-[75%] text-xs leading-relaxed ${
                      isMe
                        ? "bg-amber-500 text-slate-950 font-medium rounded-br-none"
                        : "bg-slate-800 text-slate-200 rounded-bl-none border border-white/5"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <span className="text-[9px] font-mono opacity-60 mt-1 block">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex h-full items-center justify-center text-xs font-mono text-slate-500">
              No messages yet. Send a greeting below!
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="pt-4 border-t border-white/5 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
          <button
            type="submit"
            disabled={sending || !inputText.trim()}
            className="inline-flex items-center justify-center px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl text-xs font-bold transition-all disabled:opacity-50 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}