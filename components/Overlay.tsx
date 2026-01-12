"use client";

import { useStore } from "@/store";
import { projects } from "@/data/projects";

export const Overlay = () => {
  const { activeProject, toggleMute, isMuted, focus, setFocus, setActiveProject } = useStore();
  const project = activeProject !== null ? projects[activeProject] : null;
  // Fonction de style pour les boutons
const navItemClass = (isActive: boolean) => 
    `cursor-pointer m-10 text-sm font-bold uppercase tracking-[0.25em] transition-all duration-300 bg-transparent text-white ${
      isActive 
      ? "drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] scale-110" 
      : "hover:scale-105"
    }`;
    

  return (
    <div className="w-full h-full text-white pointer-events-none antialiased font-sans"> 
{/* --- MENU PRINCIPAL --- */}
      {/* On utilise la classe .menu-position définie dans le CSS */}
      <div className="menu-position pointer-events-auto">
       <nav className="flex items-center">
            {/* BOUTON MOI */}
            <button 
                style={{ color: 'white' }}
                className={navItemClass(focus === 'poster')}
                onClick={() => { setFocus('poster'); setActiveProject(null); }}
            >
                Moi
            </button>

            {/* BOUTON SKILLS */}
            <button 
                style={{ color: 'white' }}
                className={navItemClass(focus === 'record')}
                onClick={() => { setFocus('record'); setActiveProject(null); }}
            >
                Skills
            </button>

            {/* --- NOUVEAU : BOUTON EXPÉRIENCE --- */}
            <button 
                style={{ color: 'white' }}
                className={navItemClass(focus === 'experience')}
                onClick={() => { setFocus('experience'); setActiveProject(null); }}
            >
                Expérience
            </button>

            {/* BOUTON PROJETS */}
            <button 
                style={{ color: 'white' }}
                className={navItemClass(focus === 'turntable')}
                onClick={(e) => { 
                    e.stopPropagation(); 
                    setFocus('turntable'); 
                    setActiveProject(null); 
                }}
            >
                Projets
            </button>

            {/* BOUTON CONTACT */}
            <a 
                href="mailto:tonemail@exemple.com"
                style={{ color: 'white', textDecoration: 'none' }}
                className={`${navItemClass(false)} !text-white hover:!text-white`}
            >
                Contact
            </a>
        </nav>
      </div>
      {/* --- EN-TÊTE --- */}
      <div className="fixed top-0 w-full p-8 flex justify-between items-center z-50">
        <div className="pointer-events-auto">
            {focus !== 'intro' ? (
            <button 
                onClick={() => { setFocus('intro'); setActiveProject(null); }}
                className="group flex items-center gap-2 border border-white/20 bg-black/20 backdrop-blur-md px-5 py-2.5 rounded-full hover:bg-white hover:border-white transition-all duration-300"
            >
                <span className="text-white group-hover:text-black text-[10px] font-bold uppercase tracking-widest transition-colors">
                   ← Retour
                </span>
            </button>
            ) : <div />}
        </div>

        <button 
          onClick={toggleMute}
          className="group border border-white/20 bg-black/20 backdrop-blur-md px-5 py-2.5 rounded-full hover:bg-white hover:border-white transition-all duration-300 pointer-events-auto"
        >
          <span className="text-white group-hover:text-black text-[10px] font-bold uppercase tracking-widest transition-colors">
            {isMuted ? 'Muted' : 'Sound On'}
            <span className={`ml-2 inline-block w-2 h-2 rounded-full ${isMuted ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></span>
          </span>
        </button>
      </div>


      {/* === MODE PROJET === */}
      {focus === 'turntable' && project && (
        <>
        {/* BLOC GAUCHE - PROJET (Modifié : Gros texte, fond sombre, pas de bordures) */}
          <div 
            className="fixed bottom-20 z-30 pointer-events-auto"
            style={{ left: '5%', width: '600px' }} 
          >
              {/* TITRE ENORME */}
              <h2 className="text-8xl font-black mb-6 text-white leading-[0.8] tracking-tighter drop-shadow-2xl">
                {project.title}
              </h2>
              
              {/* Conteneur sombre (Dark Glass) au lieu de blanc */}
              <div className="bg-black/40 backdrop-blur-xl p-8 rounded-3xl shadow-2xl">
                
                {/* Info (ID / Date) */}
                <div className="flex gap-4 mb-6 border-b border-white/20 pb-4">
                    <span className="font-mono text-xs text-white/50 uppercase tracking-widest">
                        ID: {project.id < 10 ? `0${project.id}` : project.id}
                    </span>
                    <span className="font-mono text-xs text-white/50 uppercase tracking-widest">
                        2024
                    </span>
                </div>

                {/* Description en plus gros et blanc */}
                <p className="text-xl leading-relaxed text-white/90 font-light mb-8">
                    {project.description}
                </p>
                
                {/* Boutons stylisés blancs */}
                <div className="flex gap-4">
                    <a 
                        href={project.link} 
                        target="_blank" 
                        className="px-8 py-4 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-lg hover:scale-105 transition-transform"
                    >
                      Live Demo
                    </a>
                    <a 
                        href={project.github} 
                        target="_blank" 
                        className="px-8 py-4 border border-white/20 text-white font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-white/10 transition-colors"
                    >
                      Code
                    </a>
                </div>
              </div>
          </div>

          {/* BLOC DROITE */}
          <div 
            className="fixed top-0 h-screen w-[500px] bg-[#0a0a0a] border-l border-white/5 overflow-y-auto pointer-events-auto z-20 shadow-2xl"
            style={{ right: '0px' }} 
          >
             <div className="flex flex-col">
                <div className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur z-10 p-8 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-white/40 text-[10px] tracking-[0.3em] uppercase font-bold">
                        Visual Assets
                    </h3>
                </div>

                <div className="p-8 flex flex-col gap-8">
                    {(project.gallery && project.gallery.length > 0 ? project.gallery : [project.screenshot]).map((img, index) => (
                    <div key={index} className="group relative">
                        <div className="overflow-hidden rounded-md border border-white/10 bg-white/5 transition-colors group-hover:border-white/30">
                            <img 
                                src={img} 
                                alt={`View ${index}`} 
                                className="w-full h-auto object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" 
                            />
                        </div>
                        <div className="mt-2 flex justify-between items-center px-1">
                            <span className="text-[9px] font-mono text-white/30">FIG. 0{index + 1}</span>
                        </div>
                    </div>
                    ))}
                    
                    <div className="h-24 flex items-center justify-center border-t border-white/5 mt-8">
                        <span className="text-white/20 text-[9px] tracking-[0.3em] uppercase">End of List</span>
                    </div>
                </div>
             </div>
          </div>
        </>
      )}


      {/* === AUTRES MODES === */}
      
 {/* POSTER (Bio - VERSION CSS CLEAN) */}
      {focus === 'poster' && (
        <div className="poster-container">
            
            <h1 className="poster-title">
              Hello.
            </h1>
            
            <div className="poster-separator"></div>
            
            <div className="flex flex-col gap-6">
                <p className="poster-identity">
                    I am <strong className="font-bold text-white">Raphaël Liberge</strong>.
                </p>

                <p className="poster-bio">
                    Student at <strong>IUT Vélizy in France</strong>, I design impactful visual experiences. My hybrid profile blends <strong>Art Direction</strong>, <strong>Audiovisual Tech</strong>, and <strong>Social Media Strategy</strong>.
                </p>

                <div className="poster-quote-box">
                    <p className="poster-quote-text">
                        "Looking for a stimulating internship to leverage my creativity and technical versatility."
                    </p>
                </div>

                <p className="poster-footer">
                    Diligent • Rigorous • Cheerful • Proactive
                </p>
            </div>
        </div>
      )}
     {/* EXPÉRIENCE (STYLE SKILLS / TIMELINE) */}
      {focus === 'experience' && (
        <div className="experience-container">
            <h2 className="experience-title">
                Experience
            </h2>
            
            <div className="flex flex-col">
                
                {/* ITEM 1: FREELANCE */}
                <div className="experience-item">
                    <div className="experience-year">2024 — Now</div>
                    <div className="experience-content">
                        <h3>360° Artist Manager & Art Director</h3>
                        <span className="experience-context">Freelance • For @MEWA & @BVNBAN</span>
                        <ul className="experience-desc list-disc pl-5 mt-2 space-y-1">
                            <li><b>Career Management:</b> Full-stack management of the artists' careers and brand image.</li>
                            <li><b>Music Marketing & PR:</b> Launch strategies, press relations, and editorial calendar.</li>
                            <li><b>Art Direction & Production:</b> Visual identities (Covers), music video direction & editing.</li>
                            <li><b>Distribution:</b> Digital distribution (Spotify, Apple Music, Deezer) via aggregators.</li>
                        </ul>
                    </div>
                </div>

                {/* ITEM 2: UN FESTIVALISTE */}
                <div className="experience-item">
                    <div className="experience-year">Internship 01/2025 — 02/2025</div>
                    <div className="experience-content">
                        <h3>Community Manager & Videographer</h3>
                        <span className="experience-context">Un Festivaliste</span>
                        <ul className="experience-desc list-disc pl-5 mt-2 space-y-1">
                            <li><b>Content Creation:</b> Produced Reels and posts to promote YouTube content.</li>
                            <li><b>Social Media:</b> Community management across all platforms.</li>
                            <li><b>Design:</b> Created high-impact YouTube thumbnails.</li>
                            <li><b>Strategy:</b> Implemented new creative concepts for the channel.</li>
                        </ul>
                    </div>
                </div>

                {/* ITEM 3: NORMANIA */}
                <div className="experience-item">
                    <div className="experience-year">Internship 07/2024 - 08/2024</div>
                    <div className="experience-content">
                        <h3>Assistant Community Manager</h3>
                        <span className="experience-context">Normania</span>
                        <ul className="experience-desc list-disc pl-5 mt-2 space-y-1">
                            <li><b>Marketing Strategy:</b> Launch strategy for a new artist.</li>
                            <li><b>Graphic Design:</b> Posters for events/concerts and VHSS flyers.</li>
                            <li><b>Cover Art:</b> Artwork for Lux Ornot - "Other Vices".</li>
                            <li><b>Promotion:</b> Reels and posts for concert residency promotion.</li>
                        </ul>
                    </div>
                </div>

            </div>
        </div>
      )}

  {/* SKILLS (VERSION CSS CLEAN & GIANT) */}
      {focus === 'record' && (
        <div className="skills-container">
            <h2 className="skills-title">
                Skills
            </h2>
            
            <div className="skills-grid">
                
                {/* 1. GRAPHIC DESIGN */}
                <div className="skills-box">
                    <h3 className="skills-category">Graphic Design</h3>
                    <ul className="skills-list">
                        <li>Photoshop / Illustrator</li>
                        <li>InDesign</li>
                        <li>Visual Identity & Branding</li>
                        <li>Merch Design / UI Web</li>
                    </ul>
                </div>

                {/* 2. AUDIOVISUAL */}
                <div className="skills-box">
                    <h3 className="skills-category">Audiovisual</h3>
                     <ul className="skills-list">
                        <li>DaVinci Resolve (Fusion)</li>
                        <li>Premiere Pro / After Effects</li>
                        <li>Filming & Camerawork</li>
                        <li>Sound Design (Logic Pro)</li>
                    </ul>
                </div>

                {/* 3. 3D & TECH */}
                <div className="skills-box">
                    <h3 className="skills-category">3D & Tech</h3>
                     <ul className="skills-list">
                        <li>Blender (Model/Anim)</li>
                        <li>Wordpress</li>
                        <li>HTML / CSS / JS</li>
                    </ul>
                </div>

                 {/* 4. COMMUNICATION */}
                <div className="skills-box">
                    <h3 className="skills-category">Communication</h3>
                     <ul className="skills-list">
                        <li>Social Media Strategy</li>
                        <li>Community Management</li>
                        <li>SWOT Analysis</li>
                        <li>Ad Campaigns</li>
                    </ul>
                </div>

            </div>
        </div>
      )}

    </div>
  );
};