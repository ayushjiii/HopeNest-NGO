import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// Simple image pool; add/replace paths as needed
const images = [
    { title: 'volunteer', image: 'src/assets/img/volu.jpg' },
    { title: 'well', image: 'src/assets/img/well.png' },
    { title: 'groupeofvolunteers', image: 'src/assets/img/rkr.png' },
    { title: 'foodsupply', image: 'src/assets/img/foodkit.jpeg' },
    { title: 'Grap', image: 'src/assets/img/kss.png' },
    { title: 'Graphic', image: 'src/assets/img/medcamps.png' },
];

const pick = (i) => images[i % images.length];
const tileNum = (i) => i + 1; // numeric id for each tile

// Canvas-based wipe reveal image
function WipeImage({ src, alt }) {
    const canvasRef = useRef(null);
    const imgRef = useRef(null);
    const animRef = useRef(null);
    const startedRef = useRef(false);
    const resizeRaf = useRef(0);

    // Draw image with object-cover and wipe via clip rect
    const drawFrame = (ctx, img, progress, width, height) => {
        ctx.clearRect(0, 0, width, height);

        // Compute cover scaling
        const iw = img.naturalWidth || img.width;
        const ih = img.naturalHeight || img.height;
        if (!iw || !ih) return;
        const scale = Math.max(width / iw, height / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        const dx = (width - dw) / 2;
        const dy = (height - dh) / 2;

        // Clip to reveal portion
        const revealedW = Math.max(0, Math.min(width, width * progress));
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, revealedW, height);
        ctx.clip();
        ctx.drawImage(img, 0, 0, iw, ih, dx, dy, dw, dh);
        ctx.restore();
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d', { alpha: true, desynchronized: true });
        if (!canvas || !ctx) return;

        const img = new Image();
        imgRef.current = img;
        img.src = src;
        img.alt = alt;
        img.crossOrigin = 'anonymous';

        const doResize = () => {
            const parent = canvas.parentElement;
            if (!parent) return;
            const w = parent.clientWidth;
            const h = parent.clientHeight;
            if (w === 0 || h === 0) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.floor(w * dpr);
            canvas.height = Math.floor(h * dpr);
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            if (img.complete) {
                drawFrame(ctx, img, 1, w, h);
            }
        };

        const resize = () => {
            cancelAnimationFrame(resizeRaf.current);
            resizeRaf.current = requestAnimationFrame(doResize);
        };

        let startTs = 0;
        const duration = 900; // ms
        const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
        const animate = (ts) => {
            if (!startTs) startTs = ts;
            const parent = canvas.parentElement;
            if (!parent) return;
            const w = parent.clientWidth;
            const h = parent.clientHeight;
            const t = Math.min(1, (ts - startTs) / duration);
            const p = easeInOut(t);
            drawFrame(ctx, img, p, w, h);
            if (t < 1) {
                animRef.current = requestAnimationFrame(animate);
            }
        };

        const startAnimation = () => {
            cancelAnimationFrame(animRef.current);
            startTs = 0;
            animRef.current = requestAnimationFrame(animate);
        };

        const onHover = () => startAnimation();
        const onTouch = () => startAnimation();

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !startedRef.current) {
                        startedRef.current = true;
                        startAnimation();
                    }
                });
            },
            { threshold: 0.35 }
        );

        img.onload = () => {
            resize();
            observer.observe(canvas);
            canvas.addEventListener('mouseenter', onHover);
            canvas.addEventListener('touchstart', onTouch, { passive: true });
        };

        window.addEventListener('resize', resize);

        return () => {
            window.removeEventListener('resize', resize);
            canvas.removeEventListener('mouseenter', onHover);
            canvas.removeEventListener('touchstart', onTouch);
            observer.disconnect();
            cancelAnimationFrame(animRef.current);
            cancelAnimationFrame(resizeRaf.current);
        };
    }, [src, alt]);

    return (
        <canvas
            ref={canvasRef}
            role="img"
            aria-label={alt}
            className="w-full h-full block rounded-3xl"
        />
    );
}

function Gallary() {
    return (
        <section id="gallery">
            <div className="relative py-12 bg-white flex flex-col items-center w-full">
                <div className="w-[95%] mx-auto md:px-[30px] mb-8 text-center">

                    <h2 className="mt-0 text-4xl sm:text-5xl md:text-6xl font-extrabold">
                        Gal<span className="text-accent">l</span>ery
                    </h2>
                    <p className="mt-2 text-gray-600 max-w-2xl mx-auto">Moments from our mission to rescue, heal and protect wildlife.</p>
                    <div className="mx-auto h-1.5 w-24 bg-accent mt-3 rounded-full"></div>
                </div>
                <div className="w-[95%] mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 md:px-[30px]">
                    {/* Top wide banner (left, spans 6) */}
                    <div className="md:col-span-6 gap-6 flex flex-col">
                        <div id={`gallery-${tileNum(0)}`} data-id={tileNum(0)} className="group relative overflow-hidden border border-gray-200 ring-1 ring-gray-200 hover:ring-accent/40 shadow-md hover:shadow-xl transition duration-300 rounded-3xl transform-gpu will-change-transform hover:-translate-y-1" style={{ aspectRatio: '3 / 1' }}>
                            <WipeImage src={pick(0).image} alt={pick(0).title} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="absolute bottom-0 left-0 right-0 text-white px-4 py-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="text-sm sm:text-base font-medium">{pick(0).title}</span>
                            </div>
                        </div>
                        <div className="relative overflow-hidden rounded-2xl border border-gray-200 ring-1 ring-gray-200 bg-white/80 backdrop-blur-sm shadow-lg p-5 sm:p-6">
                            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
                                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse"></span>
                                Join Our Mission
                            </span>
                            <h3 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-extrabold  leading-tight">
                                Hope Begins With You
                            </h3>
                            <p className="mt-2 text-gray-600 text-sm sm:text-base max-w-prose">
                                Stand with HopeNest to protect vulnerable animals—every rupee saves a life.
                            </p>
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                <Link to="/donate" className="inline-flex items-center justify-center rounded-full bg-primary text-white px-5 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg hover:brightness-105 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent">
                                    Donate Now
                                    <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                                <Link to="/camp?join=volunteer" className="inline-flex items-center justify-center rounded-full border border-primary/30 text-primary hover:bg-primary hover:text-white px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                                    Volunteer
                                </Link>
                                <button className="inline-flex items-center justify-center rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 px-4 py-2 text-sm font-medium transition">
                                    Read More
                                </button>
                            </div>
                            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent/10 blur-xl"></div>
                        </div>
                    </div>

                    {/* Right block: two small (stacked) + one tall column */}
                    <div className="md:col-span-6 grid grid-cols-2 grid-rows-2 gap-6">
                        {/* small 1 */}
                        <div id={`gallery-${tileNum(1)}`} data-id={tileNum(1)} className="group relative overflow-hidden border border-gray-200 ring-1 ring-gray-200 hover:ring-accent/40 shadow-md hover:shadow-xl transition duration-300 rounded-3xl transform-gpu will-change-transform hover:-translate-y-1" style={{ aspectRatio: '3 / 2' }}>
                            <WipeImage src={pick(1).image} alt={pick(1).title} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="absolute bottom-0 left-0 right-0 text-white px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="text-xs sm:text-sm font-medium">{pick(1).title}</span>
                            </div>
                        </div>
                        {/* tall spans both rows on the right */}
                        <div id={`gallery-${tileNum(2)}`} data-id={tileNum(2)} className="col-start-2 row-span-2 group relative overflow-hidden border border-gray-200 ring-1 ring-gray-200 hover:ring-accent/40 shadow-md hover:shadow-xl transition duration-300 rounded-3xl transform-gpu will-change-transform hover:-translate-y-1">
                            <WipeImage src={pick(2).image} alt={pick(2).title} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="absolute bottom-0 left-0 right-0 text-white px-4 py-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="text-sm sm:text-base font-medium">{pick(2).title}</span>
                            </div>
                        </div>
                        {/* small 2 */}
                        <div id={`gallery-${tileNum(3)}`} data-id={tileNum(3)} className="group relative overflow-hidden border border-gray-200 ring-1 ring-gray-200 hover:ring-accent/40 shadow-md hover:shadow-xl transition duration-300 rounded-3xl transform-gpu will-change-transform hover:-translate-y-1" style={{ aspectRatio: '3 / 2' }}>
                            <WipeImage src={pick(3).image} alt={pick(3).title} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="absolute bottom-0 left-0 right-0 text-white px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="text-xs sm:text-sm font-medium">{pick(3).title}</span>
                            </div>
                        </div>
                    </div>

                    {/* Second wide banner (left) */}
                    <div className="md:col-span-6">
                        <div id={`gallery-${tileNum(4)}`} data-id={tileNum(4)} className="group relative overflow-hidden border border-gray-200 ring-1 ring-gray-200 hover:ring-accent/40 shadow-md hover:shadow-xl transition duration-300 rounded-3xl transform-gpu will-change-transform hover:-translate-y-1" style={{ aspectRatio: '2 / 1' }}>
                            <WipeImage src={pick(4).image} alt={pick(4).title} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="absolute bottom-0 left-0 right-0 text-white px-4 py-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="text-sm sm:text-base font-medium">{pick(4).title}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right block under second banner: one horizontal + one square */}
                    <div className="md:col-span-6 grid grid-cols-2 gap-6">
                        <div id={`gallery-${tileNum(5)}`} data-id={tileNum(5)} className="group relative overflow-hidden border border-gray-200 ring-1 ring-gray-200 hover:ring-accent/40 shadow-md hover:shadow-xl transition duration-300 rounded-3xl transform-gpu will-change-transform hover:-translate-y-1" style={{ aspectRatio: '1 / 1' }}>
                            <WipeImage src={pick(5).image} alt={pick(5).title} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="absolute bottom-0 left-0 right-0 text-white px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="text-xs sm:text-sm font-medium">{pick(5).title}</span>
                            </div>
                        </div>
                        <div id={`gallery-${tileNum(6)}`} data-id={tileNum(6)} className="group relative overflow-hidden border border-gray-200 ring-1 ring-gray-200 hover:ring-accent/40 shadow-md hover:shadow-xl transition duration-300 rounded-3xl transform-gpu will-change-transform hover:-translate-y-1" style={{ aspectRatio: '1 / 1' }}>
                            <WipeImage src={pick(6).image} alt={pick(6).title} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="absolute bottom-0 left-0 right-0 text-white px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="text-xs sm:text-sm font-medium">{pick(6).title}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
        </section>
    );
}
export default Gallary;
