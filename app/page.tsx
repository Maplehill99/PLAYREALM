'use client';

import React from 'react';
// 1. 引入 Variants 类型以修复构建报错
import { motion, Variants } from 'framer-motion'; 
import { Play, Brain, ChevronRight, Menu, CarFront, Sparkles } from 'lucide-react';
import Link from 'next/link';

// --- 1. 顶部导航栏 ---
const Navbar = () => (
  <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-black/10 backdrop-blur-md border-b border-white/10 transition-all">
    <div className="flex items-center gap-2">
      <img 
        src="/logo.png" 
        alt="PlayRealm Logo" 
        className="w-10 h-10 object-contain drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]" 
      />
      <span className="text-white font-bold text-xl tracking-tight">PlayRealm</span>
    </div>
    
    <div className="hidden md:flex gap-8 text-sm font-medium text-gray-300">
      <a href="#adrenaline" className="hover:text-cyan-400 transition-colors scroll-smooth">Games</a>
      <a href="#wellness" className="hover:text-cyan-400 transition-colors scroll-smooth">Wellness</a>
    </div>

   

    <Menu className="md:hidden text-white w-6 h-6" />
  </nav>
);

// --- 2. Hero 区域 ---
const Hero = () => {
  return (
    <div className="relative w-full min-h-screen bg-[#0a0a0f] flex flex-col justify-center items-center overflow-hidden text-center px-4">
      
      <div className="absolute inset-0 w-full h-full z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-60" 
        >
          <source src="https://cdn.midjourney.com/video/a7dcea1f-3b67-4c17-a2ea-460315f43292/2.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute bottom-0 w-full h-40 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-8 mt-10">
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight drop-shadow-2xl"
        >
          The Future of <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500">
            Interactive Play
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto leading-relaxed font-light"
        >
          Experience high-performance gaming meets data-driven digital wellness. One platform, infinite possibilities.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="flex flex-col md:flex-row gap-4 justify-center items-center mt-8"
        >
          <Link href="/games/vegas-run" className="inline-block">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full text-white font-bold text-lg shadow-[0_0_30px_rgba(236,72,153,0.3)] hover:shadow-[0_0_40px_rgba(236,72,153,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              START ENGINE
              <ChevronRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </motion.div>
          </Link>

          <Link href="/games/bubble-realm" className="inline-block">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white/10 border border-white/20 backdrop-blur-md rounded-full text-cyan-300 font-bold text-lg hover:bg-white/20 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Brain className="w-5 h-5" />
              FIND FOCUS
            </motion.div>
          </Link>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-10 text-xs text-gray-400 uppercase tracking-[0.2em]"
      >
        Powered by Next.js & Unreal Engine
      </motion.div>
    </div>
  );
};

// --- 3. Games 游戏板块 ---
const GamesSection = () => {
  // 2. 这里的 : Variants 是修复 Vercel 报错的关键
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i: number) => ({
      opacity: 1, 
      y: 0,
      transition: { delay: i * 0.2, duration: 0.8, ease: "easeOut" },
    }),
  };

  return (
    <section className="w-full py-32 bg-[#0a0a0f] relative overflow-hidden">
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-cyan-400 tracking-[0.2em] uppercase">
            Choose Your Realm
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 tracking-tight">
            Enter the Arena
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Card 1: Vegas Night Run */}
          <motion.div
            id="adrenaline" 
            custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={cardVariants} whileHover={{ scale: 1.02, translateY: -10 }}
            className="group relative p-1 rounded-2xl bg-gradient-to-b from-red-500/20 to-orange-500/5 overflow-hidden transition-all duration-300 hover:shadow-[0_0_50px_rgba(239,68,68,0.2)] scroll-mt-32"
          >
            <div className="absolute inset-0 bg-[#0a0a0f] m-[1px] rounded-2xl" />
            <div className="relative h-full p-8 flex flex-col bg-[#0a0a0f]/80 backdrop-blur-xl rounded-2xl overflow-hidden">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-red-600/20 rounded-full blur-3xl group-hover:bg-red-600/30 transition-all" />
              <div className="mb-6">
                <span className="text-xs font-bold text-red-400 tracking-widest uppercase">Adrenaline Zone</span>
                <h3 className="text-3xl font-bold text-white mt-2 group-hover:text-red-100 transition-colors">Vegas Night Run (Beta)</h3>
              </div>
              <div className="flex-grow flex items-center justify-center py-10">
                <CarFront className="w-24 h-24 text-red-500/80 group-hover:text-red-400 group-hover:scale-110 transition-all duration-500" />
              </div>
              <p className="text-gray-400 mb-8 leading-relaxed">Test your reflexes on the infinite neon track. Featuring global leaderboards and instant-play technology.</p>
              
              <Link href="/games/vegas-run" className="inline-flex items-center gap-2 text-red-400 font-semibold group/link hover:text-red-300 transition-colors">
                Play Now <ChevronRight className="w-5 h-5 transition-transform group-hover/link:translate-x-1" />
              </Link>
            </div>
          </motion.div>

          {/* Card 2: Wellness Hub */}
          <motion.div
            id="wellness"
            custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={cardVariants} whileHover={{ scale: 1.02, translateY: -10 }}
            className="group relative p-1 rounded-2xl bg-gradient-to-b from-cyan-500/20 to-blue-500/5 overflow-hidden transition-all duration-300 hover:shadow-[0_0_50px_rgba(34,211,238,0.2)] scroll-mt-32"
          >
            <div className="absolute inset-0 bg-[#0a0a0f] m-[1px] rounded-2xl" />
            <div className="relative h-full p-8 flex flex-col bg-[#0a0a0f]/80 backdrop-blur-xl rounded-2xl overflow-hidden">
               <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-600/20 rounded-full blur-3xl group-hover:bg-cyan-600/30 transition-all" />
              <div className="mb-6">
                <span className="text-xs font-bold text-cyan-400 tracking-widest uppercase">Wellness Hub</span>
                <h3 className="text-3xl font-bold text-white mt-2 group-hover:text-cyan-100 transition-colors">Bubble Realm</h3>
              </div>
              <div className="flex-grow flex items-center justify-center py-10">
                <Sparkles className="w-24 h-24 text-cyan-500/80 group-hover:text-cyan-400 group-hover:scale-110 transition-all duration-500 group-hover:rotate-12" />
              </div>
              <p className="text-gray-400 mb-8 leading-relaxed">A meditative interactive experience designed to lower stress levels. Digital detox starts here.</p>
              
              <Link href="/games/bubble-realm" className="inline-flex items-center gap-2 text-cyan-400 font-semibold group/link hover:text-cyan-300 transition-colors">
                Start Session <ChevronRight className="w-5 h-5 transition-transform group-hover/link:translate-x-1" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// --- 4. Infrastructure 特性板块 ---
const FeatureSection = () => {
  return (
    <section className="w-full py-32 bg-[#0a0a0f] flex flex-col justify-center items-center text-center px-4 relative">
      <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-3xl mx-auto space-y-6"
      >
        <span className="text-sm font-semibold text-gray-500 tracking-[0.2em] uppercase">Infrastructure</span>
        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Low Latency. High Concurrency.</h2>
        <p className="text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto">PlayRealm is an online interactive gaming platform offering browser-based games and immersive digital play experiences. We specialize in the design and development of high-performance gaming engines, providing web-based solutions that make interactive environments accessible directly through the browser. Our browser-based technology ensures 60FPS performance and real-time connectivity without downloads.</p>
      </motion.div>
    </section>
  );
};

// --- 5. Footer 页脚 ---
const Footer = () => {
  return (
    <footer className="w-full py-12 bg-[#0a0a0f] border-t border-white/5 text-center flex flex-col items-center gap-6">
      <div className="opacity-50 hover:opacity-100 transition-opacity">
        <img 
          src="/logo.png" 
          alt="PlayRealm Footer Logo" 
          className="w-10 h-10 object-contain" 
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-gray-500 text-sm">© 2025 PlayRealm. All Rights Reserved.</p>
        
      </div>
    </footer>
  );
};

// --- 6. 主页面组合 ---
export default function Home() {
  return (
    <main className="bg-[#0a0a0f] min-h-screen scroll-smooth">
      <Navbar />
      <Hero />
      <GamesSection />
      <FeatureSection />
      <Footer />
    </main>
  );
}