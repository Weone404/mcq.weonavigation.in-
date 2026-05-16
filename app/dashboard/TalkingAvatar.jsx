// components/TalkingFace.jsx
import { useEffect, useRef, useCallback } from "react";

export default function TalkingFace({ speaking }) {
    const svgRef = useRef(null);
    const animRef = useRef(null);
    const blinkIntervalRef = useRef(null);
    const eyeIntervalRef = useRef(null);

    // All mutable animation state in refs (never stale in rAF loop)
    const morphIdxRef = useRef(0);
    const morphTimerRef = useRef(0);
    const morphDurationRef = useRef(0.3);
    const headBobTRef = useRef(0);
    const fromMorphRef = useRef({ ry: 2, t: 0, g: 0 });
    const toMorphRef = useRef({ ry: 6, t: 0.5, g: 0.1 });
    const speakingRef = useRef(speaking); // mirror prop into ref so rAF sees current value

    const morphs = useRef([
        { ry: 2.5, t: 0.05, g: 0.04 }, { ry: 6, t: 0.5, g: 0.1 },
        { ry: 4, t: 0.2, g: 0.04 }, { ry: 8, t: 0.7, g: 0.18 },
        { ry: 3, t: 0.1, g: 0 }, { ry: 7, t: 0.6, g: 0.12 },
        { ry: 1.5, t: 0, g: 0 }, { ry: 9, t: 0.8, g: 0.22 },
    ]);

    function lerp(a, b, t) { return a + (b - a) * t; }

    const getSvgEl = useCallback((id) => svgRef.current?.querySelector(`#${id}`), []);

    const setMouth = useCallback((ry, teethOp, tongueOp) => {
        const mo = getSvgEl("f-mouth-open");
        const ll = getSvgEl("f-lower-lip");
        const te = getSvgEl("f-teeth");
        const to = getSvgEl("f-tongue");
        if (!mo || !ll || !te || !to) return;
        mo.setAttribute("ry", ry);
        te.setAttribute("opacity", teethOp);
        to.setAttribute("opacity", tongueOp);
        ll.setAttribute("d",
            `M68 147 Q78 ${148 + ry * 0.5} 90 ${148 + ry * 0.4} Q102 ${148 + ry * 0.5} 112 147 Q102 ${151 + ry * 1.2} 90 ${152 + ry * 1.3} Q78 ${151 + ry * 1.2} 68 147Z`
        );
    }, [getSvgEl]);

    const raiseBrows = useCallback((a) => {
        const bl = getSvgEl("f-brow-left");
        const br = getSvgEl("f-brow-right");
        if (!bl || !br) return;
        bl.setAttribute("d", `M48 ${76 - a} Q62 ${68 - a} 74 ${72 - a}`);
        br.setAttribute("d", `M106 ${72 - a} Q118 ${68 - a} 132 ${76 - a}`);
    }, [getSvgEl]);

    const blink = useCallback(() => {
        const ll = getSvgEl("f-lid-left");
        const lr = getSvgEl("f-lid-right");
        if (!ll || !lr) return;
        ll.setAttribute("ry", 10); lr.setAttribute("ry", 10);
        setTimeout(() => {
            ll.setAttribute("ry", 2); lr.setAttribute("ry", 2);
        }, 130);
    }, [getSvgEl]);

    const lookAround = useCallback(() => {
        const dx = (Math.random() - 0.5) * 5;
        const dy = (Math.random() - 0.5) * 3;
        ["f-iris-left", "f-pupil-left"].forEach(id => {
            const el = getSvgEl(id); if (!el) return;
            el.setAttribute("cx", 62 + dx); el.setAttribute("cy", 95 + dy);
        });
        ["f-iris-right", "f-pupil-right"].forEach(id => {
            const el = getSvgEl(id); if (!el) return;
            el.setAttribute("cx", 118 + dx); el.setAttribute("cy", 95 + dy);
        });
    }, [getSvgEl]);

    // The animate loop — uses only refs, so it's never stale inside rAF
    const animate = useCallback(() => {
        morphTimerRef.current += 0.04;

        if (morphTimerRef.current >= morphDurationRef.current) {
            fromMorphRef.current = { ...toMorphRef.current };
            morphIdxRef.current = (morphIdxRef.current + 1) % morphs.current.length;
            toMorphRef.current = morphs.current[morphIdxRef.current];
            morphTimerRef.current = 0;
            morphDurationRef.current = 0.3 + Math.random() * 0.5;
        }

        const t = Math.min(morphTimerRef.current / morphDurationRef.current, 1);
        const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease in-out quad

        const curRy = lerp(fromMorphRef.current.ry, toMorphRef.current.ry, e);
        const curT = lerp(fromMorphRef.current.t, toMorphRef.current.t, e);
        const curG = lerp(fromMorphRef.current.g, toMorphRef.current.g, e);

        setMouth(curRy, curT, curG);
        raiseBrows(curRy * 0.4);

        headBobTRef.current += 0.12;
        if (svgRef.current) {
            svgRef.current.style.transform = `translateY(${Math.sin(headBobTRef.current) * 1.8}px)`;
        }

        // Only keep looping if still speaking
        if (speakingRef.current) {
            animRef.current = requestAnimationFrame(animate);
        }
    }, [setMouth, raiseBrows]);

    // Keep speakingRef in sync with the prop
    useEffect(() => {
        speakingRef.current = speaking;
    }, [speaking]);

    // Start/stop mouth animation based on speaking prop
    useEffect(() => {
        if (speaking) {
            // Reset animation state
            morphTimerRef.current = 0;
            morphIdxRef.current = 0;
            headBobTRef.current = 0;
            fromMorphRef.current = { ry: 2, t: 0, g: 0 };
            toMorphRef.current = morphs.current[0];

            cancelAnimationFrame(animRef.current);
            animRef.current = requestAnimationFrame(animate);

            // Faster blink & look when talking
            clearInterval(blinkIntervalRef.current);
            clearInterval(eyeIntervalRef.current);
            blinkIntervalRef.current = setInterval(blink, 2800 + Math.random() * 1500);
            eyeIntervalRef.current = setInterval(lookAround, 1800 + Math.random() * 2000);
        } else {
            cancelAnimationFrame(animRef.current);
            animRef.current = null;

            // Reset mouth to closed
            setMouth(0, 0, 0);
            raiseBrows(0);
            if (svgRef.current) svgRef.current.style.transform = "translateY(0)";

            // Revert to idle blink/look cadence
            clearInterval(blinkIntervalRef.current);
            clearInterval(eyeIntervalRef.current);
            blinkIntervalRef.current = setInterval(blink, 3500 + Math.random() * 1000);
            eyeIntervalRef.current = setInterval(lookAround, 2500 + Math.random() * 1500);
        }

        return () => {
            cancelAnimationFrame(animRef.current);
            clearInterval(blinkIntervalRef.current);
            clearInterval(eyeIntervalRef.current);
        };
    }, [speaking, animate, blink, lookAround, setMouth, raiseBrows]);

    return (
        <div style={{ width: 140, height: 164, flexShrink: 0, transition: "transform 0.3s" }}>
            <svg ref={svgRef} viewBox="0 0 180 210" xmlns="http://www.w3.org/2000/svg"
                style={{ width: "100%", height: "100%", transition: "transform 0.1s" }}>
                <defs>
                    <radialGradient id="tfs" cx="50%" cy="40%" r="55%">
                        <stop offset="0%" stopColor="#FDDBB4" />
                        <stop offset="100%" stopColor="#F0A875" />
                    </radialGradient>
                    <radialGradient id="tfc" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#F4A0A0" stopOpacity="0.55" />
                        <stop offset="100%" stopColor="#F4A0A0" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="tfe" cx="35%" cy="35%" r="60%">
                        <stop offset="0%" stopColor="#7C6BCC" />
                        <stop offset="100%" stopColor="#3B2F8A" />
                    </radialGradient>
                    <filter id="tfb"><feGaussianBlur stdDeviation="1.5" /></filter>
                </defs>
                <rect x="72" y="170" width="36" height="38" rx="8" fill="#E8955A" />
                <ellipse cx="90" cy="102" rx="72" ry="82" fill="url(#tfs)" />
                <ellipse cx="90" cy="35" rx="74" ry="44" fill="#2C1A0E" />
                <ellipse cx="90" cy="28" rx="70" ry="32" fill="#2C1A0E" />
                <ellipse cx="24" cy="90" rx="14" ry="48" fill="#2C1A0E" />
                <ellipse cx="156" cy="90" rx="14" ry="48" fill="#2C1A0E" />
                <ellipse cx="20" cy="108" rx="10" ry="14" fill="#E8955A" />
                <ellipse cx="21" cy="108" rx="6" ry="9" fill="#D4804A" />
                <ellipse cx="160" cy="108" rx="10" ry="14" fill="#E8955A" />
                <ellipse cx="159" cy="108" rx="6" ry="9" fill="#D4804A" />
                <ellipse cx="52" cy="128" rx="22" ry="14" fill="url(#tfc)" filter="url(#tfb)" />
                <ellipse cx="128" cy="128" rx="22" ry="14" fill="url(#tfc)" filter="url(#tfb)" />
                <path id="f-brow-left" d="M48 76 Q62 68 74 72" stroke="#2C1A0E" strokeWidth="4" strokeLinecap="round" fill="none" />
                <path id="f-brow-right" d="M106 72 Q118 68 132 76" stroke="#2C1A0E" strokeWidth="4" strokeLinecap="round" fill="none" />
                <ellipse cx="62" cy="95" rx="16" ry="11" fill="white" />
                <ellipse id="f-iris-left" cx="62" cy="95" rx="9" ry="9" fill="url(#tfe)" />
                <ellipse id="f-pupil-left" cx="62" cy="95" rx="5" ry="5" fill="#0a0710" />
                <ellipse cx="65" cy="92" rx="2.5" ry="2" fill="white" opacity="0.85" />
                <ellipse cx="118" cy="95" rx="16" ry="11" fill="white" />
                <ellipse id="f-iris-right" cx="118" cy="95" rx="9" ry="9" fill="url(#tfe)" />
                <ellipse id="f-pupil-right" cx="118" cy="95" rx="5" ry="5" fill="#0a0710" />
                <ellipse cx="121" cy="92" rx="2.5" ry="2" fill="white" opacity="0.85" />
                <ellipse id="f-lid-left" cx="62" cy="88" rx="16" ry="2" fill="#E8955A" />
                <ellipse id="f-lid-right" cx="118" cy="88" rx="16" ry="2" fill="#E8955A" />
                <ellipse cx="90" cy="120" rx="5" ry="3.5" fill="#D4804A" opacity="0.6" />
                <path d="M82 114 Q90 122 98 114" stroke="#C57040" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.5" />
                <g id="f-mouth-group">
                    <path d="M68 147 Q78 143 90 145 Q102 143 112 147 Q102 152 90 151 Q78 152 68 147Z" fill="#C0604A" />
                    <path id="f-lower-lip" d="M68 147 Q78 152 90 151 Q102 152 112 147 Q102 159 90 160 Q78 159 68 147Z" fill="#D4705A" />
                    <ellipse id="f-mouth-open" cx="90" cy="153" rx="18" ry="0" fill="#1a0808" />
                    <rect id="f-teeth" x="75" y="151" width="30" height="7" rx="3" fill="#F8F8F8" opacity="0" />
                    <ellipse id="f-tongue" cx="90" cy="160" rx="10" ry="5" fill="#D4605A" opacity="0" />
                    <ellipse cx="83" cy="148" rx="6" ry="2" fill="white" opacity="0.18" />
                </g>
                <g opacity="0.85">
                    <rect x="44" y="86" width="36" height="20" rx="8" fill="none" stroke="#3C3489" strokeWidth="2.5" />
                    <rect x="100" y="86" width="36" height="20" rx="8" fill="none" stroke="#3C3489" strokeWidth="2.5" />
                    <line x1="80" y1="96" x2="100" y2="96" stroke="#3C3489" strokeWidth="2.5" />
                    <line x1="20" y1="93" x2="44" y2="93" stroke="#3C3489" strokeWidth="2" />
                    <line x1="136" y1="93" x2="160" y2="93" stroke="#3C3489" strokeWidth="2" />
                </g>
            </svg>
        </div>
    );
}