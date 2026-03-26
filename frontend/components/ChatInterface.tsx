"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  MapPin,
  Calendar,
  Star,
  CheckCircle,
  ArrowRight,
  X,
  Maximize2,
  Minimize2,
  Heart,
  Camera,
  Landmark,
  Palmtree,
} from "lucide-react";
import axios from "axios";
import DateRangePicker from "./DateRangePicker";

// --- Types ---
interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Package {
  id: string;
  api_id: string;
  name: string;
  category: string;
  location: string;
  price: number;
  currency: string;
  duration: string;
  description: string;
  inclusions?: string[];
  image_url: string;
  rating: number;
  highlights: string[];
  site_url?: string; // Direct booking link
}

type UI =
  | {
      type: "package_cards";
      items: Package[];
      total_packages?: number;
      packages_shown?: number;
      show_more_available?: boolean;
    }
  | {
      type: "calendar";
      mode?: "single" | "range";
      min_date?: string;
      max_date?: string;
    }
  | {
      type: "option_cards";
      items: {
        id: string;
        title: string;
        description: string;
        icon: string;
        action_id?: string;
        value: string;
      }[];
    }
  | {
      type: "event_type_cards";
      items: {
        id: string;
        name: string;
        description: string;
        icon: string;
      }[];
    }
  | {
      type: "search_type_cards";
      items: {
        id: string;
        title: string;
        icon: string;
        description: string;
        action: string;
      }[];
    }
  | {
      type: "category_cards";
      items: {
        id: string;
        name: string;
        icon: string;
      }[];
      allow_text_input?: boolean;
      placeholder?: string;
    }
  | {
      type: "location_cards";
      items: {
        name: string;
        description: string;
        icon: string;
      }[];
      allow_text_input?: boolean;
      placeholder?: string;
    }
  | {
      type: "redirect";
      url: string;
      message: string;
    }
  | {
      type: "pax_selector";
      adults?: number;
      children?: number;
    }
  | {
      type: "partner_info_cards";
      items: Array<{
        id: string;
        icon: string;
        title: string;
        description: string;
        value: string;
      }>;
    };

interface ChatResponse {
  response: string;
  conversation_id: string;
  dialog_stage: string;
  packages?: Package[];
  selected_package?: Package;
  reference_id?: string;
  ui?: UI; // UI payload for category cards, package cards, etc.
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ChatInterface() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandMode, setExpandMode] = useState<"horizontal" | "vertical">(
    "horizontal"
  ); // NEW: Expansion mode
  const [showHome, setShowHome] = useState(true); // Home view toggle
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Welcome to Xplora! How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [currentPackages, setCurrentPackages] = useState<Package[]>([]);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [currentUI, setCurrentUI] = useState<UI | null>(null); // Store UI payload from API

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && !showHome) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, showHome, messages, currentPackages, isExpanded]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    if (showHome) setShowHome(false); // Switch to chat view

    const userMessage: Message = {
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setCurrentPackages([]);
    setCurrentUI(null); // Clear UI when sending new message
    setReferenceId(null); // Clear reference box when sending new message

    try {
      const response = await axios.post<ChatResponse>(`${API_URL}/chat`, {
        message: textToSend,
        conversation_id: conversationId,
      });

      if (!conversationId) {
        setConversationId(response.data.conversation_id);
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: response.data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.data.packages && response.data.packages.length > 0) {
        setCurrentPackages(response.data.packages);
      }

      if (response.data.reference_id) {
        setReferenceId(response.data.reference_id);
      }

      // Handle UI payload (category cards, package cards, etc.)
      console.log("🔍 API Response UI:", response.data.ui);
      console.log("🔍 Full API Response:", response.data);
      if (response.data.ui) {
        console.log("✅ Setting currentUI:", response.data.ui);
        setCurrentUI(response.data.ui);
        // If UI contains package cards, also set them in currentPackages
        if (
          response.data.ui.type === "package_cards" &&
          Array.isArray(response.data.ui.items)
        ) {
          setCurrentPackages(response.data.ui.items as Package[]);
        }
        // Handle Option Cards - Ensure we clear packages if we are showing options
        if (response.data.ui.type === "option_cards") {
          setCurrentPackages([]); // Clear packages to avoid confusion
        }
      } else {
        console.log("❌ No UI payload in response");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm having trouble connecting to the server. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // --- Render Helpers ---
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Proactive options detection (greeting message)
  const isProactiveOptionsPrompt = (message: string) => {
    const lowerMsg = message.toLowerCase();
    return (
      lowerMsg.includes("how can i help you today") ||
      lowerMsg.includes("is there anything we can do for you") ||
      lowerMsg.includes("what would you like to do") ||
      (lowerMsg.includes("book a kerala trip") &&
        (lowerMsg.includes("get help") ||
          lowerMsg.includes("become a partner"))) ||
      (lowerMsg.includes("already registered") && lowerMsg.includes("book"))
    );
  };

  // Travel options (inspired by MyraWidget but integrated with our backend)
  const travelOptions = [
    {
      icon: "🏖️",
      title: "Beach Destinations",
      description: "Relax by the ocean",
      message: "I'm looking for beach destinations",
      gradient: "from-blue-400 to-cyan-400",
    },
    {
      icon: "🏔️",
      title: "Mountain Getaways",
      description: "Adventure awaits",
      message: "I want mountain getaways",
      gradient: "from-green-400 to-emerald-400",
    },
    {
      icon: "💑",
      title: "Honeymoon Packages",
      description: "Romantic escapes",
      message: "Show me honeymoon packages",
      gradient: "from-pink-400 to-rose-400",
    },
    {
      icon: "🎭",
      title: "Cultural Tours",
      description: "Explore heritage",
      message: "I'm interested in cultural tours",
      gradient: "from-purple-400 to-violet-400",
    },
    {
      icon: "🏰",
      title: "Historical Sites",
      description: "Time travel",
      message: "Show me historical sites",
      gradient: "from-amber-400 to-orange-400",
    },
    {
      icon: "🌴",
      title: "Tropical Paradise",
      description: "Island hopping",
      message: "I want tropical paradise trips",
      gradient: "from-teal-400 to-cyan-400",
    },
  ];

  // Check if we should show travel options (after greeting, only show once)
  const shouldShowTravelOptions = () => {
    // Only show if we have messages and haven't shown options yet
    if (messages.length === 0) return false;

    // Check if user has already interacted (sent a message)
    const hasUserMessage = messages.some((m) => m.role === "user");
    if (hasUserMessage) return false; // Don't show after user has interacted

    // Show only after the first welcome/greeting message
    if (messages.length === 1 && messages[0].role === "assistant") {
      const content = messages[0].content.toLowerCase();
      return (
        content.includes("welcome") ||
        content.includes("how can i help") ||
        content.includes("explore kerala") ||
        content.includes("help you")
      );
    }

    return false;
  };

  const handleTravelOptionClick = (option: (typeof travelOptions)[0]) => {
    sendMessage(option.message);
  };

  if (!isMounted) return null;

  return (
    <div className="fixed bottom-6 right-6 top-6 z-50 flex flex-col items-end justify-end pointer-events-none">
      {/* 
         Note: We removed the full-screen background overlay 
         so you can interact with the 'website' behind it.
         Only the chat window blocks clicks.
      */}

      {/* Chat Window Container */}
      <div
        className={`
          pointer-events-auto z-50 bg-white
          rounded-3xl shadow-2xl border border-gray-200
          flex flex-col overflow-hidden
          transition-all duration-300 ease-in-out transform origin-bottom-right
          max-h-[calc(100vh-3rem)]
          ${
            isOpen
              ? "scale-100 opacity-100 translate-y-0"
              : "scale-0 opacity-0 translate-y-10"
          }
          ${
            isExpanded
              ? expandMode === "vertical"
                ? "w-[95vw] h-[90vh] md:w-[550px] md:h-[900px]" // Vertical: width stays, height expands
                : "w-[95vw] h-[90vh] md:w-[1000px] md:h-[800px]" // Horizontal: width expands
              : "w-[95vw] h-[75vh] md:w-[550px] md:h-[650px]"
          }
        `}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-4 shrink-0 flex items-center justify-between text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30 shadow-lg">
                <img
                  src="/mia_avatar.png?v=2"
                  alt="Xplora"
                  className="w-full h-full object-cover scale-110"
                  style={{ imageRendering: "auto" }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://img.freepik.com/premium-photo/cute-cat-adventurer-cartoon-character_894855-1688.jpg";
                  }}
                />
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-indigo-900 rounded-full"></div>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">XPLORA</h1>
              <p className="text-[10px] text-indigo-200 font-medium tracking-wider uppercase">
                AI Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Expansion Mode Toggle - Only show when expanded */}
            {isExpanded && (
              <button
                onClick={() =>
                  setExpandMode(
                    expandMode === "horizontal" ? "vertical" : "horizontal"
                  )
                }
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-indigo-200 hover:text-white"
                title={
                  expandMode === "horizontal"
                    ? "Switch to Vertical"
                    : "Switch to Horizontal"
                }
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {expandMode === "horizontal" ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-indigo-200 hover:text-white"
              title={isExpanded ? "Minimize" : "Maximize"}
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-indigo-200 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 bg-slate-50">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <img
                src="/mia_avatar.png"
                alt="Mia"
                className="w-12 h-12 opacity-20 rounded-full"
              />
              <p className="text-sm">Chat with XPLORA</p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full overflow-hidden border border-purple-200 shadow-sm mt-1">
                  <img
                    src="/mia_avatar.png?v=2"
                    alt="Xplora"
                    className="w-full h-full object-cover scale-110"
                    style={{ imageRendering: "auto" }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://img.freepik.com/premium-photo/cute-cat-adventurer-cartoon-character_894855-1688.jpg";
                    }}
                  />
                </div>
              )}

              <div
                className={`max-w-[85%] space-y-1 ${
                  message.role === "user"
                    ? "items-end flex flex-col"
                    : "items-start"
                }`}
              >
                <div
                  className={`px-5 py-3 shadow-sm text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-indigo-600 text-white rounded-2xl rounded-br-none"
                      : "bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-none"
                  }`}
                >
                  <div className="whitespace-pre-wrap">
                    {(() => {
                      const urlRegex = /(https?:\/\/[^\s]+)/g;
                      const parts = message.content.split(urlRegex);
                      return parts.map((part, i) =>
                        part.match(urlRegex) ? (
                          <a
                            key={i}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-800"
                          >
                            {part}
                          </a>
                        ) : (
                          part
                        )
                      );
                    })()}
                  </div>
                </div>

                {/* Travel Options Grid - Show after greeting or when appropriate */}
                {message.role === "assistant" &&
                  index === messages.length - 1 &&
                  shouldShowTravelOptions() && (
                    <div className="mt-4 w-full">
                      <div className="grid grid-cols-2 gap-3">
                        {travelOptions.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleTravelOptionClick(option)}
                            disabled={isLoading}
                            className="relative bg-white rounded-xl p-4 shadow-md border border-gray-100 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed group"
                          >
                            {/* Gradient Background on Hover */}
                            <div
                              className={`absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                            ></div>

                            {/* Content */}
                            <div className="relative z-10">
                              <div
                                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.gradient} flex items-center justify-center mx-auto mb-3 text-2xl shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                              >
                                {option.icon}
                              </div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-1 text-center group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 transition-all duration-300">
                                {option.title}
                              </h4>
                              <p className="text-xs text-gray-500 text-center line-clamp-2">
                                {option.description}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                <span className="text-[10px] text-gray-400 px-1 opacity-70">
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-purple-200 shadow-sm mt-1">
                <img
                  src="/mia_avatar.png?v=2"
                  alt="Xplora"
                  className="w-full h-full object-cover scale-110"
                  style={{ imageRendering: "auto" }}
                />
              </div>
              <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-gray-100 shadow-sm flex gap-1 items-center h-11">
                <span
                  className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></span>
                <span
                  className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></span>
                <span
                  className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></span>
              </div>
            </div>
          )}

          {/* Calendar Component - Show when booking agent requests dates */}
          {currentUI?.type === "calendar" && !isLoading && (
            <div className="mt-4 max-w-md">
              <DateRangePicker
                onDateSelect={(checkIn, checkOut) => {
                  const nights = Math.ceil(
                    (new Date(checkOut).getTime() -
                      new Date(checkIn).getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  sendMessage(
                    `Check-in: ${checkIn}, Check-out: ${checkOut} (${nights} night${
                      nights !== 1 ? "s" : ""
                    })`
                  );
                }}
                minDate={currentUI.min_date}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Pax Selector */}
          {currentUI?.type === "pax_selector" && !isLoading && (
            <div className="mt-4 bg-white rounded-xl shadow-md border border-gray-200 p-4 max-w-xs">
              <h4 className="font-bold text-gray-800 mb-3 text-sm">
                Select Travelers
              </h4>

              {/* Adults */}
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-600">Adults</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const current = currentUI.adults || 1;
                      if (current > 1)
                        setCurrentUI({ ...currentUI, adults: current - 1 });
                    }}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 font-bold"
                  >
                    -
                  </button>
                  <span className="font-bold w-4 text-center">
                    {currentUI.adults || 2}
                  </span>
                  <button
                    onClick={() => {
                      const current = currentUI.adults || 1;
                      setCurrentUI({ ...currentUI, adults: current + 1 });
                    }}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Children */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-600">Children</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const current = currentUI.children || 0;
                      if (current > 0)
                        setCurrentUI({ ...currentUI, children: current - 1 });
                    }}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 font-bold"
                  >
                    -
                  </button>
                  <span className="font-bold w-4 text-center">
                    {currentUI.children || 0}
                  </span>
                  <button
                    onClick={() => {
                      const current = currentUI.children || 0;
                      setCurrentUI({ ...currentUI, children: current + 1 });
                    }}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={() =>
                  sendMessage(
                    `Adults: ${currentUI.adults || 2}, Children: ${
                      currentUI.children || 0
                    }`
                  )
                }
                className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          )}

          {/* Package Cards - Strict check to prevent overlap with Calendar/Pax */}
          {currentPackages.length > 0 &&
            currentUI?.type === "package_cards" && (
              <div className="!mt-4 space-y-3">
                <div className="overflow-x-auto pb-4 -mx-4 px-4 flex gap-4 snap-x">
                  {currentPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="snap-center shrink-0 w-[260px] bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden group hover:shadow-lg transition-all"
                    >
                      <div className="relative h-32 overflow-hidden">
                        <img
                          src={
                            pkg.image_url ||
                            "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400"
                          }
                          alt={pkg.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&q=80";
                          }}
                        />
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-white flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />{" "}
                          {pkg.rating}
                        </div>
                      </div>

                      <div className="p-3">
                        <h3 className="font-bold text-gray-900 text-sm mb-1 truncate">
                          {pkg.name}
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-2">
                          <MapPin className="w-3 h-3" /> {pkg.location}
                          <span>•</span>
                          <Calendar className="w-3 h-3" /> {pkg.duration}
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <p className="text-sm font-bold text-indigo-700">
                            ₹{pkg.price.toLocaleString()}
                          </p>
                          {pkg.site_url ? (
                            <a
                              href={pkg.site_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm block text-center"
                            >
                              Book
                            </a>
                          ) : (
                            <button
                              onClick={() =>
                                sendMessage(
                                  `I want to book ${pkg.name} (ID: ${pkg.api_id})`
                                )
                              }
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1"
                            >
                              Book <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Show More Button */}
                {currentUI?.type === "package_cards" &&
                  currentUI.show_more_available && (
                    <div className="flex justify-center px-4">
                      <button
                        onClick={() => sendMessage("show more")}
                        disabled={isLoading}
                        className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                      >
                        <span>Show More Packages</span>
                        <span className="text-xs opacity-90">
                          (Click to see more)
                        </span>
                      </button>
                    </div>
                  )}
              </div>
            )}

          {currentUI?.type === "option_cards" && !isLoading && (
            <div className="mt-4 grid grid-cols-2 gap-3 w-full">
              {currentUI.items.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    console.log("Option clicked:", opt.value);
                    sendMessage(opt.value);
                  }}
                  className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-left flex flex-col gap-2 group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform block">
                    {opt.icon}
                  </span>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm group-hover:text-indigo-600 transition-colors">
                      {opt.title}
                    </h4>
                    <p className="text-[10px] text-gray-500 leading-tight">
                      {opt.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Corporate Event Type Cards */}
          {currentUI?.type === "event_type_cards" && !isLoading && (
            <div className="mt-4 grid grid-cols-2 gap-3 w-full">
              {currentUI.items.map((evt) => (
                <button
                  key={evt.id}
                  onClick={() => sendMessage(evt.name)}
                  className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-left flex flex-col gap-2 group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform block">
                    {evt.icon}
                  </span>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm group-hover:text-indigo-600 transition-colors">
                      {evt.name}
                    </h4>
                    <p className="text-[10px] text-gray-500 leading-tight">
                      {evt.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Search Type Cards (Category vs Location) */}
          {currentUI?.type === "search_type_cards" && !isLoading && (
            <div className="mt-4 grid grid-cols-2 gap-3 max-w-sm">
              {currentUI.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => sendMessage(item.action)}
                  className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-left flex flex-col gap-2 group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform block">
                    {item.icon}
                  </span>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-gray-500 leading-tight">
                      {item.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Partner Info Cards */}
          {currentUI?.type === "partner_info_cards" && !isLoading && (
            <div className="mt-4 grid grid-cols-2 gap-3 w-full">
              {currentUI.items.map((card) => (
                <button
                  key={card.id}
                  onClick={() => sendMessage(card.value)}
                  disabled={isLoading}
                  className="p-4 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl shadow-sm hover:shadow-lg hover:border-indigo-400 hover:from-indigo-50 hover:to-white transition-all text-left flex flex-col gap-2 group disabled:opacity-50"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform block">
                    {card.icon}
                  </span>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm group-hover:text-indigo-700 transition-colors">
                      {card.title}
                    </h4>
                    <p className="text-[10px] text-gray-600 leading-tight mt-1">
                      {card.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Category Cards (Grid of Chips) */}
          {currentUI?.type === "category_cards" && !isLoading && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {currentUI.items.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => sendMessage(cat.name)}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-center gap-2 group"
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-xs font-semibold text-gray-700 group-hover:text-indigo-700">
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
              {currentUI.allow_text_input && (
                <p className="text-[10px] text-gray-400 mt-2 italic text-center">
                  {currentUI.placeholder}
                </p>
              )}
            </div>
          )}

          {/* Location Cards */}
          {currentUI?.type === "location_cards" && !isLoading && (
            <div className="mt-4 grid grid-cols-2 gap-3 max-w-sm">
              {currentUI.items.map((loc, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(loc.name)}
                  className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-left flex items-center gap-3 group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform block">
                    {loc.icon}
                  </span>
                  <div>
                    <h4 className="font-bold text-gray-800 text-xs group-hover:text-indigo-600 transition-colors">
                      {loc.name}
                    </h4>
                    <p className="text-[10px] text-gray-500 leading-tight">
                      {loc.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Redirect Handler REMOVED - User requested no green button */}

          {/* Reference ID */}
          {referenceId && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3 items-start shadow-sm mx-2">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-green-900 text-sm">
                  Booking Requested!
                </h3>
                <p className="text-xs text-green-700 mt-1">
                  Our agent will call you shortly.
                </p>
                <p className="text-xs font-mono font-bold text-green-800 mt-2 bg-white/50 inline-block px-2 py-1 rounded border border-green-100">
                  REF: {referenceId}
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-100 p-3 shrink-0">
          <div className="relative flex items-end bg-gray-50 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Auto-resize textarea
                e.target.style.height = "auto";
                e.target.style.height =
                  Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyPress={handleKeyPress}
              placeholder="Ask Xplora..."
              className="flex-1 bg-transparent px-4 py-3 outline-none text-sm text-gray-700 placeholder:text-gray-400 resize-none overflow-y-auto"
              style={{ minHeight: "44px", maxHeight: "120px" }}
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className="mr-2 p-2 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-lg text-white shadow-sm disabled:opacity-50 hover:shadow-md active:scale-95 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-300 mt-2">
            Xplora AI • Powered by Groq
          </p>
        </div>
      </div>

      {/* Floating Button (Visible when chat is closed) - Improved with MyraWidget style */}
      {!isOpen && (
        <div className="fixed right-6 bottom-6 z-[9998] pointer-events-auto flex flex-row items-center gap-3">
          {/* Label */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg whitespace-nowrap animate-fadeIn">
            Xplora AI Assistant
          </div>

          {/* Main Button */}
          <button onClick={() => setIsOpen(true)} className="relative group">
            {/* Pulse Ring Animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full animate-ping opacity-20"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full animate-pulse opacity-30"></div>

            {/* Main Button */}
            <div className="relative w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-full shadow-2xl shadow-indigo-500/50 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-active:scale-95">
              <img
                src="/mia_avatar.png?v=2"
                alt="Mia"
                className="w-full h-full object-cover rounded-full scale-110 animate-float"
                style={{ imageRendering: "auto" }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://img.freepik.com/premium-photo/cute-cat-adventurer-cartoon-character_894855-1688.jpg";
                }}
              />

              {/* Notification Badge */}
              <span className="absolute top-0 right-0 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full border-3 border-white shadow-lg animate-bounce"></span>
            </div>
          </button>
        </div>
      )}

      {/* Custom Animations - Enhanced with MyraWidget style */}
      <style jsx>{`
        @keyframes bounce-slow {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite ease-in-out;
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-8px) rotate(-2deg);
          }
          50% {
            transform: translateY(-4px) rotate(0deg);
          }
          75% {
            transform: translateY(-8px) rotate(2deg);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
