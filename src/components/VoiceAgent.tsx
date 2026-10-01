'use client';

import { useConversation } from '@elevenlabs/react';
import { useState, useCallback, useEffect, useRef } from 'react';

type ConversationStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';

type LeaveMessageArgs = { name?: unknown; contact?: unknown; message?: unknown };

const str = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

async function leaveMessage(args?: LeaveMessageArgs) {
  const name = str(args?.name);
  const contact = str(args?.contact);
  const message = str(args?.message);
  if (!message) {
    return "No message was provided yet. Ask the visitor what they'd like to tell Bala, then call leave_message again.";
  }

  try {
    const res = await fetch('/api/leave-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, contact, message }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`leave-message ${res.status}`);
    return 'Message emailed to Bala. Confirm to the visitor that it was sent.';
  } catch (error) {
    console.error(error);
    return 'The message could not be sent. Apologize and suggest emailing baladhurgeshbp@gmail.com directly.';
  }
}

export default function VoiceAgent() {
  const [status, setStatus] = useState<ConversationStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showCalendly, setShowCalendly] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      setStatus('connected');
      setErrorMessage(null);
    },
    onDisconnect: () => {
      setStatus('disconnected');
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    },
    onError: (error) => {
      setErrorMessage(typeof error === 'string' ? error : 'An error occurred');
      setStatus('disconnected');
    },
  });

  const requestMicPermission = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      return true;
    } catch {
      setHasPermission(false);
      setErrorMessage('Microphone access is required to talk with the digital twin.');
      return false;
    }
  }, []);

  const startConversation = useCallback(async () => {
    setErrorMessage(null);
    
    if (hasPermission === null || hasPermission === false) {
      const granted = await requestMicPermission();
      if (!granted) return;
    }

    setStatus('connecting');
    
    try {
      const tokenRes = await fetch('/api/conversation-token');
      if (!tokenRes.ok) {
        throw new Error('Could not start a private voice session.');
      }
      const { token } = await tokenRes.json();
      if (!token) {
        throw new Error('Voice session token was missing.');
      }

      await conversation.startSession({
        conversationToken: token,
        connectionType: 'webrtc',
        clientTools: {
          offer_calendly: async () => {
            setShowCalendly(true);
            return 'Showed the 30-minute Calendly link on screen: https://calendly.com/baladhurgeshbp/30min';
          },
          leave_message: leaveMessage,
        },
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to start conversation');
      setStatus('disconnected');
    }
  }, [conversation, hasPermission, requestMicPermission]);

  const endConversation = useCallback(async () => {
    await conversation.endSession();
    setStatus('idle');
  }, [conversation]);

  // Audio visualizer
  useEffect(() => {
    if (status !== 'connected' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const inputData = conversation.getInputByteFrequencyData?.() || new Uint8Array(0);
      const outputData = conversation.getOutputByteFrequencyData?.() || new Uint8Array(0);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.min(centerX, centerY) - 10;

      // Calculate average levels
      const inputLevel = inputData.length > 0 
        ? Array.from(inputData).reduce((a, b) => a + b, 0) / inputData.length / 255
        : 0;
      const outputLevel = outputData.length > 0 
        ? Array.from(outputData).reduce((a, b) => a + b, 0) / outputData.length / 255
        : 0;

      const combinedLevel = Math.max(inputLevel, outputLevel);
      const radius = maxRadius * 0.4 + (maxRadius * 0.6 * combinedLevel);

      // Outer glow
      const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.5, centerX, centerY, radius * 1.5);
      gradient.addColorStop(0, conversation.isSpeaking ? 'rgba(139, 92, 246, 0.4)' : 'rgba(59, 130, 246, 0.4)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Main orb
      const orbGradient = ctx.createRadialGradient(centerX - radius * 0.3, centerY - radius * 0.3, 0, centerX, centerY, radius);
      if (conversation.isSpeaking) {
        orbGradient.addColorStop(0, '#a78bfa');
        orbGradient.addColorStop(0.5, '#8b5cf6');
        orbGradient.addColorStop(1, '#6d28d9');
      } else {
        orbGradient.addColorStop(0, '#93c5fd');
        orbGradient.addColorStop(0.5, '#3b82f6');
        orbGradient.addColorStop(1, '#1d4ed8');
      }
      ctx.fillStyle = orbGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Inner highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(centerX - radius * 0.2, centerY - radius * 0.2, radius * 0.3, 0, Math.PI * 2);
      ctx.fill();

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [status, conversation]);

  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return 'Click to start conversation';
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return conversation.isSpeaking ? 'Bala is speaking...' : 'Listening...';
      case 'disconnected':
        return 'Conversation ended';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return conversation.isSpeaking ? 'text-violet-400' : 'text-blue-400';
      case 'connecting':
        return 'text-amber-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Voice Orb / Visualizer */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-violet-500/20 blur-3xl" />
        
        {status === 'connected' ? (
          <canvas
            ref={canvasRef}
            width={200}
            height={200}
            className="relative z-10"
          />
        ) : (
          <button
            onClick={status === 'idle' || status === 'disconnected' ? startConversation : undefined}
            disabled={status === 'connecting'}
            className={`
              relative z-10 w-[200px] h-[200px] rounded-full
              bg-gradient-to-br from-blue-400 via-blue-500 to-violet-600
              shadow-lg shadow-blue-500/25
              transition-all duration-300 ease-out
              ${status === 'idle' || status === 'disconnected' 
                ? 'hover:scale-105 hover:shadow-blue-500/40 hover:shadow-xl cursor-pointer' 
                : ''
              }
              ${status === 'connecting' ? 'animate-pulse' : ''}
              flex items-center justify-center
            `}
          >
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
            <svg
              className="w-16 h-16 text-white/90"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Status Text */}
      <p className={`text-sm font-medium ${getStatusColor()} transition-colors duration-300`}>
        {getStatusText()}
      </p>

      {showCalendly && (
        <a
          href="https://calendly.com/baladhurgeshbp/30min"
          target="_blank"
          rel="noreferrer"
          className="px-6 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors"
        >
          Book 30 minutes
        </a>
      )}

      {/* End Conversation Button */}
      {status === 'connected' && (
        <button
          onClick={endConversation}
          className="px-6 py-2 rounded-full bg-slate-800/50 border border-slate-700 text-slate-300 
                     hover:bg-red-900/50 hover:border-red-700 hover:text-red-300
                     transition-all duration-200 text-sm font-medium"
        >
          End Conversation
        </button>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="max-w-sm p-4 rounded-lg bg-red-900/20 border border-red-800/50 text-red-300 text-sm text-center">
          {errorMessage}
        </div>
      )}

      {/* Permission Prompt */}
      {hasPermission === false && (
        <button
          onClick={requestMicPermission}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
        >
          Grant Microphone Access
        </button>
      )}
    </div>
  );
}

