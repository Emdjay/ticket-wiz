"use client";

import { useEffect, useState, useRef } from "react";

interface FlyingElement {
    id: string;
    type: "birds" | "airplane";
    yPosition: number;
    birdCount?: number;
}

export function AnimatedBackground() {
    const [elements, setElements] = useState<FlyingElement[]>([]);
    const idCounterRef = useRef(0);

    useEffect(() => {
        const spawnBirds = () => {
            const id = `birds-${++idCounterRef.current}`;
            const yPosition = 15 + Math.random() * 40;
            const birdCount = 4 + Math.floor(Math.random() * 3);
            setElements((prev) => [...prev, { id, type: "birds", yPosition, birdCount }]);

            setTimeout(() => {
                setElements((prev) => prev.filter((el) => el.id !== id));
            }, 5000);
        };

        const spawnAirplane = () => {
            const id = `airplane-${++idCounterRef.current}`;
            const yPosition = 10 + Math.random() * 30;
            setElements((prev) => [...prev, { id, type: "airplane", yPosition }]);

            setTimeout(() => {
                setElements((prev) => prev.filter((el) => el.id !== id));
            }, 6000);
        };

        // Initial spawn after a short delay
        const initialBirdTimeout = setTimeout(spawnBirds, 2000);
        const initialPlaneTimeout = setTimeout(spawnAirplane, 5000);

        // Set up intervals
        const birdInterval = setInterval(spawnBirds, 10000);
        const planeInterval = setInterval(spawnAirplane, 30000);

        return () => {
            clearTimeout(initialBirdTimeout);
            clearTimeout(initialPlaneTimeout);
            clearInterval(birdInterval);
            clearInterval(planeInterval);
        };
    }, []);

    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {elements.map((element) =>
                element.type === "birds" ? (
                    <BirdFlock key={element.id} yPosition={element.yPosition} birdCount={element.birdCount ?? 5} />
                ) : (
                    <Airplane key={element.id} yPosition={element.yPosition} />
                )
            )}
        </div>
    );
}

function BirdFlock({ yPosition, birdCount }: { yPosition: number; birdCount: number }) {
    // Create a flock of birds in V formation
    const birds = Array.from({ length: birdCount }, (_, i) => ({
        id: i,
        offsetX: i * 12,
        offsetY: Math.abs(i - Math.floor(birdCount / 2)) * 8,
        delay: i * 0.1,
    }));

    return (
        <div
            className="animate-fly-across absolute"
            style={{ top: `${yPosition}%`, left: "-100px" }}
        >
            {birds.map((bird) => (
                <svg
                    key={bird.id}
                    className="absolute animate-bird-flap"
                    style={{
                        left: `${bird.offsetX}px`,
                        top: `${bird.offsetY}px`,
                        animationDelay: `${bird.delay}s`,
                    }}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                >
                    <path
                        d="M2 12C2 12 5 8 12 8C19 8 22 12 22 12"
                        stroke="#1a365d"
                        strokeWidth="2"
                        strokeLinecap="round"
                        opacity="0.6"
                    />
                    <path
                        d="M12 8C12 8 10 4 6 4"
                        stroke="#1a365d"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        opacity="0.6"
                    />
                    <path
                        d="M12 8C12 8 14 4 18 4"
                        stroke="#1a365d"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        opacity="0.6"
                    />
                </svg>
            ))}
        </div>
    );
}

function Airplane({ yPosition }: { yPosition: number }) {
    return (
        <div
            className="animate-fly-airplane absolute"
            style={{ top: `${yPosition}%`, right: "-150px" }}
        >
            {/* Airplane - rotated to fly horizontally facing left */}
            <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                className="-rotate-90"
            >
                <path
                    d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"
                    fill="#1a365d"
                    opacity="0.5"
                />
            </svg>
            {/* Contrail - trailing behind */}
            <div className="absolute -right-[580px] top-1/2 h-[3px] w-[600px] -translate-y-1/2 animate-fade-trail bg-gradient-to-r from-white/80 via-white/40 to-transparent" />
        </div>
    );
}
