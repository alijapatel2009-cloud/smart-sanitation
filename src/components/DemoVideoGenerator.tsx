import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { Video, Play, Loader2, AlertCircle, X, ExternalLink } from "lucide-react";

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function DemoVideoGenerator({ onClose }: { onClose: () => void }) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const generateVideo = async () => {
    setLoading(true);
    setError(null);
    setVideoUrl(null);
    setStatus("Checking API Key...");

    try {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        setStatus("Please select a Paid Gemini API Key...");
        await window.aistudio.openSelectKey();
        // After opening, we assume success as per instructions
      }

      setStatus("Initializing Gemini...");
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      setStatus("Requesting video generation (this may take a few minutes)...");
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: "A high-quality screen recording demo of a mobile application called 'Hygiene Hub'. The UI is clean and modern with a white background and dark zinc accents. It shows a list of public toilets with star ratings and hygiene icons (water, smell, safety). A hand taps an 'Add Facility' button, and a sleek modal slides up with rating sliders and a photo upload area. The app looks professional and user-friendly.",
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '9:16'
        }
      });

      // Poll for completion
      let attempts = 0;
      while (!operation.done) {
        attempts++;
        setStatus(`Generating video... (${attempts * 10}s elapsed)`);
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new Error("Video generation failed - no link returned.");

      setStatus("Downloading video...");
      const response = await fetch(downloadLink, {
        method: 'GET',
        headers: {
          'x-goog-api-key': process.env.API_KEY || '',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError("Requested entity was not found. Please try selecting your API key again.");
          await window.aistudio.openSelectKey();
          return;
        }
        throw new Error(`Failed to download video: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setStatus("Video ready!");
    } catch (err: any) {
      console.error("Video generation error:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/60 backdrop-blur-md p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-white rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-zinc-50 rounded-full hover:bg-zinc-100 transition-colors"
        >
          <X className="w-5 h-5 text-zinc-400" />
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center">
            <Video className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">App Demo Video</h2>
            <p className="text-sm text-zinc-500">Generate an AI-powered demo of Hygiene Hub</p>
          </div>
        </div>

        <div className="bg-zinc-50 rounded-3xl aspect-[9/16] max-h-[400px] flex flex-col items-center justify-center p-8 text-center mb-8 relative overflow-hidden">
          {videoUrl ? (
            <video 
              src={videoUrl} 
              controls 
              autoPlay 
              className="w-full h-full object-cover rounded-2xl"
            />
          ) : loading ? (
            <div className="space-y-4">
              <Loader2 className="w-10 h-10 text-zinc-900 animate-spin mx-auto" />
              <p className="text-sm font-medium text-zinc-900">{status}</p>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Veo 3.1 Fast Preview</p>
            </div>
          ) : error ? (
            <div className="space-y-4 p-4">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
              <p className="text-sm text-red-600 font-medium">{error}</p>
              <button 
                onClick={generateVideo}
                className="text-xs font-bold text-zinc-900 underline"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Play className="w-6 h-6 text-zinc-300" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-zinc-500">Ready to visualize your app?</p>
                <p className="text-[10px] text-zinc-400 px-4">
                  This uses Google's Veo model to create a cinematic demo. Requires a paid Gemini API key.
                </p>
              </div>
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                Billing Info <ExternalLink className="w-2 h-2" />
              </a>
            </div>
          )}
        </div>

        {!videoUrl && !loading && (
          <button 
            onClick={generateVideo}
            className="w-full py-5 bg-zinc-900 text-white rounded-3xl font-bold shadow-xl shadow-zinc-900/20 hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
          >
            <Video className="w-5 h-5" />
            Generate Demo
          </button>
        )}

        {videoUrl && (
          <button 
            onClick={() => {
              const a = document.createElement('a');
              a.href = videoUrl;
              a.download = 'hygiene-hub-demo.mp4';
              a.click();
            }}
            className="w-full py-5 bg-zinc-900 text-white rounded-3xl font-bold shadow-xl shadow-zinc-900/20 hover:bg-zinc-800 transition-colors"
          >
            Download Video
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
