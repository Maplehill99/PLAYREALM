'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Wind, Activity, MousePointer2, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';

export default function BubbleRealmGame() {
  const [gameState, setGameState] = useState<'start' | 'playing'>('start');
  const [focusScore, setFocusScore] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 音频上下文引用 (用于合成声音，无需下载文件)
  const audioCtxRef = useRef<AudioContext | null>(null);

  // 气泡配置
  const BUBBLE_SPAWN_RATE = 40; 
  let frameCount = 0;

  // 类型定义
  type Bubble = {
    id: number;
    x: number;
    y: number;
    radius: number;
    speed: number;
    wobbleOffset: number;
    color: string;
    opacity: number;
  };

  type Particle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
  };

  // --- 音效系统 (Web Audio API) ---
  const initAudio = () => {
    if (!audioCtxRef.current) {
      // 浏览器策略要求：必须在用户交互后才能创建 AudioContext
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playPopSound = () => {
    if (isMuted || !audioCtxRef.current) return;

    const ctx = audioCtxRef.current;
    const t = ctx.currentTime;

    // 1. 创建振荡器 (声音源)
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // 2. 设置音色 (正弦波最像气泡的声音)
    oscillator.type = 'sine';

    // 3. 设置音调 (随机化一点，听起来更自然、开心)
    // 基础频率在 300Hz - 600Hz 之间，比较清脆
    const frequency = 300 + Math.random() * 300; 
    oscillator.frequency.setValueAtTime(frequency, t);
    // 频率快速下降，模拟气泡破裂的 "Bloop" 声
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.1, t + 0.1);

    // 4. 设置音量包络 (淡入淡出，避免爆音)
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(0.1, t + 0.01); // 快速达到音量 (0.1 避免太吵)
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.1); // 快速消失

    // 5. 播放并销毁
    oscillator.start(t);
    oscillator.stop(t + 0.1);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // --- 游戏逻辑 ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let bubbles: Bubble[] = [];
    let particles: Particle[] = [];
    let animationFrameId: number;
    let mouseX = -1000;
    let mouseY = -1000;
    let spawnCounter = 0;

    const createBubble = (): Bubble => {
      const radius = Math.random() * 20 + 15;
      return {
        id: Math.random(),
        x: Math.random() * canvas.width,
        y: canvas.height + radius,
        radius: radius,
        speed: Math.random() * 1.5 + 0.5,
        wobbleOffset: Math.random() * Math.PI * 2,
        color: `hsl(${Math.random() * 40 + 180}, 90%, 60%)`, 
        opacity: 0,
      };
    };

    const createExplosion = (x: number, y: number, color: string) => {
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1.0,
          color: color,
          size: Math.random() * 3 + 1
        });
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (gameState !== 'playing') return;
      
      // 确保音频系统已启动
      initAudio();

      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        const dist = Math.hypot(px - b.x, py - b.y);
        
        if (dist < b.radius + 15) { // 增加一点判定范围
          createExplosion(b.x, b.y, b.color);
          bubbles.splice(i, 1);
          setFocusScore(prev => prev + 1);
          
          // 播放音效 🎵
          playPopSound();
          
          break; 
        }
      }
    };

    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerdown', handlePointerDown);

    const loop = () => {
      // 背景绘制
      ctx.fillStyle = 'rgba(2, 6, 12, 0.3)'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 生成气泡
      if (gameState === 'playing') {
        spawnCounter++;
        if (spawnCounter > BUBBLE_SPAWN_RATE) {
          bubbles.push(createBubble());
          spawnCounter = 0;
        }
      } else if (gameState === 'start' && bubbles.length < 15) {
          if (Math.random() < 0.05) bubbles.push(createBubble());
      }

      // 更新气泡
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.y -= b.speed;
        b.x += Math.sin(frameCount * 0.02 + b.wobbleOffset) * 0.5;
        
        // 鼠标推开效果
        const dx = b.x - mouseX;
        const dy = b.y - mouseY;
        const dist = Math.hypot(dx, dy);
        if (dist < 100) {
            const angle = Math.atan2(dy, dx);
            const force = (100 - dist) * 0.05;
            b.x += Math.cos(angle) * force;
            b.y += Math.sin(angle) * force;
        }

        if (b.opacity < 1) b.opacity += 0.02;

        if (b.y < -b.radius * 2) {
          bubbles.splice(i, 1);
          continue;
        }

        // 绘制气泡
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        
        const gradient = ctx.createRadialGradient(
            b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.1,
            b.x, b.y, b.radius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, b.color.replace(')', `, ${b.opacity * 0.4})`).replace('hsl', 'hsla'));
        
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 255, 255, ${b.opacity * 0.3})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(b.x - b.radius*0.4, b.y - b.radius*0.4, b.radius*0.2, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,255,255, ${b.opacity * 0.4})`;
        ctx.fill();
      }

      // 更新粒子
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        p.size *= 0.95;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      frameCount++;
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [gameState, isMuted]); // 依赖 isMuted 以确保 sound 函数使用的是最新状态

  // 处理开始游戏 (同时初始化音频)
  const handleStart = () => {
    initAudio();
    setGameState('playing');
  };

  return (
    <div className="w-full h-screen bg-[#020609] text-white overflow-hidden flex flex-col font-sans select-none">
      
      {/* --- HUD --- */}
      <header className="h-16 border-b border-cyan-900/30 flex items-center justify-between px-6 bg-[#050a10]/80 backdrop-blur-md z-30 shrink-0">
        <Link href="/" className="flex items-center gap-2 text-cyan-500/70 hover:text-cyan-400 transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium text-xs tracking-[0.2em]">EXIT</span>
        </Link>
        
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 text-cyan-400/80">
            <Activity className="w-4 h-4 animate-pulse" />
            <span className="text-xs font-mono tracking-widest">FLOW STATE</span>
          </div>
          
          {/* 音效开关按钮 */}
          <button 
            onClick={toggleMute}
            className="flex items-center gap-2 text-cyan-400/60 hover:text-cyan-400 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="text-xs font-mono tracking-widest hidden md:inline">
              {isMuted ? 'MUTE' : 'SOUND ON'}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-cyan-200">
           <span className="text-xs font-light uppercase tracking-widest opacity-60">Focus</span>
           <span className="text-2xl font-thin font-mono">{focusScore}</span>
        </div>
      </header>

      {/* --- Main Visual Area --- */}
      <main className="flex-1 relative w-full h-full overflow-hidden">
        
        {/* 背景 */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020609] via-[#081b26] to-[#0f3042]" />
        <div className="absolute inset-0 opacity-30 pointer-events-none">
             <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(34,211,238,0.1)_0%,transparent_50%)] animate-spin-slow" style={{ animationDuration: '60s' }} />
        </div>

        {/* 交互画布 */}
        <canvas 
          ref={canvasRef}
          className="absolute inset-0 z-10 cursor-crosshair active:cursor-grabbing w-full h-full"
        />

        {/* --- UI Overlays --- */}
        <AnimatePresence>
          {gameState === 'start' && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm"
            >
              <motion.div 
                animate={{ y: [0, -10, 0] }} 
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="mb-8"
              >
                <Wind className="w-16 h-16 text-cyan-300/80 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]" />
              </motion.div>

              <h1 className="text-6xl md:text-7xl font-thin tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-cyan-200 to-blue-400 mb-6 drop-shadow-lg text-center">
                Bubble Realm
              </h1>
              
              <p className="text-cyan-100/70 mb-12 text-center max-w-md font-light leading-relaxed tracking-wide">
                Clear your mind.<br/>
                Pop the bubbles to find your focus.
              </p>
              
              <button 
                onClick={handleStart}
                className="group relative px-12 py-4 bg-cyan-900/40 hover:bg-cyan-800/50 border border-cyan-500/30 rounded-full text-cyan-100 tracking-[0.2em] text-sm transition-all hover:shadow-[0_0_30px_rgba(34,211,238,0.2)] overflow-hidden"
              >
                <span className="relative z-10">BEGIN SESSION</span>
                <div className="absolute inset-0 bg-cyan-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="h-16 bg-[#020609] border-t border-cyan-900/20 flex items-center justify-center gap-16 text-xs text-cyan-600/50 font-medium tracking-widest uppercase z-30 shrink-0">
        <div className="flex items-center gap-2">
          <MousePointer2 className="w-4 h-4" />
          <span>Tap to Pop</span>
        </div>
      </footer>
    </div>
  );
}