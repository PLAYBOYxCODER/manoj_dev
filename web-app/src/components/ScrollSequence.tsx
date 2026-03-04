"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";

export default function ScrollSequence() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { scrollYProgress } = useScroll();
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const imagesRef = useRef<HTMLImageElement[]>([]);

    const frameCount = 240; // Total number of frames we unzipped

    useEffect(() => {
        // Preload images
        const loadImages = async () => {
            const promises = [];
            for (let i = 1; i <= frameCount; i++) {
                promises.push(
                    new Promise<HTMLImageElement>((resolve) => {
                        const img = new Image();
                        img.src = `/frame-data/frame_${String(i).padStart(4, "0")}.jpg`;
                        img.onload = () => resolve(img);
                    })
                );
            }

            imagesRef.current = await Promise.all(promises);
            setImagesLoaded(true);

            // Draw first frame immediately
            if (canvasRef.current && imagesRef.current[0]) {
                const ctx = canvasRef.current.getContext("2d");
                const img = imagesRef.current[0];

                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;

                // Draw to cover the screen
                drawCenteredCover(ctx, img, canvasRef.current);
            }
        };

        loadImages();

        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        if (!imagesLoaded || !canvasRef.current) return;

        // Map scroll progress (0 to 1) to frame index (0 to 239)
        const frameIndex = Math.min(
            frameCount - 1,
            Math.floor(latest * frameCount)
        );

        const img = imagesRef.current[frameIndex];
        if (img) {
            const ctx = canvasRef.current.getContext("2d");
            drawCenteredCover(ctx, img, canvasRef.current);
        }
    });

    const drawCenteredCover = (ctx: CanvasRenderingContext2D | null, img: HTMLImageElement, canvas: HTMLCanvasElement) => {
        if (!ctx) return;

        // Calculate scale to cover canvas
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width / 2) - (img.width / 2) * scale;
        const y = (canvas.height / 2) - (img.height / 2) * scale;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        // Add dark overlay to make text readable
        ctx.fillStyle = "rgba(10, 10, 10, 0.6)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    return (
        <div className="fixed inset-0 w-full h-full -z-50 bg-[#0a0a0a] pointer-events-none">
            <canvas
                ref={canvasRef}
                className="w-full h-full object-cover transition-opacity duration-1000"
                style={{ opacity: imagesLoaded ? 1 : 0 }}
            />
            {!imagesLoaded && (
                <div className="absolute inset-0 flex items-center justify-center text-[#D4AF37] font-semibold tracking-widest text-sm uppercase">
                    Loading Royal Experience...
                </div>
            )}
        </div>
    );
}
