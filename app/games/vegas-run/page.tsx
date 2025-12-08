'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw, Zap, Radio, MousePointer2, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';

export default function VegasRunGame() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [isMuted, setIsMuted] = useState(false); // 静音状态

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // --- 音频系统 Refs ---
  const audioCtxRef = useRef<AudioContext | null>(null);
  const engineOscRef = useRef<OscillatorNode | null>(null);
  const engineGainRef = useRef<GainNode | null>(null);
  
  // 游戏配置
  const GAME_SPEED_BASE = 8;
  let gameSpeed = GAME_SPEED_BASE;
  const PLAYER_SPEED = 6;
  const ROAD_WIDTH = 300;

  // 背景城市元素
  type CityElement = { x: number; y: number; width: number; height: number; color: string; speedFactor: number };
  let cityElements: CityElement[] = [];

  const initCityscape = (width: number, height: number) => {
    cityElements = [];
    for (let i = 0; i < 20; i++) {
      const width = Math.random() * 60 + 40;
      cityElements.push({
        x: Math.random() * width,
        y: Math.random() * height,
        width: width,
        height: Math.random() * 150 + 100,
        color: `hsl(${Math.random() * 60 + 220}, 60%, ${Math.random() * 20 + 10}%)`,
        speedFactor: 0.2,
      });
    }
    for (let i = 0; i < 15; i++) {
      const width = Math.random() * 80 + 50;
      cityElements.push({
        x: Math.random() * width,
        y: Math.random() * height,
        width: width,
        height: Math.random() * 200 + 150,
        color: `hsl(${Math.random() * 360}, 80%, 50%)`,
        speedFactor: 0.6,
      });
    }
  };

  // --- 音效逻辑 ---
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const startEngineSound = () => {
    if (!audioCtxRef.current) initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    // 如果已经在响，先停掉
    if (engineOscRef.current) {
      engineOscRef.current.stop();
      engineOscRef.current.disconnect();
    }

    // 创建引擎振荡器 (锯齿波适合模拟引擎粗糙感)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.value = 80; // 基础频率 (低沉)

    // 连接节点
    osc.connect(gain);
    gain.connect(ctx.destination);

    // 初始音量 (静音时为0)
    gain.gain.value = isMuted ? 0 : 0.05;

    osc.start();

    engineOscRef.current = osc;
    engineGainRef.current = gain;
  };

  const updateEnginePitch = (speed: number) => {
    if (engineOscRef.current && audioCtxRef.current) {
      // 随着速度增加，提高引擎频率 (模拟升档/加速)
      // 基础 80Hz + 速度加成
      const targetFreq = 80 + (speed * 5); 
      engineOscRef.current.frequency.setTargetAtTime(targetFreq, audioCtxRef.current.currentTime, 0.1);
    }
  };

  const stopEngineSound = () => {
    if (engineOscRef.current) {
      // 淡出效果
      if (engineGainRef.current && audioCtxRef.current) {
          engineGainRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.1);
      }
      setTimeout(() => {
          if (engineOscRef.current) {
            engineOscRef.current.stop();
            engineOscRef.current.disconnect();
            engineOscRef.current = null;
          }
      }, 200);
    }
  };

  const playCrashSound = () => {
    if (isMuted || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(10, t + 0.5); // 快速降调，模拟 "Booooom"

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.5);
  };

  // 监听静音切换，实时改变引擎音量
  useEffect(() => {
    if (engineGainRef.current && audioCtxRef.current) {
      const targetVolume = isMuted ? 0 : 0.05;
      engineGainRef.current.gain.setTargetAtTime(targetVolume, audioCtxRef.current.currentTime, 0.1);
    }
  }, [isMuted]);

  // --- 游戏主逻辑 ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const bgCanvas = bgCanvasRef.current;
    if (!canvas || !bgCanvas) return;

    const ctx = canvas.getContext('2d');
    const bgCtx = bgCanvas.getContext('2d');
    if (!ctx || !bgCtx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      bgCanvas.width = rect.width;
      bgCanvas.height = rect.height;
      initCityscape(bgCanvas.width, bgCanvas.height);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let animationFrameId: number;
    let playerX = canvas.width / 2;
    let obstacles: { x: number; y: number; width: number; height: number; speed: number; color: string }[] = [];
    let roadOffset = 0;
    let frameCount = 0;
    let currentScore = 0;
    gameSpeed = GAME_SPEED_BASE;

    const keys: { [key: string]: boolean } = {};
    
    const handleKeyDown = (e: KeyboardEvent) => { keys[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.code] = false; };
    const handlePointerMove = (e: PointerEvent) => {
      if (gameState !== 'playing') return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const roadCenterX = canvas.width / 2;
      const minX = roadCenterX - ROAD_WIDTH / 2 + 20;
      const maxX = roadCenterX + ROAD_WIDTH / 2 - 20;
      playerX = Math.max(minX, Math.min(maxX, x));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerdown', handlePointerMove);

    const gameLoop = () => {
      if (gameState !== 'playing') {
        drawBackground(bgCtx, bgCanvas.width, bgCanvas.height, GAME_SPEED_BASE * 0.5);
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      // 更新引擎音调
      updateEnginePitch(gameSpeed);

      gameSpeed = GAME_SPEED_BASE + Math.floor(currentScore / 500);

      const roadCenterX = canvas.width / 2;
      if ((keys['ArrowLeft'] || keys['KeyA']) && playerX > roadCenterX - ROAD_WIDTH / 2 + 20) {
        playerX -= PLAYER_SPEED;
      }
      if ((keys['ArrowRight'] || keys['KeyD']) && playerX < roadCenterX + ROAD_WIDTH / 2 - 20) {
        playerX += PLAYER_SPEED;
      }

      frameCount++;
      if (frameCount % Math.max(30, 60 - Math.floor(currentScore / 1000)) === 0) {
        const laneWidth = ROAD_WIDTH / 3;
        const lane = Math.floor(Math.random() * 3); 
        const obstacleX = (roadCenterX - ROAD_WIDTH / 2) + lane * laneWidth + (laneWidth - 40) / 2;
        obstacles.push({
          x: obstacleX,
          y: -100,
          width: 40,
          height: 70,
          speed: gameSpeed * (0.8 + Math.random() * 0.4), 
          color: `hsl(${Math.random() * 180 + 180}, 100%, 50%)`
        });
      }

      obstacles.forEach(obs => {
        obs.y += obs.speed;
      });

      if (obstacles.length > 0 && obstacles[0].y > canvas.height + 100) {
        obstacles.shift();
        currentScore += 100;
        setScore(currentScore);
      }

      const playerRect = { x: playerX - 20, y: canvas.height - 150, width: 40, height: 70 };
      for (const obs of obstacles) {
        const padding = 5; 
        if (
          playerRect.x + padding < obs.x + obs.width &&
          playerRect.x + playerRect.width - padding > obs.x &&
          playerRect.y + padding < obs.y + obs.height &&
          playerRect.y + playerRect.height - padding > obs.y
        ) {
          // 游戏结束
          setGameState('gameover');
          stopEngineSound(); // 停止引擎
          playCrashSound(); // 播放撞击
          drawGame(ctx, canvas.width, canvas.height, playerX, obstacles, roadOffset, roadCenterX);
          return;
        }
      }

      drawBackground(bgCtx, bgCanvas.width, bgCanvas.height, gameSpeed);
      drawGame(ctx, canvas.width, canvas.height, playerX, obstacles, roadOffset, roadCenterX);

      roadOffset = (roadOffset + gameSpeed) % 40;
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    // --- 绘图函数保持不变 ---
    const drawBackground = (ctx: CanvasRenderingContext2D, w: number, h: number, speed: number) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, '#020008'); 
      gradient.addColorStop(1, '#2a0033'); 
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      cityElements.forEach(el => {
        el.y += speed * el.speedFactor;
        if (el.y > h) {
          el.y = -el.height; 
          el.x = Math.random() * w; 
        }

        ctx.shadowBlur = el.speedFactor > 0.4 ? 20 : 0; 
        ctx.shadowColor = el.color;
        ctx.fillStyle = el.speedFactor > 0.4 ? '#000' : el.color; 
        ctx.fillRect(el.x, el.y, el.width, el.height);
        
        if (el.speedFactor > 0.4) { 
          ctx.strokeStyle = el.color;
          ctx.lineWidth = 2;
          ctx.strokeRect(el.x, el.y, el.width, el.height);
          ctx.fillStyle = el.color;
          for(let wy = el.y + 10; wy < el.y + el.height - 10; wy += 20) {
             for(let wx = el.x + 5; wx < el.x + el.width - 5; wx += 15) {
                if (Math.random() > 0.7) ctx.fillRect(wx, wy, 5, 8);
             }
          }
        }
        ctx.shadowBlur = 0;
      });
    };

    const drawGame = (ctx: CanvasRenderingContext2D, w: number, h: number, pX: number, obs: any[], rOffset: number, rCenterX: number) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(10, 10, 10, 0.8)';
      ctx.fillRect(rCenterX - ROAD_WIDTH / 2, 0, ROAD_WIDTH, h);

      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ff0055';
      ctx.strokeStyle = '#ff0055';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(rCenterX - ROAD_WIDTH / 2, 0);
      ctx.lineTo(rCenterX - ROAD_WIDTH / 2, h);
      ctx.moveTo(rCenterX + ROAD_WIDTH / 2, 0);
      ctx.lineTo(rCenterX + ROAD_WIDTH / 2, h);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([20, 30]);
      ctx.lineDashOffset = -rOffset;
      ctx.beginPath();
      ctx.moveTo(rCenterX - ROAD_WIDTH / 6, 0);
      ctx.lineTo(rCenterX - ROAD_WIDTH / 6, h);
      ctx.moveTo(rCenterX + ROAD_WIDTH / 6, 0);
      ctx.lineTo(rCenterX + ROAD_WIDTH / 6, h);
      ctx.stroke();
      ctx.setLineDash([]);

      drawCar(ctx, pX, h - 150, '#ff0000', true);
      obs.forEach(o => drawCar(ctx, o.x + o.width / 2, o.y, o.color, false));
    };

    const drawCar = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, isPlayer: boolean) => {
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x - 15, y);
        ctx.lineTo(x + 15, y);
        ctx.lineTo(x + 20, y + 60);
        ctx.lineTo(x - 20, y + 60);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = isPlayer ? '#ffaaaa' : '#ffffff';
        const lightY = isPlayer ? y + 5 : y + 55;
        ctx.fillRect(x - 18, lightY, 8, 4);
        ctx.fillRect(x + 10, lightY, 8, 4);
        
        ctx.fillStyle = '#000';
        ctx.fillRect(x - 12, y + 15, 24, 15);
        ctx.shadowBlur = 0;
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerdown', handlePointerMove);
      // 组件卸载时关闭声音
      stopEngineSound();
    };
  }, [gameState]);

  const handleStartGame = () => {
    initAudio();
    startEngineSound();
    setGameState('playing');
  };

  const restartGame = () => {
    setScore(0);
    startEngineSound();
    setGameState('playing');
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="w-full h-screen bg-[#020008] text-white overflow-hidden flex flex-col select-none touch-none font-sans">
      
      {/* --- HUD --- */}
      <header className="h-16 flex items-center justify-between px-6 bg-black/50 backdrop-blur-md z-30 shrink-0 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-mono text-sm tracking-wider">EXIT</span>
        </Link>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-red-500 animate-pulse">
            <Radio className="w-4 h-4" />
            <span className="text-xs font-bold tracking-widest">LIVE</span>
          </div>
          
          {/* 音量控制按钮 */}
          <button 
            onClick={toggleMute} 
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
             {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
             <span className="text-xs font-mono tracking-widest hidden md:inline">
                {isMuted ? 'MUTE' : 'SOUND ON'}
             </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs font-mono tracking-widest">SCORE</span>
            <span className="font-mono text-2xl text-red-500 font-black tracking-tighter">{score.toString().padStart(6, '0')}</span>
        </div>
      </header>

      {/* --- Main Game Area --- */}
      <main className="flex-1 relative flex items-center justify-center overflow-hidden w-full">
        
        <canvas ref={bgCanvasRef} className="absolute inset-0 w-full h-full object-cover z-0" />
        <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-[#2a0033]/80 via-transparent to-transparent" 
             style={{ transform: 'perspective(1000px) rotateX(60deg) translateY(20%)' }}>
             <div className="w-full h-full bg-[linear-gradient(0deg,transparent_24%,rgba(255,0,100,0.2)_25%,rgba(255,0,100,0.2)_26%,transparent_27%,transparent_74%,rgba(255,0,100,0.2)_75%,rgba(255,0,100,0.2)_76%,transparent_77%),linear-gradient(90deg,transparent_24%,rgba(255,0,100,0.2)_25%,rgba(255,0,100,0.2)_26%,transparent_27%,transparent_74%,rgba(255,0,100,0.2)_75%,rgba(255,0,100,0.2)_76%,transparent_77%)] bg-[length:100px_100px]" />
        </div>
        <canvas ref={canvasRef} className="relative z-20 w-full h-full object-cover cursor-crosshair active:cursor-grabbing" />

        <AnimatePresence>
          {gameState === 'start' && (
            <motion.div 
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }} 
              animate={{ opacity: 1, backdropFilter: 'blur(10px)' }} 
              exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60"
            >
              <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-purple-500 to-orange-500 mb-6 drop-shadow-[0_0_30px_rgba(220,0,100,0.8)] text-center px-4 transform -skew-x-12">
                VEGAS<br/>NIGHT RUN
              </h1>
              <button 
                onClick={handleStartGame}
                className="group relative px-16 py-6 bg-gradient-to-r from-red-600 to-purple-600 text-white font-black text-xl rounded-sm tracking-[0.2em] transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(220,38,100,0.6)] overflow-hidden"
              >
                <span className="relative z-10">START ENGINE</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-red-950/80 backdrop-blur-xl"
            >
              <h2 className="text-6xl font-black text-white mb-2 drop-shadow-[0_0_20px_rgba(255,0,0,1)] italic">WASTED</h2>
              <div className="text-center mb-8">
                <p className="text-red-300 font-mono text-sm tracking-widest mb-1">FINAL SCORE</p>
                <p className="text-5xl font-black text-white tracking-tighter">{score.toString().padStart(6, '0')}</p>
              </div>
              <button 
                onClick={restartGame}
                className="flex items-center gap-3 px-10 py-4 bg-white text-black font-bold rounded-sm hover:bg-gray-200 transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
              >
                <RotateCcw className="w-5 h-5" />
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}