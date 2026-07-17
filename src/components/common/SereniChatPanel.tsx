// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState, useRef, useEffect } from 'react';
import { X, Copy, PenLine, Send, Loader2, Sparkles, Plus, ChevronDown} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useSereniChat as useSereniChatContext } from '../../contexts/SereniChatContext';
import { useSereniChat as useSereniChatApi } from '../../hooks/useApi';
import { InteractiveOptionButton } from '../ui/InteractiveOptionButton';

interface SereniChatMessage {
  id: string;
  content: string;
  role: 'system' | 'user' | 'assistant' | 'bot';
  interactiveOptions?: Array<{
    id: string;
    label: string;
    value: string;
    selected?: boolean;
  }>;
}

type SereniModel = 'gpt-4.1-mini' | 'gpt-5.2-pro' | 'gpt-4o-mini';

interface ChatMessageProps {
  message: SereniChatMessage;
  isUser: boolean;
  isEditing: boolean;
  editingValue: string;
  onCopyMessage: (content: string) => void;
  onStartEditing: (message: SereniChatMessage) => void;
  onEditChange: (value: string) => void;
  onEditKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onOptionClick: (messageId: string, optionId: string, value: string) => void;
  isSendingSereniChat: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isUser,
  isEditing,
  editingValue,
  onCopyMessage,
  onStartEditing,
  onEditChange,
  onEditKeyDown,
  onSaveEdit,
  onCancelEdit,
  onOptionClick,
  isSendingSereniChat,
}) => {
  return (
    <div className={`group flex ${isUser ? 'justify-end' : 'justify-start'} gap-2`}>
      {!isUser && (
        <div className="flex-shrink-0 h-8 w-8 rounded-t-full rounded-l-full  bg-[var(--color-brand-600)] flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-black" />
        </div>
      )}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] relative`}>
        {!isUser && !isEditing && (
          <button
            type="button"
            className="absolute -top-2 -right-2 p-1 bg-white border border-gray-200 rounded-full shadow-sm z-10"
            onClick={() => onCopyMessage(message.content)}
            title="Copy message"
          >
            <Copy className="h-3 w-3 text-gray-600" />
          </button>
        )}
        <div
          className={`relative rounded-2xl px-3 py-2 text-base font-normal not-italic ${
            isUser
              ? 'bg-green-100 text-black rounded-br-md border border-green-200'
              : 'text-[var(--color-text-primary)]'
          } ${isEditing ? 'w-full' : ''}`}
        >
          {isEditing ? (
            <textarea
              value={editingValue}
              onChange={(e) => onEditChange(e.target.value)}
              onKeyDown={onEditKeyDown}
              className="min-h-[84px] w-full resize-none rounded-xl border border-white/20 bg-transparent p-0 text-[15px] leading-6 outline-none"
              autoFocus
            />
          ) : (
            message.content
          )}
        </div>

        <div className="mt-1 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          {isUser && !isEditing && (
            <button
              type="button"
              onClick={() => onStartEditing(message)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-gray-200)] bg-white px-2.5 py-1 text-xs font-medium text-[var(--color-text-primary)] shadow-sm"
              title="Edit message"
            >
              <PenLine className="h-3 w-3" />
            </button>
          )}
        </div>

        {!isUser && message.interactiveOptions && message.interactiveOptions.length > 0 && (
          <div className="mt-3 p-3 bg-[var(--color-gray-100)] rounded-lg border border-[var(--color-gray-200)] w-full">
            <div className="flex flex-col gap-2">
              {message.interactiveOptions.map((option) => (
                <InteractiveOptionButton
                  key={option.id}
                  id={option.id}
                  label={option.label}
                  value={option.value}
                  align="left"
                  onClick={(value) => onOptionClick(message.id, option.id, value)}
                  disabled={isSendingSereniChat}
                  isSelected={option.selected === true}
                  hasSelection={message.interactiveOptions?.some(opt => opt.selected === true) || false}
                />
              ))}
            </div>
          </div>
        )}

        {isEditing && (
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onSaveEdit}
              className="rounded-full bg-[var(--color-blue-600)] px-3 py-1.5 text-xs font-semibold text-white"
            >
              Send
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-full border border-[var(--color-gray-200)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)]"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const SereniChatPanel: React.FC = () => {
  const toast = useToast();
  const { isSereniChatOpen, closeSereniChat } = useSereniChatContext();
  const serenChatMutation = useSereniChatApi();
  const [sereniModel] = useState<SereniModel>('gpt-4.1-mini');
  const [sereniTemperature] = useState(0.3);
  const [sereniChatInput, setSereniChatInput] = useState('');
  const [sereniChatMessages, setSereniChatMessages] = useState<SereniChatMessage[]>([
    {
      id: 'sereni-welcome',
      role: 'assistant',
      content: 'Hi, I am Sereni AI. Ask me about tables, bases, or workspace actions.',
      // interactiveOptions: [
      //   { id: 'opt-1', label: 'projects', value: 'projects' },
      //   { id: 'opt-2', label: 'tasks', value: 'tasks', selected: true },
      //   { id: 'opt-3', label: 'due_date', value: 'due_date' },
      // ],
    },
  ]);
  const [isSendingSereniChat, setIsSendingSereniChat] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  // const [isExpanded, setIsExpanded] = useState(false);
  const [firstQuestion, setFirstQuestion] = useState<string>('');
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ id: string; title: string; messages: SereniChatMessage[]; timestamp: number }>>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sereniChatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("sereniChatEndRef.current?", sereniChatEndRef.current, "sereniChatMessages", sereniChatMessages , "isSereniChatOpen", isSereniChatOpen)
    sereniChatEndRef.current?.scrollIntoView({  behavior: "smooth", block: "end" });
  }, [isSereniChatOpen, sereniChatMessages]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('sereniChatHistory');
    if (savedHistory) {
      try {
        setChatHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Failed to parse chat history:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sereniChatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowChatHistory(false);
      }
    };

    if (showChatHistory) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showChatHistory]);

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Message copied to clipboard');
    } catch (error) {
      console.error('Failed to copy message:', error);
      toast.error('Failed to copy message');
    }
  };

  const startEditingMessage = (message: SereniChatMessage) => {
    setEditingMessageId(message.id);
    setEditingValue(message.content);
  };

  const cancelEditingMessage = () => {
    setEditingMessageId(null);
    setEditingValue('');
  };

  const handleNewChat = () => {
    // Only save if this is a chat with actual messages (not just the welcome message)
    if (sereniChatMessages.length > 1) {
      const currentChat = {
        id: currentChatId || `chat-${Date.now()}`,
        title: firstQuestion || 'New Chat',
        messages: sereniChatMessages,
        timestamp: Date.now(),
      };
      
      setChatHistory((prev) => {
        // Remove if this chat ID already exists to avoid duplicates
        const filtered = prev.filter((c) => c.id !== currentChat.id);
        return [currentChat, ...filtered];
      });
    }
    
    setSereniChatMessages([
      {
        id: 'sereni-welcome',
        role: 'assistant',
        content: "Hi, I'm Sereni AI. Ask me about tables, bases or views actions.",
      },
    ]);
    setSereniChatInput('');
    setFirstQuestion('');
    setCurrentChatId(null);
    setShowChatHistory(false);
  };

  const updateChatHistory = (prev: Array<{ id: string; title: string; messages: SereniChatMessage[]; timestamp: number }>, chatToSave: { id: string; title: string; messages: SereniChatMessage[]; timestamp: number }) => {
    const existingIndex = prev.findIndex((c) => c.id === chatToSave.id);
    
    if (existingIndex >= 0) {
      const updated = [...prev];
      updated[existingIndex] = chatToSave;
      return updated;
    } else {
      return [chatToSave, ...prev];
    }
  };

  const saveCurrentChat = () => {
    if (sereniChatMessages.length <= 1) return;
    
    const chatToSave = {
      id: currentChatId || `chat-${Date.now()}`,
      title: firstQuestion || 'New Chat',
      messages: sereniChatMessages,
      timestamp: Date.now(),
    };
    
    setChatHistory((prev) => updateChatHistory(prev, chatToSave));
  };

  const loadChatHistory = (chatId: string) => {
    const chat = chatHistory.find((c) => c.id === chatId);
    if (!chat) return;

    // Save current chat before loading a different one
    saveCurrentChat();
    
    setSereniChatMessages(chat.messages);
    setFirstQuestion(chat.title);
    setCurrentChatId(chatId);
    setShowChatHistory(false);
  };

  const deleteChatHistory = (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setChatHistory((prev) => prev.filter((c) => c.id !== chatId));
  };

  // const handleExpand = () => {
  //   setIsExpanded(!isExpanded);
  // };

  const updateInteractiveOptions = (options: Array<{ id: string; label: string; value: string; selected?: boolean }>, optionId: string) => {
    return options.map((opt) => ({
      ...opt,
      selected: opt.id === optionId,
    }));
  };

  const updateMessageWithOptions = (msg: SereniChatMessage, messageId: string, optionId: string) => {
    if (msg.id === messageId && msg.interactiveOptions) {
      return {
        ...msg,
        interactiveOptions: updateInteractiveOptions(msg.interactiveOptions, optionId),
      };
    }
    return msg;
  };

  const handleOptionClick = (messageId: string, optionId: string, value: string) => {
    // Update the message's interactiveOptions to set the selected option
    setSereniChatMessages((current) =>
      current.map((msg) => updateMessageWithOptions(msg, messageId, optionId))
    );
    handleSereniChatSend(value);
  };

  const trimMessagesUpTo = (messages: SereniChatMessage[], messageId: string | null) => {
    if (!messageId) return messages;
    const index = messages.findIndex((msg) => msg.id === messageId);
    if (index === -1) return messages;
    return messages.slice(0, index);
  };

  const saveEditingMessage = () => {
    if (!editingMessageId) return;

    const nextValue = editingValue.trim();
    if (!nextValue) return;

    setSereniChatMessages((current) => trimMessagesUpTo(current, editingMessageId));

    handleSereniChatSend(nextValue);
    cancelEditingMessage();
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditingMessage();
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      saveEditingMessage();
    }
  };

  const generateInteractiveOptions = (content: string): Array<{ id: string; label: string; value: string; selected?: boolean }> => {
    const options: Array<{ id: string; label: string; value: string; selected?: boolean }> = [];
    const lowerContent = content.toLowerCase();

    // Generate interactive options based on response content
    if (lowerContent.includes('table') || lowerContent.includes('select')) {
      options.push(
        { id: 'opt-projects', label: 'projects', value: 'projects' },
        { id: 'opt-tasks', label: 'tasks', value: 'tasks' },
        { id: 'opt-due-date', label: 'due_date', value: 'due_date' }
      );
    }

    if (lowerContent.includes('field') || lowerContent.includes('column')) {
      options.push(
        { id: 'opt-text', label: 'text', value: 'text' },
        { id: 'opt-number', label: 'number', value: 'number' },
        { id: 'opt-date', label: 'date', value: 'date' }
      );
    }

    if (lowerContent.includes('record')) {
      options.push(
        { id: 'opt-create', label: 'create', value: 'create' },
        { id: 'opt-edit', label: 'edit', value: 'edit' },
        { id: 'opt-delete', label: 'delete', value: 'delete' }
      );
    }

    return options;
  };

  const createAssistantMessage = (content: string, nextId: () => string): SereniChatMessage => ({
    id: `assistant-${nextId()}`,
    role: 'assistant',
    content,
    interactiveOptions: generateInteractiveOptions(content),
  });

  const buildRequestMessages = (trimmed: string) => [
    {
      role: 'system' as const,
      content: 'You are Sereni AI, a concise assistant for SereniBase workspace, base, and table tasks.',
    },
    ...sereniChatMessages.map((message) => ({
      role: message.role === 'bot' ? 'assistant' : message.role,
      content: message.content,
    })),
    {
      role: 'user' as const,
      content: trimmed,
    },
  ];

  const handleSereniChatSend = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || isSendingSereniChat) return;
    const nextId = () => `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    // Set first question if this is the first user message
    const hasUserMessages = sereniChatMessages.some(msg => msg.role === 'user');
    if (!firstQuestion && !hasUserMessages) {
      setFirstQuestion(trimmed);
    }

    const userMessage: SereniChatMessage = {
      id: `user-${nextId()}`,
      role: 'user',
      content: trimmed,
    };

    const requestMessages = buildRequestMessages(trimmed);

    setSereniChatMessages((current) => [...current, userMessage]);
    setSereniChatInput('');
    setIsSendingSereniChat(true);

    try {
      const response = await serenChatMutation.mutateAsync({
        messages: requestMessages,
        model: sereniModel,
        temperature: sereniTemperature,
      });

      const reply = response?.reply || '';
      const assistantMessage = createAssistantMessage(reply?.trim() || 'I did not receive a reply from the chat service.', nextId);
      setSereniChatMessages((current) => [...current, assistantMessage]);
    } catch (error: any) {
      const errorMessage = error?.message || 'Chat request failed.';
      const assistantMessage = createAssistantMessage(errorMessage, nextId);
      setSereniChatMessages((current) => [...current, assistantMessage]);
    } finally {
      setIsSendingSereniChat(false);
    }
  };

  if (!isSereniChatOpen) return null;

  return (
    <div
      className="bg-card border-l border-[var(--color-gray-200)] shadow-2xl flex flex-col h-full transition-all duration-300 w-full max-w-[33rem]"
      style={{
        animation: 'slideInRight 300ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards'
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3" ref={dropdownRef}>
          <img 
            src="/assets/chat_sparkle_ai.svg" 
            alt="Sereni AI" 
            className="h-8 w-8"
          />
          <div className="flex flex-col relative">
            <button
              type="button"
              className="flex items-center text-left gap-1 font-semibold text-[var(--color-text-primary)] text-sm hover:bg-gray-100 rounded px-2 py-1 transition-colors"
              onClick={() => {
                if (chatHistory.length > 0) {
                  setShowChatHistory(!showChatHistory);
                }
              }}
            >
              <span className="text-ellipsis overflow-hidden whitespace-nowrap w-[14rem] max-w-[15rem]">{firstQuestion || 'Sereni AI'}</span>
              {chatHistory.length > 0 && (
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform flex-shrink-0 ${showChatHistory ? 'rotate-180' : ''}`} />
              )}
            </button>

            {showChatHistory && chatHistory.length > 0 && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="p-3">
                  <div className="flex items-center text-sm font-semibold text-[var(--color-text-tertiary)] not-italic">
                    Recent
                  </div>
                </div>
                  {chatHistory.map((chat) => (
                    <button
                      key={chat.id}
                      type="button"
                      className="group relative flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors mb-1 w-full text-left"
                      onClick={() => loadChatHistory(chat.id)}
                    >
                      <span className="text-sm font-medium text-[var(--color-text-primary)] not-italic truncate">
                        {chat.title}
                      </span>

                      <button
                        type="button"
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
                        onClick={(e) => deleteChatHistory(chat.id, e)}
                        title="Delete chat"
                      >
                        <X className="h-3 w-3 text-gray-500" />
                      </button>
                    </button>
                  ))}

              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            title="New chat"
            onClick={handleNewChat}
          >
            <span>New Chat</span>
            <Plus className="h-4 w-4 text-gray-400" />
          </button>
          {/* <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-gray-100)]"
            title={isExpanded ? "Minimize" : "Expand"}
            onClick={handleExpand}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4 text-gray-400" /> : <Maximize2 className="h-4 w-4 text-gray-400" />}
          </button> */}
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-gray-100)]"
            onClick={closeSereniChat}
            aria-label="Close Sereni AI chat"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

        <div className="flex-1 overflow-y-auto px-4 scroll-smooth">
          <div 
            className="min-h-full flex flex-col justify-end gap-3 w-full"
          >
            {sereniChatMessages.map((message) => {
              const isUser = message.role === 'user';
              const isEditing = editingMessageId === message.id;
              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isUser={isUser}
                  isEditing={isEditing}
                  editingValue={editingValue}
                  onCopyMessage={handleCopyMessage}
                  onStartEditing={startEditingMessage}
                  onEditChange={setEditingValue}
                  onEditKeyDown={handleEditKeyDown}
                  onSaveEdit={saveEditingMessage}
                  onCancelEdit={cancelEditingMessage}
                  onOptionClick={handleOptionClick}
                  isSendingSereniChat={isSendingSereniChat}
                />
              );
            })}
            <div ref={sereniChatEndRef} />
          </div>
        </div>

        <form
          className="border-t border-[var(--color-gray-200)] p-3"
          onSubmit={(event) => {
            event.preventDefault();
            handleSereniChatSend(sereniChatInput);
          }}
        >
          <div className="relative">
            <div className="relative rounded-xl bg-gradient-to-r from-green-400 to-indigo-700 p-1">
              <div className="relative h-full w-full rounded-xl bg-white">
                <div className="absolute left-3 top-3 pointer-events-none">
                  <Sparkles className="h-4 w-4 text-gray-400" />
                </div>
                <textarea
                  value={sereniChatInput}
                  onChange={(event) => setSereniChatInput(event.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSereniChatSend(sereniChatInput);
                    }
                  }}
                  placeholder="Describe the table, base or view you want to create..."
                  rows={1}
                  className="min-h-[80px] w-full resize-none rounded-xl bg-white pl-10 pr-10 py-2 font-normal text-sm text-[var(--color-text-secondary)] outline-none transition-colors placeholder:text-[var(--color-text-tertiary)]"
                />
                <button
                  type="submit"
                  className={`absolute right-2 bottom-2 inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${!sereniChatInput.trim() || isSendingSereniChat ? 'bg-gray-300 cursor-not-allowed' : 'bg-[var(--color-brand-600)]'}`}
                  disabled={!sereniChatInput.trim() || isSendingSereniChat}
                  aria-label="Send message"
                >
                  {isSendingSereniChat ? (
                    <Loader2 className={`h-4 w-4 animate-spin ${!sereniChatInput.trim() || isSendingSereniChat ? 'text-gray-500' : 'text-black'}`} />
                  ) : (
                    <Send className={`h-4 w-4 ${!sereniChatInput.trim() || isSendingSereniChat ? 'text-gray-600' : 'text-black'}`} />
                  )}
                </button>
              </div>
            </div>
            <p className="mt-2 mb-2 text-xs text-[var(--color-text-tertiary)] text-center">
              AI can make mistakes. Review important outputs carefully.
            </p>
          </div>
        </form>
      </div>
  );
};

export default SereniChatPanel;
