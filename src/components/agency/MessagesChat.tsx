"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";

interface Profile {
  id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  status: string | null;
  last_active_at: string | null;
}

interface Conversation {
  id: string;
  participants: Profile[];
  lastMessage: {
    id: string;
    content: string | null;
    type: string;
    file_name: string | null;
    created_at: string;
    sender_id: string;
  } | null;
  lastMessageAt: string;
  unreadCount: number;
}

interface Message {
  id: string;
  content: string | null;
  type: string;
  file_name: string | null;
  file_url: string | null;
  status: string;
  created_at: string;
  sender_id: string;
  sender: Profile;
}

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  status: string | null;
  last_active_at: string | null;
  email: string;
  job_title: string | null;
  is_invite?: boolean;
}

export const MessagesChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<{
    file: File;
    preview: string;
    type: "image" | "file";
  } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Voice and Video recording states
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [pendingVoice, setPendingVoice] = useState<{
    blob: Blob;
    url: string;
    duration: number;
  } | null>(null);
  const [pendingVideo, setPendingVideo] = useState<{
    blob: Blob;
    url: string;
    duration: number;
  } | null>(null);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<{
    blob: Blob;
    url: string;
  } | null>(null);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoChunksRef = useRef<Blob[]>([]);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Common emojis grouped by category
  const emojis = {
    smileys: ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😍", "🥰", "😘", "😋", "😜", "🤪", "😎", "🤩", "🥳"],
    gestures: ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤙", "👋", "🙌", "👏", "🤝", "💪", "🙏", "✍️", "🤳", "💅"],
    hearts: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💕", "💞", "💓", "💗", "💖", "💝", "💘"],
    objects: ["🎉", "🎊", "🎁", "🎈", "✨", "🔥", "💯", "⭐", "🌟", "💫", "🎯", "🏆", "🥇", "📌", "💡", "📎"],
  };

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setIsLoadingConversations(true);
      setError(null);
      const response = await fetch("/api/messages/conversations");
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      } else if (response.status === 401) {
        setError("Please sign in to view messages");
      } else {
        // Don't show error for other statuses, just show empty state
        setConversations([]);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      setError("Unable to load conversations");
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      setIsLoadingMessages(true);
      setMessages([]); // Clear previous messages while loading
      const response = await fetch(`/api/messages/conversations/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setCurrentUserId(data.currentUserId);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to fetch messages:", response.status, errorData);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // Fetch team members for new message modal
  const fetchTeamMembers = useCallback(async () => {
    try {
      setIsLoadingMembers(true);
      const response = await fetch("/api/team/members");
      if (response.ok) {
        const data = await response.json();
        // Filter out pending invites - they don't have profiles yet
        const activeMembers = (data.members || []).filter(
          (m: TeamMember) => !m.is_invite && m.status !== "pending_invite"
        );
        setTeamMembers(activeMembers);
      }
    } catch (error) {
      console.error("Failed to fetch team members:", error);
    } finally {
      setIsLoadingMembers(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowMobileChat(true);
    await fetchMessages(conversation.id);

    // Update unread count locally
    setConversations((prev) =>
      prev.map((c) => (c.id === conversation.id ? { ...c, unreadCount: 0 } : c))
    );
  };

  const handleStartNewConversation = async (member: TeamMember) => {
    try {
      const response = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: member.id }),
      });

      if (response.ok) {
        const data = await response.json();

        // Create or find the conversation
        const newConversation: Conversation = {
          id: data.conversation.id,
          participants: [
            {
              id: member.id,
              first_name: member.first_name,
              last_name: member.last_name,
              avatar_url: member.avatar_url,
              status: member.status,
              last_active_at: member.last_active_at,
            },
          ],
          lastMessage: null,
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0,
        };

        if (data.conversation.isNew) {
          setConversations((prev) => [newConversation, ...prev]);
        }

        setSelectedConversation(newConversation);
        setShowNewMessageModal(false);
        setMemberSearchQuery("");
        setShowMobileChat(true);
        await fetchMessages(data.conversation.id);
      }
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation) return;
    if (!newMessage.trim() && !pendingFile) return;

    // If there's a pending file, upload it first
    if (pendingFile) {
      setIsUploading(true);
      try {
        const base64 = await convertToBase64(pendingFile.file);

        const uploadResponse = await fetch("/api/upload/attachments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file: base64,
            fileName: pendingFile.file.name,
            fileType: pendingFile.file.type,
          }),
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();

          // Send message to API
          const response = await fetch(`/api/messages/conversations/${selectedConversation.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: newMessage.trim() || null,
              type: pendingFile.type,
              fileName: pendingFile.file.name,
              fileUrl: uploadData.url,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            setMessages((prev) => [...prev, data.message]);
            updateConversationLastMessage(data.message);
          }
        } else {
          const errorData = await uploadResponse.json().catch(() => ({}));
          alert(`Failed to upload: ${errorData.error || "Unknown error"}`);
        }
      } catch (error) {
        console.error("Upload error:", error);
        alert("Failed to upload file. Please try again.");
      } finally {
        setIsUploading(false);
        setPendingFile(null);
        setNewMessage("");
      }
    } else {
      // Just text message
      try {
        const response = await fetch(`/api/messages/conversations/${selectedConversation.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: newMessage,
            type: "text",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setMessages((prev) => [...prev, data.message]);
          setNewMessage("");
          updateConversationLastMessage(data.message);
        }
      } catch (error) {
        console.error("Send message error:", error);
      }
    }
  };

  const updateConversationLastMessage = (message: Message) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversation?.id
          ? {
              ...c,
              lastMessage: {
                id: message.id,
                content: message.content,
                type: message.type,
                file_name: message.file_name,
                created_at: message.created_at,
                sender_id: message.sender_id,
              },
              lastMessageAt: message.created_at,
            }
          : c
      )
    );
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedConversation) return;

    const file = e.target.files[0];
    const isImage = file.type.startsWith("image/");

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);

    setPendingFile({
      file,
      preview: previewUrl,
      type: isImage ? "image" : "file",
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const cancelPendingFile = () => {
    if (pendingFile) {
      URL.revokeObjectURL(pendingFile.preview);
      setPendingFile(null);
    }
  };

  // Format recording time as MM:SS
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Start voice recording
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      // Check supported mime types for audio
      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/webm";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "audio/mp4";
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ""; // Let browser choose
          }
        }
      }

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const actualMimeType = mediaRecorder.mimeType || "audio/webm";

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: actualMimeType });
        const url = URL.createObjectURL(blob);
        const duration = recordingTime;
        setPendingVoice({ blob, url, duration });
        setRecordingTime(0);

        // Stop all tracks
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecordingVoice(true);
      setRecordingTime(0);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting voice recording:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  // Stop voice recording
  const stopVoiceRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    setIsRecordingVoice(false);
  };

  // Cancel voice recording
  const cancelVoiceRecording = () => {
    // Stop timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    // Stop media recorder without triggering onstop handler
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }

    // Stop all tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Reset state
    setIsRecordingVoice(false);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  // Cancel pending voice
  const cancelPendingVoice = () => {
    if (pendingVoice) {
      URL.revokeObjectURL(pendingVoice.url);
      setPendingVoice(null);
    }
  };

  // Open camera preview (without recording)
  const openCameraPreview = async () => {
    try {
      setShowVideoRecorder(true);
      setIsCameraReady(false);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      mediaStreamRef.current = stream;

      // Wait a bit for the modal to render, then attach stream
      setTimeout(() => {
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
          videoPreviewRef.current.play().then(() => {
            setIsCameraReady(true);
          }).catch(console.error);
        }
      }, 100);
    } catch (error) {
      console.error("Error accessing camera:", error);
      setShowVideoRecorder(false);
      setIsCameraReady(false);
      alert("Could not access camera. Please check permissions.");
    }
  };

  // Start video recording (called from inside camera preview)
  const startVideoRecording = () => {
    if (!mediaStreamRef.current) return;

    videoChunksRef.current = [];

    // Check supported mime types
    let mimeType = "video/webm;codecs=vp8,opus";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/webm";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/mp4";
      }
    }

    const mediaRecorder = new MediaRecorder(mediaStreamRef.current, { mimeType });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        videoChunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(videoChunksRef.current, { type: mimeType.split(";")[0] });
      const url = URL.createObjectURL(blob);
      const duration = recordingTime;
      setPendingVideo({ blob, url, duration });
      setRecordingTime(0);
      setShowVideoRecorder(false);
      setIsRecordingVideo(false);

      // Stop all tracks
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };

    mediaRecorder.start(1000);
    setIsRecordingVideo(true);
    setRecordingTime(0);

    // Start timer
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  // Take a picture from camera
  const takePicture = () => {
    if (!videoPreviewRef.current || !mediaStreamRef.current) return;

    const video = videoPreviewRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flip horizontally to match the mirrored preview
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setPendingImage({ blob, url });

        // Close camera and stop stream
        setShowVideoRecorder(false);
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
      }
    }, "image/jpeg", 0.9);
  };

  // Cancel pending image
  const cancelPendingImage = () => {
    if (pendingImage) {
      URL.revokeObjectURL(pendingImage.url);
      setPendingImage(null);
    }
  };

  // Send image message
  const sendImageMessage = async () => {
    if (!selectedConversation || !pendingImage) return;

    setIsUploading(true);
    try {
      const base64 = await blobToBase64(pendingImage.blob);
      const fileName = `photo_${Date.now()}.jpg`;

      const uploadResponse = await fetch("/api/upload/attachments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: base64,
          fileName: fileName,
          fileType: "image/jpeg",
        }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        alert(`Upload failed: ${errorData.error || "Unknown error"}`);
        return;
      }

      const uploadData = await uploadResponse.json();

      const response = await fetch(`/api/messages/conversations/${selectedConversation.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: null,
          type: "image",
          fileName: fileName,
          fileUrl: uploadData.url,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        alert(`Failed to send: ${errorData.error || "Unknown error"}`);
        return;
      }

      const data = await response.json();
      setMessages((prev) => [...prev, data.message]);
      updateConversationLastMessage(data.message);
      cancelPendingImage();
    } catch (error) {
      console.error("Send image error:", error);
      alert("Failed to send image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Stop video recording
  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecordingVideo) {
      mediaRecorderRef.current.stop();
      setIsRecordingVideo(false);

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  // Close camera preview / cancel video recording
  const closeCameraPreview = () => {
    // Stop timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    // Stop media recorder without triggering onstop handler
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }

    // Stop all tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Reset state
    setIsRecordingVideo(false);
    setShowVideoRecorder(false);
    setIsCameraReady(false);
    setRecordingTime(0);
    videoChunksRef.current = [];
  };

  // Cancel pending video
  const cancelPendingVideo = () => {
    if (pendingVideo) {
      URL.revokeObjectURL(pendingVideo.url);
      setPendingVideo(null);
    }
  };

  // Convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = () => reject(new Error("Failed to read blob"));
      reader.readAsDataURL(blob);
    });
  };

  // Send voice message
  const sendVoiceMessage = async () => {
    if (!selectedConversation || !pendingVoice) return;

    setIsUploading(true);
    try {
      const base64 = await blobToBase64(pendingVoice.blob);
      const fileName = `voice_${Date.now()}.webm`;

      console.log("Uploading voice message...", {
        blobSize: pendingVoice.blob.size,
        blobType: pendingVoice.blob.type,
        base64Length: base64.length
      });

      const uploadResponse = await fetch("/api/upload/attachments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: base64,
          fileName: fileName,
          fileType: pendingVoice.blob.type || "audio/webm",
        }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        console.error("Upload failed:", errorData);
        alert(`Upload failed: ${errorData.error || "Unknown error"}`);
        return;
      }

      const uploadData = await uploadResponse.json();
      console.log("Upload successful:", uploadData);

      const response = await fetch(`/api/messages/conversations/${selectedConversation.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: null,
          type: "voice",
          fileName: fileName,
          fileUrl: uploadData.url,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Send message failed:", errorData);
        alert(`Failed to send: ${errorData.error || "Unknown error"}`);
        return;
      }

      const data = await response.json();
      setMessages((prev) => [...prev, data.message]);
      updateConversationLastMessage(data.message);
      cancelPendingVoice();
    } catch (error) {
      console.error("Send voice error:", error);
      alert("Failed to send voice message. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Send video message
  const sendVideoMessage = async () => {
    if (!selectedConversation || !pendingVideo) return;

    setIsUploading(true);
    try {
      const base64 = await blobToBase64(pendingVideo.blob);
      const fileName = `video_${Date.now()}.webm`;

      console.log("Uploading video message...", {
        blobSize: pendingVideo.blob.size,
        blobType: pendingVideo.blob.type,
        base64Length: base64.length
      });

      const uploadResponse = await fetch("/api/upload/attachments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: base64,
          fileName: fileName,
          fileType: pendingVideo.blob.type || "video/webm",
        }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        console.error("Upload failed:", errorData);
        alert(`Upload failed: ${errorData.error || "Unknown error"}`);
        return;
      }

      const uploadData = await uploadResponse.json();
      console.log("Upload successful:", uploadData);

      const response = await fetch(`/api/messages/conversations/${selectedConversation.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: null,
          type: "video",
          fileName: fileName,
          fileUrl: uploadData.url,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Send message failed:", errorData);
        alert(`Failed to send: ${errorData.error || "Unknown error"}`);
        return;
      }

      const data = await response.json();
      setMessages((prev) => [...prev, data.message]);
      updateConversationLastMessage(data.message);
      cancelPendingVideo();
    } catch (error) {
      console.error("Send video error:", error);
      alert("Failed to send video message. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const participantName = c.participants
      .map((p) => `${p.first_name} ${p.last_name || ""}`.toLowerCase())
      .join(" ");
    return participantName.includes(searchQuery.toLowerCase());
  });

  // Get IDs of users who already have conversations
  const existingConversationUserIds = new Set(
    conversations.flatMap((c) => c.participants.map((p) => p.id))
  );

  const filteredMembers = teamMembers.filter((m) => {
    // Exclude members who already have a conversation
    if (existingConversationUserIds.has(m.id)) {
      return false;
    }
    const fullName = `${m.first_name} ${m.last_name || ""}`.toLowerCase();
    return (
      fullName.includes(memberSearchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearchQuery.toLowerCase())
    );
  });

  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "active":
      case "online":
        return "bg-success-500";
      case "away":
        return "bg-warning-500";
      default:
        return "bg-gray-400";
    }
  };

  const getInitials = (firstName: string, lastName: string | null) => {
    return `${firstName[0]}${lastName?.[0] || ""}`.toUpperCase();
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

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const getLastSeenText = (lastActiveAt: string | null) => {
    if (!lastActiveAt) return "Offline";
    const date = new Date(lastActiveAt);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMins < 5) return "Online";
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] h-[calc(100vh-180px)] min-h-[600px]">
      <div className="flex h-full">
        {/* Contacts Sidebar */}
        <div className={`relative w-full md:w-80 lg:w-96 border-r border-gray-200 dark:border-gray-800 flex flex-col ${showMobileChat ? "hidden md:flex" : "flex"}`}>
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
            {isLoadingConversations ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-start gap-3 animate-pulse">
                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <p>{error}</p>
                <button
                  onClick={fetchConversations}
                  className="mt-2 text-brand-500 hover:text-brand-600 text-sm"
                >
                  Try again
                </button>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                {conversations.length === 0
                  ? "No conversations yet. Start a new message!"
                  : "No conversations found"}
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const participant = conversation.participants[0];
                // Skip if no participant data (shouldn't happen now)
                if (!participant) {
                  console.warn("Conversation missing participant:", conversation.id);
                  return null;
                }

                return (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800 ${
                      selectedConversation?.id === conversation.id ? "bg-brand-50 dark:bg-brand-500/[0.08]" : ""
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {participant.avatar_url ? (
                        <img
                          src={participant.avatar_url}
                          alt={participant.first_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold ${getAvatarColor(participant.first_name)}`}>
                          {getInitials(participant.first_name, participant.last_name)}
                        </div>
                      )}
                      <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900 ${getStatusColor(participant.status)}`} />
                    </div>

                    {/* Contact Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-medium truncate ${conversation.unreadCount > 0 ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                          {participant.first_name} {participant.last_name || ""}
                        </span>
                        {conversation.lastMessage && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                            {formatMessageTime(conversation.lastMessage.created_at)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${conversation.unreadCount > 0 ? "text-gray-900 dark:text-white font-medium" : "text-gray-500 dark:text-gray-400"}`}>
                          {conversation.lastMessage?.type === "image"
                            ? "Sent an image"
                            : conversation.lastMessage?.type === "file"
                            ? conversation.lastMessage.file_name || "Sent a file"
                            : conversation.lastMessage?.type === "voice"
                            ? "Sent a voice message"
                            : conversation.lastMessage?.type === "video"
                            ? "Sent a video message"
                            : conversation.lastMessage?.content || "No messages yet"}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium text-brand-600 bg-brand-50 dark:bg-brand-500/[0.12] dark:text-brand-400 rounded-full flex-shrink-0 ml-2">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Floating New Message Button */}
          <button
            onClick={() => {
              setShowNewMessageModal(true);
              fetchTeamMembers();
            }}
            className="absolute bottom-6 right-6 w-14 h-14 bg-brand-500 hover:bg-brand-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${!showMobileChat ? "hidden md:flex" : "flex"}`}>
          {selectedConversation ? (
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
                {selectedConversation.participants[0] && (
                  <>
                    <div className="relative">
                      {selectedConversation.participants[0].avatar_url ? (
                        <img
                          src={selectedConversation.participants[0].avatar_url}
                          alt={selectedConversation.participants[0].first_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${getAvatarColor(selectedConversation.participants[0].first_name)}`}>
                          {getInitials(selectedConversation.participants[0].first_name, selectedConversation.participants[0].last_name)}
                        </div>
                      )}
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${getStatusColor(selectedConversation.participants[0].status)}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {selectedConversation.participants[0].first_name} {selectedConversation.participants[0].last_name || ""}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {getLastSeenText(selectedConversation.participants[0].last_active_at)}
                      </p>
                    </div>
                  </>
                )}
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
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isMe = message.sender_id === currentUserId;
                    const showTimestamp = index === 0 || messages[index - 1].sender_id !== message.sender_id;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl ${
                            message.type === "image" ? "p-1" : "px-4 py-2.5"
                          } ${
                            isMe
                              ? "bg-brand-50 text-gray-900 dark:bg-brand-500/[0.15] dark:text-white rounded-br-md"
                              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md shadow-sm border border-gray-100 dark:border-gray-700"
                          }`}
                        >
                          {/* Image Message */}
                          {message.type === "image" && message.file_url && (
                            <div>
                              <a href={message.file_url} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={message.file_url}
                                  alt={message.file_name || "Image"}
                                  className="rounded-xl max-w-full max-h-64 object-cover"
                                />
                              </a>
                              {message.content && (
                                <p className="text-sm whitespace-pre-wrap mt-2 px-2">{message.content}</p>
                              )}
                            </div>
                          )}

                          {/* File Message */}
                          {message.type === "file" && message.file_url && (
                            <a
                              href={message.file_url}
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
                                <p className="text-sm font-medium truncate">{message.file_name}</p>
                                <p className="text-xs text-gray-500">Click to download</p>
                              </div>
                            </a>
                          )}

                          {/* Voice Message */}
                          {message.type === "voice" && message.file_url && (
                            <div className="flex items-center gap-3 min-w-[200px]">
                              <button
                                onClick={(e) => {
                                  const audio = document.getElementById(`audio-${message.id}`) as HTMLAudioElement;
                                  if (audio) {
                                    if (audio.paused) {
                                      // Pause any other playing audio first
                                      document.querySelectorAll("audio").forEach((a) => {
                                        if (a.id !== `audio-${message.id}`) {
                                          a.pause();
                                        }
                                      });
                                      audio.play();
                                      setPlayingAudioId(message.id);
                                    } else {
                                      audio.pause();
                                      setPlayingAudioId(null);
                                    }
                                  }
                                }}
                                className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center flex-shrink-0 hover:bg-brand-600 transition-colors"
                              >
                                {playingAudioId === message.id ? (
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                )}
                              </button>
                              <div className="flex-1">
                                <div className="flex items-center gap-1">
                                  {[...Array(20)].map((_, i) => (
                                    <div
                                      key={i}
                                      className={`w-1 rounded-full transition-colors ${
                                        playingAudioId === message.id ? "bg-brand-500" : "bg-gray-400 dark:bg-gray-500"
                                      }`}
                                      style={{ height: `${Math.random() * 16 + 4}px` }}
                                    />
                                  ))}
                                </div>
                              </div>
                              <audio
                                id={`audio-${message.id}`}
                                src={message.file_url}
                                className="hidden"
                                onEnded={() => setPlayingAudioId(null)}
                                onPause={() => {
                                  if (playingAudioId === message.id) setPlayingAudioId(null);
                                }}
                              />
                            </div>
                          )}

                          {/* Video Message */}
                          {message.type === "video" && message.file_url && (
                            <div className="relative rounded-xl overflow-hidden">
                              <video
                                src={message.file_url}
                                className="max-w-full max-h-64 rounded-xl"
                                controls
                                playsInline
                              />
                            </div>
                          )}

                          {/* Text Message */}
                          {message.type === "text" && (
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          )}

                          <div className={`flex items-center justify-end gap-1 mt-1 ${message.type === "image" ? "px-2 pb-1" : ""} ${isMe ? "text-gray-500 dark:text-gray-400" : "text-gray-400"}`}>
                            <span className="text-xs">
                              {new Date(message.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            </span>
                            {isMe && (
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
                  })
                )}

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

              {/* Camera Modal (Photo & Video) */}
              {showVideoRecorder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
                  <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-2xl" style={{ width: "400px", maxWidth: "90vw" }}>
                    {/* Camera Preview */}
                    <div className="relative aspect-[4/3] bg-black">
                      <video
                        ref={videoPreviewRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                        style={{ transform: "scaleX(-1)" }}
                      />

                      {/* Recording indicator */}
                      {isRecordingVideo && (
                        <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600 rounded-full px-3 py-1">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          <span className="text-white text-xs font-medium">{formatRecordingTime(recordingTime)}</span>
                        </div>
                      )}

                      {/* Loading state - only show when camera not ready yet */}
                      {!isCameraReady && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                          <div className="text-center">
                            <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto mb-2" />
                            <p className="text-white text-xs">Accessing camera...</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-6 p-4 bg-gray-800">
                      {/* Close button */}
                      <button
                        onClick={closeCameraPreview}
                        className="w-10 h-10 rounded-full bg-gray-700 text-white flex items-center justify-center hover:bg-gray-600 transition-colors"
                        title="Close"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>

                      {/* Take Photo button */}
                      <button
                        onClick={takePicture}
                        disabled={isRecordingVideo || !isCameraReady}
                        className="w-12 h-12 rounded-full bg-white text-gray-900 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
                        title="Take photo"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>

                      {/* Record Video button */}
                      <button
                        onClick={isRecordingVideo ? stopVideoRecording : startVideoRecording}
                        disabled={!isCameraReady && !isRecordingVideo}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 ${
                          isRecordingVideo
                            ? "bg-red-500 hover:bg-red-600"
                            : "bg-red-500 hover:bg-red-600"
                        }`}
                        title={isRecordingVideo ? "Stop recording" : "Record video"}
                      >
                        {isRecordingVideo ? (
                          <div className="w-5 h-5 bg-white rounded" />
                        ) : (
                          <div className="w-5 h-5 bg-white rounded-full" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-transparent">
                {/* Voice Recording Indicator */}
                {isRecordingVoice && (
                  <div className="p-4 pb-0">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-red-600 dark:text-red-400 font-medium">Recording...</span>
                        <span className="text-red-500 dark:text-red-400 text-sm">{formatRecordingTime(recordingTime)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={cancelVoiceRecording}
                        className="p-2 text-red-500 hover:text-red-600 dark:text-red-400"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={stopVoiceRecording}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <rect x="6" y="6" width="12" height="12" rx="1" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* Pending Voice Preview */}
                {pendingVoice && !isRecordingVoice && (
                  <div className="p-4 pb-0">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => {
                          const audio = document.getElementById("pending-voice-audio") as HTMLAudioElement;
                          if (audio) {
                            if (audio.paused) {
                              audio.play();
                              setPlayingAudioId("pending");
                            } else {
                              audio.pause();
                              setPlayingAudioId(null);
                            }
                          }
                        }}
                        className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 transition-colors"
                      >
                        {playingAudioId === "pending" ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 flex items-center gap-1">
                        {[...Array(30)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-1 rounded-full transition-colors ${
                              playingAudioId === "pending" ? "bg-brand-500" : "bg-brand-400 dark:bg-brand-500"
                            }`}
                            style={{ height: `${Math.random() * 16 + 4}px` }}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">{formatRecordingTime(pendingVoice.duration)}</span>
                      <button
                        type="button"
                        onClick={cancelPendingVoice}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={sendVoiceMessage}
                        disabled={isUploading}
                        className="p-2 bg-brand-500 text-white rounded-full hover:bg-brand-600 disabled:opacity-50"
                      >
                        {isUploading ? (
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        )}
                      </button>
                      <audio
                        id="pending-voice-audio"
                        src={pendingVoice.url}
                        className="hidden"
                        onEnded={() => setPlayingAudioId(null)}
                        onPause={() => {
                          if (playingAudioId === "pending") setPlayingAudioId(null);
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Pending Video Preview */}
                {pendingVideo && (
                  <div className="p-4 pb-0">
                    <div className="relative inline-block rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <video
                        src={pendingVideo.url}
                        className="max-h-40 max-w-xs"
                        controls
                        playsInline
                      />
                      <button
                        type="button"
                        onClick={cancelPendingVideo}
                        className="absolute top-2 right-2 w-6 h-6 bg-gray-900/70 hover:bg-gray-900 text-white rounded-full flex items-center justify-center transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Video ready to send ({formatRecordingTime(pendingVideo.duration)})
                      </p>
                      <button
                        type="button"
                        onClick={sendVideoMessage}
                        disabled={isUploading}
                        className="text-xs text-brand-500 hover:text-brand-600 font-medium disabled:opacity-50"
                      >
                        {isUploading ? "Sending..." : "Send now"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Pending Image Preview (from camera) */}
                {pendingImage && (
                  <div className="p-4 pb-0">
                    <div className="relative inline-block rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <img
                        src={pendingImage.url}
                        alt="Captured"
                        className="max-h-40 max-w-xs object-contain"
                      />
                      <button
                        type="button"
                        onClick={cancelPendingImage}
                        className="absolute top-2 right-2 w-6 h-6 bg-gray-900/70 hover:bg-gray-900 text-white rounded-full flex items-center justify-center transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Photo ready to send
                      </p>
                      <button
                        type="button"
                        onClick={sendImageMessage}
                        disabled={isUploading}
                        className="text-xs text-brand-500 hover:text-brand-600 font-medium disabled:opacity-50"
                      >
                        {isUploading ? "Sending..." : "Send now"}
                      </button>
                    </div>
                  </div>
                )}

                {/* File Preview */}
                {pendingFile && (
                  <div className="p-4 pb-0">
                    <div className="relative inline-block rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      {pendingFile.type === "image" ? (
                        <img
                          src={pendingFile.preview}
                          alt="Preview"
                          className="max-h-40 max-w-xs object-contain"
                        />
                      ) : (
                        <div className="flex items-center gap-3 p-4 pr-12">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                              {pendingFile.file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(pendingFile.file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      )}
                      {/* Cancel button */}
                      <button
                        type="button"
                        onClick={cancelPendingFile}
                        className="absolute top-2 right-2 w-6 h-6 bg-gray-900/70 hover:bg-gray-900 text-white rounded-full flex items-center justify-center transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Add a caption below (optional), then press send
                    </p>
                  </div>
                )}

                <div className="p-4 flex items-end gap-2">
                  {/* File Attachment Button */}
                  <button
                    type="button"
                    onClick={handleFileAttach}
                    disabled={isUploading || isRecordingVoice || isRecordingVideo || !!pendingVoice || !!pendingVideo}
                    className={`p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 ${isUploading ? "text-brand-500" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`}
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

                  {/* Voice Recording Button */}
                  <button
                    type="button"
                    onClick={isRecordingVoice ? stopVoiceRecording : startVoiceRecording}
                    disabled={isUploading || isRecordingVideo || !!pendingFile || !!pendingVideo}
                    className={`p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors ${
                      isRecordingVoice
                        ? "text-red-500 bg-red-50 dark:bg-red-500/10"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                    title={isRecordingVoice ? "Stop recording" : "Record voice message"}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>

                  {/* Camera Button (Photo & Video) */}
                  <button
                    type="button"
                    onClick={openCameraPreview}
                    disabled={isUploading || isRecordingVoice || isRecordingVideo || !!pendingFile || !!pendingVoice || !!pendingVideo || !!pendingImage}
                    className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 transition-colors"
                    title="Camera (photo or video)"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>

                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={pendingFile ? "Add a caption..." : "Type a message..."}
                      className="w-full h-11 px-4 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-gray-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${showEmojiPicker ? "text-brand-500" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>

                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                      <div
                        ref={emojiPickerRef}
                        className="absolute bottom-full right-0 mb-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3 z-50"
                      >
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {Object.entries(emojis).map(([category, emojiList]) => (
                            <div key={category}>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 capitalize">
                                {category}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {emojiList.map((emoji, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleEmojiSelect(emoji)}
                                    className="w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isUploading || isRecordingVoice || isRecordingVideo || !!pendingVoice || !!pendingVideo || !!pendingImage || (!newMessage.trim() && !pendingFile)}
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
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choose a contact to start messaging</p>
                <button
                  onClick={() => {
                    setShowNewMessageModal(true);
                    fetchTeamMembers();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Message
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">New Message</h3>
                <button
                  onClick={() => {
                    setShowNewMessageModal(false);
                    setMemberSearchQuery("");
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-4 relative">
                <input
                  type="text"
                  placeholder="Search team members..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-gray-500"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Team Members List */}
            <div className="max-h-80 overflow-y-auto">
              {isLoadingMembers ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  {memberSearchQuery
                    ? "No team members found"
                    : "All team members already have conversations"}
                </div>
              ) : (
                filteredMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleStartNewConversation(member)}
                    className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.first_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${getAvatarColor(member.first_name)}`}>
                          {getInitials(member.first_name, member.last_name)}
                        </div>
                      )}
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-900 ${getStatusColor(member.status)}`} />
                    </div>

                    {/* Member Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {member.first_name} {member.last_name || ""}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {member.job_title || member.email}
                      </p>
                    </div>

                    {/* Arrow */}
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
