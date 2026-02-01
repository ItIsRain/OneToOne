/**
 * Voice Server - WebSocket server for AI-powered voice calls
 *
 * This server handles:
 * 1. Initiating outbound calls via Twilio
 * 2. WebSocket connections for Twilio Media Streams
 * 3. Real-time STT → LLM → TTS pipeline
 */

import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import Twilio from "twilio";
import dotenv from "dotenv";
import { CallManager } from "./services/call-manager";
import { CallInitiateRequest, TwilioMediaMessage, CallStatusUpdate } from "./types";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/media-stream" });

const PORT = process.env.VOICE_SERVER_PORT || 3001;
const BASE_URL = process.env.VOICE_SERVER_URL || `http://localhost:${PORT}`;
const MAIN_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Pending calls waiting for WebSocket connection
const pendingCalls: Map<string, CallInitiateRequest> = new Map();

// Call manager instance
const callManager = new CallManager(async (callId, update) => {
  // Callback to notify main app of call updates
  try {
    await fetch(`${MAIN_APP_URL}/api/voice-agent/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "call_update",
        callId,
        ...update,
      }),
    });
  } catch (error) {
    console.error("Failed to send call update:", error);
  }
});

// ============================================================================
// REST API Endpoints
// ============================================================================

/**
 * Health check endpoint
 */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    activeCalls: callManager.getActiveCallIds().length,
    uptime: process.uptime(),
  });
});

/**
 * Initiate a new outbound call
 */
app.post("/initiate", async (req, res) => {
  try {
    const request: CallInitiateRequest = req.body;

    // Validate required fields
    if (!request.tenantId || !request.config?.phoneNumber || !request.config?.systemPrompt) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: tenantId, phoneNumber, systemPrompt",
      });
    }

    // Validate integrations
    if (!request.integrations?.twilio) {
      return res.status(400).json({
        success: false,
        error: "Twilio integration not configured",
      });
    }

    if (!request.integrations?.elevenlabs) {
      return res.status(400).json({
        success: false,
        error: "ElevenLabs integration not configured",
      });
    }

    const aiProvider = request.config.aiProvider || "openai";
    if (aiProvider === "openai" && !request.integrations?.openai) {
      return res.status(400).json({
        success: false,
        error: "OpenAI integration not configured",
      });
    }
    if (aiProvider === "anthropic" && !request.integrations?.anthropic) {
      return res.status(400).json({
        success: false,
        error: "Anthropic integration not configured",
      });
    }

    // Create call in manager
    const callId = callManager.createCall(request);

    // Store for WebSocket connection
    pendingCalls.set(callId, request);

    // Initialize Twilio client
    const twilioClient = Twilio(
      request.integrations.twilio.accountSid,
      request.integrations.twilio.authToken
    );

    // Build TwiML URL for Media Streams
    const twimlUrl = `${BASE_URL}/twiml/${callId}`;

    // Initiate outbound call
    const call = await twilioClient.calls.create({
      to: request.config.phoneNumber,
      from: request.config.fromNumber || request.integrations.twilio.phoneNumber,
      url: twimlUrl,
      statusCallback: `${BASE_URL}/status/${callId}`,
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      statusCallbackMethod: "POST",
      record: request.config.enableRecording || false,
    });

    // Update call with Twilio SID
    callManager.setCallSid(callId, call.sid);

    console.log(`[${callId}] Call initiated: ${call.sid} -> ${request.config.phoneNumber}`);

    res.json({
      success: true,
      callId,
      callSid: call.sid,
    });
  } catch (error) {
    console.error("Error initiating call:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * TwiML endpoint for Twilio to connect Media Streams
 */
app.all("/twiml/:callId", (req, res) => {
  const { callId } = req.params;

  console.log(`[${callId}] TwiML requested`);

  // Generate TwiML for Media Streams
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://${req.get("host")}/media-stream">
      <Parameter name="callId" value="${callId}" />
    </Stream>
  </Connect>
</Response>`;

  res.type("text/xml");
  res.send(twiml);
});

/**
 * Twilio status callback
 */
app.post("/status/:callId", async (req, res) => {
  const { callId } = req.params;
  const { CallSid, CallStatus, CallDuration, RecordingUrl, RecordingSid } = req.body;

  console.log(`[${callId}] Status update: ${CallStatus}`);

  // Map Twilio status to our status
  const statusMap: Record<string, string> = {
    initiated: "initiated",
    ringing: "ringing",
    "in-progress": "in_progress",
    completed: "completed",
    busy: "busy",
    "no-answer": "no_answer",
    failed: "failed",
    canceled: "cancelled",
  };

  const status = statusMap[CallStatus] || CallStatus;

  // If call completed, clean up and send final update
  if (["completed", "busy", "no-answer", "failed", "canceled"].includes(CallStatus)) {
    const callState = callManager.endCall(callId, CallStatus);

    if (callState) {
      // Generate summary
      let summary: string | undefined;
      if (callState.transcript.length > 0) {
        // summary = await callManager.generateSummary(callId);
      }

      // Send final update to main app
      const update: CallStatusUpdate = {
        callId,
        callSid: CallSid,
        status: status as CallStatusUpdate["status"],
        durationSeconds: CallDuration ? parseInt(CallDuration) : undefined,
        recordingUrl: RecordingUrl,
        recordingSid: RecordingSid,
        transcript: callState.transcript,
        summary,
        goalAchieved: callState.goalAchieved,
      };

      try {
        await fetch(`${MAIN_APP_URL}/api/voice-agent/webhook`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "call_completed",
            ...update,
          }),
        });
      } catch (error) {
        console.error("Failed to send completion update:", error);
      }
    }

    // Clean up pending call
    pendingCalls.delete(callId);
  }

  res.sendStatus(200);
});

/**
 * End a call manually
 */
app.post("/end/:callId", async (req, res) => {
  const { callId } = req.params;
  const callState = callManager.getCall(callId);

  if (!callState || !callState.callSid) {
    return res.status(404).json({ error: "Call not found" });
  }

  const request = pendingCalls.get(callId);
  if (!request?.integrations?.twilio) {
    return res.status(400).json({ error: "Twilio integration not found" });
  }

  try {
    const twilioClient = Twilio(
      request.integrations.twilio.accountSid,
      request.integrations.twilio.authToken
    );

    await twilioClient.calls(callState.callSid).update({ status: "completed" });

    res.json({ success: true });
  } catch (error) {
    console.error("Error ending call:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Get call status
 */
app.get("/call/:callId", (req, res) => {
  const { callId } = req.params;
  const callState = callManager.getCall(callId);

  if (!callState) {
    return res.status(404).json({ error: "Call not found" });
  }

  res.json({
    callId,
    callSid: callState.callSid,
    transcript: callState.transcript,
    goalAchieved: callState.goalAchieved,
    messageCount: callState.messages.length,
    durationMs: Date.now() - callState.startTime,
  });
});

// ============================================================================
// WebSocket Handler for Twilio Media Streams
// ============================================================================

wss.on("connection", (ws: WebSocket, req) => {
  console.log("WebSocket connection established");

  let currentCallId: string | null = null;

  ws.on("message", async (data) => {
    try {
      const message: TwilioMediaMessage = JSON.parse(data.toString());

      switch (message.event) {
        case "connected":
          console.log("Media stream connected");
          break;

        case "start":
          if (message.start) {
            const callId = message.start.customParameters?.callId;
            if (callId) {
              currentCallId = callId;
              callManager.setStreamSid(callId, message.start.streamSid);
              await callManager.attachWebSocket(callId, ws);
              console.log(`[${callId}] Media stream started`);
            }
          }
          break;

        case "media":
          if (currentCallId && message.media?.payload) {
            callManager.processAudio(currentCallId, message.media.payload);
          }
          break;

        case "mark":
          // Audio playback mark received
          if (message.mark) {
            console.log(`Mark received: ${message.mark.name}`);
          }
          break;

        case "stop":
          console.log(`[${currentCallId}] Media stream stopped`);
          if (currentCallId) {
            callManager.endCall(currentCallId, "stream_stopped");
          }
          break;
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  });

  ws.on("close", () => {
    console.log(`WebSocket closed for call ${currentCallId}`);
    if (currentCallId) {
      callManager.endCall(currentCallId, "ws_closed");
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
    if (currentCallId) {
      callManager.endCall(currentCallId, "ws_error");
    }
  });
});

// ============================================================================
// Start Server
// ============================================================================

server.listen(PORT, () => {
  console.log(`Voice server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/media-stream`);
  console.log(`REST API: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down...");

  // End all active calls
  for (const callId of callManager.getActiveCallIds()) {
    callManager.endCall(callId, "server_shutdown");
  }

  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
