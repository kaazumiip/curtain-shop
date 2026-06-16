import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { MessageCircle, Send, User, ChevronRight, ChevronLeft, Clock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LiveChat = ({ onClose }) => {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const chatEndRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 350);
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000); // Poll for sessions
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeSession) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000); // Poll for messages
      return () => clearInterval(interval);
    }
  }, [activeSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/chat/admin/sessions');
      setSessions(res.data);
    } catch (err) {
      console.error('Session error:', err);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/chat/${activeSession}`);
      setMessages(res.data);
      // Mark as read
      await api.put(`/chat/read/${activeSession}/admin`);
    } catch (err) {
      console.error('Message error:', err);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeSession) return;

    const newMessage = {
      sessionId: activeSession,
      sender: 'admin',
      message: inputText
    };

    try {
      await api.post('/chat', newMessage);
      setInputText('');
      fetchMessages();
    } catch (err) {
      console.error('Send error:', err);
    }
  };

  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255,255,255,0.3)', 
      backdropFilter: 'blur(3px)', 
      WebkitBackdropFilter: 'blur(3px)', 
      zIndex: 2000,
      display: 'flex',
      justifyContent: 'flex-end', 
      padding: '20px',
      opacity: isClosing ? 0 : 1,
      transition: 'opacity 0.35s ease'
    }} onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div style={{ 
        width: '100%',
        maxWidth: '1200px',
        height: 'calc(100vh - 40px)', 
        display: 'flex', 
        gap: '2px', 
        backgroundColor: '#f0f0f0', 
        borderRadius: '24px', 
        overflow: 'hidden',
        boxShadow: '-30px 40px 100px rgba(0,0,0,0.1)',
        animation: isClosing ? 'slideOutRight 0.4s ease-in forwards' : 'slideInRight 0.4s ease-out'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Session List */}
        <div style={{ 
          width: isMobile ? '100%' : '350px', 
          backgroundColor: '#fff', 
          borderRight: '1px solid #eee', 
          display: (isMobile && activeSession) ? 'none' : 'flex', 
          flexDirection: 'column' 
        }}>
          <div style={{ padding: '30px', borderBottom: '1px solid #f9f9f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="serif" style={{ fontSize: '1.4rem' }}>Conversations</h2>
            <X 
              size={20} 
              onClick={handleClose} 
              style={{ cursor: 'pointer', color: '#999' }} 
            />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
          {sessions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999', fontSize: '0.9rem' }}>No active curations.</div>
          ) : (
            sessions.map(sess => (
              <div 
                key={sess._id} 
                onClick={() => setActiveSession(sess._id)}
                style={{ 
                  padding: '20px 30px', 
                  cursor: 'pointer', 
                  borderBottom: '1px solid #f9f9f9',
                  backgroundColor: activeSession === sess._id ? '#f9f9f9' : '#fff',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                      <User size={20} color="#999" />
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>Guest Curatee</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#ccc' }}>{new Date(sess.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingLeft: '50px' }}>
                  {sess.lastMessage}
                </p>
                {sess.unreadCount > 0 && (
                  <div style={{ position: 'absolute', right: '30px', bottom: '20px', backgroundColor: '#000', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '800' }}>
                    {sess.unreadCount}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ 
        flex: 1, 
        backgroundColor: '#fff', 
        display: (isMobile && !activeSession) ? 'none' : 'flex', 
        flexDirection: 'column' 
      }}>
        {activeSession ? (
          <>
            {/* Header */}
            <div style={{ padding: isMobile ? '20px' : '25px 40px', borderBottom: '1px solid #f9f9f9', display: 'flex', alignItems: 'center', gap: '15px' }}>
              {isMobile && (
                <button 
                  onClick={() => setActiveSession(null)}
                  style={{ background: 'none', border: 'none', padding: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <ChevronLeft size={24} color="#000" />
                </button>
              )}
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#2ecc71', flexShrink: 0 }}></div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '800' }}>Active Support Session</h3>
                <p style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>ID: {activeSession}</p>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, padding: isMobile ? '20px 15px' : '40px', overflowY: 'auto', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {messages.map((msg, idx) => (
                <div key={idx} style={{ 
                  alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start',
                  maxWidth: isMobile ? '85%' : '60%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.sender === 'admin' ? 'flex-end' : 'flex-start'
                }}>
                  <div style={{ 
                    padding: isMobile ? '12px 18px' : '16px 24px',
                    borderRadius: msg.sender === 'admin' ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
                    backgroundColor: msg.sender === 'admin' ? '#000' : '#fff',
                    color: msg.sender === 'admin' ? '#fff' : '#333',
                    fontSize: '0.9rem',
                    boxShadow: msg.sender === 'admin' ? 'none' : '0 4px 15px rgba(0,0,0,0.03)',
                    lineHeight: '1.6'
                  }}>
                    {msg.message}
                  </div>
                  <span style={{ fontSize: '0.65rem', color: '#ccc', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {msg.sender.toUpperCase()} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Footer */}
            <form onSubmit={handleSend} style={{ padding: isMobile ? '15px' : '30px 40px', borderTop: '1px solid #f9f9f9', display: 'flex', gap: isMobile ? '10px' : '20px' }}>
              <input 
                type="text" 
                placeholder="Type your response to customer..." 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{ 
                  flex: 1, 
                  padding: isMobile ? '12px 15px' : '18px 25px', 
                  borderRadius: '15px', 
                  border: '1px solid #eee', 
                  backgroundColor: '#f9f9f9',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
              <button 
                type="submit"
                style={{ 
                  padding: isMobile ? '0 15px' : '0 30px', 
                  borderRadius: '15px', 
                  backgroundColor: '#000', 
                  color: '#fff', 
                  border: 'none', 
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                {!isMobile && <span>SEND</span>}
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
            <MessageCircle size={80} style={{ opacity: 0.1, marginBottom: '20px' }} />
            <p className="serif" style={{ fontSize: '1.2rem' }}>Select a conversation to begin curation.</p>
          </div>
        )}
      </div>
    </div>
      
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(50px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(50px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default LiveChat;
