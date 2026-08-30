import { useState } from "react";
import Sidebar from "../components/Sidebar";

export default function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I'm ExamAce AI. How can I help you study today?",
    },
  ]);

  const sendMessage = () => {
    if (!message.trim()) return;

    setMessages([
      ...messages,
      { role: "user", text: message },
      {
        role: "assistant",
        text: "AI response will come here later.",
      },
    ]);

    setMessage("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-3xl font-bold">
            🤖 AI Chat
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`max-w-2xl p-4 rounded-xl ${
                msg.role === "user"
                  ? "bg-blue-600 ml-auto"
                  : "bg-slate-800"
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800 flex gap-3">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 bg-slate-800 p-3 rounded-xl outline-none"
          />

          <button
            onClick={sendMessage}
            className="bg-blue-600 hover:bg-blue-700 px-6 rounded-xl"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}