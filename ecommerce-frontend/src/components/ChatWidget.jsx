import React, { useState, useEffect, useRef } from 'react';
import axios from '../api/axios';
import { MessageCircle, X, Send, User } from 'lucide-react';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sessionId, setSessionId] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    // Generate or retrieve session ID
    let sId = localStorage.getItem('srey_tha_chat_session');
    if (!sId) {
      sId = 'sess_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('srey_tha_chat_session', sId);
    }
    setSessionId(sId);
  }, []);

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000); // Poll every 3s
      return () => clearInterval(interval);
    }
  }, [isOpen, sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`/chat/${sessionId}`);
      setMessages(res.data);
      // Mark as read when viewing
      await axios.put(`/chat/read/${sessionId}/customer`);
    } catch (err) {
      console.error('Chat error:', err);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage = {
      sessionId,
      sender: 'customer',
      message: inputText
    };

    try {
      await axios.post('/chat', newMessage);
      setInputText('');
      fetchMessages();
    } catch (err) {
      console.error('Send error:', err);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000 }}>
      {/* Chat Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '50%', 
            backgroundColor: '#000', 
            color: '#fff', 
            border: 'none', 
            cursor: 'pointer',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <MessageCircle size={28} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{ 
          width: '350px', 
          height: '500px', 
          backgroundColor: '#fff', 
          borderRadius: '24px', 
          boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.3s ease'
        }}>
          {/* Header */}
          <div style={{ padding: '20px', backgroundColor: '#000', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#2ecc71' }}></div>
              <span style={{ fontWeight: '700', fontSize: '0.9rem', letterSpacing: '1px' }}>SUPPORT LIVE</span>
            </div>
            <X size={20} onClick={() => setIsOpen(false)} style={{ cursor: 'pointer' }} />
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#f9f9f9', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: '50px', color: '#999' }}>
                <MessageCircle size={40} style={{ marginBottom: '15px', opacity: 0.2 }} />
                <p style={{ fontSize: '0.8rem' }}>Welcome to Srey Tha. <br/> How can our support team assist you today?</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} style={{ 
                  alignSelf: msg.sender === 'customer' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  padding: '12px 16px',
                  borderRadius: msg.sender === 'customer' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                  backgroundColor: msg.sender === 'customer' ? '#000' : '#fff',
                  color: msg.sender === 'customer' ? '#fff' : '#333',
                  fontSize: '0.85rem',
                  boxShadow: msg.sender === 'customer' ? 'none' : '0 2px 10px rgba(0,0,0,0.05)',
                  lineHeight: '1.5'
                }}>
                  {msg.message}
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Footer Input */}
          <form onSubmit={handleSend} style={{ padding: '15px', borderTop: '1px solid #eee', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="Write a message..." 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{ 
                flex: 1, 
                padding: '12px 15px', 
                borderRadius: '50px', 
                border: '1px solid #eee', 
                backgroundColor: '#f5f5f5',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
            <button 
              type="submit"
              style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                backgroundColor: '#000', 
                color: '#fff', 
                border: 'none', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ChatWidget;
