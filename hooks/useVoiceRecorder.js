// hooks/useVoiceRecorder.js
import { useState, useRef, useCallback } from "react";

export function useVoiceRecorder() {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [error, setError] = useState(null);
    const [duration, setDuration] = useState(0);

    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);

    const startRecording = useCallback(async () => {
        setError(null);
        setAudioBlob(null);
        setDuration(0);
        chunksRef.current = [];

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const options = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                ? { mimeType: "audio/webm;codecs=opus" }
                : MediaRecorder.isTypeSupported("audio/webm")
                    ? { mimeType: "audio/webm" }
                    : {};

            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, {
                    type: options.mimeType || "audio/webm",
                });
                setAudioBlob(blob);
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.start(250);
            setIsRecording(true);

            // Track duration
            timerRef.current = setInterval(() => {
                setDuration((d) => d + 1);
            }, 1000);
        } catch (err) {
            setError(
                err.name === "NotAllowedError"
                    ? "Microphone access denied. Please allow microphone in browser settings."
                    : "Could not access microphone: " + err.message
            );
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    }, [isRecording]);

    const resetRecording = useCallback(() => {
        setAudioBlob(null);
        setDuration(0);
        setError(null);
        chunksRef.current = [];
    }, []);

    const formattedDuration = `${String(Math.floor(duration / 60)).padStart(
        2,
        "0"
    )}:${String(duration % 60).padStart(2, "0")}`;

    return {
        isRecording,
        audioBlob,
        error,
        duration,
        formattedDuration,
        startRecording,
        stopRecording,
        resetRecording,
    };
}