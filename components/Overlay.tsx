"use client";

import { useStore } from "@/store";
import { projects } from "@/data/projects";
import { useEffect, useRef, useState } from "react";

// --- DONNÉES DE LA TECH STACK ---
const techStackData = [
  { id: 1, desc: "Logo Mort Aux Rats", image: "/textures/logomar.jpg" },
  { id: 2, desc: "Tee Shirt Mort Aux Rats", image: "/textures/mortauxrats.jpg" },
  { id: 3,  desc: "Tee Shirt Vive Les Ratz", image: "/textures/vivelesratz.jpg" },
  { id: 4, desc: "Tee Shirt Paye Ta Prod", image: "/textures/payetaprod.jpg" },
];

export const Overlay = () => {
  const { activeProject, toggleMute, isMuted, focus, setFocus, setActiveProject } = useStore();
  const project = activeProject !== null ? projects[activeProject] : null;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- STATES ---
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [currentTechIndex, setCurrentTechIndex] = useState(0);

  // Reset des images quand on change de projet
  useEffect(() => {
    setCurrentImgIndex(0);
  }, [activeProject, focus]);

  // Bloquer le scroll
  useEffect(() => {
    const element = scrollContainerRef.current;
    if (!element) return;
    const preventScroll = (e: WheelEvent) => e.stopPropagation();
    element.addEventListener('wheel', preventScroll, { passive: false });
    return () => element.removeEventListener('wheel', preventScroll);
  }, [activeProject, focus]);

  // --- NAVIGATION GALERIE (IMAGES) ---
  const handleNextImg = (e: any, total: number) => {
    e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation();
    setCurrentImgIndex((prev) => (prev + 1) % total);
  };
  const handlePrevImg = (e: any, total: number) => {
    e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation();
    setCurrentImgIndex((prev) => (prev - 1 + total) % total);
  };

  // --- NAVIGATION RACK (TECH) ---
  const handleNextTech = (e: any) => {
    e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation();
    setCurrentTechIndex((prev) => (prev + 1) % techStackData.length);
  };
  const handlePrevTech = (e: any) => {
    e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation();
    setCurrentTechIndex((prev) => (prev - 1 + techStackData.length) % techStackData.length);
  };

  // --- NOUVEAU : NAVIGATION ENTRE PROJETS (PRÉCÉDENT / SUIVANT) ---
  const changeProject = (direction: 'next' | 'prev', e: any) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    e.nativeEvent.stopImmediatePropagation(); // Important pour ne pas clip la caméra
    
    if (activeProject === null) return;

    const total = projects.length;
    let newIndex = activeProject;

    if (direction === 'next') {
        newIndex = (activeProject + 1) % total;
    } else {
        newIndex = (activeProject - 1 + total) % total;
    }

    setActiveProject(newIndex);
  };

  // Style des liens du menu haut
  const navItemClass = (isActive: boolean) => 
    `cursor-pointer bg-transparent border-none outline-none text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 !text-white ${
      isActive 
      ? "scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" 
      : "hover:scale-105 hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" 
    }`;

  const projectImages = project 
    ? (project.gallery && project.gallery.length > 0 ? project.gallery : [project.screenshot])
    : [];

  return (
    <div className="w-full h-full text-white pointer-events-none antialiased font-sans selection:bg-orange-500 selection:text-white"> 
      
      {/* 1. MENU NAVIGATION (HAUT) */}
      <div className="menu-position pointer-events-auto">
         <nav className="flex items-center gap-8 md:gap-12">
            <button className={navItemClass(focus === 'poster')} onClick={() => { setFocus('poster'); setActiveProject(null); }} style={{ color: 'white' }}>Moi</button>
            <button className={navItemClass(focus === 'record')} onClick={() => { setFocus('record'); setActiveProject(null); }} style={{ color: 'white' }}>Skills</button>
            <button className={navItemClass(focus === 'experience')} onClick={() => { setFocus('experience'); setActiveProject(null); }} style={{ color: 'white' }}>Experience</button>
            <button className={navItemClass(focus === 'turntable')} onClick={(e) => { e.stopPropagation(); setFocus('turntable'); setActiveProject(null); }} style={{ color: 'white' }}>Projets</button>
        </nav>
      </div>

      {/* 2. BOUTON CONTACT (BAS DROITE) */}
      <div className="contact-container">
        <a href="mailto:raphael.liberge@gmail.com" className="contact-link">Contact</a>
        <a href="https://www.linkedin.com/in/rapha%C3%ABl-liberge-3b0621264/" className="contact-link">LinkedIn</a>
        <a href="https://www.instagram.com/itsevilh/" className="contact-link">Instagram</a>
      </div>

      {/* 3. HEADER (RETOUR / SON) */}
      <div className="fixed top-0 w-full p-8 flex justify-between items-start z-50 pointer-events-none">
        <div className="pointer-events-auto mt-2">
            {focus !== 'intro' ? (
            <button onClick={() => { setFocus('intro'); setActiveProject(null); }} className="group flex items-center gap-3 px-5 py-2.5 bg-transparent border-none !text-white transition-all duration-300 opacity-80 hover:opacity-100 hover:scale-105" style={{ color: 'white' }}>
                <span className="text-xl">←</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">Retour</span>
            </button>
            ) : <div />}
        </div>
        <button onClick={toggleMute} className="pointer-events-auto mt-2 bg-transparent border-none flex items-center gap-3 px-5 py-2.5 !text-white transition-all duration-300 opacity-80 hover:opacity-100 hover:scale-105" style={{ color: 'white' }}>
          <span className="text-[10px] font-bold uppercase tracking-widest">{isMuted ? 'Sound Off' : 'Sound On'}</span>
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${isMuted ? 'bg-red-500' : 'bg-green-400 animate-pulse'}`}></span>
        </button>
      </div>

      
      {/* ========================================= */}
      {/* === MODE PROJET === */}
      {/* ========================================= */}
      {focus === 'turntable' && project && (
        <>
          {/* TEXTE GAUCHE */}
          <div className="project-container">
                <div className="mb-6 flex items-center gap-3">
                   <span className="project-meta">Date {project.id < 10 ? `0${project.id}` : project.id}</span>
                   <span className="text-[10px] text-white/40 font-mono">///</span>
                   <span className="project-meta">2024</span>
                </div>
                <h1 className="project-title">{project.title}</h1>
                <p className="project-desc mb-8 text-sm leading-relaxed text-white/80">{project.description}</p>
                <div className="flex gap-4">
                    <a href={project.link} target="_blank" className="px-20 py-3 bg-white text-black font-bold uppercase tracking-widest text-[30px] hover:scale-105 transition-transform no-underline">Audiovisual Support</a>
                </div>
                <div className="mt-12 text-[10px] text-white/30 font-mono">IMAGE {currentImgIndex + 1} / {projectImages.length}</div>
          </div>

          {/* GALERIE DROITE */}
          <div className="gallery-viewer" onClick={(e) => e.stopPropagation()}>
             <div className="gallery-rect-wrapper" onClick={(e) => e.stopPropagation()}>
                 <img key={currentImgIndex} src={projectImages[currentImgIndex]} alt="Project View" className="gallery-image" />
                 
                 {projectImages.length > 1 && (
                    <>
                    <button className="gallery-nav-btn gallery-prev" onClick={(e) => handlePrevImg(e, projectImages.length)}>←</button>
                    <button className="gallery-nav-btn gallery-next" onClick={(e) => handleNextImg(e, projectImages.length)}>→</button>
                    </>
                 )}
                 <div className="gallery-counter">0{currentImgIndex + 1}</div>
             </div>
          </div>

          {/* --- NOUVEAU : NAVIGATION BASSE ENTRE PROJETS --- */}
         <div className="project-nav-bottom">
             
             {/* Bouton Précédent */}
             <button 
                className="nav-btn-text"
                onClick={(e) => {
                    e.preventDefault(); 
                    e.stopPropagation(); 
                    e.nativeEvent.stopImmediatePropagation();
                    changeProject('prev', e);
                }}
             >
                <span style={{ fontSize: '1.2rem' }}>←</span>
                <span>Prev</span>
             </button>

             {/* Séparateur */}
             <div className="w-px h-3 bg-white/30 mx-2"></div>

             {/* Bouton Suivant */}
             <button 
                className="nav-btn-text"
                onClick={(e) => {
                    e.preventDefault(); 
                    e.stopPropagation(); 
                    e.nativeEvent.stopImmediatePropagation();
                    changeProject('next', e);
                }}
             >
                <span>Next</span>
                <span style={{ fontSize: '1.2rem' }}>→</span>
             </button>

          </div>
        </>
      )}


      {/* ========================================= */}
      {/* === MODE RACK (TECH STACK) === */}
      {/* ========================================= */}
      {focus === 'rack' && (
        <>
          <div className="rack-container">
                <div className="mb-6 flex items-center gap-3">
                   <span className="project-meta">MORT AUX RATS</span>
                   <span className="text-[10px] text-white/40 font-mono">///</span>
                   <span className="project-meta">design de tee shirts</span>
                </div>
                <h1 className="rack-title" style={{ fontSize: '3.5rem' }}>MORT AUX RATS<br/></h1>
                <p className="project-desc mb-8 text-sm leading-relaxed text-white/80">
                    MORT AUX RATS is a brand I created. It is not available yet, but stay tuned.
                </p>
                <div className="mt-12 text-[10px] text-white/30 font-mono">
                    ITEM {currentTechIndex + 1} / {techStackData.length}
                </div>
          </div>

          <div className="gallery-viewer" onClick={(e) => e.stopPropagation()}>
             <div className="gallery-rect-wrapper">
                 <img key={currentTechIndex} src={techStackData[currentTechIndex].image} alt={(techStackData[currentTechIndex]as any).name} className="gallery-image" style={{ filter: 'brightness(0.6)' }} />
                 <div className="tech-info-overlay">
                    <h2 className="tech-title">{(techStackData[currentTechIndex]as any) .name}</h2>
                    <span className="tech-desc">/// {techStackData[currentTechIndex].desc}</span>
                 </div>
                 <button className="gallery-nav-btn gallery-prev" onClick={handlePrevTech}>←</button>
                 <button className="gallery-nav-btn gallery-next" onClick={handleNextTech}>→</button>
                 <div className="gallery-counter">0{currentTechIndex + 1}</div>
             </div>
          </div>
        </>
      )}

      {/* AUTRES SECTIONS (Moi, Exp, Skills) restent inchangées */}
      {focus === 'poster' && (
        <div className="poster-container">
            <h1 className="poster-title" style={{ fontSize: '7rem', lineHeight: '0.8' }}>Hello.</h1>
            {/* Séparateur Blanc */}
            <div className="poster-separator my-8 w-24 h-1 bg-white"></div>
            
            <div className="flex flex-col gap-6 max-w-xl animate-in fade-in slide-in-from-bottom-10 duration-700">
                <p className="poster-identity text-3xl font-light">
                    I am <strong className="font-bold text-white">Raphaël Liberge</strong>.
                </p>
                
                <div className="text-sm leading-relaxed text-white/80 font-light text-justify flex flex-col gap-4">
                    <p>
                        I am a 3rd-year student in <strong>BUT MMI</strong> (Multimedia & Internet Professions). 
                        I am currently looking for an <strong>internship between April 7 and August 31</strong> in Communication, Audiovisual Production, or Graphic Design.
                    </p>
                    <p>
                        My ambition is to evolve within the <strong>music industry</strong>, manage artists, and eventually establish my own creative structure.
                    </p>
                    <p>
                        Creative and rigorous, I am dedicated to investing myself fully in diverse projects. I bring serious commitment and adaptability to professional teams, along with a positive and collaborative mindset.
                    </p>
                </div>

                <div className="flex flex-col gap-2 mt-4 text-xs tracking-widest text-white/60 border-t border-white/20 pt-4">
                    <p>📍 PARIS / VÉLIZY</p>
                    <p>📅 APRIL 7 — AUGUST 31</p>
                    <p>✉️ OPEN TO OPPORTUNITIES</p>
                </div>
            </div>
        </div>
      )}

     {focus === 'experience' && (
        <div className="experience-container w-full max-w-4xl px-8 h-[70vh] flex flex-col">
            <h2 className="experience-title text-6xl font-bold mb-8 flex-shrink-0">EXPERIENCE</h2>
             
             {/* LISTE DÉFILANTE */}
             <div className="flex flex-col w-full custom-scrollbar overflow-y-auto pr-4 pointer-events-auto flex-grow gap-12 pb-20">
                
                {/* EXPERIENCE 1 : MANAGER */}
                <div className="experience-item group">
                    <div className="flex justify-between items-baseline mb-2">
                        <h3 className="text-2xl font-bold text-white transition-colors">Artist Manager & 360° Art Director</h3>
                        <span className="text-sm font-mono text-white/50">1.5 YEARS — FREELANCE</span>
                    </div>
                    {/* Orange retiré ici -> Blanc gras */}
                    <p className="text-sm text-white mb-4 font-bold tracking-widest uppercase">For Artists @mewa & @bvnban</p>
                    <p className="text-white/80 text-sm leading-relaxed mb-4">
                        Complete steering of the artists' careers and public image.
                    </p>
                    <ul className="list-disc list-inside text-sm text-white/60 space-y-1 ml-2">
                        <li><strong className="text-white">Music Marketing & PR:</strong> Launch strategies, press relations, and editorial calendar management.</li>
                        <li><strong className="text-white">Art Direction:</strong> Creation of visual identities (Covers), music video direction and editing.</li>
                        <li><strong className="text-white">Distribution:</strong> Management of digital distribution (Spotify, Apple Music) via aggregators.</li>
                    </ul>
                </div>

                {/* EXPERIENCE 2 : FESTIVALISTE */}
                <div className="experience-item group">
                    <div className="flex justify-between items-baseline mb-2">
                        <h3 className="text-2xl font-bold text-white transition-colors">Community Manager & Videographer</h3>
                        <span className="text-sm font-mono text-white/50">INTERNSHIP</span>
                    </div>
                    <p className="text-sm text-white mb-4 font-bold tracking-widest uppercase">Un Festivaliste</p>
                    <ul className="list-disc list-inside text-sm text-white/60 space-y-1 ml-2">
                        <li>Creation of Reels and posts for YouTube content promotion.</li>
                        <li>Full social media management for the brand.</li>
                        <li>Creation of high-CTR YouTube thumbnails.</li>
                        <li>R&D and implementation of new YouTube concepts.</li>
                    </ul>
                </div>

                {/* EXPERIENCE 3 : NORMANIA */}
                <div className="experience-item group">
                    <div className="flex justify-between items-baseline mb-2">
                        <h3 className="text-2xl font-bold text-white transition-colors">Assistant Community Manager</h3>
                        <span className="text-sm font-mono text-white/50">INTERNSHIP</span>
                    </div>
                    <p className="text-sm text-white mb-4 font-bold tracking-widest uppercase">Normania</p>
                    <ul className="list-disc list-inside text-sm text-white/60 space-y-1 ml-2">
                        <li>Launch marketing strategy for a new artist.</li>
                        <li>Design of event posters and concert assets.</li>
                        <li>Cover art realization for Lux Ornot - "Other Vices".</li>
                        <li>Content creation (Reels/Posts) for concert promotion during residency.</li>
                    </ul>
                </div>

            </div>
        </div>
      )}

      {focus === 'record' && (
        // AJOUT DE 'h-[70vh]' et 'flex-col' pour gérer la hauteur
        <div className="skills-container w-full max-w-6xl px-8 flex flex-col h-[70vh]">
            <div className="mb-6 flex items-center gap-3 flex-shrink-0">
                 <span className="project-meta">CREATIVE</span>
                 <span className="text-[10px] text-white/40 font-mono">///</span>
                 <span className="project-meta">TECHNICAL</span>
            </div>

            <h2 className="skills-title text-6xl font-bold mb-8 flex-shrink-0">SKILLS</h2>
             
             {/* AJOUT DU CONTENEUR SCROLLABLE (C'est ça qui règle ton problème de visibilité) */}
             <div className="overflow-y-auto custom-scrollbar pr-4 pb-20 flex-grow">
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 w-full text-white">
                    
                    {/* 1. GRAPHIC DESIGN */}
                    <div className="flex flex-col gap-4">
                        {/* Orange remplacé par white */}
                        <h3 className="text-white font-bold text-xs tracking-[0.2em] uppercase border-b border-white/20 pb-2 mb-2">Graphic Design</h3>
                        <ul className="flex flex-col gap-2 text-sm font-light text-white/80">
                            <li>Photoshop / Illustrator / InDesign</li>
                            <li>Visual Identity & Branding</li>
                            <li>Merch Design</li>
                            <li>UI Webdesign</li>
                        </ul>
                    </div>

                    {/* 2. AUDIOVISUAL */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-white font-bold text-xs tracking-[0.2em] uppercase border-b border-white/20 pb-2 mb-2">Audiovisual</h3>
                        <ul className="flex flex-col gap-2 text-sm font-light text-white/80">
                            <li>DaVinci Resolve (Edit & Fusion)</li>
                            <li>Premiere Pro / After Effects</li>
                            <li>Filming & Framing</li>
                            <li>Scriptwriting / Storyboard</li>
                            <li>Sound Design (Logic Pro X)</li>
                        </ul>
                    </div>

                    {/* 3. 3D & TECH */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-white font-bold text-xs tracking-[0.2em] uppercase border-b border-white/20 pb-2 mb-2">3D & Tech</h3>
                        <ul className="flex flex-col gap-2 text-sm font-light text-white/80">
                            <li>Blender (Modeling/Anim)</li>
                            <li>WordPress & HTML/CSS</li>
                            <li>JavaScript (React / Three.js)</li>
                        </ul>
                    </div>

                    {/* 4. COMMUNICATION */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-white font-bold text-xs tracking-[0.2em] uppercase border-b border-white/20 pb-2 mb-2">Communication</h3>
                        <ul className="flex flex-col gap-2 text-sm font-light text-white/80">
                            <li>Social Media Strategy</li>
                            <li>Community Management</li>
                            <li>SWOT Analysis</li>
                            <li>Advertising Campaigns</li>
                        </ul>
                    </div>

                </div>
            </div>
        </div>
      )}

    </div>
  );
};