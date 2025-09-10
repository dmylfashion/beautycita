/* ===========================================
   BEAUTYCITA - SECURE CHAT SYSTEM
   =========================================== */

class BeautyCitaChatSystem {
    constructor() {
        this.currentAppointmentId = null;
        this.messages = [];
        this.isVisible = false;
        this.lastMessageTime = null;
        this.messageContainer = null;
        this.inputElement = null;
        this.typingTimeout = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.privacyKeywords = [
            'phone', 'number', 'call', 'text', 'email', '@', '.com', '.net', '.org',
            'facebook', 'instagram', 'twitter', 'snapchat', 'whatsapp', 'telegram',
            'address', 'home', 'meet', 'outside', 'personal', 'private'
        ];
    }

    // Initialize chat system
    init() {
        this.messageContainer = document.getElementById('chatMessages');
        this.inputElement = document.getElementById('chatInput');
        
        if (!this.messageContainer || !this.inputElement) {
            console.warn('Chat elements not found');
            return false;
        }

        this.setupEventListeners();
        return true;
    }

    // Setup event listeners
    setupEventListeners() {
        // Enter key to send message
        this.inputElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Input validation and privacy filtering
        this.inputElement.addEventListener('input', (e) => {
            this.validateInput(e.target.value);
            this.handleTyping();
        });

        // Socket event listeners
        if (BeautyCita.socket) {
            BeautyCita.socket.on('chat_message_received', (data) => {
                this.handleIncomingMessage(data);
            });

            BeautyCita.socket.on('user_typing', (data) => {
                this.handleTypingIndicator(data);
            });

            BeautyCita.socket.on('chat_error', (data) => {
                this.handleChatError(data);
            });
        }
    }

    // Open chat modal for specific appointment
    async openChat(appointmentId, otherUserInfo) {
        if (!BeautyCita.user) {
            BeautyCita.showNotification('Please login to use chat', 'warning');
            return;
        }

        this.currentAppointmentId = appointmentId;
        
        // Update chat header with user info
        this.updateChatHeader(otherUserInfo);
        
        // Load message history
        await this.loadMessages();
        
        // Show modal
        const modal = document.getElementById('chatModal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.isVisible = true;

        // Focus input
        setTimeout(() => {
            if (this.inputElement) {
                this.inputElement.focus();
            }
        }, 300);

        // Join chat room via socket
        if (BeautyCita.socket) {
            BeautyCita.socket.emit('join_chat_room', appointmentId);
        }

        // Mark messages as read
        this.markMessagesAsRead();
    }

    // Close chat modal
    closeChat() {
        const modal = document.getElementById('chatModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        this.isVisible = false;

        // Leave chat room
        if (BeautyCita.socket && this.currentAppointmentId) {
            BeautyCita.socket.emit('leave_chat_room', this.currentAppointmentId);
        }

        this.currentAppointmentId = null;
        this.messages = [];
    }

    // Update chat header with other user info
    updateChatHeader(userInfo) {
        const avatar = document.getElementById('chatUserAvatar');
        const name = document.getElementById('chatUserName');
        const status = document.getElementById('chatUserStatus');

        if (avatar) avatar.src = userInfo.avatar || '/images/default-avatar.png';
        if (name) name.textContent = userInfo.name || 'User';
        if (status) {
            status.textContent = userInfo.online ? 'Online' : 'Offline';
            status.className = userInfo.online ? 'online' : 'offline';
        }
    }

    // Load message history
    async loadMessages() {
        if (!this.currentAppointmentId) return;

        try {
            const response = await BeautyCitaAPI.getChatMessages(this.currentAppointmentId);
            this.messages = response.messages || [];
            this.renderMessages();
        } catch (error) {
            console.error('Failed to load messages:', error);
            BeautyCitaNotifications.show('Failed to load chat history', 'error');
        }
    }

    // Render all messages
    renderMessages() {
        if (!this.messageContainer) return;

        this.messageContainer.innerHTML = this.messages.map(message => 
            this.renderMessage(message)
        ).join('');

        // Scroll to bottom
        this.scrollToBottom();
    }

    // Render single message
    renderMessage(message) {
        const isOwn = message.sender_id === BeautyCita.user?.id;
        const messageClass = isOwn ? 'sent' : 'received';
        const timestamp = this.formatTimestamp(message.created_at);

        return `
            <div class="message ${messageClass}" data-message-id="${message.id}">
                <div class="message-content">
                    ${this.escapeHtml(message.content)}
                    ${message.filtered ? '<div class="privacy-warning"><i class="fas fa-exclamation-triangle"></i> Message filtered for privacy</div>' : ''}
                </div>
                <div class="message-time">${timestamp}</div>
                ${isOwn ? `<div class="message-status">${this.getMessageStatus(message.status)}</div>` : ''}
            </div>
        `;
    }

    // Send message
    async sendMessage() {
        const messageText = this.inputElement.value.trim();
        
        if (!messageText || !this.currentAppointmentId) return;

        // Privacy check
        if (!this.passesPrivacyCheck(messageText)) {
            BeautyCitaNotifications.show(
                'Message blocked: Sharing personal contact information is prohibited', 
                'warning',
                6000
            );
            return;
        }

        // Clear input
        this.inputElement.value = '';
        
        // Create optimistic message
        const optimisticMessage = {
            id: `temp_${Date.now()}`,
            sender_id: BeautyCita.user.id,
            content: messageText,
            status: 'sending',
            created_at: new Date().toISOString(),
            temporary: true
        };

        this.addMessage(optimisticMessage);

        try {
            // Send via API
            const response = await BeautyCitaAPI.sendChatMessage(this.currentAppointmentId, messageText);
            
            // Replace optimistic message with real one
            this.replaceMessage(optimisticMessage.id, response.message);
            
            // Send via socket for real-time delivery
            if (BeautyCita.socket) {
                BeautyCita.socket.emit('chat_message', {
                    appointmentId: this.currentAppointmentId,
                    message: messageText
                });
            }

        } catch (error) {
            console.error('Failed to send message:', error);
            
            // Update optimistic message to show error
            optimisticMessage.status = 'failed';
            optimisticMessage.content += ' (Failed to send)';
            this.replaceMessage(optimisticMessage.id, optimisticMessage);
            
            BeautyCitaNotifications.show('Failed to send message', 'error');
        }
    }

    // Privacy check for message content
    passesPrivacyCheck(message) {
        const lowerMessage = message.toLowerCase();
        
        // Check for privacy keywords
        const hasPrivacyKeyword = this.privacyKeywords.some(keyword => 
            lowerMessage.includes(keyword)
        );

        // Check for phone number patterns
        const phonePattern = /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\(\d{3}\)\s?\d{3}[-.\s]?\d{4})/;
        const hasPhoneNumber = phonePattern.test(message);

        // Check for email patterns
        const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
        const hasEmail = emailPattern.test(message);

        // Check for social media handles
        const socialPattern = /@[a-zA-Z0-9._]+/;
        const hasSocialHandle = socialPattern.test(message);

        return !hasPrivacyKeyword && !hasPhoneNumber && !hasEmail && !hasSocialHandle;
    }

    // Validate input in real-time
    validateInput(value) {
        const inputContainer = this.inputElement.parentElement;
        const existingWarning = inputContainer.querySelector('.privacy-warning');

        if (!this.passesPrivacyCheck(value)) {
            if (!existingWarning) {
                const warning = document.createElement('div');
                warning.className = 'privacy-warning';
                warning.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Personal contact info is not allowed';
                inputContainer.appendChild(warning);
            }
        } else if (existingWarning) {
            existingWarning.remove();
        }
    }

    // Handle typing indicator
    handleTyping() {
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }

        // Send typing indicator via socket
        if (BeautyCita.socket && this.currentAppointmentId) {
            BeautyCita.socket.emit('user_typing', {
                appointmentId: this.currentAppointmentId,
                typing: true
            });
        }

        // Stop typing indicator after 3 seconds
        this.typingTimeout = setTimeout(() => {
            if (BeautyCita.socket && this.currentAppointmentId) {
                BeautyCita.socket.emit('user_typing', {
                    appointmentId: this.currentAppointmentId,
                    typing: false
                });
            }
        }, 3000);
    }

    // Handle incoming typing indicator
    handleTypingIndicator(data) {
        if (data.appointmentId !== this.currentAppointmentId) return;
        if (data.userId === BeautyCita.user?.id) return;

        const typingIndicator = this.messageContainer.querySelector('.typing-indicator');

        if (data.typing) {
            if (!typingIndicator) {
                const indicator = document.createElement('div');
                indicator.className = 'typing-indicator';
                indicator.innerHTML = `
                    <div class="message received">
                        <div class="message-content">
                            <div class="typing-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                `;
                this.messageContainer.appendChild(indicator);
                this.scrollToBottom();
            }
        } else if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Handle incoming message
    handleIncomingMessage(data) {
        if (data.appointmentId !== this.currentAppointmentId) {
            // Show notification for messages in other chats
            BeautyCitaNotifications.showNewMessage(data.senderName);
            return;
        }

        // Remove typing indicator
        const typingIndicator = this.messageContainer.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }

        // Add message
        this.addMessage(data.message);

        // Mark as read if chat is visible
        if (this.isVisible) {
            this.markMessagesAsRead();
        }
    }

    // Handle chat errors
    handleChatError(data) {
        console.error('Chat error:', data);
        BeautyCitaNotifications.show(data.message || 'Chat error occurred', 'error');
    }

    // Add message to chat
    addMessage(message) {
        this.messages.push(message);
        
        // Remove typing indicator if exists
        const typingIndicator = this.messageContainer.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }

        // Add message element
        const messageElement = document.createElement('div');
        messageElement.innerHTML = this.renderMessage(message);
        this.messageContainer.appendChild(messageElement.firstElementChild);

        // Scroll to bottom
        this.scrollToBottom();

        // Show notification sound (if enabled)
        this.playNotificationSound();
    }

    // Replace message (for optimistic updates)
    replaceMessage(tempId, newMessage) {
        const index = this.messages.findIndex(m => m.id === tempId);
        if (index !== -1) {
            this.messages[index] = newMessage;
            
            // Update DOM element
            const messageElement = this.messageContainer.querySelector(`[data-message-id="${tempId}"]`);
            if (messageElement) {
                messageElement.outerHTML = this.renderMessage(newMessage);
            }
        }
    }

    // Mark messages as read
    async markMessagesAsRead() {
        if (!this.currentAppointmentId) return;

        try {
            await BeautyCitaAPI.markMessagesRead(this.currentAppointmentId);
        } catch (error) {
            console.warn('Failed to mark messages as read:', error);
        }
    }

    // Scroll to bottom of messages
    scrollToBottom() {
        if (this.messageContainer) {
            this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
        }
    }

    // Format timestamp for display
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }

    // Get message status icon/text
    getMessageStatus(status) {
        const statusIcons = {
            sending: '<i class="fas fa-clock"></i>',
            sent: '<i class="fas fa-check"></i>',
            delivered: '<i class="fas fa-check-double"></i>',
            read: '<i class="fas fa-check-double text-primary"></i>',
            failed: '<i class="fas fa-exclamation-circle text-error"></i>'
        };
        
        return statusIcons[status] || '';
    }

    // Play notification sound
    playNotificationSound() {
        // Only play if chat is not visible or window is not focused
        if (this.isVisible && document.hasFocus()) return;

        try {
            // Create and play audio element
            const audio = new Audio('/sounds/message-notification.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => {
                // Ignore errors (user hasn't interacted with page yet)
            });
        } catch (error) {
            // Fallback: use system notification
            if (Notification.permission === 'granted') {
                new Notification('New message', {
                    body: 'You have received a new message',
                    icon: '/images/logo-192x192.png',
                    silent: false
                });
            }
        }
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Export chat history (for user download)
    exportChatHistory() {
        if (!this.messages.length) {
            BeautyCitaNotifications.show('No messages to export', 'info');
            return;
        }

        const chatHistory = this.messages.map(message => ({
            timestamp: message.created_at,
            sender: message.sender_id === BeautyCita.user?.id ? 'You' : 'Stylist',
            message: message.content
        }));

        const blob = new Blob([JSON.stringify(chatHistory, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-history-${this.currentAppointmentId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        BeautyCitaNotifications.show('Chat history exported', 'success');
    }

    // Report inappropriate message
    async reportMessage(messageId, reason) {
        try {
            await BeautyCitaAPI.reportMessage(messageId, reason);
            BeautyCitaNotifications.show('Message reported. Thank you for helping keep our platform safe.', 'success');
        } catch (error) {
            console.error('Failed to report message:', error);
            BeautyCitaNotifications.show('Failed to report message', 'error');
        }
    }

    // Block user (emergency feature)
    async blockUser(userId) {
        try {
            await BeautyCitaAPI.blockUser(userId);
            this.closeChat();
            BeautyCitaNotifications.show('User blocked successfully', 'success');
        } catch (error) {
            console.error('Failed to block user:', error);
            BeautyCitaNotifications.show('Failed to block user', 'error');
        }
    }

    // Get chat statistics
    getChatStats() {
        return {
            totalMessages: this.messages.length,
            userMessages: this.messages.filter(m => m.sender_id === BeautyCita.user?.id).length,
            otherMessages: this.messages.filter(m => m.sender_id !== BeautyCita.user?.id).length,
            firstMessage: this.messages[0]?.created_at,
            lastMessage: this.messages[this.messages.length - 1]?.created_at
        };
    }
}

// Global chat system instance
window.BeautyCitaChat = new BeautyCitaChatSystem();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    BeautyCitaChat.init();
});

// Global functions for modal controls
window.BeautyCita.openChat = (appointmentId, otherUserInfo) => {
    BeautyCitaChat.openChat(appointmentId, otherUserInfo);
};

window.BeautyCita.closeChatModal = () => {
    BeautyCitaChat.closeChat();
};

window.BeautyCita.sendChatMessage = () => {
    BeautyCitaChat.sendMessage();
};

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BeautyCitaChatSystem;
}