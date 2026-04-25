'use client';

import { useState, useRef, useEffect } from 'react';

// ─── COLOUR TOKENS (match WeOne Aviation design system) ─────────────────────
const C = {
    bg: '#F0F4FF',
    sidebar: '#0A1628',
    card: '#FFFFFF',
    primary: '#1D4ED8',
    primaryLight: '#EFF6FF',
    accent: '#F59E0B',
    green: '#10B981',
    red: '#EF4444',
    purple: '#8B5CF6',
    text: '#0F172A',
    muted: '#64748B',
    border: '#E2E8F0',
    noteSidebar: '#F8FAFF',
};

// ─── ALL 28 CHAPTERS WITH FULL NOTES ─────────────────────────────────────────
const CHAPTERS = [
    // ══════════════════════ PART I ══════════════════════
    {
        part: 'PART I — Air Regulations, Operational Procedures & Communications',
        partColor: '#1D4ED8',
        id: 'ch1', num: 1, icon: '📖', color: '#1D4ED8',
        title: 'Definitions & Abbreviations',
        ref: 'ICAO Annex 2 · CAR Section 9',
        topics: [
            {
                heading: 'Flight Simulator Types',
                points: [
                    'Basic Instrument Flight Trainer (BIFT): equipped with instruments that simulate flight deck in instrument conditions.',
                    'Flight Procedures Trainer (FPT): simulates instrument responses, simple control functions, and performance characteristics of an aircraft class.',
                    'Flight Simulator (FS): accurate representation of a specific aircraft type — systems, environment, performance, and flight characteristics are realistically simulated.',
                ],
            },
            {
                heading: 'Key Distance Definitions',
                points: [
                    'ASDA (Accelerate-Stop Distance Available): TORA + Stopway length.',
                    'TODA (Take-Off Distance Available): TORA + Clearway length.',
                    'TORA (Take-Off Run Available): declared length of runway available for the ground run of an aircraft taking off.',
                    'LDA (Landing Distance Available): declared runway length available and suitable for the ground run of an aircraft landing.',
                ],
            },
            {
                heading: 'Accident vs Incident',
                points: [
                    'Accident: occurrence between boarding and disembarking where (a) person is fatally/seriously injured, (b) aircraft sustains damage or structural failure, or (c) aircraft is missing/inaccessible.',
                    'Serious Incident: incident involving circumstances indicating high probability of an accident.',
                    'Incident: occurrence other than an accident associated with aircraft operation that affects or could affect safety.',
                ],
            },
            {
                heading: 'Airspace Definitions',
                points: [
                    'Advisory Airspace (ADA): airspace of defined dimensions where ATC advisory service is available.',
                    'Advisory Route (ADR): designated route with ATC advisory service.',
                    'Aerodrome Traffic Zone (ATZ): defined airspace around an aerodrome for protection of aerodrome traffic.',
                    'Aerodrome Elevation: elevation of the highest point of the landing area.',
                    'Aerodrome Operating Minima: limits of usability expressed as RVR/visibility, MDA/H or DA/H.',
                ],
            },
            {
                heading: 'Approach & Landing Definitions',
                points: [
                    'Decision Altitude/Height (DA/H): specified altitude/height in precision or APV approach at which missed approach must be initiated if required visual reference not established.',
                    'Minimum Descent Altitude/Height (MDA/H): used in non-precision approaches — altitude below which descent must not be made without visual reference.',
                    'Runway Visual Range (RVR): range over which pilot can see runway surface markings or lights delineating runway.',
                    'CAT I: DA not below 60 m, RVR not less than 550 m.',
                    'CAT II: DA 30–60 m, RVR not less than 300 m.',
                    'CAT IIIA: DA below 30 m (or no DA), RVR not less than 175 m.',
                    'CAT IIIB: DA below 15 m (or no DA), RVR 50–175 m.',
                    'CAT IIIC: No DA, no RVR limitation.',
                ],
            },
            {
                heading: 'Airspace Classifications (ICAO)',
                points: [
                    'Class A: IFR only, all flights ATC cleared and separated. No VFR.',
                    'Class B: IFR + VFR, all flights ATC separated.',
                    'Class C: IFR + VFR, IFR separated from all, VFR separated from IFR only.',
                    'Class D: IFR + VFR, IFR separated from IFR, traffic info given.',
                    'Class E: IFR separated from IFR; VFR not separated; ATC clearance for IFR.',
                    'Class F: IFR advisory service; VFR advisory if requested.',
                    'Class G: Uncontrolled — flight information service only.',
                    'India uses: Class A (FL245 and above), Class C (above 3000 ft AGL to FL245), Class D (CTR/TMA), Class G (below Class C/D).',
                ],
            },
            {
                heading: 'Navigation & Route Terms',
                points: [
                    'ATS Route: specified route for channelling flow of traffic.',
                    'Waypoint (WPT): specified geographical location for RNAV. Fly-by (turn anticipation) vs Flyover (turn at waypoint).',
                    'RNAV: Area Navigation — allows operation on any desired flight path within range of navigation aids.',
                    'RNP: Required Navigation Performance — RNAV with onboard monitoring and alerting.',
                    'ETOPS/EDTO: Extended-range Twin-engine Operations — specific approval for operations >60 min from diversion aerodrome.',
                ],
            },
            {
                heading: 'Other Essential Terms',
                points: [
                    'Accepting Unit: ATC unit next to take control of the aircraft.',
                    'Aerodrome Beacon (ABN): aeronautical beacon indicating aerodrome location from the air.',
                    'VOLMET: meteorological information broadcast for aircraft in flight (METAR, SPECI, TAF, SIGMET).',
                    'Wet/Dry Runway: wet = visible dampness/water up to 3 mm; dry = free of visible moisture.',
                    'Caution Area: airspace with unusual activity — not prohibited, but use caution.',
                    'Control Zone (CTR): controlled airspace extending upward from surface to specified upper limit.',
                ],
            },
        ],
    },

    {
        part: 'PART I — Air Regulations, Operational Procedures & Communications',
        partColor: '#1D4ED8',
        id: 'ch2', num: 2, icon: '🌐', color: '#0891B2',
        title: 'International Organisations & Conventions',
        ref: 'ICAO Doc 7300 (Chicago Convention)',
        topics: [
            {
                heading: 'Paris Convention, 1919',
                points: [
                    'First international agreement on civil aviation — signed 13 October 1919 at Peace Conference in Paris.',
                    'Established International Commission on Air Navigation (ICAN) — forerunner of ICAO.',
                    'Laid down preliminary technical standards. Superseded by Chicago Convention (1944).',
                ],
            },
            {
                heading: 'Chicago Convention, 1944',
                points: [
                    'Convention on International Civil Aviation signed 7 December 1944; 96 Articles.',
                    'India has ratified this convention. Forms the foundation of all international aviation law.',
                    'Article 1 — Sovereignty: every State has complete and exclusive sovereignty over airspace above its territory.',
                    'Article 2 — Territory: land areas + territorial waters adjacent to a State.',
                    'Article 3 — Applicable to civil aircraft only; not State aircraft (military, customs, police).',
                    'Article 6 — Scheduled international air services require special permission of the State.',
                    'Article 12 — Rules of the Air: each State must adopt rules conforming with ICAO standards.',
                    'Article 33 — Certificates of Airworthiness and licences issued by one State recognized by other contracting States.',
                ],
            },
            {
                heading: 'ICAO — Structure & Function',
                points: [
                    'International Civil Aviation Organisation (ICAO) established by Chicago Convention; came into existence 4 April 1947.',
                    'Headquartered in Montreal, Canada.',
                    'Member states: 193 (as of recent count).',
                    'Objectives: safe, orderly, and efficient development of international civil aviation.',
                    'Structure: Assembly (meets every 3 years), Council (33 member States, elected), Secretariat.',
                    'Publishes 19 Annexes to the Chicago Convention covering all aspects of aviation.',
                    'Publishes PANS (Procedures for Air Navigation Services) — PANS-OPS, PANS-ATM.',
                    'Regional Offices: 7 worldwide. India falls under Asia & Pacific Region (APAC), Bangkok.',
                ],
            },
            {
                heading: 'ICAO Annexes (19 Total)',
                points: [
                    'Annex 1 — Personnel Licensing',
                    'Annex 2 — Rules of the Air',
                    'Annex 3 — Meteorological Service',
                    'Annex 4 — Aeronautical Charts',
                    'Annex 5 — Units of Measurement',
                    'Annex 6 — Operation of Aircraft (Part I: International Commercial, Part II: General Aviation, Part III: International Helicopter)',
                    'Annex 7 — Aircraft Nationality & Registration Marks',
                    'Annex 8 — Airworthiness',
                    'Annex 9 — Facilitation',
                    'Annex 10 — Aeronautical Telecommunications (5 volumes)',
                    'Annex 11 — Air Traffic Services',
                    'Annex 12 — Search and Rescue',
                    'Annex 13 — Aircraft Accident Investigation',
                    'Annex 14 — Aerodromes (Vol I & II)',
                    'Annex 15 — Aeronautical Information Services',
                    'Annex 16 — Environmental Protection',
                    'Annex 17 — Security',
                    'Annex 18 — Dangerous Goods',
                    'Annex 19 — Safety Management',
                ],
            },
            {
                heading: 'Other International Bodies',
                points: [
                    'IATA (International Air Transport Association): trade association of airlines, promotes safe, regular, economical air transport. Headquarters: Geneva & Montreal.',
                    'ACI (Airports Council International): represents interests of airports worldwide.',
                    'FAA (Federal Aviation Administration): USA civil aviation authority.',
                    'EASA (European Union Aviation Safety Agency): European aviation regulator.',
                    'DGCA (Directorate General of Civil Aviation): India\'s national aviation authority, headquartered in New Delhi.',
                ],
            },
            {
                heading: 'Freedom of the Air (Nine Freedoms)',
                points: [
                    '1st Freedom: right to fly over a foreign country without landing.',
                    '2nd Freedom: right to land in a foreign country for non-traffic purposes (technical stop).',
                    '3rd Freedom: right to carry passengers/cargo from home country to another country.',
                    '4th Freedom: right to carry passengers/cargo from another country back to home country.',
                    '5th Freedom: right to carry passengers/cargo between two foreign countries on a flight originating/ending in home country.',
                    '6th–9th Freedoms: various commercial rights negotiated bilaterally.',
                ],
            },
        ],
    },

    {
        part: 'PART I — Air Regulations, Operational Procedures & Communications',
        partColor: '#1D4ED8',
        id: 'ch3', num: 3, icon: '🏷️', color: '#7C3AED',
        title: 'Aircraft Nationality & Registration Marks',
        ref: 'ICAO Annex 7 · CAR Section 2',
        topics: [
            {
                heading: 'Nationality Marks',
                points: [
                    'Every aircraft engaged in international navigation must bear its nationality and registration marks.',
                    'India\'s Nationality Mark: VT (Victoria Terminus — historical British India designation).',
                    'USA: N; UK: G; France: F; Germany: D; Pakistan: AP; Russia: RA.',
                ],
            },
            {
                heading: 'Marking Requirements',
                points: [
                    'Marks to be displayed on the aircraft — nationality mark followed by registration mark.',
                    'Registration marks: letters, numbers, or combinations thereof.',
                    'Marks must be kept clean and visible at all times.',
                    'Marks on wings: fixed-wing aircraft must display on lower surface of left wing (or both wings).',
                    'Marks on fuselage: displayed on each side of fuselage between wings and tail.',
                    'Letter height: minimum 50 cm for aircraft with maximum certificated take-off mass >5700 kg; minimum 30 cm for others.',
                ],
            },
            {
                heading: 'Certificate of Registration',
                points: [
                    'Every registered aircraft must carry a Certificate of Registration.',
                    'Issued by the State of Registry (DGCA in India).',
                    'Must be on board the aircraft at all times during flight.',
                    'Contains: nationality and registration mark, name and address of owner, aircraft manufacturer, model, serial number.',
                ],
            },
            {
                heading: 'Change of Registration',
                points: [
                    'Aircraft can only be registered in one State at a time.',
                    'Cancellation of previous registration required before re-registration in another State.',
                    'The State of Registry is responsible for ensuring the aircraft is airworthy.',
                ],
            },
        ],
    },

    {
        part: 'PART I — Air Regulations, Operational Procedures & Communications',
        partColor: '#1D4ED8',
        id: 'ch4', num: 4, icon: '✈️', color: '#DC2626',
        title: 'Rules of the Air',
        ref: 'ICAO Annex 2 · CAR Section 9 · Series C Part I Issue II (Rev. Nov 2018)',
        topics: [
            {
                heading: 'Territorial Application',
                points: [
                    'Rules apply to all aircraft flying over Indian Territory and to aircraft bearing Indian nationality wherever they may be.',
                    'Do not conflict with rules published by the State having jurisdiction over the territory flown.',
                ],
            },
            {
                heading: 'Responsibility of Pilot-in-Command',
                points: [
                    'PIC is responsible for the operation of the aircraft whether or not manipulating the controls.',
                    'PIC may depart from the rules in circumstances that render such departure absolutely necessary in the interests of safety.',
                    'Pre-flight action: must become familiar with all available information for the intended flight — weather, NOTAMs, fuel requirements, alternate.',
                    'PIC has final authority as to the disposition of the aircraft while in command.',
                    'No person under influence of psychoactive substances shall perform safety-sensitive functions.',
                ],
            },
            {
                heading: 'General Rules — Protection of Persons & Property',
                points: [
                    'Aircraft shall not be operated negligently or recklessly to endanger life or property.',
                    'Minimum safe heights over congested areas: must be high enough to make emergency landing without undue hazard.',
                    'Cruising levels: IFR flights at altitudes specified in cruising level table (odd thousands East, even thousands West — below FL290).',
                    'Above transition altitude: FL selected from RVSM table.',
                ],
            },
            {
                heading: 'Right-of-Way Rules',
                points: [
                    'Aircraft in distress has right of way over all.',
                    'Balloon > glider > airship > powered aircraft (in order of right of way).',
                    'Aircraft overtaking: must keep away — the aircraft being overtaken has right of way. Overtaking to the right.',
                    'Head-on approach: both alter heading to the right.',
                    'Converging: aircraft on the right has right of way.',
                    'Landing aircraft: has right of way over aircraft in flight or on ground.',
                    'Aircraft on final approach: aircraft at lower altitude has right of way (cannot cut in front).',
                ],
            },
            {
                heading: 'VFR — Visual Flight Rules',
                points: [
                    'VMC Minima below 3000 ft AMSL or 1000 ft AGL (whichever is higher) — Outside controlled airspace: 1500 m flight visibility, clear of cloud.',
                    'VMC Minima at and above 3000 ft AMSL or 1000 ft AGL: 5 km visibility, 1000 ft above, 1000 ft below, 1 NM horizontally from cloud.',
                    'Within Class D airspace: 5 km visibility; 1500 m horizontal, 1000 ft vertical from cloud.',
                    'VFR flights not permitted above FL200 (except gliders — FL600).',
                    'Special VFR: ATC may clear aircraft to operate in a control zone below VMC — visibility at least 1500 m, clear of cloud and in sight of surface.',
                ],
            },
            {
                heading: 'IFR — Instrument Flight Rules',
                points: [
                    'IFR compulsory: when VMC minima cannot be maintained; at night in certain airspace; above certain altitudes.',
                    'IFR cruising levels: below FL290 — odd FL eastbound (000–179°M), even FL westbound (180–359°M).',
                    'Above FL290 with RVSM: 1000 ft separation; without RVSM: 2000 ft separation.',
                    'IFR flight must comply with ATC clearance.',
                    'Pilot must report when unable to maintain assigned altitude.',
                ],
            },
            {
                heading: 'Formation Flying',
                points: [
                    'Aircraft not to be flown in formation except by pre-arrangement among PICs.',
                    'Formation: treated as a single aircraft for ATC purposes.',
                ],
            },
            {
                heading: 'Unmanned Aircraft',
                points: [
                    'Must be operated so as not to create a hazard to persons, property, or other aircraft.',
                    'Must not be flown in controlled airspace without ATC clearance.',
                ],
            },
        ],
    },

    {
        part: 'PART I — Air Regulations, Operational Procedures & Communications',
        partColor: '#1D4ED8',
        id: 'ch5', num: 5, icon: '🗼', color: '#059669',
        title: 'Air Traffic Services',
        ref: 'ICAO Annex 11 · CAR-ANS-ATM',
        topics: [
            {
                heading: 'Objectives of ATS',
                points: [
                    '1. Prevent collisions between aircraft.',
                    '2. Prevent collisions between aircraft on manoeuvring area and obstructions.',
                    '3. Expedite and maintain an orderly flow of air traffic.',
                    '4. Provide advice and information useful for safe and efficient conduct of flights.',
                    '5. Notify organisations and render assistance when required.',
                ],
            },
            {
                heading: 'Types of Air Traffic Services',
                points: [
                    'Air Traffic Control Service (ATC): provides separation — Aerodrome Control, Approach Control, Area Control.',
                    'Flight Information Service (FIS): provides advice and information for safe and efficient conduct. Provided to all flights as far as practical.',
                    'Alerting Service (ALRS): notifies appropriate organisations of aircraft needing SAR assistance.',
                    'Air Traffic Advisory Service: advisory service in advisory airspace (Class F).',
                ],
            },
            {
                heading: 'ATC Units',
                points: [
                    'Area Control Centre (ACC): provides ATC for controlled flights in control areas (en-route phase). India has 4 ACCs: Delhi, Mumbai, Chennai, Kolkata.',
                    'Approach Control Unit (APP): provides ATC for arriving and departing controlled flights.',
                    'Aerodrome Control Tower (TWR): provides ATC for aerodrome traffic.',
                ],
            },
            {
                heading: 'Controlled vs Uncontrolled Airspace',
                points: [
                    'Controlled Airspace: Class A, B, C, D, E — ATC clearance required for IFR.',
                    'Uncontrolled Airspace: Class F (advisory), Class G (FIS only).',
                    'Control Zone (CTR): extends from surface upward to upper limit — protects arriving/departing traffic.',
                    'Terminal Control Area (TMA): control area normally established at confluence of ATS routes at upper limit of CTR.',
                    'Control Area (CTA): controlled airspace above 200 ft AGL.',
                ],
            },
            {
                heading: 'ATC Clearance',
                points: [
                    'Authorization for aircraft to proceed under specified conditions.',
                    'Does not constitute authority to violate rules — PIC responsibility remains.',
                    'Phraseology: "Cleared to [destination] via [route] climb and maintain [altitude] squawk [code]."',
                    'Readback required for: runway-in-use, altimeter settings, SSR codes, level instructions, heading and speed instructions, ATC route clearances.',
                ],
            },
            {
                heading: 'Pilot–Controller Responsibilities',
                points: [
                    'ATC: responsible for separation of IFR flights in controlled airspace.',
                    'Pilot: responsible for terrain clearance, collision avoidance, and following clearances.',
                    'Pilot must report: level reached, vacating level, any deviation from cleared route/level, position (as required).',
                ],
            },
        ],
    },

    {
        part: 'PART I — Air Regulations, Operational Procedures & Communications',
        partColor: '#1D4ED8',
        id: 'ch6', num: 6, icon: '📏', color: '#D97706',
        title: 'Separation Methods & Minima',
        ref: 'ICAO Doc 4444 (PANS-ATM)',
        topics: [
            {
                heading: 'Types of Separation',
                points: [
                    'Vertical Separation: achieved by assignment of different altitudes/FLs.',
                    'Horizontal Separation: achieved by Lateral (different routes) or Longitudinal (same track, time or distance).',
                    'Radar Separation: maintained by ensuring prescribed distance between radar returns.',
                    'Wake Turbulence Separation: additional minima based on aircraft category.',
                ],
            },
            {
                heading: 'Vertical Separation Minima',
                points: [
                    'Below FL290: 1000 ft (300 m) — Standard VSM.',
                    'FL290–FL410 without RVSM: 2000 ft (600 m).',
                    'FL290–FL410 with RVSM approval: 1000 ft (300 m).',
                    'Above FL410: 2000 ft.',
                    'India implemented RVSM in NAT/APAC — most routes above FL290 use 1000 ft VSM.',
                ],
            },
            {
                heading: 'Longitudinal Separation',
                points: [
                    'Time-based on same track: 10 min at same speed; 5 min if leading aircraft 20+ kt faster.',
                    'Distance-based (DME/RNAV): 20 NM at same level; 10 NM if leading aircraft faster.',
                ],
            },
            {
                heading: 'Lateral Separation',
                points: [
                    'Between aircraft on different routes: separated when navigational aids or RNAV confirm separation.',
                    'By tracks: sufficient angular difference defined by applicable regional procedures.',
                ],
            },
            {
                heading: 'Radar Separation Minima',
                points: [
                    'En-route: 5 NM (3 NM in certain TMA with high-resolution radar and accuracy).',
                    'Approach: 3 NM (can be reduced to 2.5 NM under certain conditions).',
                    'Separation maintained until RADAR handoff or pilot reports visual contact.',
                ],
            },
            {
                heading: 'Wake Turbulence Categories',
                points: [
                    'Super (J): MTOW > 560,000 kg (e.g., A380).',
                    'Heavy (H): MTOW > 136,000 kg.',
                    'Medium (M): 7,000–136,000 kg.',
                    'Light (L): MTOW ≤ 7,000 kg.',
                    'Departing behind Heavy: 2 min (or distance equivalent).',
                    'Light/Medium behind Heavy: 4–5 NM on same approach.',
                ],
            },
        ],
    },

    {
        part: 'PART I — Air Regulations, Operational Procedures & Communications',
        partColor: '#1D4ED8',
        id: 'ch7', num: 7, icon: '🛬', color: '#BE185D',
        title: 'Separation in the Vicinity of Aerodromes',
        ref: 'ICAO Doc 4444 · ICAO Annex 14',
        topics: [
            {
                heading: 'Aerodrome Traffic Circuit (ATC)',
                points: [
                    'Standard circuit: left-hand turns (unless specified otherwise).',
                    'Upwind, crosswind, downwind, base, final legs.',
                    'Circuit altitude: 1000 ft AGL typically (may vary by aerodrome).',
                ],
            },
            {
                heading: 'Runway Separation',
                points: [
                    'Successive take-offs same runway: not until preceding aircraft is airborne and has passed DER, or cleared the runway.',
                    'Landing after landing: not until preceding aircraft has vacated runway.',
                    'Landing after departing: not until departing aircraft is airborne and not on collision course.',
                    'ILS/MLS approaches: runway not occupied when landing aircraft crosses threshold.',
                ],
            },
            {
                heading: 'Wake Turbulence near Aerodromes',
                points: [
                    'Generated by wings producing lift — vortices sink and drift downwind.',
                    'Vortices: counter-rotating, 100–200 ft below flight path of generator.',
                    'Worst conditions: light wind, stable atmosphere.',
                    'Precautions on departure: rotate early, climb above and upwind of preceding aircraft\'s track.',
                    'Precautions on approach: maintain above the preceding aircraft\'s glide path.',
                ],
            },
            {
                heading: 'Intersection Departures',
                points: [
                    'TORA may be reduced when aircraft departs from intersection.',
                    'Pilot must be informed of reduced TORA available.',
                ],
            },
        ],
    },

    {
        part: 'PART I — Air Regulations, Operational Procedures & Communications',
        partColor: '#1D4ED8',
        id: 'ch8', num: 8, icon: '🗺️', color: '#6D28D9',
        title: 'Procedures for Aerodrome Control Service',
        ref: 'ICAO Doc 4444 (PANS-ATM) · AIP India',
        topics: [
            {
                heading: 'Tower Responsibilities',
                points: [
                    'Control all traffic on manoeuvring area (runways + taxiways, excluding aprons).',
                    'Issue clearances for take-off, landing, taxi, and runway crossing.',
                    'Provide traffic information and wind/altimeter setting.',
                ],
            },
            {
                heading: 'ATIS (Automatic Terminal Information Service)',
                points: [
                    'Continuous broadcast of routine information to arriving/departing aircraft.',
                    'Contains: aerodrome name, time, approach in use, runway in use, TL/TA, wind, visibility, significant weather, cloud, temperature, dew point, QNH, NOSIG.',
                    'Alphabetical designator (Alpha, Bravo…) changes with significant weather change or hourly.',
                    'Pilot confirms ATIS receipt: "Information Bravo received."',
                ],
            },
            {
                heading: 'Taxi Procedures',
                points: [
                    'ATC issues taxi clearance specifying route, holding position, runway.',
                    'Pilot reads back runway holding position and route.',
                    'Runway incursion prevention: never enter active runway without ATC clearance.',
                    'Line-up and wait: aircraft cleared to enter runway but not take off.',
                    'CAT II/III operations: runway guard lights, stop bars active.',
                ],
            },
            {
                heading: 'Take-Off & Landing Clearance',
                points: [
                    'Take-off clearance: given when runway clear, traffic separation assured.',
                    'Landing clearance: given when runway clear of preceding traffic.',
                    'Backtrack: permission to use opposite end of runway (enter and backtrack).',
                    'Touch-and-go, stop-and-go, low approach: all require specific ATC clearance.',
                ],
            },
            {
                heading: 'Low-Visibility Procedures (LVP)',
                points: [
                    'Initiated when RVR < 600 m or ceiling < 200 ft.',
                    'Reduced movement rate, enhanced holding procedures, surface movement guidance active.',
                    'CAT II/III ILS must be protected — strict runway occupancy rules.',
                ],
            },
        ],
    },

    {
        part: 'PART I — Air Regulations, Operational Procedures & Communications',
        partColor: '#1D4ED8',
        id: 'ch9', num: 9, icon: '📡', color: '#0E7490',
        title: 'Use of ATS Surveillance Systems',
        ref: 'ICAO Doc 4444 · ICAO Annex 10 · CAR-ANS',
        topics: [
            {
                heading: 'Types of Surveillance Systems',
                points: [
                    'PSR (Primary Surveillance Radar): transmits pulses, detects reflections — no transponder needed. Range ~80 NM.',
                    'SSR (Secondary Surveillance Radar): interrogates aircraft transponder; provides code + Mode C altitude. Range ~250 NM.',
                    'Monopulse SSR (MSSR): single interrogation gives both azimuth and identity — more accurate.',
                    'MLAT (Multilateration): uses time difference of arrival from multiple receivers — no rotating antenna.',
                    'ADS-B (Automatic Dependent Surveillance — Broadcast): aircraft broadcasts GPS-derived position. Cost-effective, used for surveillance in remote areas.',
                ],
            },
            {
                heading: 'SSR Transponder Modes',
                points: [
                    'Mode A: 4096 discrete identity codes (squawk).',
                    'Mode C: 4096 altitude codes (pressure altitude to nearest 100 ft).',
                    'Mode S: selective addressing — individual aircraft interrogation + data link capability.',
                    'Mode 3/A: combination of Mode 3 and Mode A, most commonly used.',
                ],
            },
            {
                heading: 'Emergency Transponder Codes',
                points: [
                    'Squawk 7700: General Emergency.',
                    'Squawk 7600: Radio Communication Failure.',
                    'Squawk 7500: Unlawful Interference (Hijack).',
                    'Squawk 2000: Entering controlled airspace without clearance (default for VFR).',
                    'Squawk 7000: VFR conspicuity code (used in uncontrolled airspace in India/ICAO).',
                ],
            },
            {
                heading: 'Radar Vectoring',
                points: [
                    'ATC provides headings for traffic separation, expediting, navigation.',
                    'Pilot must acknowledge and comply with heading instructions.',
                    'Radar vectors for ILS approach: pilot reports established on localizer — radar separation can be terminated.',
                ],
            },
            {
                heading: 'ADS-B',
                points: [
                    'Aircraft avionics determine position (GPS) and broadcast to ground stations and other aircraft (TCAS/ACAS integration).',
                    'Used in en-route surveillance where radar coverage is limited (oceanic, mountainous terrain).',
                    'Requires GNSS + ADS-B Out equipment on aircraft.',
                ],
            },
        ],
    },

    {
        part: 'PART I — Air Regulations, Operational Procedures & Communications',
        partColor: '#1D4ED8',
        id: 'ch10', num: 10, icon: '📢', color: '#065F46',
        title: 'Aeronautical Information Services',
        ref: 'ICAO Annex 15 · CAR-ANS-AIS',
        topics: [
            {
                heading: 'AIS Publications',
                points: [
                    'AIP (Aeronautical Information Publication): contains permanent information of lasting character — GEN, ENR, AD sections.',
                    'AIP Amendment: permanent changes to AIP — notified via AIRAC or non-AIRAC.',
                    'AIP Supplement: temporary changes to AIP (>3 months duration) — on yellow paper.',
                    'AIC (Aeronautical Information Circular): info not qualifying for AIP/NOTAM but related to safety, navigation, technical matters.',
                    'NOTAM: notice distributed by telecom containing info concerning establishment, condition, change of aeronautical facility, service, procedure, or hazard.',
                ],
            },
            {
                heading: 'AIRAC System',
                points: [
                    'Aeronautical Information Regulation and Control: common effective dates at 28-day intervals.',
                    'Significant changes (IFR procedures, airspace, frequencies) must follow AIRAC.',
                    'AIRAC effective dates published in advance — 28 days minimum before effective date.',
                ],
            },
            {
                heading: 'NOTAM Categories',
                points: [
                    'NOTAM N (new): contains new information.',
                    'NOTAM R (replace): replaces a previous NOTAM.',
                    'NOTAM C (cancel): cancels a previous NOTAM.',
                    'SNOWTAM: format for aerodrome surface conditions in winter (snow, slush, ice).',
                    'ASHTAM: volcanic ash/tropical cyclone notification.',
                    'BIRDTAM: bird hazard notification.',
                    'NOTAM Code: 5-letter code — Qline abbreviates the subject.',
                ],
            },
            {
                heading: 'AIP Structure',
                points: [
                    'GEN — General: regulations, services, fees, definitions.',
                    'ENR — En-Route: ATS routes, nav aids, airspace.',
                    'AD — Aerodromes: aerodrome information, charts, procedures.',
                ],
            },
        ],
    },

    {
        part: 'PART I — Air Regulations, Operational Procedures & Communications',
        partColor: '#1D4ED8',
        id: 'ch11', num: 11, icon: '🆘', color: '#B91C1C',
        title: 'Search and Rescue',
        ref: 'ICAO Annex 12',
        topics: [
            {
                heading: 'SAR Phases',
                points: [
                    'INCERFA (Uncertainty Phase): doubt about safety of aircraft and persons on board.',
                    'ALERFA (Alert Phase): apprehension exists regarding safety of aircraft and persons — time overdue, conflicting info.',
                    'DETRESFA (Distress Phase): immediate assistance required — fuel exhausted, pilot declared emergency, forced landing imminent.',
                    'Each phase triggers escalating SAR response by the RCC.',
                ],
            },
            {
                heading: 'RCC & RSC',
                points: [
                    'RCC (Rescue Coordination Centre): responsible for coordination of SAR operations within an SRR. India: multiple RCCs (Air Force, Coast Guard, Civil).',
                    'RSC (Rescue Sub-Centre): assists RCC within a sub-region.',
                    'SRR (Search and Rescue Region): designated area for SAR operations.',
                ],
            },
            {
                heading: 'ELT (Emergency Locator Transmitter)',
                points: [
                    'ELT types: Fixed (F), Portable (P), Automatic Portable (AP), Automatic Fixed (AF), Automatic Deployable (AD).',
                    'Operates on 121.5 MHz (guard) and/or 406 MHz (digital — detected by COSPAS-SARSAT satellite).',
                    '406 MHz ELTs: send unique 15-digit code identifying the aircraft — satellite detects within 45 min.',
                    'COSPAS-SARSAT: international satellite SAR system.',
                    'ELTs must be tested on 121.5 MHz in first 5 minutes of each hour, max 3 sweeps.',
                ],
            },
            {
                heading: 'Pilot Actions in Emergency',
                points: [
                    'Declare emergency to ATC: "MAYDAY MAYDAY MAYDAY" (distress) or "PAN-PAN" (urgency).',
                    'Squawk 7700, turn on ELT if possible.',
                    'ATC: initiate ALERFA/DETRESFA, coordinate with RCC.',
                    'SAR aircraft: conduct search pattern (expanding square, parallel track, sector search).',
                ],
            },
        ],
    },

    {
        part: 'PART I — Air Regulations, Operational Procedures & Communications',
        partColor: '#1D4ED8',
        id: 'ch12', num: 12, icon: '🛤️', color: '#92400E',
        title: 'Visual Aids for Navigation',
        ref: 'ICAO Annex 14 (Aerodromes)',
        topics: [
            {
                heading: 'Runway Markings',
                points: [
                    'Runway designation marking: two-digit number (magnetic heading ÷ 10, rounded).',
                    'Runway centre-line: white dashes (30 m on, 20 m off typically).',
                    'Threshold marking: eight white stripes either side of centreline (broad-body runways).',
                    'Aiming point marking: two solid white rectangles at ~300–400 m from threshold.',
                    'Touchdown zone markings (TDZ): pairs of stripes indicating first 900 m / first third of runway.',
                    'Side stripes: white strips along runway edges.',
                ],
            },
            {
                heading: 'Approach Lighting Systems',
                points: [
                    'ALSF-1/2: high-intensity approach lighting with sequenced flashers — for CAT I/II/III.',
                    'MALSR: medium intensity with sequenced flashers.',
                    'Threshold lights: green lights extending across runway width — visible from approach.',
                    'Runway End Lights: red lights visible from runway direction.',
                    'PAPI (Precision Approach Path Indicator): 4 lights — all red too low; 2 red 2 white on glidepath; all white too high.',
                    'VASIS: visual approach slope indicator — similar principle to PAPI (older system).',
                    'T-VASIS / AT-VASIS: used in some countries.',
                ],
            },
            {
                heading: 'PAPI Reading',
                points: [
                    '4 Red: well below glide path.',
                    '3 Red 1 White: slightly low.',
                    '2 Red 2 White: on glide path.',
                    '1 Red 3 White: slightly high.',
                    '4 White: well above glide path.',
                ],
            },
            {
                heading: 'Taxiway Markings & Signs',
                points: [
                    'Taxiway centreline: continuous yellow line.',
                    'Runway holding position (Cat I): two solid + two dashed yellow lines — never cross without ATC clearance.',
                    'Runway holding position (Cat II/III): double solid yellow lines.',
                    'Mandatory signs: white text on red background (runway designation, ILS critical area, NO ENTRY).',
                    'Information signs: black text on yellow background (taxiway designation, direction, destination).',
                ],
            },
            {
                heading: 'Other Visual Aids',
                points: [
                    'Windsock: indicates wind direction and approximate speed. Fully extended ≈ 15 kt.',
                    'Signal square (signal area): 9×9 m white square — used for visual ground signals.',
                    'Aerodrome Beacon (ABN): rotates green-white (civil) or white-white (military) — visible 20 NM.',
                    'Obstruction lights: red (fixed or flashing) on obstacles >150 m AGL or in approach area.',
                ],
            },
        ],
    },

    {
        part: 'PART I — Air Regulations, Operational Procedures & Communications',
        partColor: '#1D4ED8',
        id: 'ch13', num: 13, icon: '🛩️', color: '#1D4ED8',
        title: 'PANS-OPS — Aircraft Operations',
        ref: 'ICAO Doc 8168 (PANS-OPS) · CAR-OPS Section 1',
        topics: [
            {
                heading: 'Aircraft Categories (Approach)',
                points: [
                    'Cat A: Vat < 91 kt (small piston aircraft).',
                    'Cat B: Vat 91–120 kt.',
                    'Cat C: Vat 121–140 kt (most medium jets — A320, B737).',
                    'Cat D: Vat 141–165 kt (heavy jets — B747, A330).',
                    'Cat E: Vat 166–210 kt (Concorde, military).',
                    'Vat = 1.3 × Vso at maximum certified landing mass.',
                ],
            },
            {
                heading: 'Types of Instrument Approaches',
                points: [
                    'Precision Approach (3D): ILS, MLS, GLS — provides lateral + vertical guidance. DA/H used.',
                    'Non-Precision Approach (2D): VOR, NDB, LOC — lateral only. MDA/H used.',
                    'APV (Approach with Vertical guidance): SBAS, GBAS, Baro-VNAV — between NPA and PA. DA/H used.',
                    'ILS: provides localizer (±2.5° half-course width) and glide slope (typically 3° above runwaymid point).',
                ],
            },
            {
                heading: 'ILS Components',
                points: [
                    'Localizer: transmits on 108.10–111.95 MHz (odd decimals). Provides lateral guidance — 4° course width standard.',
                    'Glideslope: transmits on 329.15–335.00 MHz (paired with localizer). Typical angle 3°.',
                    'Marker Beacons: OM (outer — 75 Hz dash), MM (middle — 75 Hz alternate), IM (inner — continuous dots 75 Hz).',
                    'DME may replace marker beacons in modern ILS installations.',
                ],
            },
            {
                heading: 'SIDs & STARs',
                points: [
                    'SID (Standard Instrument Departure): ATC route from aerodrome to en-route structure.',
                    'STAR (Standard Terminal Arrival Route): ATC route from en-route structure to aerodrome.',
                    'RNAV SID/STAR: uses RNAV instead of conventional ground navaids — more direct routes.',
                    'Clearance: "Cleared [destination] via [SID name] departure, runway [X], squawk [code]."',
                ],
            },
            {
                heading: 'Missed Approach',
                points: [
                    'Initiated at MDA/H or DA/H if required visual reference not established.',
                    'ICAO: two types — immediate (climb straight ahead) or turning missed approach.',
                    'Minimum missed approach climb gradient: 2.5% for most aircraft categories.',
                    'If missed approach not specified in approach chart: execute as per ATC instructions or standard missed approach procedure.',
                ],
            },
        ],
    },

    {
        part: 'PART I — Air Regulations, Operational Procedures & Communications',
        partColor: '#1D4ED8',
        id: 'ch14', num: 14, icon: '⚖️', color: '#374151',
        title: 'National Law',
        ref: 'Aircraft Act 1934 · Aircraft Rules 1937 · CAR',
        topics: [
            {
                heading: 'Aircraft Act, 1934',
                points: [
                    'Provides for control of manufacture, possession, use, operation, sale, import and export of aircraft.',
                    'Empowers Government to make rules for licensing of aerodromes, personnel, and aircraft.',
                    'Applies to all aircraft in India and all aircraft registered in India.',
                    'Key sections: Sec. 5 — offences, Sec. 7 — powers of inspection, Sec. 8 — power to detain aircraft.',
                ],
            },
            {
                heading: 'DGCA — Powers & Functions',
                points: [
                    'Directorate General of Civil Aviation: national regulatory body for civil aviation in India.',
                    'Powers: grant/suspend/revoke licences and certificates; conduct investigations; approve aerodrome standards.',
                    'Issues Civil Aviation Requirements (CARs) — technical and operational regulations.',
                    'Issues Aeronautical Information Circulars (AICs).',
                    'Director General: head of DGCA appointed by Government of India.',
                ],
            },
            {
                heading: 'Civil Aviation Requirements (CARs)',
                points: [
                    'CARs are legally binding regulations issued by DGCA.',
                    'Organized in Sections: Section 1 (General), Section 2 (Airworthiness), Section 3 (Aircraft Operations), Section 4 (Aerodrome Standards), Section 5 (Training), Section 6 (Design Standards), Section 7 (Flight Crew Licensing), Section 8 (Personnel Licensing — others), Section 9 (Air Space).',
                    'Regular amendments issued as aviation standards evolve.',
                ],
            },
            {
                heading: 'Carriage of Documents',
                points: [
                    'Aircraft must carry: Certificate of Registration, Certificate of Airworthiness, Ops Manual / Flight Manual, Journey Logbook, Radio licence, Crew Licences, Passenger Manifest (commercial flights).',
                    'Certificates must be current and valid during the flight.',
                ],
            },
            {
                heading: 'Offences & Penalties',
                points: [
                    'Flying without a licence: punishable under Aircraft Act.',
                    'Flying unregistered/unairworthy aircraft: offence.',
                    'Endangering safety: criminal offence.',
                    'Tampering with aircraft: serious criminal offence.',
                    'Consuming alcohol before/during duty: violation of CAR and CrPC provisions.',
                ],
            },
        ],
    },

    {
        part: 'PART I — Air Regulations, Operational Procedures & Communications',
        partColor: '#1D4ED8',
        id: 'ch15', num: 15, icon: '🪪', color: '#7C3AED',
        title: 'Personnel Licensing',
        ref: 'ICAO Annex 1 · CAR Section 7',
        topics: [
            {
                heading: 'Student Pilot Licence (SPL)',
                points: [
                    'Minimum age: 16 years.',
                    'Valid medical: Class 2 or higher.',
                    'For solo flight under supervision — not valid as crew on commercial flights.',
                ],
            },
            {
                heading: 'Private Pilot Licence (PPL)',
                points: [
                    'Minimum age: 17 years.',
                    'Total flying hours: minimum 40 hours (including 10 hours solo, 5 hours cross-country solo).',
                    'Medical: Class 2.',
                    'Privileges: fly single-engine/multi-engine (with rating) aircraft for non-commercial flights.',
                    'Night flying endorsement required for night operations.',
                ],
            },
            {
                heading: 'Commercial Pilot Licence (CPL)',
                points: [
                    'Minimum age: 18 years.',
                    'Total flying hours: minimum 200 hours (including 100 hours PIC, 20 hours cross-country PIC, 10 hours instrument flying, 5 hours instrument dual).',
                    'Medical: Class 1.',
                    'Privileges: act as PIC or co-pilot on aircraft engaged in commercial air transport.',
                ],
            },
            {
                heading: 'Airline Transport Pilot Licence (ATPL)',
                points: [
                    'Minimum age: 21 years.',
                    'Total flying hours: minimum 1500 hours (including 500 hours multi-crew, 500 hours cross-country, 100 hours night, 75 hours instrument).',
                    'Medical: Class 1.',
                    'Privileges: act as PIC (captain) in commercial air transport operations.',
                ],
            },
            {
                heading: 'Medical Requirements',
                points: [
                    'Class 1 (ATP, CPL, IR): strictest standards — cardiovascular, visual acuity, etc. Validity: 12 months (6 months above age 40 for ATPL).',
                    'Class 2 (PPL, SPL): less stringent. Validity: 24 months (12 months above 40).',
                    'Class 3 (ATC): specific to air traffic controllers.',
                    'Medical conducted by AMEs (Aviation Medical Examiners) designated by DGCA.',
                ],
            },
            {
                heading: 'Recency Requirements',
                points: [
                    'CPL/ATPL: must have flown specified hours in the type within preceding 90 days for PIC.',
                    'Instrument Rating (IR): renewal every 12 months — instrument check required.',
                    'Type Rating: specific to each aircraft type — required before acting as crew.',
                    'Line Check: annual route/line check by approved examiner.',
                ],
            },
        ],
    },

    {
        part: 'PART I — Air Regulations, Operational Procedures & Communications',
        partColor: '#1D4ED8',
        id: 'ch16', num: 16, icon: '🔧', color: '#0891B2',
        title: 'Airworthiness of Aircraft',
        ref: 'ICAO Annex 8 · CAR Section 2',
        topics: [
            {
                heading: 'Certificate of Airworthiness (CofA)',
                points: [
                    'Must be carried in the aircraft at all times.',
                    'Issued by State of Registry (DGCA for Indian-registered aircraft).',
                    'Renewed annually — requires maintenance check (C/D check or annual inspection).',
                    'Standard CofA: issued for aircraft conforming to approved type design.',
                    'Special CofA: for experimental, exhibition, or racing aircraft.',
                ],
            },
            {
                heading: 'Type Certificate (TC)',
                points: [
                    'Design approval of aircraft type by airworthiness authority.',
                    'Issued by DGCA for indigenous aircraft; foreign TCs validated by DGCA.',
                    'Type Certificate Data Sheet (TCDS): essential parameters of the approved design.',
                ],
            },
            {
                heading: 'Airworthiness Directives (AD)',
                points: [
                    'Mandatory — issued by airworthiness authority to correct unsafe conditions.',
                    'Compliance within specified time limit (flight hours, cycles, calendar time).',
                    'Issued when: aircraft design, engine, propeller, or appliance has unsafe condition.',
                    'Must be incorporated before aircraft can be legally operated.',
                ],
            },
            {
                heading: 'MEL (Minimum Equipment List)',
                points: [
                    'Defines conditions under which aircraft may operate with specified instruments or equipment inoperative.',
                    'Based on MMEL (Master MEL) approved by airworthiness authority.',
                    'Operator specific — approved by DGCA for each operator and aircraft type.',
                    'Dispatch with item deferred: must comply with MEL conditions (time limits, crew procedures).',
                ],
            },
            {
                heading: 'Maintenance Requirements',
                points: [
                    'CAME (Continuing Airworthiness Management Exposition): operator\'s maintenance organisation manual.',
                    'Checks: Line (daily/pre-flight), A, B, C, D — increasing scope.',
                    'C Check: major structural inspection every ~18–24 months or 4,000–6,000 hours.',
                    'D (Heavy) Check: complete overhaul every 6–10 years.',
                    'Maintenance must be done by approved maintenance organisation (AMO).',
                ],
            },
        ],
    },

    {
        part: 'PART I — Air Regulations, Operational Procedures & Communications',
        partColor: '#1D4ED8',
        id: 'ch17', num: 17, icon: '📋', color: '#059669',
        title: 'Operational Procedures',
        ref: 'ICAO Annex 6 · CAR-OPS · DGCA CAR Section 3',
        topics: [
            {
                heading: 'Pre-flight Preparation',
                points: [
                    'PIC must ensure: aircraft airworthy, correctly loaded, passengers briefed, NOTAMs checked, weather studied, ATC flight plan filed.',
                    'Ops manual: operator\'s document — must be available to crew during flight.',
                    'Minimum fuel: must carry enough for destination + alternate + contingency (10% of planned trip fuel) + holding (30 min at 1500 ft at destination) + additional.',
                    'Go/No-go decision: PIC\'s responsibility.',
                ],
            },
            {
                heading: 'Fuel Requirements',
                points: [
                    'Trip fuel + contingency + alternate + final reserve (30 min piston / 30 min turbine at holding speed at 1500 ft).',
                    'Contingency: 5% of trip fuel (or 5 min whichever is greater).',
                    'Alternate fuel: fuel to fly from destination alternate routing.',
                    'Final reserve: 45 min piston / 30 min jet.',
                    'Isolated aerodrome: carry additional 15% fuel or 2-hour fuel if no alternate listed.',
                ],
            },
            {
                heading: 'ETOPS / EDTO',
                points: [
                    'Extended Diversion Time Operations: approval for twin-engine to fly routes where diversion time >60 min (ETOPS-120, 180, beyond).',
                    'Requires: engine reliability, maintenance, crew training, alternate availability, medical provisions.',
                    'Applies to: over-water, remote/polar routes.',
                ],
            },
            {
                heading: 'Dangerous Goods',
                points: [
                    'ICAO Annex 18 + IATA DGR (Dangerous Goods Regulations).',
                    '9 classes: Explosives, Gases, Flammable Liquids, Flammable Solids, Oxidizers, Toxic, Radioactive, Corrosives, Miscellaneous.',
                    'Operator must have approved DG training programme.',
                    'Some items forbidden on aircraft entirely; others forbidden in cabin (cargo only).',
                    'Shipper\'s Declaration for DG required for cargo.',
                ],
            },
            {
                heading: 'Mass & Balance',
                points: [
                    'Aircraft must be loaded within certified CG envelope and maximum weights.',
                    'MTOW, MLW, MZFW, OWE, MREW must not be exceeded.',
                    'Load sheet: prepared by load controller, verified by PIC.',
                    'Trim sheet: shows CG position vs allowable limits.',
                ],
            },
        ],
    },

    {
        part: 'PART I — Air Regulations, Operational Procedures & Communications',
        partColor: '#1D4ED8',
        id: 'ch18', num: 18, icon: '⚠️', color: '#DC2626',
        title: 'Special Ops & Hazards',
        ref: 'ICAO Annex 6 · ICAO Annex 2 · ICAO Doc 9432',
        topics: [
            {
                heading: 'Wake Turbulence (detailed)',
                points: [
                    'Vortices generated by wings during lift production.',
                    'Trail behind aircraft — descend at 300–500 ft/min; drift with crosswind.',
                    'Most dangerous: heavy aircraft slow, clean, landing configuration.',
                    'Pilot action: above glide path of preceding heavy; rotate before threshold; fly slightly upwind.',
                ],
            },
            {
                heading: 'Windshear & Microburst',
                points: [
                    'Windshear: sudden change in wind speed and/or direction over short distance.',
                    'Low-level windshear: occurs below 1600 ft AGL — most dangerous on approach/departure.',
                    'Microburst: intense small-scale downdraft hitting ground and spreading outward. Maximum 4 km horizontal. Lasts 2–5 min. Can cause 45–80 kt airspeed change.',
                    'LLWAS (Low-Level Windshear Alert System): ground-based sensors at airports.',
                    'PIREP: pilots report windshear to ATC.',
                    'Recovery: maximum thrust + pitch up to arrest descent rate.',
                ],
            },
            {
                heading: 'TCAS / ACAS',
                points: [
                    'TCAS II (ACAS II): mandated on aircraft >19 seats or MTOW >5700 kg in commercial ops.',
                    'Issues Resolution Advisories (RA) and Traffic Advisories (TA).',
                    'RA types: Climb, Descend, Reduce Climb, Reduce Descent, Don\'t Climb, Don\'t Descend.',
                    'ICAO rule: follow RA immediately — inform ATC after.',
                    'ATC cannot override TCAS RA — pilot must follow TCAS regardless of ATC instruction.',
                ],
            },
            {
                heading: 'GPWS / TAWS',
                points: [
                    'GPWS (Ground Proximity Warning System): alerts based on computed aircraft state.',
                    'TAWS (Terrain Awareness & Warning System): uses GPS + terrain database.',
                    'TAWS provides look-ahead warning — GPWS reactive only.',
                    'Modes (GPWS): excessive descent rate, excessive terrain closure rate, altitude loss after T/O, unsafe terrain clearance, excessive glideslope deviation.',
                    'CFIT: Controlled Flight Into Terrain — primary hazard addressed by TAWS.',
                    'Recovery from GPWS/TAWS: maximum thrust + maximum pitch up (wings level).',
                ],
            },
            {
                heading: 'Bird Strikes',
                points: [
                    'Most occur below 3000 ft AGL — high concentration at aerodromes.',
                    'Mandatory reporting for strikes causing damage.',
                    'Aerodrome wildlife management: scare devices, habitat management, daily inspection.',
                    'Bird Strike Report: filed with DGCA / ICAO database.',
                ],
            },
            {
                heading: 'Laser Hazards',
                points: [
                    'Laser illumination: distraction, temporary flash blindness, afterimage.',
                    'Most dangerous: on approach — pilot incapacitated during critical phase.',
                    'Procedure: shade eyes, do not look at source, inform ATC, continue with other pilot if incapacitated.',
                    'Offense: illegal to direct laser at aircraft.',
                ],
            },
        ],
    },

    {
        part: 'PART I — Air Regulations, Operational Procedures & Communications',
        partColor: '#1D4ED8',
        id: 'ch19', num: 19, icon: '📻', color: '#7C3AED',
        title: 'Communications',
        ref: 'ICAO Annex 10 Vol II · ICAO Doc 9432 (RT Manual)',
        topics: [
            {
                heading: 'RT Phraseology Principles',
                points: [
                    'Clear, concise, unambiguous. Standard phraseology preferred over plain language.',
                    'RTF: Radio Telephony. Fractions in time: "one five" not "fifteen."',
                    'Numbers: said digit by digit for altitudes, headings, frequencies; "thousand" for complete thousands.',
                    'Altitude: "flight level two four zero" not "twenty-four thousand."',
                ],
            },
            {
                heading: 'Distress & Urgency Calls',
                points: [
                    'MAYDAY: distress — immediate danger to life, needs immediate assistance. Spoken 3 times.',
                    'PAN-PAN: urgency — serious condition but not immediate danger. Spoken 3 times.',
                    'Content: Mayday/Pan-Pan × 3; station called; callsign; nature of emergency; intentions; position; altitude; any other useful info.',
                    'Guard frequency: 121.5 MHz (civil) — monitored by aircraft and ATC at all times.',
                ],
            },
            {
                heading: 'Readability Scale',
                points: [
                    '1 — Unreadable.',
                    '2 — Readable now and then.',
                    '3 — Readable but with difficulty.',
                    '4 — Readable.',
                    '5 — Perfectly readable.',
                ],
            },
            {
                heading: 'Phonetic Alphabet',
                points: [
                    'A-Alpha, B-Bravo, C-Charlie, D-Delta, E-Echo, F-Foxtrot, G-Golf, H-Hotel,',
                    'I-India, J-Juliet, K-Kilo, L-Lima, M-Mike, N-November, O-Oscar, P-Papa,',
                    'Q-Quebec, R-Romeo, S-Sierra, T-Tango, U-Uniform, V-Victor, W-Whiskey,',
                    'X-X-ray, Y-Yankee, Z-Zulu.',
                ],
            },
            {
                heading: 'SELCAL',
                points: [
                    'Selective Calling System: ground station selects specific aircraft by unique 4-letter code.',
                    'Aircraft chimes when called — no need to monitor continuously on HF.',
                    'Used on HF long-range communications (oceanic/remote routes).',
                    'Codes: 16 letters (A,B,C,D,E,F,G,H,J,K,L,M,P,Q,R,S) — 4 non-repeated selected.',
                ],
            },
            {
                heading: 'Radio Failure Procedures',
                points: [
                    'Squawk 7600 on transponder.',
                    'In VMC: continue VFR, land at nearest suitable aerodrome, report arrival.',
                    'In IMC: maintain last assigned altitude or MEA (whichever higher) for 1 minute from ETA, then fly route clearance, commence approach at ETA.',
                    'Light signals from ATC: Green continuous = cleared to land; Red continuous = give way and circle; Green flashes = return to land (approved); Red flashes = aerodrome unsafe — do not land.',
                ],
            },
        ],
    },

    {
        part: 'PART I — Air Regulations, Operational Procedures & Communications',
        partColor: '#1D4ED8',
        id: 'ch20', num: 20, icon: '🔍', color: '#B91C1C',
        title: 'Aircraft Accident & Incident',
        ref: 'ICAO Annex 13',
        topics: [
            {
                heading: 'Definitions',
                points: [
                    'Accident: occurrence between boarding and disembarkation involving: death/serious injury, aircraft damage/failure, aircraft missing.',
                    'Serious Incident: incident with high probability of accident (e.g., near collision, hard landing causing structural damage, runway incursion).',
                    'Incident: occurrence affecting or could affect safety — mandatory reporting.',
                    'State of Occurrence: State in whose territory accident occurred.',
                    'State of Registry: State where aircraft is registered.',
                    'State of Operator: State where operator has principal place of business.',
                ],
            },
            {
                heading: 'Notification & Investigation',
                points: [
                    'Notification: State of Occurrence notifies State of Registry, Operator, Manufacturer within 72 hours for serious incidents; immediately for accidents.',
                    'Investigation: conducted by State of Occurrence. Purpose: prevention — not to apportion blame.',
                    'ICAO Annex 13 mandates independent investigation authority.',
                    'India: AAIB (Aircraft Accident Investigation Bureau) — part of MoCA.',
                    'IIB (India): now AAIIB — reports directly to Ministry.',
                ],
            },
            {
                heading: 'FDR & CVR',
                points: [
                    'FDR (Flight Data Recorder): records 25+ flight parameters for last 25 hours.',
                    'CVR (Cockpit Voice Recorder): records last 2 hours of cockpit audio.',
                    'Both crash-protected — withstand 3400 G impact, 1100°C fire, 6000 m underwater.',
                    'Must NOT be erased after an accident/serious incident.',
                    'Flight recorders: bright orange for easy identification.',
                ],
            },
            {
                heading: 'Mandatory Occurrence Reports (MOR)',
                points: [
                    'Pilots, maintenance engineers, ATCOs must report specified safety occurrences.',
                    'Reportable: serious incidents, near misses, bird strikes causing damage, dangerous goods occurrences, security events.',
                    'Goal: just culture — encouraging reporting without fear of punishment (for non-criminal events).',
                ],
            },
        ],
    },

    {
        part: 'PART I — Air Regulations, Operational Procedures & Communications',
        partColor: '#1D4ED8',
        id: 'ch21', num: 21, icon: '🛂', color: '#065F46',
        title: 'Facilitation',
        ref: 'ICAO Annex 9',
        topics: [
            {
                heading: 'Objectives of Annex 9',
                points: [
                    'Simplify and standardize formalities for international aviation.',
                    'Expedite movement of passengers, crew, baggage, cargo, mail across borders.',
                    'Reduce delays caused by border control procedures.',
                ],
            },
            {
                heading: 'Documentation',
                points: [
                    'Passport: primary travel document — ICAO standard (machine-readable).',
                    'Visa: may be required depending on bilateral agreements.',
                    'Crew: must carry valid crew licence + passport.',
                    'General Declaration: form submitted to authorities listing crew and cargo.',
                    'Passenger Manifest: list of passengers.',
                ],
            },
            {
                heading: 'Health & Customs',
                points: [
                    'Health: vaccination certificates, quarantine procedures if required.',
                    'Customs: declaration of goods above duty-free limits.',
                    'Contraband: prohibited — aircraft subject to search.',
                ],
            },
        ],
    },

    {
        part: 'PART I — Air Regulations, Operational Procedures & Communications',
        partColor: '#1D4ED8',
        id: 'ch22', num: 22, icon: '🔒', color: '#374151',
        title: 'Security',
        ref: 'ICAO Annex 17',
        topics: [
            {
                heading: 'Aviation Security Objectives',
                points: [
                    'Safeguard international civil aviation against acts of unlawful interference.',
                    'AVSEC: Aviation Security — covers physical security of aircraft, airports, personnel.',
                ],
            },
            {
                heading: 'Acts of Unlawful Interference',
                points: [
                    'Unlawful seizure of aircraft (hijacking).',
                    'Sabotage of aircraft in service.',
                    'Hostage-taking on board or at aerodrome.',
                    'Violent seizure of aerodrome.',
                    'Placing weapons or dangerous devices on aircraft.',
                    'Communication of false information endangering flight safety.',
                ],
            },
            {
                heading: 'Security Measures',
                points: [
                    'Passenger screening: walk-through metal detectors, body scanners, pat-down.',
                    'Baggage screening: X-ray, explosive trace detection (ETD).',
                    'Cargo screening: mandatory for cargo on passenger aircraft.',
                    'Background checks for airport staff.',
                    'Secure areas: landside vs airside — controlled access.',
                    'Cockpit door: must be reinforced and kept locked during flight.',
                ],
            },
            {
                heading: 'Hijack Procedures',
                points: [
                    'Squawk 7500 — no RT if dangerous.',
                    'Follow hijackers\' instructions if resistance would endanger aircraft.',
                    'Notify ATC at earliest opportunity via ATC speech code or interphone.',
                    'ATC: implement hijack procedures — coordinate with agencies, track aircraft.',
                ],
            },
        ],
    },

    // ══════════════════════ PART II ══════════════════════
    {
        part: 'PART II — Human Factors Affecting Aviation',
        partColor: '#059669',
        id: 'ch23', num: 23, icon: '🧠', color: '#7C3AED',
        title: 'Human Performance & Limitations',
        ref: 'ICAO Doc 9683 (Human Factors Training Manual)',
        topics: [
            {
                heading: 'SHELL Model',
                points: [
                    'S — Software: procedures, checklists, regulations, training programmes.',
                    'H — Hardware: aircraft design, instruments, controls, equipment.',
                    'E — Environment: weather, traffic, time of day, social/organisational culture.',
                    'L — Liveware (centre): the human — pilot, ATC, maintenance engineer.',
                    'Liveware — Liveware: crew interaction, teamwork, communication.',
                    'Interfaces between centre L and each element: mismatch = error opportunity.',
                ],
            },
            {
                heading: 'Information Processing',
                points: [
                    'Sensation → Perception → Attention → Memory → Decision-making → Action.',
                    'Attention: selective (focused), divided, vigilance (sustained).',
                    'Workload: high workload = attention tunnelling, errors.',
                    'Vigilance decrement: performance drops after ~30 min of monitoring.',
                ],
            },
            {
                heading: 'Memory',
                points: [
                    'Sensory memory: very short (milliseconds).',
                    'Working memory (short-term): 7 ± 2 items, 20–30 seconds without rehearsal.',
                    'Long-term memory: procedural (how to do) + declarative (facts).',
                    'Forgetting: decay, interference, retrieval failure.',
                ],
            },
            {
                heading: 'Fatigue',
                points: [
                    'Acute fatigue: from single extended duty period.',
                    'Chronic fatigue: accumulated over days/weeks.',
                    'Circadian rhythm: 24-hour biological cycle. Core body temperature minimum ~0400 local = lowest alertness.',
                    'Night work and jet lag disrupt circadian rhythm.',
                    'FRMS (Fatigue Risk Management System): regulatory framework for managing fatigue.',
                    'FTL (Flight Time Limitations): max 9 hrs (day) / 8 hrs (night) flight duty for commercial ops (India, roughly per CAR).',
                ],
            },
            {
                heading: 'Stress',
                points: [
                    'Eustress: positive stress — enhances performance (Yerkes-Dodson law: inverted-U).',
                    'Distress: negative — degrades performance beyond optimal arousal.',
                    'Symptoms: narrowed attention, impaired decision-making, somatic effects.',
                    'Stressors in aviation: workload, time pressure, noise, temperature, hypoxia, personal issues.',
                ],
            },
        ],
    },

    {
        part: 'PART II — Human Factors Affecting Aviation',
        partColor: '#059669',
        id: 'ch24', num: 24, icon: '👥', color: '#0891B2',
        title: 'CRM, TEM & LOFT',
        ref: 'ICAO Doc 9683 · ICAO Annex 6',
        topics: [
            {
                heading: 'CRM — Crew Resource Management',
                points: [
                    'Effective use of all available resources — hardware, software, liveware — to achieve safe and efficient operation.',
                    'Addresses cognitive and interpersonal skills, not technical flying skills.',
                    'Cognitive skills: situational awareness, problem-solving, decision-making.',
                    'Interpersonal skills: communications, teamwork, leadership, workload management.',
                    'CRM applies to all crew — pilots, cabin crew, dispatchers, maintenance.',
                    'CRM training: mandatory recurrent training for commercial airline crew.',
                ],
            },
            {
                heading: 'TEM — Threat and Error Management',
                points: [
                    'Threat: events outside crew\'s control that increase operational complexity — weather, ATC, system malfunctions.',
                    'Error: crew actions/inactions that deviate from expected or required.',
                    'Undesired Aircraft State (UAS): position, speed, attitude, or configuration unintended — results from unmanaged error.',
                    'TEM model: Threats → (if not managed) → Errors → (if not managed) → UAS → (if not managed) → Accident.',
                    'Goal: manage threats and errors before they become UAS.',
                ],
            },
            {
                heading: 'LOFT — Line-Oriented Flight Training',
                points: [
                    'Full-mission simulation in a line environment — realistic scenarios.',
                    'Focuses on CRM skills — crew communication, decision-making, workload.',
                    'Non-jeopardy training: no pass/fail for CRM behaviours during LOFT.',
                    'Complemented by LOFTE (LOFT Evaluation) for assessment.',
                ],
            },
            {
                heading: 'Situational Awareness (SA)',
                points: [
                    'SA Level 1 — Perception: noticing what is happening.',
                    'SA Level 2 — Comprehension: understanding what it means.',
                    'SA Level 3 — Projection: predicting future state.',
                    'Loss of SA ("Falling behind the aircraft"): dangerous — most accidents involve SA loss.',
                    'Improving SA: cross-checks, crew briefings, "what if" thinking.',
                ],
            },
        ],
    },

    {
        part: 'PART II — Human Factors Affecting Aviation',
        partColor: '#059669',
        id: 'ch25', num: 25, icon: '🔬', color: '#DC2626',
        title: 'Aviation Psychology & HF',
        ref: 'ICAO Doc 9683 · James Reason Error Theory',
        topics: [
            {
                heading: 'Human Error Theory',
                points: [
                    'James Reason\'s Swiss Cheese Model: defences have holes (latent conditions); when holes align, accident occurs.',
                    'Active failures: errors/violations with immediate negative effect (pilot mistakes).',
                    'Latent conditions: hidden failures in system — poor procedures, design, management decisions.',
                    'Error types: Skill-based (slips/lapses — automatic behaviour), Rule-based (misapplication of rules), Knowledge-based (problem-solving in novel situations).',
                ],
            },
            {
                heading: 'Decision-Making Models',
                points: [
                    'Rational model: gather info → generate options → evaluate → choose → execute.',
                    'Naturalistic Decision Making (NDM): experienced operators use pattern recognition — Rapid Decision Making in time-pressure situations.',
                    'Cognitive biases affecting aviation: confirmation bias, plan continuation bias (get-there-itis), authority gradient.',
                    'DECIDE Model: Detect → Estimate → Choose → Identify → Do → Evaluate.',
                    'FOR-DEC: Facts, Options, Risks, Decision, Execute, Check.',
                ],
            },
            {
                heading: 'Organisational Factors',
                points: [
                    'Just culture: equitable treatment of staff who report errors in good faith.',
                    'Blame culture: suppresses reporting — increases hidden risks.',
                    'High reliability organisations (HRO): aviation, nuclear — culture of safety, preoccupation with failure.',
                    'Safety Management System (SMS): structured approach to managing safety risks.',
                    'SMS four pillars: Safety Policy, Safety Risk Management, Safety Assurance, Safety Promotion.',
                ],
            },
            {
                heading: 'Automation & Complacency',
                points: [
                    'Mode confusion: crew unsure which automation mode is active.',
                    'Automation surprise: unexpected system behaviour.',
                    'Over-reliance on automation reduces manual flying skills.',
                    'Monitoring duties increase — vigilance required even with high automation.',
                ],
            },
        ],
    },

    {
        part: 'PART II — Human Factors Affecting Aviation',
        partColor: '#059669',
        id: 'ch26', num: 26, icon: '🫁', color: '#059669',
        title: 'Aviation Physiology & HF',
        ref: 'ICAO Doc 9683 · CAR Section 5',
        topics: [
            {
                heading: 'Hypoxia',
                points: [
                    'Deficiency of oxygen in tissues.',
                    'Types: Hypoxic (altitude), Hypemic (CO poisoning, anaemia), Stagnant (circulatory failure), Histotoxic (alcohol, drugs).',
                    'Time of Useful Consciousness (TUC): 15000 ft — 30 min; 25000 ft — 3–5 min; 35000 ft — 30–60 sec; 40000 ft — 15–20 sec.',
                    'Symptoms: headache, euphoria, impaired judgement, cyanosis, unconsciousness.',
                    'Insidious — pilot may not recognise own impairment.',
                    'Treatment: 100% oxygen, descent.',
                ],
            },
            {
                heading: 'Hyperventilation',
                points: [
                    'Excessive breathing — CO₂ washed out → respiratory alkalosis.',
                    'Cause: anxiety, hypoxia, stress.',
                    'Symptoms: tingling extremities, muscle spasms, dizziness, visual disturbance (similar to hypoxia).',
                    'Treatment: slow breathing, breathe into bag, talk/hum to regulate rate.',
                ],
            },
            {
                heading: 'Spatial Disorientation',
                points: [
                    'Sensory conflict between visual and vestibular cues.',
                    'Somatogravic illusion: false sense of pitch-up on acceleration.',
                    'Leans: bank in one direction while feeling wings level.',
                    'Graveyard spiral: pilot pulls back instead of levelling wings — increasing bank and descent.',
                    'Prevention: trust instruments, scan regularly, transition to instruments promptly.',
                    'Type 1 (unrecognised): pilot unaware; Type 2 (recognised): aware but not recovered; Type 3 (incapacitating).',
                ],
            },
            {
                heading: 'Decompression Sickness (DCS)',
                points: [
                    'Nitrogen comes out of solution when pressure drops rapidly — bubble formation.',
                    'Bends (joints), chokes (respiratory), skin bends, CNS effects.',
                    'Occurs above 18,000 ft — most risk above 25,000 ft.',
                    'Predisposing factors: SCUBA diving before flight, obesity, previous DCS.',
                    'Treatment: recompression chamber, 100% O₂.',
                ],
            },
            {
                heading: 'G-Forces',
                points: [
                    'Positive G (Gz): blood pooled in lower body — greying out (> +4 G), G-LOC at +5 to +9 G.',
                    'Negative G: blood pushed to head — redout.',
                    'AGSM (Anti-G Straining Manoeuvre): tensing leg/abdominal muscles + bearing down breath.',
                    'G-LOC (G-induced Loss of Consciousness): incapacitation + recovery confusion (up to 12 sec).',
                ],
            },
            {
                heading: 'Vision',
                points: [
                    'Rods: peripheral, night vision, no colour.',
                    'Cones: central (fovea), daylight colour vision.',
                    'Night vision adaptation: 30–45 min in dark.',
                    'Empty field myopia: no focussing reference → eyes relax to ~2 m. Scan required.',
                    'Runway illusions: upsloping = too high (undershoot tendency); downsloping = too low (overshoot tendency); narrow runway = too high; wide runway = too low.',
                ],
            },
            {
                heading: 'Alcohol & Drugs',
                points: [
                    'ICAO: minimum 8-hour bottle-to-throttle (48 hours recommended for commercial ops).',
                    'India (DGCA): 12 hours minimum before flight duty. BAC limit: 0.00% for pilots.',
                    'Hangover effects persist — residual impairment even when alcohol metabolised.',
                    'Self-medication: avoid all OTC medications without AME advice.',
                    'Carbon monoxide (CO): odourless, colourless — from heating systems. Symptoms similar to hypoxia. Action: switch off heater, open fresh air vents, land ASAP.',
                ],
            },
        ],
    },

    {
        part: 'PART II — Human Factors Affecting Aviation',
        partColor: '#059669',
        id: 'ch27', num: 27, icon: '❓', color: '#D97706',
        title: 'HF Practice Questions',
        ref: 'Topic-wise MCQs with Answers',
        topics: [
            {
                heading: 'Key Stats for Exam',
                points: [
                    'Human factor cited in ~73% of aviation accidents.',
                    'Most accidents occur during approach and landing phase.',
                    'Rate of accidents in commercial aviation: ~1 per million airport movements.',
                    'CFIT (Controlled Flight Into Terrain): most common specific cause of pilot-induced accidents.',
                    'Approx. 80% of maintenance errors are human-factor related.',
                ],
            },
            {
                heading: 'Common Exam Topics',
                points: [
                    'SHELL model component identification.',
                    'Hypoxia TUC values at various altitudes.',
                    'TCAS RA types and pilot response.',
                    'CRM principles and its applicability.',
                    'Swiss Cheese model: active failures vs latent conditions.',
                    'Decision-making models (DECIDE, FOR-DEC).',
                    'Fatigue and circadian rhythm effects.',
                    'Runway visual illusions.',
                ],
            },
        ],
    },

    // ══════════════════════ PART III ══════════════════════
    {
        part: 'PART III — Sample Question Papers',
        partColor: '#D97706',
        id: 'ch28', num: 28, icon: '📝', color: '#D97706',
        title: 'Sample Question Papers',
        ref: '16 DGCA-pattern full-length papers with answers',
        topics: [
            {
                heading: 'Exam Pattern (DGCA Air Regulations)',
                points: [
                    'ATPL Air Regulations: 100 questions, 90 minutes, negative marking (0.25 per wrong answer).',
                    'CPL Air Regulations: 60–80 questions, 60–75 minutes.',
                    'Passing: 70% marks required.',
                    'Questions cover all chapters — weightage highest for Ch 4 (Rules of Air), Ch 5 (ATS), Ch 15 (Licensing).',
                    '16 sample papers in this book — each simulates full exam pattern.',
                ],
            },
            {
                heading: 'High-Yield Topics (Most Frequently Tested)',
                points: [
                    'VMC minima values by airspace class.',
                    'Transponder codes (7700, 7600, 7500).',
                    'Chicago Convention articles.',
                    'ICAO Annex numbers and subjects.',
                    'Aircraft approach categories (Vat values).',
                    'ILS components and CAT I/II/III minima.',
                    'SAR phases (INCERFA/ALERFA/DETRESFA).',
                    'PAPI reading (colour combinations).',
                    'Hypoxia TUC at altitude.',
                    'CRM / TEM model components.',
                    'Fuel requirements (final reserve, contingency).',
                    'Wake turbulence categories (Super/Heavy/Medium/Light).',
                    'Radio failure procedures (squawk 7600, light signals).',
                ],
            },
            {
                heading: 'Exam Strategy',
                points: [
                    'Read all options before answering — DGCA questions often have very close distractors.',
                    'Know exact numbers: minima, altitudes, times — not approximate.',
                    'Negative marking: skip genuinely unknown questions rather than guessing blindly.',
                    'Do all 16 sample papers — timing yourself.',
                    'Review incorrect answers using chapter notes.',
                ],
            },
        ],
    },
];

// ─── RESOURCES PAGE COMPONENT ────────────────────────────────────────────────
export default function ResourcesPage() {
    const [selectedId, setSelectedId] = useState(CHAPTERS[0].id);
    const [search, setSearch] = useState('');
    const [expandedTopics, setExpandedTopics] = useState({});
    const contentRef = useRef(null);

    const selected = CHAPTERS.find(c => c.id === selectedId);

    // Filter chapters by search
    const filtered = search.trim()
        ? CHAPTERS.filter(c =>
            c.title.toLowerCase().includes(search.toLowerCase()) ||
            c.topics.some(t =>
                t.heading.toLowerCase().includes(search.toLowerCase()) ||
                t.points.some(p => p.toLowerCase().includes(search.toLowerCase()))
            )
        )
        : CHAPTERS;

    function toggleTopic(key) {
        setExpandedTopics(prev => ({ ...prev, [key]: !prev[key] }));
    }

    // Expand all topics when chapter changes
    useEffect(() => {
        if (selected) {
            const initial = {};
            selected.topics.forEach((_, i) => { initial[`${selected.id}-${i}`] = true; });
            setExpandedTopics(initial);
        }
        if (contentRef.current) contentRef.current.scrollTop = 0;
    }, [selectedId]);

    // Group chapters by part
    const parts = [...new Set(CHAPTERS.map(c => c.part))];

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 128px)', background: C.bg, borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.border}` }}>

            {/* ── Left Sidebar: Chapter List ───────────────────────────── */}
            <div style={{ width: 280, flexShrink: 0, background: '#fff', borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                {/* Header */}
                <div style={{ padding: '16px 14px 10px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 8 }}>📁 Air Regulations Notes</div>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search chapters or topics…"
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, color: C.text, outline: 'none', background: C.bg }}
                    />
                </div>

                {/* Chapter list grouped by part */}
                <div style={{ flex: 1, padding: '8px 0' }}>
                    {parts.map(part => {
                        const partChapters = filtered.filter(c => c.part === part);
                        if (!partChapters.length) return null;
                        const partColor = CHAPTERS.find(c => c.part === part)?.partColor || C.primary;
                        const shortPart = part.split('—')[0].trim();
                        return (
                            <div key={part}>
                                <div style={{ padding: '8px 14px 4px', fontSize: 9, fontWeight: 800, color: partColor, letterSpacing: 1, textTransform: 'uppercase', borderTop: `1px solid ${C.border}` }}>
                                    {shortPart}
                                </div>
                                {partChapters.map(ch => (
                                    <button key={ch.id}
                                        onClick={() => { setSelectedId(ch.id); setSearch(''); }}
                                        style={{
                                            width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                                            padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
                                            background: selectedId === ch.id ? ch.color + '15' : 'transparent',
                                            borderLeft: selectedId === ch.id ? `3px solid ${ch.color}` : '3px solid transparent',
                                            transition: 'all .12s',
                                        }}>
                                        <span style={{ fontSize: 14, flexShrink: 0 }}>{ch.icon}</span>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: selectedId === ch.id ? ch.color : C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                Ch {ch.num}. {ch.title}
                                            </div>
                                            <div style={{ fontSize: 10, color: C.muted }}>{ch.topics.length} topics</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Right: Notes Content ─────────────────────────────────── */}
            <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
                {selected && (
                    <>
                        {/* Chapter header */}
                        <div style={{ background: `linear-gradient(120deg,${selected.color}18,${selected.color}08)`, borderRadius: 16, padding: '22px 26px', marginBottom: 24, border: `1px solid ${selected.color}30` }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <div style={{ width: 56, height: 56, borderRadius: 16, background: selected.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
                                    {selected.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 11, color: selected.color, fontWeight: 700, marginBottom: 2 }}>Chapter {selected.num}</div>
                                    <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 4 }}>{selected.title}</div>
                                    <div style={{ fontSize: 11, color: C.muted }}>📌 Reference: {selected.ref}</div>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                                        <span style={{ background: selected.color + '20', color: selected.color, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>{selected.topics.length} Topics</span>
                                        <span style={{ background: C.bg, color: C.muted, fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99, border: `1px solid ${C.border}` }}>
                                            {selected.part.split('—')[0].trim()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Expand/Collapse all */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14, gap: 8 }}>
                            <button onClick={() => {
                                const all = {};
                                selected.topics.forEach((_, i) => { all[`${selected.id}-${i}`] = true; });
                                setExpandedTopics(all);
                            }} style={{ fontSize: 11, color: C.primary, background: C.primaryLight, border: 'none', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontWeight: 700 }}>
                                ↕ Expand All
                            </button>
                            <button onClick={() => setExpandedTopics({})}
                                style={{ fontSize: 11, color: C.muted, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontWeight: 600 }}>
                                ↕ Collapse All
                            </button>
                        </div>

                        {/* Topics */}
                        {selected.topics.map((topic, i) => {
                            const key = `${selected.id}-${i}`;
                            const open = expandedTopics[key] !== false;
                            return (
                                <div key={key} style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 12, overflow: 'hidden' }}>
                                    {/* Topic header */}
                                    <button
                                        onClick={() => toggleTopic(key)}
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: open ? selected.color + '08' : '#fff', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: open ? `1px solid ${selected.color}20` : 'none', transition: 'background .15s' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 28, height: 28, borderRadius: 8, background: selected.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: selected.color, flexShrink: 0 }}>
                                                {i + 1}
                                            </div>
                                            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{topic.heading}</span>
                                        </div>
                                        <span style={{ fontSize: 16, color: C.muted, transform: open ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform .2s' }}>▾</span>
                                    </button>

                                    {/* Points */}
                                    {open && (
                                        <ul style={{ margin: 0, padding: '12px 18px 16px 18px', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {topic.points.map((pt, j) => (
                                                <li key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: selected.color, flexShrink: 0, marginTop: 7 }} />
                                                    <span style={{ fontSize: 13, color: C.text, lineHeight: 1.65 }}
                                                        dangerouslySetInnerHTML={{
                                                            __html: pt
                                                                .replace(/\*\*(.+?)\*\*/g, `<strong style="color:${selected.color}">$1</strong>`)
                                                                .replace(/`(.+?)`/g, `<code style="background:${C.bg};padding:1px 5px;border-radius:4px;font-size:12px;font-family:monospace">$1</code>`)
                                                        }}
                                                    />
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            );
                        })}

                        {/* Footer nav */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                            {(() => {
                                const idx = CHAPTERS.findIndex(c => c.id === selected.id);
                                const prev = CHAPTERS[idx - 1];
                                const next = CHAPTERS[idx + 1];
                                return (
                                    <>
                                        {prev
                                            ? <button onClick={() => setSelectedId(prev.id)}
                                                style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 16px', cursor: 'pointer', fontSize: 13, color: C.text, fontWeight: 600 }}>
                                                ← Ch {prev.num}: {prev.title}
                                            </button>
                                            : <span />}
                                        {next
                                            ? <button onClick={() => setSelectedId(next.id)}
                                                style={{ display: 'flex', alignItems: 'center', gap: 8, background: next.color, border: 'none', borderRadius: 10, padding: '10px 16px', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 700 }}>
                                                Ch {next.num}: {next.title} →
                                            </button>
                                            : <span />}
                                    </>
                                );
                            })()}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}