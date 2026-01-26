"use client";
import React, { useState, useRef, useEffect } from "react";

interface Contact {
  id: string;
  name: string;
  avatar?: string;
  status: "online" | "offline" | "away";
  lastSeen?: string;
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  status: "sent" | "delivered" | "read";
  type: "text" | "image" | "file";
  fileName?: string;
  fileUrl?: string;
}

const mockContacts: Contact[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    status: "online",
    unreadCount: 2,
    lastMessage: "I've completed the initial mockups and ready for review.",
    lastMessageTime: "10:30 AM",
  },
  {
    id: "2",
    name: "Michael Chen",
    status: "online",
    unreadCount: 0,
    lastMessage: "Thanks for the feedback!",
    lastMessageTime: "9:45 AM",
  },
  {
    id: "3",
    name: "Emily Davis",
    status: "away",
    lastSeen: "2 hours ago",
    unreadCount: 0,
    lastMessage: "See you at the meeting tomorrow",
    lastMessageTime: "Yesterday",
  },
  {
    id: "4",
    name: "James Wilson",
    status: "offline",
    lastSeen: "5 hours ago",
    unreadCount: 1,
    lastMessage: "I've uploaded all the marketing assets",
    lastMessageTime: "Yesterday",
  },
  {
    id: "5",
    name: "Lisa Thompson",
    status: "online",
    unreadCount: 0,
    lastMessage: "Great news! The client approved the designs",
    lastMessageTime: "Jan 23",
  },
  {
    id: "6",
    name: "David Brown",
    status: "offline",
    lastSeen: "1 day ago",
    unreadCount: 0,
    lastMessage: "Let me know when you're free to discuss",
    lastMessageTime: "Jan 22",
  },
  {
    id: "7",
    name: "Amanda White",
    status: "online",
    unreadCount: 3,
    lastMessage: "The presentation is ready for tomorrow",
    lastMessageTime: "11:15 AM",
  },
  {
    id: "8",
    name: "Robert Taylor",
    status: "away",
    lastSeen: "30 mins ago",
    unreadCount: 0,
    lastMessage: "I'll send the report by EOD",
    lastMessageTime: "Yesterday",
  },
  {
    id: "9",
    name: "Jennifer Martinez",
    status: "online",
    unreadCount: 0,
    lastMessage: "Can we reschedule the call?",
    lastMessageTime: "Jan 24",
  },
  {
    id: "10",
    name: "Christopher Lee",
    status: "offline",
    lastSeen: "3 hours ago",
    unreadCount: 0,
    lastMessage: "The contract has been signed",
    lastMessageTime: "Jan 24",
  },
  {
    id: "11",
    name: "Michelle Garcia",
    status: "online",
    unreadCount: 1,
    lastMessage: "Budget approved for Q2",
    lastMessageTime: "Jan 23",
  },
  {
    id: "12",
    name: "Daniel Anderson",
    status: "away",
    lastSeen: "1 hour ago",
    unreadCount: 0,
    lastMessage: "New team member starting Monday",
    lastMessageTime: "Jan 23",
  },
  {
    id: "13",
    name: "Jessica Thomas",
    status: "offline",
    lastSeen: "2 days ago",
    unreadCount: 0,
    lastMessage: "Thanks for your help!",
    lastMessageTime: "Jan 22",
  },
  {
    id: "14",
    name: "Kevin Jackson",
    status: "online",
    unreadCount: 0,
    lastMessage: "Meeting notes attached",
    lastMessageTime: "Jan 22",
  },
  {
    id: "15",
    name: "Rachel Moore",
    status: "offline",
    lastSeen: "4 hours ago",
    unreadCount: 2,
    lastMessage: "Please review the updated proposal",
    lastMessageTime: "Jan 21",
  },
  {
    id: "16",
    name: "Brian Harris",
    status: "online",
    unreadCount: 0,
    lastMessage: "All systems are operational",
    lastMessageTime: "Jan 21",
  },
];

const mockChats: Record<string, ChatMessage[]> = {
  "1": [
    { id: "1", senderId: "1", content: "Hey! Good morning. How are you doing today?", timestamp: "9:00 AM", status: "read", type: "text" },
    { id: "2", senderId: "me", content: "Morning Sarah! I'm doing great, thanks for asking. How about you?", timestamp: "9:02 AM", status: "read", type: "text" },
    { id: "3", senderId: "1", content: "I'm good! Just finished my coffee and ready to tackle the day.", timestamp: "9:05 AM", status: "read", type: "text" },
    { id: "4", senderId: "me", content: "Nice! So about the website redesign project...", timestamp: "9:08 AM", status: "read", type: "text" },
    { id: "5", senderId: "1", content: "Yes! I was just about to bring that up. We need to finalize the homepage layout.", timestamp: "9:10 AM", status: "read", type: "text" },
    { id: "6", senderId: "me", content: "Agreed. I've been working on a few variations. Want me to share them?", timestamp: "9:12 AM", status: "read", type: "text" },
    { id: "7", senderId: "1", content: "That would be perfect! Send them over when you're ready.", timestamp: "9:15 AM", status: "read", type: "text" },
    { id: "8", senderId: "me", content: "Will do. Also, did you get a chance to review the color palette I sent yesterday?", timestamp: "9:18 AM", status: "read", type: "text" },
    { id: "9", senderId: "1", content: "Yes! I love the direction. The blue tones really match the brand identity.", timestamp: "9:20 AM", status: "read", type: "text" },
    { id: "10", senderId: "me", content: "Great to hear! I was a bit worried it might be too bold.", timestamp: "9:22 AM", status: "read", type: "text" },
    { id: "11", senderId: "1", content: "Not at all. The client will definitely appreciate it.", timestamp: "9:25 AM", status: "read", type: "text" },
    { id: "12", senderId: "me", content: "Speaking of the client, when is our next meeting with them?", timestamp: "9:28 AM", status: "read", type: "text" },
    { id: "13", senderId: "1", content: "It's scheduled for Thursday at 2 PM. I'll send you a calendar invite.", timestamp: "9:30 AM", status: "read", type: "text" },
    { id: "14", senderId: "me", content: "Perfect, I'll block that time off. Should we prepare a presentation?", timestamp: "9:32 AM", status: "read", type: "text" },
    { id: "15", senderId: "1", content: "Yes, definitely. Let's showcase the progress we've made so far.", timestamp: "9:35 AM", status: "read", type: "text" },
    { id: "16", senderId: "me", content: "I can put together the slides. Want to split the talking points?", timestamp: "9:38 AM", status: "read", type: "text" },
    { id: "17", senderId: "1", content: "Sounds like a plan. I'll handle the technical specs, you cover the design rationale?", timestamp: "9:40 AM", status: "read", type: "text" },
    { id: "18", senderId: "me", content: "Deal! Let's sync up tomorrow to review everything.", timestamp: "9:42 AM", status: "read", type: "text" },
    { id: "19", senderId: "1", content: "Works for me. Oh, one more thing - can you also prepare some mockups for mobile?", timestamp: "9:45 AM", status: "read", type: "text" },
    { id: "20", senderId: "me", content: "Already on it! I should have those ready by end of day.", timestamp: "9:48 AM", status: "read", type: "text" },
    { id: "21", senderId: "1", content: "You're the best! The team is lucky to have you.", timestamp: "9:50 AM", status: "read", type: "text" },
    { id: "22", senderId: "me", content: "Thanks Sarah, that means a lot. We make a great team!", timestamp: "9:52 AM", status: "read", type: "text" },
    { id: "23", senderId: "1", content: "We really do. Alright, I'll let you get back to work. Talk soon!", timestamp: "10:00 AM", status: "read", type: "text" },
    { id: "24", senderId: "me", content: "Sounds good! Let me know if you need anything else.", timestamp: "10:05 AM", status: "read", type: "text" },
    { id: "25", senderId: "1", content: "I've completed the initial mockups and ready for review. Let me know your thoughts when you get a chance!", timestamp: "10:30 AM", status: "delivered", type: "text" },
  ],
  "2": [
    { id: "1", senderId: "2", content: "Hey, I pushed the API documentation updates", timestamp: "9:30 AM", status: "read", type: "text" },
    { id: "2", senderId: "me", content: "Great work! I'll review them shortly.", timestamp: "9:35 AM", status: "read", type: "text" },
    { id: "3", senderId: "2", content: "Thanks for the feedback!", timestamp: "9:45 AM", status: "read", type: "text" },
  ],
  "3": [
    { id: "1", senderId: "3", content: "Don't forget about our meeting tomorrow at 2 PM", timestamp: "4:00 PM", status: "read", type: "text" },
    { id: "2", senderId: "me", content: "Got it! I'll be there.", timestamp: "4:15 PM", status: "read", type: "text" },
    { id: "3", senderId: "3", content: "See you at the meeting tomorrow", timestamp: "4:30 PM", status: "read", type: "text" },
  ],
  "4": [
    { id: "1", senderId: "4", content: "I've uploaded all the marketing assets to the shared folder", timestamp: "2:15 PM", status: "delivered", type: "text" },
  ],
  "5": [
    { id: "1", senderId: "5", content: "Great news! The client approved the designs", timestamp: "11:00 AM", status: "read", type: "text" },
    { id: "2", senderId: "me", content: "That's fantastic! Great job on the presentation.", timestamp: "11:15 AM", status: "read", type: "text" },
  ],
  "7": [
    { id: "1", senderId: "7", content: "Hi! Just wanted to update you on the presentation.", timestamp: "10:00 AM", status: "read", type: "text" },
    { id: "2", senderId: "7", content: "I've added the new slides you requested.", timestamp: "10:30 AM", status: "read", type: "text" },
    { id: "3", senderId: "7", content: "The presentation is ready for tomorrow", timestamp: "11:15 AM", status: "delivered", type: "text" },
  ],
  "11": [
    { id: "1", senderId: "11", content: "Budget approved for Q2", timestamp: "3:00 PM", status: "delivered", type: "text" },
  ],
  "15": [
    { id: "1", senderId: "15", content: "Hi, I've made some changes to the proposal.", timestamp: "2:00 PM", status: "read", type: "text" },
    { id: "2", senderId: "15", content: "Please review the updated proposal", timestamp: "2:30 PM", status: "delivered", type: "text" },
  ],
};

export const MessagesChat = () => {
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(mockContacts[0]);
  const [messages, setMessages] = useState<ChatMessage[]>(mockChats["1"] || []);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setMessages(mockChats[contact.id] || []);
    // Mark as read
    setContacts(contacts.map((c) =>
      c.id === contact.id ? { ...c, unreadCount: 0 } : c
    ));
    setShowMobileChat(true);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: "me",
      content: newMessage,
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      status: "sent",
      type: "text",
    };

    setMessages([...messages, message]);
    setNewMessage("");

    // Simulate typing response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      // Simulate auto-reply for demo
      const reply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        senderId: selectedContact.id,
        content: "Thanks for your message! I'll get back to you soon.",
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        status: "delivered",
        type: "text",
      };
      setMessages((prev) => [...prev, reply]);
    }, 2000);
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedContact) return;

    const files = Array.from(e.target.files);
    setIsUploading(true);

    try {
      for (const file of files) {
        const base64 = await convertToBase64(file);

        const response = await fetch("/api/upload/attachments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file: base64,
            fileName: file.name,
            fileType: file.type,
          }),
        });

        if (response.ok) {
          const data = await response.json();

          // Add file message to chat
          const fileMessage: ChatMessage = {
            id: Date.now().toString(),
            senderId: "me",
            content: file.type.startsWith("image/") ? "" : file.name,
            timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
            status: "sent",
            type: file.type.startsWith("image/") ? "image" : "file",
            fileName: file.name,
            fileUrl: data.url,
          };
          setMessages((prev) => [...prev, fileMessage]);
        } else {
          const errorData = await response.json().catch(() => ({}));
          alert(`Failed to upload ${file.name}: ${errorData.error || "Unknown error"}`);
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = contacts.reduce((acc, c) => acc + c.unreadCount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-success-500";
      case "away":
        return "bg-warning-500";
      default:
        return "bg-gray-400";
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
      "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
      "bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400",
      "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
      "bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400",
      "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] h-[calc(100vh-180px)] min-h-[600px]">
      <div className="flex h-full">
        {/* Contacts Sidebar */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-gray-200 dark:border-gray-800 flex flex-col ${showMobileChat ? "hidden md:flex" : "flex"}`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Messages</h2>
              {totalUnread > 0 && (
                <span className="flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-medium text-brand-600 bg-brand-50 dark:bg-brand-500/[0.12] dark:text-brand-400 rounded-full">
                  {totalUnread}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-gray-500"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto">
            {filteredContacts.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No conversations found
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => handleSelectContact(contact)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800 ${
                    selectedContact?.id === contact.id ? "bg-brand-50 dark:bg-brand-500/[0.08]" : ""
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold ${getAvatarColor(contact.name)}`}>
                      {getInitials(contact.name)}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900 ${getStatusColor(contact.status)}`} />
                  </div>

                  {/* Contact Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-medium truncate ${contact.unreadCount > 0 ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                        {contact.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                        {contact.lastMessageTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${contact.unreadCount > 0 ? "text-gray-900 dark:text-white font-medium" : "text-gray-500 dark:text-gray-400"}`}>
                        {contact.lastMessage}
                      </p>
                      {contact.unreadCount > 0 && (
                        <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium text-brand-600 bg-brand-50 dark:bg-brand-500/[0.12] dark:text-brand-400 rounded-full flex-shrink-0 ml-2">
                          {contact.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${!showMobileChat ? "hidden md:flex" : "flex"}`}>
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
                <button
                  onClick={() => setShowMobileChat(false)}
                  className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${getAvatarColor(selectedContact.name)}`}>
                    {getInitials(selectedContact.name)}
                  </div>
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${getStatusColor(selectedContact.status)}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{selectedContact.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedContact.status === "online" ? "Online" : selectedContact.status === "away" ? "Away" : `Last seen ${selectedContact.lastSeen || "recently"}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                  <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
                {messages.map((message, index) => {
                  const showTimestamp = index === 0 ||
                    messages[index - 1].senderId !== message.senderId;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === "me" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl ${
                          message.type === "image" ? "p-1" : "px-4 py-2.5"
                        } ${
                          message.senderId === "me"
                            ? "bg-brand-50 text-gray-900 dark:bg-brand-500/[0.15] dark:text-white rounded-br-md"
                            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md shadow-sm border border-gray-100 dark:border-gray-700"
                        }`}
                      >
                        {/* Image Message */}
                        {message.type === "image" && message.fileUrl && (
                          <a href={message.fileUrl} target="_blank" rel="noopener noreferrer">
                            <img
                              src={message.fileUrl}
                              alt={message.fileName || "Image"}
                              className="rounded-xl max-w-full max-h-64 object-cover"
                            />
                          </a>
                        )}

                        {/* File Message */}
                        {message.type === "file" && message.fileUrl && (
                          <a
                            href={message.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-2 rounded-lg bg-white/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-900 transition-colors"
                          >
                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{message.fileName}</p>
                              <p className="text-xs text-gray-500">Click to download</p>
                            </div>
                          </a>
                        )}

                        {/* Text Message */}
                        {message.type === "text" && (
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        )}

                        <div className={`flex items-center justify-end gap-1 mt-1 ${message.type === "image" ? "px-2 pb-1" : ""} ${message.senderId === "me" ? "text-gray-500 dark:text-gray-400" : "text-gray-400"}`}>
                          <span className="text-xs">{message.timestamp}</span>
                          {message.senderId === "me" && (
                            <span className="text-xs">
                              {message.status === "read" ? (
                                <svg className="w-4 h-4 text-brand-500" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" />
                                </svg>
                              ) : message.status === "delivered" ? (
                                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                </svg>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-transparent">
                <div className="flex items-end gap-3">
                  <button
                    type="button"
                    onClick={handleFileAttach}
                    disabled={isUploading}
                    className={`p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 ${isUploading ? "text-brand-500" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`}
                  >
                    {isUploading ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                  />

                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="w-full h-11 px-4 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-gray-500"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900/50">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Select a conversation</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Choose a contact to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
