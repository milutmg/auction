import React, { useState, useEffect, useRef } from 'react';
import { Send, Gavel, Users, Clock, DollarSign } from 'lucide-react';

interface Message {
  id: string;
  user: string;
  content: string;
  timestamp: Date;
  type: 'chat' | 'bid' | 'system';
  amount?: number;
}

interface Bid {
  id: string;
  user: string;
  amount: number;
  timestamp: Date;
}

interface User {
  id: string;
  name: string;
  isOnline: boolean;
}

// Mock Socket.IO implementation for demo
class MockSocket {
  private listeners: { [event: string]: Function[] } = {};
  private static instance: MockSocket;

  static getInstance() {
    if (!MockSocket.instance) {
      MockSocket.instance = new MockSocket();
    }
    return MockSocket.instance;
  }

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event: string, data: any) {
    // Simulate server response with delay
    setTimeout(() => {
      if (event === 'send_message') {
        this.trigger('new_message', {
          id: Date.now().toString(),
          user: data.user,
          content: data.content,
          timestamp: new Date(),
          type: 'chat'
        });
      } else if (event === 'place_bid') {
        this.trigger('new_bid', {
          id: Date.now().toString(),
          user: data.user,
          amount: data.amount,
          timestamp: new Date()
        });
        this.trigger('new_message', {
          id: (Date.now() + 1).toString(),
          user: 'System',
          content: `${data.user} placed a bid of $${data.amount.toLocaleString()}`,
          timestamp: new Date(),
          type: 'bid',
          amount: data.amount
        });
      }
    }, 100);
  }

  private trigger(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}

const BiddingChatSystem: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      user: 'System',
      content: 'Auction started! Current item: Vintage Watch Collection',
      timestamp: new Date(Date.now() - 300000),
      type: 'system'
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [currentUser] = useState('User_' + Math.floor(Math.random() * 1000));
  const [users] = useState<User[]>([
    { id: '1', name: 'Alice_Collector', isOnline: true },
    { id: '2', name: 'Bob_Antiques', isOnline: true },
    { id: '3', name: 'Charlie_Vintage', isOnline: false },
    { id: '4', name: currentUser, isOnline: true }
  ]);
  const [currentBid, setCurrentBid] = useState<Bid>({
    id: '1',
    user: 'Alice_Collector',
    amount: 5000,
    timestamp: new Date(Date.now() - 120000)
  });
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socket = useRef<MockSocket>(MockSocket.getInstance());

  useEffect(() => {
    // Socket event listeners
    socket.current.on('new_message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.current.on('new_bid', (bid: Bid) => {
      setCurrentBid(bid);
    });

    // Timer countdown
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setMessages(prevMessages => [...prevMessages, {
            id: Date.now().toString(),
            user: 'System',
            content: 'Auction ended!',
            timestamp: new Date(),
            type: 'system'
          }]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (currentMessage.trim() && timeLeft > 0) {
      socket.current.emit('send_message', {
        user: currentUser,
        content: currentMessage.trim()
      });
      setCurrentMessage('');
    }
  };

  const placeBid = () => {
    if (bidAmount > currentBid.amount && timeLeft > 0) {
      socket.current.emit('place_bid', {
        user: currentUser,
        amount: bidAmount
      });
      setBidAmount(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMessageStyle = (type: string) => {
    switch (type) {
      case 'bid':
        return 'bg-green-100 border-l-4 border-green-500 text-green-800';
      case 'system':
        return 'bg-blue-100 border-l-4 border-blue-500 text-blue-800';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-96">
        {/* Auction Info */}
        <div className="lg:col-span-1 bg-gradient-to-b from-purple-50 to-white p-4 rounded-lg border">
          <h3 className="font-bold text-lg mb-4 text-purple-800">Auction Status</h3>
          
          <div className="space-y-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <Clock size={16} />
                <span className="font-semibold">Time Left</span>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {formatTime(timeLeft)}
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <DollarSign size={16} />
                <span className="font-semibold">Current Bid</span>
              </div>
              <div className="text-xl font-bold text-green-600">
                ${currentBid.amount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                by {currentBid.user}
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Users size={16} />
                <span className="font-semibold">Bidders Online</span>
              </div>
              <div className="space-y-1">
                {users.filter(u => u.isOnline).map(user => (
                  <div key={user.id} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">{user.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="lg:col-span-2 bg-gray-50 rounded-lg border flex flex-col">
          <div className="bg-purple-600 text-white p-4 rounded-t-lg">
            <h3 className="font-bold text-lg">Live Chat & Bidding</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg ${getMessageStyle(message.type)}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-sm">{message.user}</span>
                  <span className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm">{message.content}</div>
                {message.amount && (
                  <div className="mt-2 font-bold text-green-600">
                    ${message.amount.toLocaleString()}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={timeLeft === 0}
              />
              <button
                onClick={sendMessage}
                disabled={!currentMessage.trim() || timeLeft === 0}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Bidding Panel */}
        <div className="lg:col-span-1 bg-gradient-to-b from-green-50 to-white p-4 rounded-lg border">
          <h3 className="font-bold text-lg mb-4 text-green-800 flex items-center gap-2">
            <Gavel size={20} />
            Place Bid
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Bid Amount ($)</label>
              <input
                type="number"
                value={bidAmount || ''}
                onChange={(e) => setBidAmount(Number(e.target.value))}
                min={currentBid.amount + 1}
                placeholder={`Min: $${(currentBid.amount + 1).toLocaleString()}`}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={timeLeft === 0}
              />
            </div>
            
            <button
              onClick={placeBid}
              disabled={bidAmount <= currentBid.amount || timeLeft === 0}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {timeLeft === 0 ? 'Auction Ended' : 'Place Bid'}
            </button>

            <div className="text-xs text-gray-600 bg-white p-2 rounded">
              <strong>Quick Bids:</strong>
              <div className="flex flex-wrap gap-1 mt-1">
                {[1000, 2500, 5000].map(amount => {
                  const quickBid = currentBid.amount + amount;
                  return (
                    <button
                      key={amount}
                      onClick={() => setBidAmount(quickBid)}
                      disabled={timeLeft === 0}
                      className="px-2 py-1 bg-green-100 hover:bg-green-200 rounded text-xs disabled:bg-gray-100"
                    >
                      +${amount.toLocaleString()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-500">
        Connected as: <strong>{currentUser}</strong> | 
        Status: <span className={timeLeft > 0 ? 'text-green-600' : 'text-red-600'}>
          {timeLeft > 0 ? 'Active Auction' : 'Auction Ended'}
        </span>
      </div>
    </div>
  );
};

export default BiddingChatSystem;