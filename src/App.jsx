import React, { createContext, useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Play, Pause, SkipBack, SkipForward, Volume2, Search, Settings, Home as HomeIcon, User, Share2, Download, LogOut, Check, ChevronLeft, Plus, Edit2, Trash2, Heart, Shuffle, ListMusic, LayoutGrid, RotateCw, MoreHorizontal, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import { supabase } from './lib/supabase';

// ---- Global Context for Audio Player ----
export const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef(null);

    const [mockSongs, setMockSongs] = useState([]);

    useEffect(() => {
        const fetchRemoteSongs = async () => {
            const { data, error } = await supabase.from('songs').select('*').order('created_at', { ascending: false });
            if (data && data.length > 0) {
                setMockSongs(data);
            } else {
                console.log('Nenhuma canção ou erro:', error);
            }
        };
        fetchRemoteSongs();
    }, []);

    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(e => console.log('Audio play blocked', e));
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, currentSong]);

    const togglePlay = () => setIsPlaying(!isPlaying);

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setProgress(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
        }
    };

    const seek = (e) => {
        const value = e.target.value;
        if (audioRef.current) {
            audioRef.current.currentTime = value;
            setProgress(value);
        }
    };

    const playSong = (song) => {
        if (currentSong?.id === song.id) {
            togglePlay();
        } else {
            setCurrentSong(song);
            setIsPlaying(true);
        }
    };

    const [likedSongs, setLikedSongs] = useState([]);
    const toggleLike = (song) => {
        if (likedSongs.some(s => s.id === song.id)) {
            setLikedSongs(likedSongs.filter(s => s.id !== song.id));
        } else {
            setLikedSongs([...likedSongs, song]);
        }
    };

    return (
        <PlayerContext.Provider value={{
            currentSong, isPlaying, progress, duration, togglePlay, playSong, seek, audioRef,
            mockSongs, setMockSongs, likedSongs, toggleLike
        }}>
            {children}
            <audio
                ref={audioRef}
                src={currentSong?.audio_url}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
            />
        </PlayerContext.Provider>
    );
};

// ---- Components ----

const GlowingBackground = () => (
    <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#0a0a0c]">
        {/* Soft glowing orbs matching the screenshot (purples, pinks, deep blacks) */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/40 rounded-full blur-[120px] mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-fuchsia-900/30 rounded-full blur-[150px] mix-blend-screen"></div>
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-yellow-500/10 rounded-full blur-[100px] mix-blend-screen"></div>
    </div>
);

const FloatingPlayer = () => {
    const { currentSong, isPlaying, togglePlay } = React.useContext(PlayerContext);
    const location = useLocation();
    const navigate = useNavigate();

    // Hide when inside the actual player page or admin/login
    const isExcluded = location.pathname.includes('/song/') || location.pathname.includes('/admin');

    if (!currentSong || isExcluded) return null;

    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-[90px] left-1/2 -translate-x-1/2 w-[90%] glass-card rounded-[30px] p-2 pr-4 flex items-center gap-3 z-40 bg-[#282932]/95 backdrop-blur-3xl border border-white/10 shadow-2xl cursor-pointer shadow-black/50"
            onClick={() => navigate(`/song/${currentSong.id}`)}
        >
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 ml-1">
                <motion.img
                    animate={{ rotate: isPlaying ? 360 : 0 }}
                    transition={{ duration: 10, ease: "linear", repeat: Infinity }}
                    src={currentSong.cover || '/imagem_do_autor.png'}
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="flex-1 min-w-0 pr-2">
                <h4 className="text-white text-sm font-semibold truncate">{currentSong.title}</h4>
                <p className="text-slate-400 text-xs truncate">{currentSong.author}</p>
            </div>

            <div className="flex items-center gap-3">
                <button onClick={(e) => { e.stopPropagation(); /* Prev logic */ }} className="text-white hover:text-[#d4f85e] transition">
                    <SkipBack size={18} fill="currentColor" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                    className="text-white hover:text-[#d4f85e] transition"
                >
                    {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); /* Next logic */ }} className="text-white hover:text-[#d4f85e] transition">
                    <SkipForward size={18} fill="currentColor" />
                </button>
            </div>
        </motion.div>
    );
};

const BottomNav = () => {
    const location = useLocation();
    // Do not show on song detail to mimic the screenshot feeling (or we can keep it, let's keep it hidden on detail to focus on player)
    if (location.pathname.includes('/song/')) return null;

    const navItems = [
        { path: '/home', icon: HomeIcon },
        { path: '/bio', icon: LayoutGrid },
        { path: '/music', icon: ListMusic },
        { path: '/favorites', icon: Heart }
    ];

    return (
        <div className="absolute bottom-6 left-0 w-full z-50 flex justify-center pb-2 pointer-events-none">
            <div className="flex items-center justify-around w-[90%] px-2 py-2 bg-[#282932]/95 backdrop-blur-3xl rounded-[30px] border border-white/5 shadow-2xl shadow-black/60 pointer-events-auto">
                {navItems.map((item, idx) => {
                    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                    const Icon = item.icon;
                    return (
                        <Link
                            key={idx}
                            to={item.path}
                            className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 ${isActive ? 'bg-[#d4f85e] text-[#12130f]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default function App() {
    return (
        <PlayerProvider>
            <Router>
                <div className="min-h-[100dvh] bg-[#050505] flex items-center justify-center overflow-hidden w-full relative sm:p-6">
                    {/* Viewport de Celular para Telas Grandes / Tela Cheia no mobile */}
                    <div className="w-full h-[100dvh] sm:h-[850px] sm:max-w-[400px] sm:rounded-[45px] sm:border-[8px] border-[#18181b] relative bg-[#0a0a0c] overflow-hidden shadow-2xl flex flex-col items-center">
                        <GlowingBackground />
                        <div className="w-full flex-1 overflow-y-auto overflow-x-hidden scrollbar-none pb-32 relative z-10">
                            <Routes>
                                <Route path="/" element={<WelcomeView />} />
                                <Route path="/home" element={<HomeView />} />
                                <Route path="/song/:id" element={<SongDetailView />} />
                                <Route path="/music" element={<MusicListView />} />
                                <Route path="/favorites" element={<FavoritesView />} />
                                <Route path="/bio" element={<BioView />} />
                                <Route path="/admin/*" element={<AdminDashboard />} />
                            </Routes>
                        </div>
                        <FloatingPlayer />
                        <BottomNav />
                    </div>
                </div>
            </Router>
        </PlayerProvider>
    );
}

// ---- Views Sections ----

function WelcomeView() {
    const navigate = useNavigate();

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative w-full h-full flex flex-col justify-end p-6 pb-20 overflow-hidden min-h-screen">
            {/* Background Image filling the screen */}
            <div className="absolute inset-0 z-0">
                <img src="/imagem_do_autor.png" className="w-full h-full object-cover object-top opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/80 to-transparent"></div>
            </div>

            <div className="relative z-10 w-full">
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                >
                    <h1 className="text-white font-extrabold text-5xl mb-2 tracking-tight leading-tight">
                        A Vibe<br />
                        <span className="text-[#d4f85e]">Musical.</span>
                    </h1>
                    <p className="text-slate-400 text-lg mb-8 max-w-[80%]">
                        Mergulhe nas composições inéditas de Paulo Oliveira.
                    </p>
                </motion.div>

                <motion.button
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    onClick={() => navigate('/home')}
                    className="w-full py-4 bg-[#d4f85e] hover:bg-[#bde72c] text-[#12130f] rounded-[24px] font-bold text-lg shadow-[0_0_40px_rgba(212,248,94,0.3)] transition transform active:scale-95 flex items-center justify-center gap-2"
                >
                    Explorar Obras <Play fill="currentColor" size={20} />
                </motion.button>
            </div>
        </motion.div>
    );
}

function HomeView() {
    const { mockSongs, playSong, currentSong, isPlaying, likedSongs, toggleLike } = React.useContext(PlayerContext);
    const navigate = useNavigate();

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
            {/* Top Header */}
            <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 p-0.5">
                        <img src="/imagem_do_autor.png" className="w-full h-full rounded-full object-cover" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Bem-vindo,</p>
                        <h2 className="text-white font-bold text-xl">Fã e Ouvinte</h2>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white"><Search size={18} /></button>
                    <button onClick={() => navigate('/favorites')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#d4f85e] hover:bg-white/10 transition"><Heart size={18} fill="currentColor" /></button>
                </div>
            </div>

            {/* Featured Section */}
            <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold text-xl">O Compositor</h3>
                </div>

                <div
                    onClick={() => navigate('/bio')}
                    className="relative bg-gradient-to-br from-[#d7a1f9] to-[#a273f5] rounded-[32px] p-6 pr-0 overflow-hidden min-h-[220px] flex items-center shadow-lg cursor-pointer hover:shadow-[#d7a1f9]/20 transition-all group"
                >
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>

                    <div className="relative w-[60%] z-10 transition-transform group-hover:translate-x-2">
                        <p className="text-white/90 text-sm mb-1 font-medium">Portfólio Oficial</p>
                        <h4 className="text-white font-bold text-2xl mb-4 leading-tight">Paulo<br />Oliveira</h4>

                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-white/80 text-sm bg-black/20 px-3 py-1.5 rounded-full font-medium flex items-center gap-1">
                                <Plus size={14} /> Ver Biografia
                            </span>
                        </div>
                    </div>

                    <img src="/imagem_do_autor.png" className="absolute right-[-10%] bottom-0 w-[55%] h-full object-cover object-left opacity-90 transition-transform duration-700 group-hover:scale-105" style={{ maskImage: 'linear-gradient(to right, transparent, black 30%)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 30%)' }} />
                </div>
            </div>

            {/* Top Daily Playlists / List */}
            <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold text-xl">Mais Tocadas</h3>
                    <button className="text-slate-400 text-sm hover:text-white">Ver tudo</button>
                </div>

                <div className="space-y-4">
                    {mockSongs.map(song => (
                        <div key={song.id} className="flex items-center p-2 rounded-2xl hover:bg-white/5 transition group cursor-pointer" onClick={() => navigate(`/song/${song.id}`)}>
                            <img src={song.cover || '/imagem_do_autor.png'} className="w-14 h-14 rounded-xl object-cover" />
                            <div className="ml-4 flex-1">
                                <h4 className="text-white font-semibold text-base">{song.title}</h4>
                                <p className="text-slate-400 text-sm">Paulo Oliveira</p>
                            </div>
                            <div className="flex items-center gap-1 mr-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
                                    className={`w-8 h-8 flex items-center justify-center transition-colors ${likedSongs.some(s => s.id === song.id) ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
                                >
                                    <Heart size={18} fill={likedSongs.some(s => s.id === song.id) ? "currentColor" : "none"} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); alert('Adicionado à playlist!'); }}
                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#d4f85e] transition-colors"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); playSong(song); }}
                                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white group-hover:bg-[#d4f85e] group-hover:text-black transition-colors"
                            >
                                {currentSong?.id === song.id && isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

function MusicListView() {
    const { mockSongs, playSong, currentSong, isPlaying, likedSongs, toggleLike } = React.useContext(PlayerContext);
    const navigate = useNavigate();

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mt-2 mb-8">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white">
                    <ChevronLeft size={20} />
                </button>
                <h2 className="text-white font-bold text-lg">Repertório</h2>
                <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white">
                    <MoreHorizontal size={20} />
                </button>
            </div>

            <div className="space-y-4">
                {mockSongs.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 bg-white/5 rounded-2xl">
                        Nenhuma música disponível no momento.
                    </div>
                ) : mockSongs.map(song => (
                    <div key={song.id} className="flex items-center p-2 rounded-2xl bg-white/5 hover:bg-white/10 transition group cursor-pointer" onClick={() => navigate(`/song/${song.id}`)}>
                        <img src={song.cover || '/imagem_do_autor.png'} className="w-16 h-16 rounded-2xl object-cover" />
                        <div className="ml-4 flex-1">
                            <h4 className="text-white font-bold text-base leading-tight">{song.title}</h4>
                            <p className="text-slate-400 text-sm mt-1">{song.author}</p>
                        </div>
                        <div className="flex items-center gap-1 mr-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
                                className={`w-8 h-8 flex items-center justify-center transition-colors ${likedSongs.some(s => s.id === song.id) ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
                            >
                                <Heart size={18} fill={likedSongs.some(s => s.id === song.id) ? "currentColor" : "none"} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); alert('Adicionado à playlist!'); }}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#d4f85e] transition-colors"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); playSong(song); }}
                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-[#d4f85e] group-hover:text-black transition-colors mr-2"
                        >
                            {currentSong?.id === song.id && isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                        </button>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

function SongDetailView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { mockSongs, playSong, currentSong, isPlaying, seek, progress, duration, togglePlay } = React.useContext(PlayerContext);

    const [showQR, setShowQR] = useState(false);
    const song = mockSongs.find(s => s.id === id) || currentSong;
    const isThisPlaying = currentSong?.id === song?.id && isPlaying;

    if (!song) return <div className="text-white p-6">Música não encontrada</div>;

    return (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col min-h-screen px-6 pt-8 pb-10 bg-gradient-to-b from-[#1c1c1e] to-[#0a0a0c]">
            {/* Header */}
            <div className="flex items-center justify-between z-10">
                <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition">
                    <ChevronLeft className="text-white" size={24} />
                </button>
                <span className="text-slate-300 font-medium text-sm tracking-wider uppercase">Now Playing</span>
                <div className="flex gap-2">
                    <a href={song.audio_url} download target="_blank" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition">
                        <Download className="text-white" size={18} />
                    </a>
                    <button className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition" onClick={() => setShowQR(true)}>
                        <Share2 className="text-white" size={18} />
                    </button>
                </div>
            </div>

            {/* Circular Cover Art */}
            <div className="flex-1 flex flex-col items-center justify-center mt-8 z-10 w-full max-w-sm mx-auto">
                <motion.div
                    animate={{ scale: isThisPlaying ? 1.05 : 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="relative w-64 h-64 md:w-80 md:h-80 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] mb-10 mx-auto"
                >
                    <div className="absolute inset-0 rounded-full overflow-hidden">
                        <img src={song.cover || '/imagem_do_autor.png'} className="w-full h-full object-cover" />
                    </div>
                    {/* Inner glowing ring effect if playing */}
                    {isThisPlaying && (
                        <div className="absolute inset-[-10px] rounded-full border-2 border-[#d4f85e] opacity-20 animate-pulse pointer-events-none"></div>
                    )}
                </motion.div>

                {/* Texts */}
                <div className="w-full text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">{song.title}</h1>
                    <p className="text-slate-400 text-lg">{song.author}</p>
                </div>

                {/* Faded Lyrics hint */}
                <div className="mt-8 w-full max-h-24 overflow-y-auto text-center scrollbar-none px-4">
                    <p className="text-slate-500/80 text-sm leading-relaxed whitespace-pre-line italic">
                        {song.lyrics || "Carregando letra..."}
                    </p>
                </div>

                {currentSong?.id === song.id && (
                    <div className="w-full mt-auto pt-8">
                        {/* Progress */}
                        <div className="flex items-center gap-3 w-full text-xs text-slate-400 font-medium font-mono mb-6">
                            <span>{formatTime(progress)}</span>
                            <div className="relative flex-1 h-1.5 bg-white/10 rounded-full">
                                <div
                                    className="absolute top-0 left-0 h-full bg-[#d4f85e] rounded-full"
                                    style={{ width: `${(progress / duration) * 100}%` }}
                                >
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow"></div>
                                </div>
                                <input
                                    type="range" min="0" max={duration || 100} value={progress || 0} onChange={seek}
                                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                                />
                            </div>
                            <span>-{formatTime(duration - progress)}</span>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between px-2">
                            <button className="text-slate-400 hover:text-white transition"><Shuffle size={24} /></button>
                            <button className="text-white hover:text-[#d4f85e] transition" onClick={() => {/* prev */ }}><SkipBack size={32} fill="currentColor" /></button>

                            <button
                                onClick={() => playSong(song)}
                                className="w-20 h-20 rounded-full bg-[#d4f85e] text-[#12130f] flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_30px_rgba(212,248,94,0.3)]"
                            >
                                {isThisPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                            </button>

                            <button className="text-white hover:text-[#d4f85e] transition" onClick={() => {/* next */ }}><SkipForward size={32} fill="currentColor" /></button>
                            <button className="text-slate-400 hover:text-white transition"><ListMusic size={24} /></button>
                        </div>
                    </div>
                )}

                {currentSong?.id !== song.id && (
                    <div className="w-full mt-auto pt-8 flex justify-center">
                        <button
                            onClick={() => playSong(song)}
                            className="w-20 h-20 rounded-full bg-[#d4f85e] text-[#12130f] flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_30px_rgba(212,248,94,0.3)]"
                        >
                            <Play size={32} fill="currentColor" className="ml-1" />
                        </button>
                    </div>
                )}
            </div>

            {showQR && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4" onClick={() => setShowQR(false)}>
                    <div className="glass-card bg-[#1c1c1e] p-8 flex flex-col items-center max-w-sm w-full border border-white/10" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4 text-white text-center">Baixar / Instalar Obra</h3>
                        <div className="bg-white p-4 rounded-xl shrink-0">
                            <QRCode value={window.location.href} size={200} />
                        </div>
                        <p className="text-sm text-slate-400 mt-4 text-center">Escaneie o QRCode acima com a câmera do celular de um amigo para compartilhar essa canção.</p>
                        <button className="mt-8 bg-[#d4f85e] text-[#12130f] px-6 py-3 rounded-full font-bold w-full" onClick={() => setShowQR(false)}>Voltar</button>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

function BioView() {
    const [showAppQR, setShowAppQR] = useState(false);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 pb-24 space-y-8">
            <div className="flex justify-between items-center mt-4">
                <h2 className="text-white font-bold text-2xl">Biografia</h2>
                <button onClick={() => setShowAppQR(true)} className="p-2 bg-white/5 rounded-full text-white hover:text-[#d4f85e] transition">
                    <Share2 size={20} />
                </button>
            </div>

            <div className="glass-card bg-[#1b1c20]/50 p-6 text-center border-none shadow-xl rounded-3xl">
                <img src="/imagem_do_autor.png" className="w-32 h-32 rounded-full mx-auto mb-6 object-cover border-4 border-[#d4f85e]/30" />
                <h1 className="text-2xl font-bold text-white mb-1">Paulo Oliveira</h1>
                <p className="text-[#d4f85e] font-medium text-sm mb-6 uppercase tracking-wider">Compositor</p>

                <p className="text-slate-300 leading-relaxed text-left text-sm italic border-l-2 border-[#d4f85e] pl-4">
                    "Eu sou Paulo Ricardo de Oliveira, tenho 45 anos e gosto de compor desde a minha adolescência. Só agora, graças a Deus, estou realizando um sonho de poder apresentar o meu trabalho."
                </p>
            </div>

            <div className="glass-card bg-[#1b1c20]/50 p-6 rounded-3xl border-none shadow-xl">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
                    <Share2 className="text-[#d4f85e]" /> Contato Rápido
                </h3>
                <div className="space-y-4">
                    <p className="text-slate-400 text-sm mb-4">Para contatos profissionais, parcerias musicais ou eventos, fale diretamente comigo pelo WhatsApp. Será um prazer atendê-lo.</p>
                    <a href="https://wa.me/557588640028" target="_blank" className="w-full py-4 block text-center bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 rounded-2xl font-bold text-lg hover:bg-[#25D366]/20 transition mt-4">
                        Chamar no WhatsApp
                    </a>
                </div>
            </div>

            {showAppQR && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4" onClick={() => setShowAppQR(false)}>
                    <div className="glass-card bg-[#1c1c1e] p-8 flex flex-col items-center max-w-sm w-full border border-white/10" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4 text-white text-center">Compartilhar App</h3>
                        <div className="bg-white p-4 rounded-xl shrink-0">
                            <QRCode value={window.location.href || 'https://vibe-music-player.vercel.app'} size={200} />
                        </div>
                        <p className="text-sm text-slate-400 mt-4 text-center">Mostre este código para alguém instalar este PWA (Portfólio Paulo Oliveira) no celular.</p>
                        <button className="mt-8 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-bold w-full" onClick={() => setShowAppQR(false)}>Fechar</button>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

function FavoritesView() {
    const { likedSongs, playSong, currentSong, isPlaying, toggleLike } = React.useContext(PlayerContext);
    const navigate = useNavigate();

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mt-2 mb-8">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition">
                    <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                    <Heart size={20} className="text-red-500" fill="currentColor" />
                    <h2 className="text-white font-bold text-lg">Favoritas</h2>
                </div>
                <div className="w-10 h-10" />
            </div>

            {likedSongs.length === 0 ? (
                <div className="text-center py-20 px-4">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Heart size={32} className="text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Nenhuma Favorita</h3>
                    <p className="text-slate-400 text-sm">Toque no coração ao lado de uma música para salvá-la aqui.</p>
                    <button onClick={() => navigate('/music')} className="mt-8 px-6 py-3 bg-[#d4f85e] text-[#12130f] font-bold rounded-full">
                        Explorar Músicas
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {likedSongs.map(song => (
                        <div key={song.id} className="flex items-center p-2 rounded-2xl bg-white/5 hover:bg-white/10 transition group cursor-pointer" onClick={() => navigate(`/song/${song.id}`)}>
                            <img src={song.cover || '/imagem_do_autor.png'} className="w-16 h-16 rounded-2xl object-cover" />
                            <div className="ml-4 flex-1">
                                <h4 className="text-white font-bold text-base leading-tight">{song.title}</h4>
                                <p className="text-slate-400 text-sm mt-1">{song.author}</p>
                            </div>
                            <div className="flex items-center gap-1 mr-2 opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
                                    className="w-8 h-8 flex items-center justify-center text-red-500 hover:text-white transition-colors"
                                >
                                    <Heart size={18} fill="currentColor" />
                                </button>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); playSong(song); }}
                                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-[#d4f85e] group-hover:text-black transition-colors mr-2"
                            >
                                {currentSong?.id === song.id && isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}

// ---- Admin Section ----
function AdminDashboard() {
    const { mockSongs } = React.useContext(PlayerContext);
    const [session, setSession] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [editingSong, setEditingSong] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loadingAuth, setLoadingAuth] = useState(true);

    useEffect(() => {
        const storedAuth = localStorage.getItem('vibe_admin_auth');
        if (storedAuth === 'true') {
            setSession(true);
        }
        setLoadingAuth(false);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoadingAuth(true);

        // Validação Hardcoded para pular a dependência do Supabase Auth (E-mails não confirmados)
        if (email === 'paulooliveiracompositor@gmail.com' && password === '!HK$p_4iW!S3pTH') {
            localStorage.setItem('vibe_admin_auth', 'true');
            setSession(true);
        } else {
            alert('Erro no login: Credenciais inválidas (Acesso Negado).');
        }

        setLoadingAuth(false);
    };

    if (loadingAuth) {
        return <div className="h-screen flex items-center justify-center text-[#d4f85e]"><Loader2 size={32} className="animate-spin" /></div>;
    }

    if (!session) {
        return (
            <div className="p-6 pt-20 max-w-sm mx-auto h-screen">
                <div className="glass-card bg-[#1b1c20] p-8 text-center rounded-3xl border border-white/5 flex flex-col items-center">
                    <div className="w-16 h-16 bg-[#d4f85e]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-[#d4f85e]">
                        <Settings size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Área Restrita</h2>
                    <p className="text-slate-400 text-sm mb-8">Faça login para gerenciar as músicas e contatos.</p>

                    <form onSubmit={handleLogin} className="space-y-4 w-full">
                        <input
                            type="email"
                            required
                            placeholder="Email do Administrador"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/30 border border-white/5 rounded-2xl px-4 py-3 text-white focus:border-[#d4f85e] outline-none"
                        />
                        <input
                            type="password"
                            required
                            placeholder="Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/30 border border-white/5 rounded-2xl px-4 py-3 text-white focus:border-[#d4f85e] outline-none"
                        />
                        <button disabled={loadingAuth} type="submit" className="w-full py-4 bg-[#d4f85e] text-[#12130f] rounded-2xl font-bold text-lg transition flex justify-center items-center">
                            Entrar
                        </button>
                    </form>

                    <Link to="/" className="block mt-6 text-slate-500 text-sm hover:text-white">Voltar ao Player</Link>
                </div>
            </div>
        );
    }

    // Salvar Dados com Upload no Storage // Add ou Edit
    const handleSubmitSong = async (e) => {
        e.preventDefault();
        setUploading(true);
        const form = e.target;

        try {
            const title = form.title.value;
            const isrc = form.isrc.value;
            const lyrics = form.lyrics.value;
            const audioFile = form.audio_file.files[0];
            const coverFile = form.cover_file.files[0];
            const audioUrlExt = form.audio_url_ext.value;
            const coverUrlExt = form.cover_url_ext.value;

            let audio_url = editingSong ? editingSong.audio_url : null;
            let cover_url = editingSong ? (editingSong.cover || '/imagem_do_autor.png') : '/imagem_do_autor.png';

            if (!editingSong && !audioFile && !audioUrlExt) {
                alert('Forneça um arquivo de áudio do seu computador OU um Link Externo!');
                setUploading(false);
                return;
            }

            // 1. Audio (URL externa tem prioridade, se vazia, faz upload do arquivo)
            if (audioUrlExt) {
                audio_url = audioUrlExt;
            } else if (audioFile) {
                const audioExt = audioFile.name.split('.').pop();
                const audioFileName = `audio-${Date.now()}.${audioExt}`;
                const { data: audioData, error: audioError } = await supabase.storage
                    .from('msc_media')
                    .upload(`audios/${audioFileName}`, audioFile);

                if (audioError) throw audioError;

                const { data: { publicUrl: newAudioUrl } } = supabase.storage
                    .from('msc_media')
                    .getPublicUrl(`audios/${audioFileName}`);
                audio_url = newAudioUrl;
            }

            // 2. Upload Cover (URL externa tem prioridade)
            if (coverUrlExt) {
                cover_url = coverUrlExt;
            } else if (coverFile) {
                const coverExt = coverFile.name.split('.').pop();
                const coverFileName = `cover-${Date.now()}.${coverExt}`;
                const { error: coverError } = await supabase.storage
                    .from('msc_media')
                    .upload(`covers/${coverFileName}`, coverFile);

                if (coverError) throw coverError;

                const { data: coverUrlData } = supabase.storage
                    .from('msc_media')
                    .getPublicUrl(`covers/${coverFileName}`);
                cover_url = coverUrlData.publicUrl;
            }

            // 3. Insert or Update Row
            if (editingSong) {
                const { error: dbError } = await supabase.from('songs')
                    .update({ title, isrc, lyrics, audio_url, cover: cover_url })
                    .eq('id', editingSong.id);
                if (dbError) throw dbError;
                alert('Sucesso! Obra ATUALIZADA no catálogo.');
            } else {
                const { error: dbError } = await supabase.from('songs').insert([
                    { title, isrc, lyrics, audio_url, cover: cover_url, author: 'Paulo Oliveira' }
                ]);
                if (dbError) throw dbError;
                alert('Sucesso! Obra REGISTRADA no catálogo.');
            }

            setEditingSong(null);
            setIsAdding(false);
            window.location.reload();

        } catch (error) {
            alert('Falha no upload ou salvamento: ' + error.message);
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja apagar essa obra do catálogo?')) {
            await supabase.from('songs').delete().eq('id', id);
            window.location.reload();
        }
    };

    return (
        <div className="p-6 pb-24">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-white">Painel Admin</h2>
                <button onClick={() => { localStorage.removeItem('vibe_admin_auth'); setSession(false); window.location.reload(); }} className="text-red-400 p-2"><LogOut size={20} /></button>
            </div>

            {isAdding || editingSong ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card bg-[#1b1c20] p-6 rounded-3xl border border-white/5 mb-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">{editingSong ? 'Editar Obra' : 'Nova Canção'}</h3>
                        <button onClick={() => { setIsAdding(false); setEditingSong(null); }} className="text-slate-400 hover:text-white"><LogOut size={20} className="rotate-180" /></button>
                    </div>

                    <form key={editingSong ? editingSong.id : 'new-form'} onSubmit={handleSubmitSong} className="space-y-4">
                        <div>
                            <label className="block text-slate-400 text-sm mb-1 ml-2">Título da Canção</label>
                            <input name="title" defaultValue={editingSong?.title || ''} required type="text" placeholder="Ex: Caminho da Flor" className="w-full bg-black/30 border border-white/5 rounded-2xl px-4 py-3 text-white focus:border-[#d4f85e] outline-none" />
                        </div>

                        <div>
                            <label className="block text-slate-400 text-sm mb-1 ml-2">Código de Registro (ISRC/Copyright)</label>
                            <input name="isrc" defaultValue={editingSong?.isrc || ''} type="text" placeholder="Ex: BR-XXX-24-XXXXX" className="w-full bg-black/30 border border-white/5 rounded-2xl px-4 py-3 text-white focus:border-[#d4f85e] outline-none" />
                        </div>

                        <div>
                            <label className="block text-slate-400 text-sm mb-1 ml-2">Letra Completa</label>
                            <textarea name="lyrics" defaultValue={editingSong?.lyrics || ''} rows="5" placeholder="Insira a letra da canção aqui..." className="w-full bg-black/30 border border-white/5 rounded-2xl px-4 py-3 text-white focus:border-[#d4f85e] outline-none"></textarea>
                        </div>

                        <div className="pt-2 border-t border-white/10 mt-4">
                            <label className="block text-white font-bold mb-3">Mídia Principal (Arquivo de Áudio)</label>
                            <div className="space-y-4">
                                <div className="bg-white/5 p-4 rounded-2xl">
                                    <p className="text-sm font-bold text-[#d4f85e] mb-2">Opção 1: Enviar Arquivo Direto</p>
                                    <input name="audio_file" type="file" accept="audio/*" className="w-full bg-black/30 border border-white/5 text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#d4f85e] file:text-[#12130f] hover:file:bg-[#bde72c] cursor-pointer rounded-2xl file:cursor-pointer p-1 transition" />
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl">
                                    <p className="text-sm font-bold text-[#d4f85e] mb-2">Opção 2: Link Externo (Econômico - Nekoweb, etc)</p>
                                    <input name="audio_url_ext" type="text" placeholder="https://..." className="w-full bg-black/30 border border-white/5 rounded-2xl px-4 py-3 text-white focus:border-[#d4f85e] outline-none" />
                                </div>
                                <p className="text-xs text-slate-500 px-2 mt-1">
                                    {editingSong ? 'Deixe em branco para manter o áudio atual.' : 'Preencha apenas UMA das opções acima (.mp3).'}
                                </p>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-white/10 mt-4">
                            <label className="block text-white font-bold mb-3">Capa da Obra (Opcional)</label>
                            <div className="space-y-4">
                                <div className="bg-white/5 p-4 rounded-2xl">
                                    <p className="text-sm font-bold text-white/70 mb-2">Opção 1: Enviar Arquivo Imagem</p>
                                    <input name="cover_file" type="file" accept="image/*" className="w-full bg-black/30 border border-white/5 text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer rounded-2xl file:cursor-pointer p-1 transition" />
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl">
                                    <p className="text-sm font-bold text-white/70 mb-2">Opção 2: Link Externo da Imagem</p>
                                    <input name="cover_url_ext" type="text" placeholder="https://..." className="w-full bg-black/30 border border-white/5 rounded-2xl px-4 py-3 text-white focus:border-[#d4f85e] outline-none" />
                                </div>
                            </div>
                        </div>

                        <button disabled={uploading} type="submit" className="w-full py-4 bg-[#d4f85e] text-[#12130f] rounded-2xl font-bold text-lg hover:bg-[#bde72c] transition shadow-lg mt-6 flex justify-center items-center">
                            {uploading ? <Loader2 className="animate-spin" /> : (editingSong ? 'Atualizar Canção Database' : 'Salvar Canção Database')}
                        </button>
                    </form>
                </motion.div>
            ) : (
                <>
                    <div className="glass-card bg-[#1b1c20] p-5 rounded-3xl border border-white/5 mb-6">
                        <button onClick={() => { setEditingSong(null); setIsAdding(true); }} className="w-full bg-[#d4f85e] text-[#12130f] px-4 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition shadow-lg">
                            <Plus size={20} /> Cadastrar Nova Obra
                        </button>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-4">Obras Registradas</h3>
                    <div className="space-y-3">
                        {mockSongs.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 bg-white/5 rounded-2xl">
                                Nenhuma obra registrada ainda no banco de dados.
                            </div>
                        ) : mockSongs.map(song => (
                            <div key={song.id} className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition rounded-2xl">
                                <div className="flex-1 min-w-0 pr-4">
                                    <h4 className="text-white font-medium truncate">{song.title}</h4>
                                    <p className="text-xs text-slate-400 mt-1 truncate">{song.isrc || 'Sem registro'} • Adicionada recentemente</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingSong(song)} className="p-2 text-slate-400 hover:text-white bg-black/40 rounded-lg"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(song.id)} className="p-2 text-red-500 hover:bg-red-500 hover:text-white transition bg-black/40 rounded-lg"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// Helpers
const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};
