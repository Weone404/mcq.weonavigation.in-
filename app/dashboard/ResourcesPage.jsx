'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// ─── COLOUR TOKENS ────────────────────────────────────────────────────────────
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
};

// ─── ALL SUBJECTS ─────────────────────────────────────────────────────────────
const SUBJECTS = [
    {
        id: 'air-reg',
        title: 'Air Regulations',
        subtitle: 'ICAO, DGCA, National Law & Procedures',
        icon: '📋',
        color: '#1D4ED8',
        tags: ['ATPL', 'CPL', 'DGCA'],
        lectureCount: 5,
    },
    {
        id: 'meteorology',
        title: 'Meteorology',
        subtitle: 'Weather, Clouds, Pressure Systems',
        icon: '🌦️',
        color: '#0891B2',
        tags: ['ATPL', 'CPL'],
        lectureCount: 7,
    },
    {
        id: 'navigation',
        title: 'Navigation',
        subtitle: 'Charts, VOR, ILS, RNAV',
        icon: '🧭',
        color: '#7C3AED',
        tags: ['ATPL', 'CPL'],
        lectureCount: 3,
    },
    {
        id: 'technical',
        title: 'Technical General',
        subtitle: 'Airframes, Engines, Systems',
        icon: '⚙️',
        color: '#059669',
        tags: ['AME', 'ATPL'],
        lectureCount: 3,
    },
    {
        id: 'radio',
        title: 'Radio Telephony',
        subtitle: 'RTF Procedures & Phraseology',
        icon: '📻',
        color: '#DC2626',
        tags: ['RTR (Aero)'],
        lectureCount: 3,
    },
    {
        id: 'meteo-joshi',
        title: 'Meteorology — IC Joshi',
        subtitle: 'Aviation Met: Atmosphere to Forecasting (7th Ed 2023)',
        icon: '🌤️',
        color: '#0369A1',
        tags: ['CPL', 'ATPL', 'DGCA'],
        lectureCount: 29,
    },
];

// ─── AIR REGULATIONS CHAPTERS ─────────────────────────────────────────────────
const AIR_REG_CHAPTERS = [
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
                    'Annex 6 — Operation of Aircraft',
                    'Annex 7 — Aircraft Nationality & Registration Marks',
                    'Annex 8 — Airworthiness',
                    'Annex 9 — Facilitation',
                    'Annex 10 — Aeronautical Telecommunications',
                    'Annex 11 — Air Traffic Services',
                    'Annex 12 — Search and Rescue',
                    'Annex 13 — Aircraft Accident Investigation',
                    'Annex 14 — Aerodromes',
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
                    'Marks on wings: fixed-wing aircraft must display on lower surface of left wing (or both wings).',
                    'Marks on fuselage: displayed on each side of fuselage between wings and tail.',
                    'Letter height: minimum 50 cm for aircraft with MTOM >5700 kg; minimum 30 cm for others.',
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
        ],
    },
    {
        part: 'PART I — Air Regulations, Operational Procedures & Communications',
        partColor: '#1D4ED8',
        id: 'ch4', num: 4, icon: '✈️', color: '#DC2626',
        title: 'Rules of the Air',
        ref: 'ICAO Annex 2 · CAR Section 9',
        topics: [
            {
                heading: 'Right-of-Way Rules',
                points: [
                    'Aircraft in distress has right of way over all.',
                    'Balloon > glider > airship > powered aircraft (in order of right of way).',
                    'Aircraft overtaking: must keep away — the aircraft being overtaken has right of way. Overtaking to the right.',
                    'Head-on approach: both alter heading to the right.',
                    'Converging: aircraft on the right has right of way.',
                    'Landing aircraft: has right of way over aircraft in flight or on ground.',
                    'Aircraft on final approach: aircraft at lower altitude has right of way.',
                ],
            },
            {
                heading: 'VFR — Visual Flight Rules',
                points: [
                    'VMC Minima below 3000 ft AMSL or 1000 ft AGL (whichever is higher) — Outside controlled airspace: 1500 m flight visibility, clear of cloud.',
                    'VMC Minima at and above 3000 ft AMSL or 1000 ft AGL: 5 km visibility, 1000 ft above, 1000 ft below, 1 NM horizontally from cloud.',
                    'VFR flights not permitted above FL200 (except gliders — FL600).',
                    'Special VFR: ATC may clear aircraft to operate in a control zone below VMC — visibility at least 1500 m.',
                ],
            },
            {
                heading: 'IFR — Instrument Flight Rules',
                points: [
                    'IFR compulsory: when VMC minima cannot be maintained; at night in certain airspace; above certain altitudes.',
                    'IFR cruising levels: below FL290 — odd FL eastbound (000–179°M), even FL westbound (180–359°M).',
                    'Above FL290 with RVSM: 1000 ft separation; without RVSM: 2000 ft separation.',
                ],
            },
            {
                heading: 'Responsibility of Pilot-in-Command',
                points: [
                    'PIC is responsible for the operation of the aircraft whether or not manipulating the controls.',
                    'PIC may depart from the rules in circumstances that render such departure absolutely necessary in the interests of safety.',
                    'Pre-flight action: must become familiar with all available information for the intended flight — weather, NOTAMs, fuel requirements, alternate.',
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
                    'Flight Information Service (FIS): provides advice and information for safe and efficient conduct.',
                    'Alerting Service (ALRS): notifies appropriate organisations of aircraft needing SAR assistance.',
                    'Air Traffic Advisory Service: advisory service in advisory airspace (Class F).',
                ],
            },
            {
                heading: 'ATC Units',
                points: [
                    'Area Control Centre (ACC): provides ATC for controlled flights in control areas. India has 4 ACCs: Delhi, Mumbai, Chennai, Kolkata.',
                    'Approach Control Unit (APP): provides ATC for arriving and departing controlled flights.',
                    'Aerodrome Control Tower (TWR): provides ATC for aerodrome traffic.',
                ],
            },
            {
                heading: 'ATC Clearance',
                points: [
                    'Authorization for aircraft to proceed under specified conditions.',
                    'Does not constitute authority to violate rules — PIC responsibility remains.',
                    'Readback required for: runway-in-use, altimeter settings, SSR codes, level instructions, heading and speed instructions, ATC route clearances.',
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
                ],
            },
            {
                heading: 'Radar Separation Minima',
                points: [
                    'En-route: 5 NM (3 NM in certain TMA with high-resolution radar).',
                    'Approach: 3 NM (can be reduced to 2.5 NM under certain conditions).',
                ],
            },
            {
                heading: 'Wake Turbulence Categories',
                points: [
                    'Super (J): MTOW > 560,000 kg (e.g., A380).',
                    'Heavy (H): MTOW > 136,000 kg.',
                    'Medium (M): 7,000–136,000 kg.',
                    'Light (L): MTOW ≤ 7,000 kg.',
                    'Light/Medium behind Heavy: 4–5 NM on same approach.',
                ],
            },
        ],
    },
    {
        part: 'PART II — Licensing & Airworthiness',
        partColor: '#7C3AED',
        id: 'ch7', num: 7, icon: '🪪', color: '#7C3AED',
        title: 'Personnel Licensing',
        ref: 'ICAO Annex 1 · CAR Section 7',
        topics: [
            {
                heading: 'PPL — Private Pilot Licence',
                points: [
                    'Minimum age: 17 years. Medical: Class 2.',
                    'Total flying hours: minimum 40 hours (including 10 hours solo, 5 hours cross-country solo).',
                    'Privileges: fly single-engine aircraft for non-commercial flights.',
                ],
            },
            {
                heading: 'CPL — Commercial Pilot Licence',
                points: [
                    'Minimum age: 18 years. Medical: Class 1.',
                    'Total flying hours: minimum 200 hours (including 100 hours PIC, 20 hours cross-country PIC, 10 hours instrument).',
                    'Privileges: act as PIC or co-pilot on aircraft engaged in commercial air transport.',
                ],
            },
            {
                heading: 'ATPL — Airline Transport Pilot Licence',
                points: [
                    'Minimum age: 21 years. Medical: Class 1.',
                    'Total flying hours: minimum 1500 hours (including 500 hours multi-crew, 100 hours night, 75 hours instrument).',
                    'Privileges: act as PIC (captain) in commercial air transport operations.',
                ],
            },
            {
                heading: 'Medical Requirements',
                points: [
                    'Class 1 (ATP, CPL, IR): strictest standards. Validity: 12 months (6 months above age 40 for ATPL).',
                    'Class 2 (PPL, SPL): less stringent. Validity: 24 months (12 months above 40).',
                    'Class 3 (ATC): specific to air traffic controllers.',
                ],
            },
        ],
    },
    {
        part: 'PART II — Licensing & Airworthiness',
        partColor: '#7C3AED',
        id: 'ch8', num: 8, icon: '🔧', color: '#0891B2',
        title: 'Airworthiness of Aircraft',
        ref: 'ICAO Annex 8 · CAR Section 2',
        topics: [
            {
                heading: 'Certificate of Airworthiness (CofA)',
                points: [
                    'Must be carried in the aircraft at all times.',
                    'Issued by State of Registry (DGCA for Indian-registered aircraft).',
                    'Renewed annually — requires maintenance check.',
                ],
            },
            {
                heading: 'Airworthiness Directives (AD)',
                points: [
                    'Mandatory — issued by airworthiness authority to correct unsafe conditions.',
                    'Compliance within specified time limit (flight hours, cycles, calendar time).',
                    'Must be incorporated before aircraft can be legally operated.',
                ],
            },
            {
                heading: 'MEL (Minimum Equipment List)',
                points: [
                    'Defines conditions under which aircraft may operate with specified instruments inoperative.',
                    'Based on MMEL (Master MEL) approved by airworthiness authority.',
                    'Operator specific — approved by DGCA for each operator and aircraft type.',
                ],
            },
        ],
    },
    {
        part: 'PART III — SAR, AIS & Security',
        partColor: '#059669',
        id: 'ch9', num: 9, icon: '🆘', color: '#B91C1C',
        title: 'Search and Rescue',
        ref: 'ICAO Annex 12',
        topics: [
            {
                heading: 'SAR Phases',
                points: [
                    'INCERFA (Uncertainty Phase): doubt about safety of aircraft and persons on board.',
                    'ALERFA (Alert Phase): apprehension exists regarding safety of aircraft and persons.',
                    'DETRESFA (Distress Phase): immediate assistance required.',
                ],
            },
            {
                heading: 'ELT (Emergency Locator Transmitter)',
                points: [
                    'Operates on 121.5 MHz (guard) and/or 406 MHz (digital — detected by COSPAS-SARSAT satellite).',
                    '406 MHz ELTs: send unique 15-digit code identifying the aircraft.',
                    'COSPAS-SARSAT: international satellite SAR system.',
                ],
            },
            {
                heading: 'Pilot Actions in Emergency',
                points: [
                    'Declare emergency to ATC: "MAYDAY MAYDAY MAYDAY" (distress) or "PAN-PAN" (urgency).',
                    'Squawk 7700, turn on ELT if possible.',
                    'ATC: initiate ALERFA/DETRESFA, coordinate with RCC.',
                ],
            },
        ],
    },
    {
        part: 'PART III — SAR, AIS & Security',
        partColor: '#059669',
        id: 'ch10', num: 10, icon: '🔒', color: '#374151',
        title: 'Security',
        ref: 'ICAO Annex 17',
        topics: [
            {
                heading: 'Acts of Unlawful Interference',
                points: [
                    'Unlawful seizure of aircraft (hijacking).',
                    'Sabotage of aircraft in service.',
                    'Hostage-taking on board or at aerodrome.',
                    'Placing weapons or dangerous devices on aircraft.',
                ],
            },
            {
                heading: 'Security Measures',
                points: [
                    'Passenger screening: walk-through metal detectors, body scanners, pat-down.',
                    'Baggage screening: X-ray, explosive trace detection (ETD).',
                    'Cockpit door: must be reinforced and kept locked during flight.',
                ],
            },
            {
                heading: 'Hijack Procedures',
                points: [
                    'Squawk 7500 — no RT if dangerous.',
                    'Follow hijackers\' instructions if resistance would endanger aircraft.',
                    'ATC: implement hijack procedures — coordinate with agencies, track aircraft.',
                ],
            },
        ],
    },
];

// ─── METEOROLOGY CHAPTERS ─────────────────────────────────────────────────────
const METEO_CHAPTERS = [
    {
        part: 'PART I — Atmosphere & Thermodynamics',
        partColor: '#0891B2',
        id: 'mch1', num: 1, icon: '🌡️', color: '#0891B2',
        title: 'The Atmosphere',
        ref: 'ICAO Annex 3 · WMO Publications',
        topics: [
            {
                heading: 'Atmospheric Layers',
                points: [
                    'Troposphere: surface to ~11 km (36,000 ft). Contains most weather. Temperature decreases at ~2°C/1000 ft (DALR 3°C/1000 ft).',
                    'Tropopause: boundary between troposphere and stratosphere. Average height: 36,000 ft at mid-latitudes.',
                    'Stratosphere: 11–50 km. Temperature initially stable then increases (ozone layer).',
                    'Mesosphere: 50–80 km. Temperature decreases.',
                    'Thermosphere: above 80 km. Temperature increases dramatically.',
                ],
            },
            {
                heading: 'Standard Atmosphere (ISA)',
                points: [
                    'Temperature: 15°C at MSL (288.15 K).',
                    'Pressure: 1013.25 hPa (29.92 in Hg) at MSL.',
                    'Density: 1.225 kg/m³ at MSL.',
                    'Temperature lapse rate: 1.98°C / 1000 ft (up to tropopause).',
                    'Tropopause: FL360 in ISA.',
                ],
            },
            {
                heading: 'Pressure Systems',
                points: [
                    'Anticyclone (High): high pressure, descending air, generally fair weather, clockwise in NH.',
                    'Depression (Low): low pressure, ascending air, generally cloud and rain, anti-clockwise in NH.',
                    'Col: region between two highs and two lows — light variable winds.',
                    'Isobars: lines of equal pressure.',
                    'Geostrophic wind: flows parallel to isobars — balance between pressure gradient and Coriolis.',
                ],
            },
            {
                heading: 'Wind',
                points: [
                    'Coriolis force: deflects wind to right in NH, left in SH.',
                    'Buys Ballot\'s Law: stand with wind on your back — low pressure is to your left (NH).',
                    'Surface friction: reduces wind speed and backs wind (turns it anti-clockwise in NH).',
                    'Veering: wind turning clockwise (N→E→S→W). Backing: anti-clockwise.',
                    'Jet Stream: narrow fast-moving air current at tropopause level — 100–200 kt, often >250 kt.',
                ],
            },
        ],
    },
    {
        part: 'PART I — Atmosphere & Thermodynamics',
        partColor: '#0891B2',
        id: 'mch2', num: 2, icon: '☁️', color: '#7C3AED',
        title: 'Clouds & Precipitation',
        ref: 'WMO Cloud Atlas · ICAO Annex 3',
        topics: [
            {
                heading: 'Cloud Classification',
                points: [
                    'High clouds (above 20,000 ft): Cirrus (Ci), Cirrocumulus (Cc), Cirrostratus (Cs).',
                    'Middle clouds (6,500–20,000 ft): Altocumulus (Ac), Altostratus (As).',
                    'Low clouds (surface–6,500 ft): Stratocumulus (Sc), Stratus (St), Nimbostratus (Ns).',
                    'Vertical development: Cumulus (Cu), Cumulonimbus (Cb).',
                ],
            },
            {
                heading: 'Cumulonimbus (Cb)',
                points: [
                    'Most hazardous cloud — associated with thunderstorms, hail, severe icing, severe turbulence.',
                    'Can extend from near surface to tropopause (50,000 ft+).',
                    'Associated hazards: lightning, windshear, microburst, heavy rain, hail.',
                    'Avoid by 20 NM in cruise; do not fly over if within 20 NM.',
                    'Top recognition: anvil (cirrus) — indicates mature/dissipating stage.',
                ],
            },
            {
                heading: 'Fog Types',
                points: [
                    'Radiation fog: clear night, light wind, moist ground. Forms after sunset. Disperses with heating.',
                    'Advection fog: warm moist air moves over cold surface. Can persist in windy conditions.',
                    'Upslope fog: air rises along terrain, cools to dew point.',
                    'Steam fog (Arctic smoke): cold air moves over warmer water.',
                    'Freezing fog: supercooled droplets — forms rime ice on surfaces.',
                ],
            },
            {
                heading: 'Precipitation Types',
                points: [
                    'Rain: liquid water drops >0.5 mm.',
                    'Drizzle: fine drops <0.5 mm — usually from stratus.',
                    'Snow: ice crystals — forms below 0°C.',
                    'Hail: balls of ice — only from Cb. Most dangerous in SFC layer.',
                    'FZRA (Freezing Rain): rain that freezes on contact — worst icing condition.',
                ],
            },
        ],
    },
    {
        part: 'PART I — Atmosphere & Thermodynamics',
        partColor: '#0891B2',
        id: 'mch2b', num: '2B', icon: '🌩️', color: '#DC2626',
        title: 'Thunderstorms & Icing',
        ref: 'ICAO Annex 3 · Doc 9328',
        topics: [
            {
                heading: 'Thunderstorm Stages',
                points: [
                    'Cumulus stage: strong updrafts, no precipitation reaching ground.',
                    'Mature stage: updrafts + downdrafts simultaneously — most severe. Lightning begins.',
                    'Dissipating stage: downdrafts predominate, precipitation decreases.',
                    'Squall line: line of thunderstorms — may extend hundreds of miles.',
                ],
            },
            {
                heading: 'Aircraft Icing',
                points: [
                    'Conditions: visible moisture + temperature 0°C to -40°C (worst -5°C to +2°C).',
                    'Clear ice: clear, glassy, dense — forms from large supercooled droplets (FZRA). Hardest to remove.',
                    'Rime ice: white, opaque, brittle — small supercooled droplets. Less dense.',
                    'Mixed ice: combination of clear and rime.',
                    'Carburetor icing: can form between +21°C and 0°C with high humidity.',
                ],
            },
            {
                heading: 'Effects of Icing on Aircraft',
                points: [
                    'Increased drag, reduced lift — disrupts airfoil shape.',
                    'Increased weight.',
                    'Blocked pitot/static ports — erroneous instruments.',
                    'Engine power loss (intake icing, carb icing).',
                    'Control surface restriction.',
                    'Action: activate anti-ice/de-ice, exit icing conditions, increase speed slightly.',
                ],
            },
        ],
    },
    {
        part: 'PART II — Fronts & Weather Systems',
        partColor: '#059669',
        id: 'mch3', num: 3, icon: '🌪️', color: '#059669',
        title: 'Air Masses & Fronts',
        ref: 'WMO Publications · ICAO Doc 7475',
        topics: [
            {
                heading: 'Air Mass Types',
                points: [
                    'Continental Polar (cP): cold, dry. Source: high-latitude land.',
                    'Maritime Polar (mP): cold, moist. Source: high-latitude ocean.',
                    'Continental Tropical (cT): warm, dry. Source: subtropical deserts.',
                    'Maritime Tropical (mT): warm, moist. Source: subtropical oceans.',
                    'Equatorial (E): hot and very moist.',
                ],
            },
            {
                heading: 'Fronts',
                points: [
                    'Warm Front: warm air advancing over cold. Gradual slope (1:150). Cloud sequence: Ci, Cs, As, Ns. Rain ahead of front.',
                    'Cold Front: cold air advancing under warm. Steep slope (1:50–1:100). Cb, heavy showers, rapid clearing. Fast-moving.',
                    'Occluded Front: cold front catches warm front. Combines characteristics of both.',
                    'Stationary Front: front not moving — persistent cloud and precipitation.',
                ],
            },
            {
                heading: 'Mountain Waves & Turbulence',
                points: [
                    'Lee waves: form downwind of mountains in stable air with strong winds (>25 kt across ridge).',
                    'Lenticular clouds (ACSL): mark wave crests — warning of severe turbulence.',
                    'Rotor zone: below lee wave crests near surface — extremely dangerous turbulence.',
                    'CAT (Clear Air Turbulence): at or near jet stream. No visual warning. FL280–FL440.',
                ],
            },
        ],
    },
    {
        part: 'PART III — Aviation Weather Services',
        partColor: '#D97706',
        id: 'mch4', num: 4, icon: '📡', color: '#D97706',
        title: 'Aviation Weather Reports & Forecasts',
        ref: 'ICAO Annex 3 · WMO No. 8',
        topics: [
            {
                heading: 'METAR',
                points: [
                    'Routine aviation weather report — issued every 30 or 60 minutes.',
                    'SPECI: special METAR when significant change occurs (wind, visibility, weather).',
                    'Format: METAR VIDP 010830Z 22015G25KT 180V260 6000 -RA FEW020 SCT035 BKN080 28/24 Q1008 NOSIG=',
                    'Wind: direction/speed in kt or m/s. Gusts: G. Variable direction: VRB.',
                    'Visibility: in metres (up to 9999) or statute miles.',
                    'Cloud: FEW (1-2 oktas), SCT (3-4), BKN (5-7), OVC (8). Height in hundreds of feet.',
                ],
            },
            {
                heading: 'TAF',
                points: [
                    'Terminal Aerodrome Forecast — valid for 9, 12, 18, or 30 hours.',
                    'BECMG: becoming — change expected within 2 hours.',
                    'TEMPO: temporary fluctuation lasting <1 hour.',
                    'PROB30/40: probability 30%/40% of specified conditions.',
                    'FM: from (change expected rapidly).',
                    'AT: at a specific time.',
                ],
            },
            {
                heading: 'SIGMET',
                points: [
                    'Significant Meteorological Information — for en-route hazards.',
                    'Issued for: CB/TS, severe/extreme turbulence, severe icing, mountain wave, dust/sand storm, volcanic ash, tropical cyclone.',
                    'WS SIGMET: turbulence/icing. WV: volcanic ash. WC: tropical cyclone.',
                    'Valid for max 4 hours (6 hours for tropical cyclone, volcanic ash).',
                ],
            },
            {
                heading: 'PIREP',
                points: [
                    'Pilot Report — actual weather conditions encountered in flight.',
                    'Essential for icing, turbulence, visibility reports.',
                    'Format: UA (routine) or UUA (urgent).',
                    'Turbulence intensity: Light, Moderate, Severe, Extreme.',
                    'Icing intensity: Trace, Light, Moderate, Severe.',
                ],
            },
        ],
    },
    {
        part: 'PART III — Aviation Weather Services',
        partColor: '#D97706',
        id: 'mch5', num: 5, icon: '🌀', color: '#B91C1C',
        title: 'Tropical Meteorology',
        ref: 'WMO Tropical Meteorology · ICAO Doc 9817',
        topics: [
            {
                heading: 'Tropical Cyclones',
                points: [
                    'Tropical Depression: sustained winds <35 kt.',
                    'Tropical Storm: sustained winds 35–64 kt. Named at this stage.',
                    'Typhoon/Hurricane/Cyclone: sustained winds ≥65 kt.',
                    'India context: Bay of Bengal and Arabian Sea cyclone season (April–June, September–December).',
                    'Eye: clear area at centre — calm, low pressure. Eye wall: most violent.',
                ],
            },
            {
                heading: 'Monsoon',
                points: [
                    'Southwest monsoon: June–September — brings majority of India\'s annual rainfall.',
                    'Northeast monsoon: October–December — affects southeastern India.',
                    'ITCZ (Intertropical Convergence Zone): band of convective activity near equator.',
                    'Aviation impacts: embedded Cb, low visibility, heavy rain, wind shear.',
                ],
            },
        ],
    },
    {
        part: 'PART IV — Altimetry & Pressure',
        partColor: '#0891B2',
        id: 'mch6', num: 6, icon: '📊', color: '#374151',
        title: 'Altimetry',
        ref: 'ICAO Doc 8168 · PANS-OPS',
        topics: [
            {
                heading: 'Pressure Settings',
                points: [
                    'QNH: altimeter setting that reads altitude above MSL when on aerodrome elevation.',
                    'QFE: altimeter setting that reads zero when on aerodrome threshold elevation.',
                    'QNE: ISA standard setting (1013.25 hPa) — gives Flight Level.',
                    'Transition Altitude (TA): altitude below which QNH is used.',
                    'Transition Level (TL): lowest FL available above TA.',
                    'Transition Layer: between TA and TL.',
                ],
            },
            {
                heading: 'Altimetry Errors',
                points: [
                    'Temperature error: cold temperature causes aircraft to be lower than indicated. ICAO correction formula applies.',
                    'Pressure error: from QNH being different from ISA.',
                    '"High to Low, Look Out Below": flying from high to low pressure — altimeter over-reads.',
                    '"Hot to Cold, Look Out Below": flying from warm to cold air — altimeter over-reads.',
                ],
            },
            {
                heading: 'India Transition Altitude',
                points: [
                    'India TA: 14,000 ft AMSL.',
                    'TL: assigned by ATC (varies by QNH).',
                    'At and above TL: use FL (QNE = 1013 hPa).',
                    'Below TA: use altitude (QNH).',
                ],
            },
        ],
    },
];

// ─── NAVIGATION CHAPTERS ──────────────────────────────────────────────────────
const NAV_CHAPTERS = [
    {
        part: 'PART I — Basic Navigation',
        partColor: '#7C3AED',
        id: 'nch1', num: 1, icon: '🗺️', color: '#7C3AED',
        title: 'Charts & Mapping',
        ref: 'ICAO Annex 4 · ICAO Doc 8697',
        topics: [
            {
                heading: 'Chart Projections',
                points: [
                    'Lambert Conformal Conic: used for en-route charts. Conformal (shapes preserved). Meridians = straight lines. Parallels = arcs.',
                    'Mercator: cylindrical, conformal. Rhumb lines appear as straight lines. Used for topographic and nautical charts. Not suitable for polar navigation.',
                    'Polar Stereographic: used for polar charts above 80°N/S. Conformal.',
                    'Gnomonic: great circles appear as straight lines. Used for plotting great circle routes.',
                ],
            },
            {
                heading: 'Direction & Bearings',
                points: [
                    'True North (TN): direction of geographic North Pole.',
                    'Magnetic North (MN): direction of magnetic North Pole.',
                    'Variation (Declination): angle between TN and MN. East (+): TN east of MN.',
                    'Deviation: error in compass due to aircraft magnetic fields.',
                    'Mnemonic — TVMDC: True + Variation = Magnetic + Deviation = Compass.',
                    '"Cadbury\'s Dairy Milk Very Tasty": Compass → Deviation → Magnetic → Variation → True (add West, subtract East).',
                ],
            },
            {
                heading: 'Distance & Speed',
                points: [
                    '1 Nautical Mile = 1 minute of arc of great circle = 1852 m.',
                    '1 Statute Mile = 1609 m.',
                    'TAS: True Airspeed (IAS corrected for altitude and temperature).',
                    'GS: Groundspeed = TAS ± wind component.',
                    'IAS to TAS: increases ~2% per 1000 ft altitude gain.',
                    'Mach No. = TAS / Speed of Sound. Speed of Sound = 661.5 kt at MSL ISA.',
                ],
            },
        ],
    },
    {
        part: 'PART II — Radio Navigation',
        partColor: '#059669',
        id: 'nch2', num: 2, icon: '📡', color: '#059669',
        title: 'Radio Navigation Aids',
        ref: 'ICAO Annex 10 · ICAO Doc 8071',
        topics: [
            {
                heading: 'VOR (VHF Omnidirectional Range)',
                points: [
                    'Frequency: 108.0–117.95 MHz. Line of sight. Range ~200 NM at altitude.',
                    'Provides magnetic bearing FROM the station (radial).',
                    'DVOR: Doppler VOR — more accurate, less site error.',
                    'CDI: Course Deviation Indicator — full deflection = ±10° (standard, ±5° with GS).',
                    'OBS: Omnibearing Selector — set desired course.',
                    'TO/FROM flag: TO = flying towards station; FROM = flying away.',
                ],
            },
            {
                heading: 'DME (Distance Measuring Equipment)',
                points: [
                    'Frequency: 962–1213 MHz (UHF). Paired with VOR or ILS localizer.',
                    'Measures slant range (not horizontal distance — error at low altitude over station).',
                    'Range: up to 200 NM.',
                    'Interrogates ground transponder; measures round-trip time.',
                    'Co-located VOR/DME: VORDME. Collocated ILS/DME: ILS/DME.',
                ],
            },
            {
                heading: 'NDB & ADF',
                points: [
                    'NDB (Non-Directional Beacon): frequency 190–1750 kHz (LF/MF). Omnidirectional.',
                    'ADF (Automatic Direction Finder): onboard receiver — points to NDB.',
                    'Relative bearing: angle between aircraft nose and NDB (clockwise).',
                    'Magnetic bearing to station: relative bearing + magnetic heading.',
                    'Errors: coastal refraction, night effect, thunderstorm static, mountain effect.',
                    'Range: 25–75 NM (day). Greater at night but unreliable.',
                ],
            },
            {
                heading: 'ILS (Instrument Landing System)',
                points: [
                    'Localizer: 108.10–111.95 MHz (odd decimals). ±35° from runway centreline coverage.',
                    'Glideslope: 329.15–335.00 MHz (UHF — paired). Typical angle 3°.',
                    'Marker Beacons: OM (outer — 75 Hz dash, 4-5 NM), MM (middle — 1500 ft, alternate), IM (inner — <200 ft).',
                    'CAT I: DH 200 ft, RVR 550 m. CAT II: DH 100 ft, RVR 300 m. CAT III: see minima.',
                    'ILS critical area: must be clear of vehicles/aircraft during CAT II/III operations.',
                ],
            },
        ],
    },
    {
        part: 'PART III — RNAV & GNSS',
        partColor: '#DC2626',
        id: 'nch3', num: 3, icon: '🛰️', color: '#DC2626',
        title: 'RNAV, RNP & GNSS',
        ref: 'ICAO Doc 9613 (PBN Manual)',
        topics: [
            {
                heading: 'PBN — Performance Based Navigation',
                points: [
                    'RNAV: Area Navigation — any desired flight path within coverage of navigation aids.',
                    'RNP: RNAV + onboard performance monitoring and alerting.',
                    'Key difference: RNP has containment requirement — 95% within ±X NM, 99.999% within 2X NM.',
                    'RNAV 5: en-route with 5 NM accuracy.',
                    'RNAV 2/1: terminal — 2 NM / 1 NM.',
                    'RNP 0.3: approach with 0.3 NM accuracy.',
                    'RNP AR: Authorization Required approach — curved paths, steep descent.',
                ],
            },
            {
                heading: 'GPS / GNSS',
                points: [
                    'GPS: 24+ satellites in 6 orbital planes at ~20,200 km. 95% accuracy: 13 m.',
                    'GLONASS: Russian system. Galileo: European. BeiDou: Chinese.',
                    'SBAS (Satellite Based Augmentation System): GAGAN (India), WAAS (USA), EGNOS (Europe).',
                    'GAGAN: GPS Aided Geo Augmented Navigation — India\'s SBAS. APV-I/LPV approaches.',
                    'RAIM: Receiver Autonomous Integrity Monitoring — onboard GPS integrity check.',
                ],
            },
            {
                heading: 'RNAV Approaches',
                points: [
                    'LNAV: Lateral Navigation only — uses MDA/H. Equivalent to NDB/VOR approach.',
                    'LNAV/VNAV: lateral + vertical advisory — uses DA/H (Baro-VNAV).',
                    'LPV: Localizer Performance with Vertical guidance — SBAS required. DA/H used. Equivalent to CAT I ILS.',
                    'Missed approach: coded in FMS — automatic prompt at MAP.',
                ],
            },
        ],
    },
];

// ─── TECHNICAL GENERAL CHAPTERS ───────────────────────────────────────────────
const TECH_CHAPTERS = [
    {
        part: 'PART I — Airframes & Structures',
        partColor: '#059669',
        id: 'tch1', num: 1, icon: '🛩️', color: '#059669',
        title: 'Airframes & Structures',
        ref: 'CAR Section 2 · DGCA Technical Notes',
        topics: [
            {
                heading: 'Structural Design',
                points: [
                    'Semi-monocoque: skin + frames + stringers — most common in modern aircraft.',
                    'Monocoque: skin carries all loads (no internal framework).',
                    'Load factor (n): lift/weight ratio. Normal category: +3.8 to -1.5 g.',
                    'Limit load: maximum expected load in service.',
                    'Ultimate load: limit load × safety factor (1.5). Structure must not fail.',
                ],
            },
            {
                heading: 'Control Surfaces',
                points: [
                    'Ailerons: roll control — differential movement. Elevators: pitch control. Rudder: yaw control.',
                    'Flaps: high-lift devices — increase lift and drag. Types: plain, split, slotted, Fowler.',
                    'Slats/Slots: leading edge devices — delay stall, increase CL max.',
                    'Spoilers: reduce lift, increase drag — also assist ailerons in roll.',
                    'Trim tabs: reduce control forces — move opposite to primary surface.',
                ],
            },
            {
                heading: 'Landing Gear',
                points: [
                    'Tricycle: nose + two main — most common. Good ground stability.',
                    'Tailwheel (conventional): main + tail — older aircraft.',
                    'Main gear absorbs landing loads — shock absorbers: oleo-pneumatic.',
                    'Shimmy: nose gear oscillation — dampened by shimmy damper.',
                    'Tyre pressure: checked daily. Under-inflated = rapid wear, overheating.',
                ],
            },
        ],
    },
    {
        part: 'PART II — Engines & Systems',
        partColor: '#D97706',
        id: 'tch2', num: 2, icon: '🔩', color: '#D97706',
        title: 'Engines & Propulsion',
        ref: 'CAR Section 2 · DGCA Technical Circulars',
        topics: [
            {
                heading: 'Piston Engine Principles',
                points: [
                    '4-stroke Otto cycle: Induction → Compression → Power → Exhaust.',
                    'Power factors: manifold pressure, RPM, mixture, temperature.',
                    'Mixture: rich for take-off/climb (cooling), lean for cruise (economy).',
                    'Magnetos: dual ignition system — engine fires even if aircraft electrical system fails.',
                    'Carburetor vs Fuel Injection: FI gives better mixture distribution, less icing risk.',
                ],
            },
            {
                heading: 'Gas Turbine / Jet Engine',
                points: [
                    'Brayton cycle: intake → compression → combustion → expansion → exhaust.',
                    'Types: Turbojet, Turbofan, Turboprop, Turboshaft.',
                    'Turbofan: bypass ratio — high BPR = fuel efficient (modern airliners).',
                    'EPR (Engine Pressure Ratio): thrust setting parameter.',
                    'N1 / N2: fan speed / compressor speed — percentage of max RPM.',
                    'EGT (Exhaust Gas Temperature): limiting parameter — must not exceed red line.',
                ],
            },
            {
                heading: 'Aircraft Systems',
                points: [
                    'Hydraulics: actuates landing gear, flaps, brakes, flight controls (large aircraft). Fluid: Skydrol (phosphate ester).',
                    'Pneumatics: powered by bleed air — pressurization, anti-icing, air conditioning.',
                    'Fuel system: gravity, pump-fed. Crossfeed: allows any engine to use any tank.',
                    'Electrical: AC and DC buses. APU (Auxiliary Power Unit): ground power + bleed air.',
                    'Pressurization: maintains cabin altitude ~6,000–8,000 ft up to aircraft ceiling.',
                    'Oxygen: chemical (PAX), gaseous (crew), liquid (long-haul).',
                ],
            },
        ],
    },
    {
        part: 'PART III — Flight Instruments',
        partColor: '#B91C1C',
        id: 'tch3', num: 3, icon: '🎛️', color: '#B91C1C',
        title: 'Flight Instruments',
        ref: 'CAR Section 2 · ICAO Annex 6',
        topics: [
            {
                heading: 'Pitot-Static Instruments',
                points: [
                    'ASI (Airspeed Indicator): measures dynamic pressure (pitot − static). Reads IAS.',
                    'Altimeter: measures static pressure → converts to altitude. Three-pointer or drum-pointer.',
                    'VSI / IVSI: measures rate of change of static pressure → rate of climb/descent. Lag ~6–9 seconds.',
                    'Pitot heat: prevents ice blockage of pitot tube.',
                    'Alternate static: bypass blocked static port.',
                ],
            },
            {
                heading: 'Gyroscopic Instruments',
                points: [
                    'Gyroscope properties: rigidity (gyro maintains orientation in space) and precession (applied force causes movement 90° later).',
                    'AI (Attitude Indicator / Artificial Horizon): rigidity gyro. Slaved to maintain erection. Toppling limit: ±70–80° pitch, ±360° bank.',
                    'DI (Directional Indicator / Heading Indicator): rigidity gyro. Must be aligned with compass. Precesses — realign every 10–15 min.',
                    'Turn Coordinator / Turn Indicator: precession gyro. Measures rate and quality of turn.',
                ],
            },
            {
                heading: 'Compass',
                points: [
                    'Magnetic compass: direct reading, reliable, independent of power.',
                    'Acceleration error (ANDS): Accelerate→North, Decelerate→South (NH).',
                    'Turning error (UNOS): when turning through N or S — compass lags (NH). Undershoot North, Overshoot South.',
                    'Remote indicating compass (RMI): combines ADF/VOR bearing with gyro heading.',
                ],
            },
        ],
    },
];

// ─── RADIO TELEPHONY CHAPTERS ─────────────────────────────────────────────────
const RADIO_CHAPTERS = [
    {
        part: 'PART I — RTF Fundamentals',
        partColor: '#DC2626',
        id: 'rch1', num: 1, icon: '📡', color: '#DC2626',
        title: 'RTF Principles & Procedures',
        ref: 'ICAO Doc 9432 · Annex 10 Vol II',
        topics: [
            {
                heading: 'RTF Phraseology Principles',
                points: [
                    'Clear, concise, unambiguous. Standard phraseology preferred over plain language.',
                    'Numbers: said digit by digit for altitudes, headings, frequencies.',
                    'Altitude: "flight level two four zero" not "twenty-four thousand."',
                    '"Affirm" (not "affirmative"), "Negative", "Roger" (received), "Wilco" (will comply).',
                    '"Say again": request for repetition. "Standby": wait. "Break": separation of messages.',
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
                    'A-Alpha, B-Bravo, C-Charlie, D-Delta, E-Echo, F-Foxtrot, G-Golf, H-Hotel',
                    'I-India, J-Juliet, K-Kilo, L-Lima, M-Mike, N-November, O-Oscar, P-Papa',
                    'Q-Quebec, R-Romeo, S-Sierra, T-Tango, U-Uniform, V-Victor, W-Whiskey',
                    'X-X-ray, Y-Yankee, Z-Zulu',
                ],
            },
            {
                heading: 'Number Pronunciation',
                points: [
                    '0 = Zero, 1 = Wun, 2 = Too, 3 = Tree, 4 = Fow-er, 5 = Fife',
                    '6 = Six, 7 = Seven, 8 = Ait, 9 = Nin-er',
                    'Thousand: "tree tousand" (3000), "wun zero tousand" (10,000)',
                    'Decimal: "desimal" — 118.3 = "wun wun ait desimal tree"',
                    'Flight levels: "fife fife zero" for FL550.',
                ],
            },
        ],
    },
    {
        part: 'PART I — RTF Fundamentals',
        partColor: '#DC2626',
        id: 'rch2', num: 2, icon: '🆘', color: '#B91C1C',
        title: 'Emergency & Special Procedures',
        ref: 'ICAO Doc 9432 · Annex 10 Vol II',
        topics: [
            {
                heading: 'Distress & Urgency Calls',
                points: [
                    'MAYDAY: distress — immediate danger to life, needs immediate assistance. Spoken 3 times.',
                    'PAN-PAN: urgency — serious condition but not immediate danger. Spoken 3 times.',
                    'Content: Mayday/Pan-Pan × 3; station called; callsign; nature of emergency; intentions; position; altitude; any other useful info.',
                    'Guard frequency: 121.5 MHz (civil) — monitored by aircraft and ATC at all times.',
                    'VHF emergency: 121.5 MHz. HF emergency: 2182 kHz (maritime).',
                ],
            },
            {
                heading: 'Radio Failure Procedures',
                points: [
                    'Squawk 7600 on transponder immediately.',
                    'In VMC: continue VFR, land at nearest suitable aerodrome, report arrival.',
                    'In IMC: maintain last assigned altitude or MEA (whichever higher) for 1 minute from ETA, then fly route clearance, commence approach at ETA.',
                    'ATC light signals: Green continuous = cleared to land; Red continuous = give way/circle; Red flashes = aerodrome unsafe.',
                    'Green flashes (ground): cleared to taxi. Green flashes (air): return to land.',
                ],
            },
            {
                heading: 'SELCAL',
                points: [
                    'Selective Calling System: ground station selects specific aircraft by unique 4-letter code.',
                    'Aircraft chimes when called — no need to monitor continuously on HF.',
                    'Used on HF long-range communications (oceanic/remote routes).',
                    'Codes: 16 letters (A,B,C,D,E,F,G,H,J,K,L,M,P,Q,R,S) — 4 non-repeated.',
                ],
            },
        ],
    },
    {
        part: 'PART II — ATC Communications',
        partColor: '#7C3AED',
        id: 'rch3', num: 3, icon: '🗼', color: '#7C3AED',
        title: 'ATC Phraseology',
        ref: 'ICAO Doc 4444 · AIP India',
        topics: [
            {
                heading: 'Departure Phraseology',
                points: [
                    'Start-up: "Request start-up, information Bravo received, [details]."',
                    'Pushback: "Request pushback, stand [X]." ATC: "[Callsign] pushback approved, face [direction]."',
                    'Taxi: "[Callsign] taxi runway [X] via [taxiway], QNH [value]." READBACK required.',
                    'Line-up: "[Callsign] line-up and wait runway [X]."',
                    'Take-off: "[Callsign] runway [X] cleared for take-off, wind [value]."',
                    'Rejection: "[Callsign] hold position — I will call you."',
                ],
            },
            {
                heading: 'En-Route Phraseology',
                points: [
                    'Level change: "[Callsign] request climb flight level [X]." ATC: "Climb flight level [X], report reaching."',
                    'Squawk: "[Callsign] squawk [code]." Pilot: "Squawking [code] [callsign]."',
                    'Position report: "[Callsign] position [fix] time [Z] level [FL] estimating [next fix] at [time]."',
                    'Frequency change: "Contact [unit] [frequency], good day." Pilot: "[Frequency] good day."',
                ],
            },
            {
                heading: 'Approach Phraseology',
                points: [
                    'Arrival: "[Callsign] estimating [fix] at [time], information [ATIS designator], request [approach type]."',
                    'ILS: "[Callsign] ILS runway [X] cleared." Pilot: "ILS runway [X] cleared [callsign]."',
                    'Go-around: "Go around, I say again go around." Pilot: "Going around [callsign]."',
                    'Vacate: "[Callsign] vacated runway [X], contact ground [frequency]."',
                ],
            },
        ],
    },
];

// ─── IC JOSHI METEOROLOGY CHAPTERS ───────────────────────────────────────────
const JOSHI_METEO_CHAPTERS = [
    {
        part: 'PART I — Atmosphere & Pressure',
        partColor: '#0369A1',
        id: 'jch1', num: 1, icon: '🌍', color: '#0369A1',
        title: 'Atmosphere',
        ref: 'IC Joshi Ch.1 · pp 1–11',
        topics: [
            {
                heading: 'Atmospheric Layers',
                points: [
                    'Troposphere: lowest layer, extends from surface to 16–18 km at equator and 8–10 km at poles. All weather occurs here.',
                    'Temperature falls at 6.5°C/km (lapse rate) in troposphere. Troposphere is generally unstable.',
                    '75% of atmospheric mass and 99% of water vapour lie within the troposphere.',
                    'Lower Troposphere: surface to 2.1 km. Mid Troposphere: 2.1–7.6 km. Upper Troposphere: 7.6 km to tropopause.',
                    'Tropopause: boundary between troposphere and stratosphere. Lapse rate reduces to 1–2°C/km or stops.',
                    'Tropopause height controlled by: surface temperature, latitude, season, land-sea distribution, synoptic situation.',
                    'Tropopause breaks/folds at ~40°N and ~60°N latitude — jet streams occur at these breaks.',
                    'Polar Tropopause: near 300 hPa, polewards of Lat 45–60°. Occasionally over Srinagar in winters.',
                    'Subtropical Tropopause: 150–200 hPa (≈45,000 ft), between 25–35°N. Subtropical Jet Stream (STJ) found here.',
                    'Equatorial Tropopause: ~100 hPa (≈55,000 ft), between 25°N–25°S.',
                    'Stratosphere: above tropopause to ~50 km. Temperature constant then increases (ozone absorbs UV).',
                    'Mesosphere: 50–80 km. Temperature decreases to –90°C.',
                    'Thermosphere/Ionosphere: above 80 km. Temperature increases. Contains D, E, F layers (radio wave reflection).',
                ],
            },
            {
                heading: 'Atmospheric Composition',
                points: [
                    'Nitrogen: 78%, Oxygen: 21%, Argon: 0.93%, CO₂: 0.03%, other gases trace amounts.',
                    'Water vapour: variable, 0–4% by volume. Most important for weather.',
                    'Ozone layer: 20–30 km altitude. Absorbs UV radiation — critical for life.',
                    'Aerosols: dust, smoke, sea salt — act as condensation nuclei for cloud formation.',
                ],
            },
            {
                heading: 'International Standard Atmosphere (ISA)',
                points: [
                    'MSL temperature: +15°C (288.15 K).',
                    'MSL pressure: 1013.25 hPa (29.92 inHg).',
                    'MSL density: 1.225 kg/m³.',
                    'Lapse rate: 1.98°C per 1000 ft (6.5°C/km) up to tropopause at FL360.',
                    'Above tropopause: temperature constant at –56.5°C up to 65,617 ft (20 km).',
                ],
            },
        ],
    },
    {
        part: 'PART I — Atmosphere & Pressure',
        partColor: '#0369A1',
        id: 'jch2', num: 2, icon: '🌡️', color: '#0369A1',
        title: 'Atmospheric Pressure',
        ref: 'IC Joshi Ch.2 · pp 12–26',
        topics: [
            {
                heading: 'Pressure Definitions',
                points: [
                    'Atmospheric pressure: weight of column of air above per unit area. MSL = 1013.25 hPa.',
                    'Pressure decreases with height — approximately 1 hPa per 27 ft near MSL.',
                    'Isobar: line joining points of equal pressure on a synoptic chart.',
                    'Isallobar: line joining points of equal pressure change over a given time.',
                    'Trough: elongated area of low pressure. Ridge: elongated area of high pressure.',
                    'Col: neutral point between two highs and two lows — light variable winds, fog prone.',
                ],
            },
            {
                heading: 'Altimeter Settings',
                points: [
                    'QNH: altimeter set to read height AMSL at aerodrome elevation. Standard setting in India below TA (14,000 ft).',
                    'QFE: altimeter reads zero at aerodrome reference point.',
                    'QNE: standard setting 1013.25 hPa. Used above Transition Level — gives Flight Level.',
                    'QFF: MSL pressure reduced to MSL using actual temperature profile (used in synoptic charts).',
                    'Transition Altitude (TA): India = 14,000 ft AMSL.',
                    'Transition Level (TL): Lowest available FL above TA. Assigned by ATC based on QNH.',
                    'Transition Layer: airspace between TA and TL — altimeters NOT compared here.',
                ],
            },
            {
                heading: 'Pressure Systems',
                points: [
                    'Anticyclone (High): pressure highest at centre. Winds clockwise (NH). Descending air — fair weather, poor visibility near surface.',
                    'Cold Anticyclone: shallow high — forms due to radiative cooling. Fog/frost likely.',
                    'Warm Anticyclone: deep, warm. Blocks weather systems — subtropical highs.',
                    'Depression (Low/Cyclone): pressure lowest at centre. Winds anti-clockwise (NH). Rising air — cloud, rain.',
                    'Geostrophic Wind: wind that flows parallel to isobars balancing PGF and Coriolis. Increases with closer isobars.',
                    'Gradient Wind: like geostrophic but accounts for curvature. Anticyclone: faster than geostrophic. Cyclone: slower.',
                    'Thermal Wind: wind shear vector proportional to temperature gradient. Cold air = stronger wind aloft.',
                ],
            },
        ],
    },
    {
        part: 'PART I — Atmosphere & Pressure',
        partColor: '#0369A1',
        id: 'jch3', num: 3, icon: '🌡️', color: '#0284C7',
        title: 'Temperature',
        ref: 'IC Joshi Ch.3 · pp 27–36',
        topics: [
            {
                heading: 'Temperature Lapse Rates',
                points: [
                    'DALR (Dry Adiabatic Lapse Rate): 3°C / 1000 ft (9.8°C/km) — unsaturated air rising.',
                    'SALR (Saturated/Pseudo-Adiabatic Lapse Rate): variable, ~1.5°C/1000 ft average — saturated air rising (latent heat released).',
                    'ELR (Environmental/Actual Lapse Rate): actual measured temperature decrease with height.',
                    'ELR > DALR → Absolute instability (rare). ELR < SALR → Absolute stability. SALR < ELR < DALR → Conditional instability (most common).',
                ],
            },
            {
                heading: 'Temperature Inversions',
                points: [
                    'Temperature increases with height (opposite of normal) — extremely stable layer.',
                    'Radiation inversion: at surface, on clear nights — trapped pollutants, fog, frost.',
                    'Subsidence inversion: warm air descending in anticyclone — caps convection, limits visibility.',
                    'Frontal inversion: at warm front boundary — warm air over cold.',
                    'Trade wind inversion: ~2000 ft, limits cloud development in tropics.',
                    'Aviation effect: inversions trap moisture and pollutants — severe visibility reduction.',
                ],
            },
            {
                heading: 'Surface & Upper Air Temperature',
                points: [
                    'Diurnal variation: greatest over land, least over ocean. Maximum ~1400 LT, minimum just after sunrise.',
                    'Annual variation: India — extreme over NW, moderate coast, small over islands.',
                    'Urban heat island: cities warmer than surrounding rural areas.',
                    'Temperature vs. altitude: above 8 km, poles start warming and become warmer than equator — reversal of surface pattern.',
                ],
            },
        ],
    },
    {
        part: 'PART I — Atmosphere & Pressure',
        partColor: '#0369A1',
        id: 'jch4', num: 4, icon: '💨', color: '#0369A1',
        title: 'Air Density',
        ref: 'IC Joshi Ch.4 · pp 37–40',
        topics: [
            {
                heading: 'Factors Affecting Air Density',
                points: [
                    'Density decreases with: increasing altitude, increasing temperature, increasing humidity.',
                    'Density altitude: pressure altitude corrected for temperature deviation from ISA.',
                    'High density altitude = low air density — reduced aircraft performance (less lift, thrust, drag).',
                    'HATL conditions (High Altitude, Temperature, Humidity, Low pressure) = worst for performance.',
                ],
            },
            {
                heading: 'Density Altitude & Aviation',
                points: [
                    'Higher DA → longer take-off run, reduced rate of climb, reduced engine power.',
                    'India in summer: DA can be 3000–5000 ft above field elevation at high-altitude airfields.',
                    'Density formula: ρ = P / (R × T) — pressure/temperature relationship.',
                ],
            },
        ],
    },
    {
        part: 'PART I — Atmosphere & Pressure',
        partColor: '#0369A1',
        id: 'jch5', num: 5, icon: '💧', color: '#0284C7',
        title: 'Humidity',
        ref: 'IC Joshi Ch.5 · pp 41–44',
        topics: [
            {
                heading: 'Humidity Definitions',
                points: [
                    'Specific humidity: mass of water vapour per unit mass of moist air (g/kg).',
                    'Relative humidity (RH): ratio of actual vapour pressure to saturation vapour pressure × 100%. Saturation = 100%.',
                    'Dew point (Td): temperature to which air must be cooled at constant pressure to become saturated.',
                    'Frost point: temperature at which frost (ice) forms on surface — slightly higher than dew point.',
                    'Saturation: air can hold maximum moisture at given temperature. Warm air holds more moisture.',
                ],
            },
            {
                heading: 'Condensation & Cloud Formation',
                points: [
                    'Condensation nucleus required for cloud droplet formation.',
                    'Lifting condensation level (LCL): altitude where rising parcel becomes saturated and cloud base forms.',
                    'Cloud base ≈ (surface T – dew point) × 400 ft (rough rule).',
                    'Super-saturation: air slightly above 100% RH before condensation nuclei available.',
                ],
            },
        ],
    },
    {
        part: 'PART II — Winds & Visibility',
        partColor: '#047857',
        id: 'jch6', num: 6, icon: '🌬️', color: '#047857',
        title: 'Winds',
        ref: 'IC Joshi Ch.6 · pp 45–66',
        topics: [
            {
                heading: 'Wind Causes & Forces',
                points: [
                    'Pressure gradient force (PGF): from high to low pressure — perpendicular to isobars.',
                    'Coriolis force: deflects to right (NH), left (SH). Proportional to wind speed and latitude.',
                    'Friction: surface friction reduces wind speed 40–50%, veers/backs wind.',
                    'Geostrophic wind: PGF balanced by Coriolis — flows parallel to straight isobars.',
                    'Gradient wind: curved isobars — anticyclone: weaker than geostrophic; cyclone: stronger.',
                ],
            },
            {
                heading: 'Local Winds',
                points: [
                    'Sea breeze: land heats faster than sea → onshore breeze by day. Reverse at night (land breeze).',
                    'Valley/Anabatic wind: up valley/slope by day (heating). Katabatic: cold air drains down slope/valley at night.',
                    'Foehn/Chinook: warm dry wind on lee side of mountain after moist air rises and sheds rain on windward side.',
                    'Haboob: dust storm — outrush of cold air from Cb system. Common in North India/Rajasthan pre-monsoon.',
                    'Loo: hot dry wind over NW India in May–June. Temperatures up to 48°C.',
                ],
            },
            {
                heading: 'Wind Shear',
                points: [
                    'Change of wind speed and/or direction with distance (horizontal or vertical shear).',
                    'Low-level wind shear (LLWS): hazardous during approach and take-off.',
                    'Causes: frontal zone, inversion, jet stream, Cb outflow, terrain.',
                    'Microburst: intense localised downdraft spreading out — headwind to tailwind change of 40–60 kt within seconds.',
                    'LLWS detection: PIREPS, SIGMET, anemometers, LLWAS (wind shear alert system).',
                ],
            },
            {
                heading: 'Upper Winds',
                points: [
                    'Westerlies: dominant upper wind in mid-latitudes. Increase with altitude to jet stream.',
                    'Trade winds: NE trades (NH), SE trades (SH). Between 5–30° latitude.',
                    'Polar easterlies: weak, variable winds near poles.',
                    'Jet stream: narrow band of fast winds (>60 kt) near tropopause. STJ at ~200 hPa, PFJ at ~300 hPa.',
                ],
            },
        ],
    },
    {
        part: 'PART II — Winds & Visibility',
        partColor: '#047857',
        id: 'jch7', num: 7, icon: '🌫️', color: '#475569',
        title: 'Visibility & Fog',
        ref: 'IC Joshi Ch.7 · pp 67–74',
        topics: [
            {
                heading: 'Visibility Definitions',
                points: [
                    'Meteorological Visibility (MET VIS): greatest distance objects can be seen and recognised under given conditions.',
                    'RVR (Runway Visual Range): distance over which pilot can see runway markings/lights from touchdown zone.',
                    'Slant visibility: visibility from cockpit along approach path to runway — different from surface visibility.',
                    'Prevailing visibility: greatest circle extent (50%) where visibility is the stated value.',
                ],
            },
            {
                heading: 'Fog Types',
                points: [
                    'Radiation fog: clear skies, light winds (2–8 kt), moist surface, night cooling. Lifts as surface heats after sunrise. Deepens with slight increase in wind (3–5 kt).',
                    'Advection fog: warm moist air over cold surface — sea fog. Persistent, less diurnal variation. Wind helps maintain.',
                    'Frontal fog: forms in precipitation ahead of warm front as rain evaporates into cold air below.',
                    'Upslope fog/hill fog: moist air forced up terrain — common in hilly India regions.',
                    'Steam fog/Arctic smoke: cold air over warm water. Shallow, wispy.',
                    'Freezing fog: fog below 0°C — deposits rime ice on all exposed surfaces.',
                ],
            },
            {
                heading: 'Haze, Mist & Smoke',
                points: [
                    'Mist: visibility 1000–5000 m, relative humidity >95%.',
                    'Fog: visibility <1000 m.',
                    'Haze: fine dry dust/aerosols reduce visibility — no humidity requirement. Common in India pre-monsoon and winter.',
                    'Smoke: industrial/agricultural burning — severe visibility in NW India Oct–Nov.',
                ],
            },
        ],
    },
    {
        part: 'PART III — Clouds & Stability',
        partColor: '#7C3AED',
        id: 'jch8', num: 8, icon: '☁️', color: '#7C3AED',
        title: 'Vertical Motion & Clouds',
        ref: 'IC Joshi Ch.8 · pp 75–86',
        topics: [
            {
                heading: 'Causes of Vertical Motion',
                points: [
                    'Thermal convection: surface heating → rising thermals → cumulus development.',
                    'Frontal lifting: warm air forced over cold at frontal boundary.',
                    'Orographic lifting: air forced up over terrain.',
                    'Convergence: air flowing together at low levels — ITCZ, trough lines.',
                    'Divergence: air flowing apart at low levels → subsidence.',
                ],
            },
            {
                heading: 'Cloud Classification (WMO)',
                points: [
                    'High family (>20,000 ft): Cirrus (Ci) — fibrous ice crystals; Cirrostratus (Cs) — halo; Cirrocumulus (Cc) — mackerel sky.',
                    'Middle family (6,500–20,000 ft): Altostratus (As) — grey sheet, rain; Altocumulus (Ac) — grey/white patches.',
                    'Low family (<6,500 ft): Stratus (St) — layer, drizzle; Stratocumulus (Sc) — lumpy rolls; Nimbostratus (Ns) — thick, continuous rain.',
                    'Convective: Cumulus (Cu) — heaped; Cumulonimbus (Cb) — thunderstorm cloud, anvil top.',
                ],
            },
            {
                heading: 'Cumulonimbus Hazards',
                points: [
                    'Severe turbulence: inside and in clear air for 20 NM around Cb.',
                    'Severe icing: at all levels.',
                    'Hail: stones can reach cricket-ball size; extends beyond visible cloud.',
                    'Lightning: corona discharge, St Elmo\'s fire, direct strike.',
                    'Microburst and windshear: sudden changes in wind speed/direction.',
                    'Standing wave: orographic Cb can produce severe turbulence in clear air downstream.',
                ],
            },
        ],
    },
    {
        part: 'PART III — Clouds & Stability',
        partColor: '#7C3AED',
        id: 'jch9', num: 9, icon: '📊', color: '#6D28D9',
        title: 'Stability & Instability of Atmosphere',
        ref: 'IC Joshi Ch.9 · pp 87–94',
        topics: [
            {
                heading: 'Stability Concepts',
                points: [
                    'Absolutely stable: ELR < SALR — displaced parcel returns to original level.',
                    'Absolutely unstable: ELR > DALR — displaced parcel accelerates away. Rare.',
                    'Conditionally unstable: SALR < ELR < DALR — most common state. Unstable only if saturated.',
                    'Neutral stability: ELR = DALR (dry) or ELR = SALR (saturated).',
                    'Convective Available Potential Energy (CAPE): energy available for convective development.',
                ],
            },
            {
                heading: 'Factors Affecting Stability',
                points: [
                    'Surface heating: warms air from below → decreases stability → promotes convection.',
                    'Cold air advection: increases lapse rate → destabilises.',
                    'Warm air advection: reduces lapse rate → stabilises.',
                    'Radiative cooling at cloud top: destabilises cloud layer.',
                    'Subsidence: warms air aloft → very stable (subsidence inversion).',
                ],
            },
        ],
    },
    {
        part: 'PART III — Clouds & Stability',
        partColor: '#7C3AED',
        id: 'jch10', num: 10, icon: '🌈', color: '#9333EA',
        title: 'Optical Phenomena',
        ref: 'IC Joshi Ch.10 · pp 95–101',
        topics: [
            {
                heading: 'Optical Phenomena',
                points: [
                    'Rainbow: sunlight refracted/reflected in raindrops. Always opposite to sun. Primary bow: red outside, violet inside.',
                    'Halo: 22° or 46° circle around sun/moon. Caused by ice crystals in Cs clouds. Indicates approaching warm front.',
                    'Corona: coloured rings close around sun/moon. Caused by diffraction in water droplet clouds (thin Ac/As).',
                    'Glory: circular rainbow seen around aircraft shadow on cloud/fog. Pilots see it around shadow of aircraft.',
                    'Mirage: refraction in layers of different temperature/density. Superior mirage: cold air below warm — objects appear elevated. Inferior mirage: hot surface layer — road/desert water effect.',
                    'St. Elmo\'s fire: luminous glow from charged objects (wing tips, antennas) in strong electric field near Cb.',
                ],
            },
        ],
    },
    {
        part: 'PART IV — Precipitation & Hazards',
        partColor: '#DC2626',
        id: 'jch11', num: 11, icon: '🌧️', color: '#DC2626',
        title: 'Precipitation',
        ref: 'IC Joshi Ch.11 · pp 102–106',
        topics: [
            {
                heading: 'Precipitation Formation',
                points: [
                    'Bergeron-Findeisen process: ice crystals grow at expense of supercooled droplets in mixed clouds. Primary mechanism for precipitation in mid-latitudes.',
                    'Coalescence process: warm clouds — larger drops fall faster, collide and merge. Tropical precipitation.',
                ],
            },
            {
                heading: 'Precipitation Types',
                points: [
                    'Rain: drops >0.5 mm diameter.',
                    'Drizzle: uniform fine drops <0.5 mm — from Stratus/fog. Severe icing risk in winter.',
                    'Snow: ice crystals at temperatures below 0°C. Wet snow: near 0°C — heavy accretion on aircraft.',
                    'Hail: layered ice spheres — only formed in Cb. Most intense within and near storm.',
                    'Freezing rain/drizzle: liquid precipitation that freezes on contact with surface below 0°C. Worst icing condition.',
                    'Sleet: partially melted snow — US definition differs (mix of rain and snow).',
                    'Virga: precipitation evaporating before reaching surface — visible as streaks below cloud base.',
                ],
            },
        ],
    },
    {
        part: 'PART IV — Precipitation & Hazards',
        partColor: '#DC2626',
        id: 'jch12', num: 12, icon: '🧊', color: '#B91C1C',
        title: 'Ice Accretion',
        ref: 'IC Joshi Ch.12 · pp 107–111',
        topics: [
            {
                heading: 'Types of Ice',
                points: [
                    'Clear ice (Glaze ice): large supercooled droplets, slow freezing. Dense, hard, clear, smooth. Forms from FZRA/heavy SLD. Hardest to remove.',
                    'Rime ice: small supercooled droplets, rapid freezing. White, opaque, brittle, rough. Less dangerous than clear ice.',
                    'Mixed ice: combination — rough hard deposits. Common in convective cloud.',
                    'Hoar frost: ice crystals deposited directly from water vapour on cold surfaces. On aircraft: when cold-soaked aircraft enters warm moist air.',
                ],
            },
            {
                heading: 'Icing Conditions',
                points: [
                    'Temperature: 0°C to –40°C. Worst icing: –5°C to +2°C (large supercooled droplets).',
                    'Supercooled Large Droplets (SLD): droplets >50 μm — hazardous, can form ice beyond protected surfaces.',
                    'Carburettor icing: possible at temperatures up to +21°C in humid conditions — venturi effect cools air.',
                    'Structural icing severely affects aircraft: disrupts airflow over wing, increases drag/weight, blocks pitot/static.',
                    'Rain ice: rain falling through below-freezing surface layer — very heavy accretion, transparent.',
                ],
            },
            {
                heading: 'Anti-ice vs De-ice',
                points: [
                    'Anti-icing: prevents ice formation — thermal (bleed air), chemical (TKS fluid), pneumatic boot (cycled).',
                    'De-icing: removes ice already formed — pneumatic boot inflation, chemical fluid, heated surfaces.',
                    'Critical surfaces: leading edges, propeller, windscreen, pitot/static, tail surfaces.',
                ],
            },
        ],
    },
    {
        part: 'PART IV — Precipitation & Hazards',
        partColor: '#DC2626',
        id: 'jch13', num: 13, icon: '⛈️', color: '#991B1B',
        title: 'Thunderstorm',
        ref: 'IC Joshi Ch.13 · pp 112–128',
        topics: [
            {
                heading: 'Thunderstorm Development',
                points: [
                    'Requirements: sufficient moisture, lifting mechanism, instability (high CAPE).',
                    'Cumulus stage: strong updrafts only. No precipitation at surface. Temperature warmer than surroundings.',
                    'Mature stage: updrafts AND downdrafts simultaneously. Lightning, heavy rain, hail, highest turbulence. Most hazardous.',
                    'Dissipating stage: downdrafts dominate, precipitation decreasing, cloud anvil spreading.',
                ],
            },
            {
                heading: 'Types of Thunderstorms',
                points: [
                    'Air mass/thermal: isolated, develop by afternoon surface heating, dissipate by evening.',
                    'Frontal: along cold fronts or pre-frontal squall lines. More organised, persistent.',
                    'Orographic: triggered by forced uplift over mountains.',
                    'Squall line: line of Cb ahead of or along cold front — can stretch 500+ km.',
                    'Supercell: rotating single cell — large hail, tornadoes, extreme winds. Most severe type.',
                ],
            },
            {
                heading: 'Thunderstorm Hazards',
                points: [
                    'Turbulence: severe to extreme inside Cb. CAT up to 50 NM away at altitude.',
                    'Hail: can extend beyond visible cloud. Avoid Cb by 20 NM in cruise.',
                    'Lightning: not usually fatal but can cause radio/avionics damage, static discharge.',
                    'Windshear/microburst: most dangerous on approach — loss of airspeed, possible terrain contact.',
                    'Icing: severe at all altitudes in Cb.',
                    'Low level turbulence: gusty winds, variable windshear near storm.',
                    'Avoid: do not fly under/over/through. Divert. ATC radar, onboard WX radar.',
                ],
            },
        ],
    },
    {
        part: 'PART V — Fronts & Disturbances',
        partColor: '#059669',
        id: 'jch14', num: 14, icon: '🌊', color: '#065F46',
        title: 'Air Masses, Fronts & Western Disturbances',
        ref: 'IC Joshi Ch.14 · pp 129–139',
        topics: [
            {
                heading: 'Air Masses',
                points: [
                    'Air mass: large body of air with uniform temperature and humidity characteristics.',
                    'Source regions: polar, arctic, tropical, equatorial — land or ocean.',
                    'Modification: air mass changes as it moves from source region.',
                    'Over India: mT (Maritime Tropical) from Arabian Sea/BoB, cT (Continental Tropical) from Thar desert, cP (Continental Polar) in winter.',
                ],
            },
            {
                heading: 'Fronts',
                points: [
                    'Front: transition zone between two different air masses.',
                    'Warm front: warm air replacing cold — gentle slope 1:150, wide cloud shield (Ci→Cs→As→Ns), rain 200–400 km ahead.',
                    'Cold front: cold air replacing warm — steep slope 1:50 to 1:100, narrow belt of Cb, heavy showers, rapid clearing.',
                    'Occluded front: cold front overtakes warm front. Cold occlusion (more common in NH): cold air undercuts both. Warm occlusion: shallow cold air.',
                    'Frontolysis: weakening of front. Frontogenesis: intensification.',
                ],
            },
            {
                heading: 'Western Disturbances (WDs)',
                points: [
                    'Extra-tropical cyclones originating over Mediterranean Sea or Atlantic, moving eastward across SW Asia into Indian subcontinent.',
                    'Arrive typically Oct–April. Bring widespread rain/snow over NW India and Pakistan.',
                    'Caused by upper-level westerly trough. Surface manifestation: low pressure trough.',
                    'Associated with: stratus/nimbostratus, continuous rain, snow over Himalayas, fog in IGP.',
                    'Aviation impact: low cloud base, reduced visibility, icing over mountains, snow on runways.',
                ],
            },
        ],
    },
    {
        part: 'PART V — Fronts & Disturbances',
        partColor: '#059669',
        id: 'jch15', num: 15, icon: '💨', color: '#059669',
        title: 'Jet Streams',
        ref: 'IC Joshi Ch.15 · pp 140–146',
        topics: [
            {
                heading: 'Jet Stream Characteristics',
                points: [
                    'Narrow band of strong winds (>60 kt by definition) near tropopause.',
                    'Subtropical Jet Stream (STJ): ~200 hPa (39,000–43,000 ft), Lat 25–35°N. Persistent throughout year.',
                    'Polar Front Jet Stream (PFJ): ~300 hPa (30,000–35,000 ft), Lat 40–60°N. Variable.',
                    'Tropical Easterly Jet (TEJ): summer only, ~150 hPa (45,000 ft), over Indian peninsula. Flows E→W.',
                    'Speeds can exceed 250 kt. Width: 100–400 km. Depth: 3–10 km.',
                ],
            },
            {
                heading: 'Aviation Effects of Jet Streams',
                points: [
                    'Significant time/fuel savings for aircraft flying with jet stream.',
                    'CAT (Clear Air Turbulence): most concentrated near jet — especially on polar/cyclonic side.',
                    'Temperature anomalies: cold side vs warm side of jet.',
                    'Tropopause fold/break: discontinuity at jet location — sudden change in flight level may be required.',
                ],
            },
        ],
    },
    {
        part: 'PART V — Fronts & Disturbances',
        partColor: '#059669',
        id: 'jch16', num: 16, icon: '🌀', color: '#047857',
        title: 'Clear Air Turbulence (CAT)',
        ref: 'IC Joshi Ch.16 · pp 147–148',
        topics: [
            {
                heading: 'CAT Characteristics',
                points: [
                    'Turbulence at upper levels (FL280–FL440) in clear air — no visual warning.',
                    'Most common cause: vertical wind shear near jet stream core.',
                    'Other causes: mountain wave propagation to high altitude, convective cloud tops.',
                    'Intensity: Light, Moderate, Severe, Extreme.',
                    'Severe CAT: abrupt changes, momentary loss of aircraft control.',
                ],
            },
            {
                heading: 'CAT Avoidance',
                points: [
                    'PIREPs essential — report location, altitude, intensity.',
                    'Forecasting: numerical models, SIGMET issued for severe/extreme CAT.',
                    'Avoid areas with large wind shear, near jet stream on cold/poleward side.',
                    'Increase speed to VA (manoeuvring speed) in turbulence.',
                ],
            },
        ],
    },
    {
        part: 'PART V — Fronts & Disturbances',
        partColor: '#059669',
        id: 'jch17', num: 17, icon: '🏔️', color: '#1D4ED8',
        title: 'Mountain Waves',
        ref: 'IC Joshi Ch.17 · pp 149–153',
        topics: [
            {
                heading: 'Mountain Wave Formation',
                points: [
                    'Conditions: stable atmosphere, wind speed >25 kt, wind perpendicular to ridge.',
                    'Lee waves: standing waves downwind of mountains extending to stratosphere.',
                    'Lenticular clouds (ACSL/CCSL): stationary cap clouds marking wave crests. Clear skies between.',
                    'Rotor zone: below wave crest near surface — extremely turbulent, dangerous for low-flying aircraft.',
                    'Rotor cloud: rolls cloud in rotor zone.',
                ],
            },
            {
                heading: 'Mountain Wave Hazards',
                points: [
                    'Severe turbulence in rotor zone and wave troughs.',
                    'Rapid altitude changes: up to 5000 ft/min vertical currents.',
                    'Altimeter errors: standing wave can cause pressure fluctuations.',
                    'Over Himalayas: extreme mountain wave activity. Significant during winter jet stream.',
                    'Avoidance: do not fly near mountain ridges in strong winds. Maintain adequate terrain clearance.',
                ],
            },
        ],
    },
    {
        part: 'PART VI — Tropical & Indian Meteorology',
        partColor: '#B45309',
        id: 'jch18', num: 18, icon: '🌀', color: '#B45309',
        title: 'Tropical Systems',
        ref: 'IC Joshi Ch.18 · pp 154–168',
        topics: [
            {
                heading: 'Tropical Cyclone Development',
                points: [
                    'Requirements: sea surface temp >26°C, sufficient Coriolis (latitude >5°), low wind shear, pre-existing disturbance.',
                    'Stages: Tropical disturbance → Depression (<35 kt) → Tropical storm (35–64 kt, named) → Severe cyclonic storm (>64 kt) → Very severe (>89 kt) → Extremely severe (>118 kt).',
                    'IMD Classification for Bay of Bengal/Arabian Sea (differs from Saffir-Simpson).',
                    'Structure: eye (calm, clear), eye wall (most severe), spiral rainbands.',
                    'Most intense: eye wall. Dangerous to fly through eye — eye wall has extreme turbulence, windshear.',
                ],
            },
            {
                heading: 'India Cyclone Activity',
                points: [
                    'Bay of Bengal: more active. Season: April–June, September–December.',
                    'Arabian Sea: less active. Post-monsoon season peak.',
                    'Pre-monsoon cyclones (April–May): can be intense (e.g. Cyclone Fani, Amphan, Biparjoy).',
                    'Landfall: surge, extreme winds, heavy rain. Aviation: airports often closed.',
                    'VCAS (Very Close to Airport System): airports within ~50 km of cyclone eye — all operations suspended.',
                ],
            },
            {
                heading: 'Other Tropical Systems',
                points: [
                    'ITCZ (Intertropical Convergence Zone): convergence of NE and SE trade winds. Band of convection near equator. Moves N/S with seasons.',
                    'Easterly wave: wave disturbance in tropical easterlies moving W→E. Pre-cursor to cyclone formation.',
                    'Monsoon trough: low pressure extending from Pakistan to BoB. Embedded Cb, heavy rain along trough.',
                    'Peninsular Discontinuity (PD): dry line over peninsular India Apr–May. Pre-monsoon thunderstorms.',
                    'Break monsoon: weakening of SW monsoon — dry spells lasting 7–14 days.',
                ],
            },
        ],
    },
    {
        part: 'PART VI — Tropical & Indian Meteorology',
        partColor: '#B45309',
        id: 'jch19', num: 19, icon: '🇮🇳', color: '#D97706',
        title: 'Climatology of India',
        ref: 'IC Joshi Ch.19 · pp 169–186',
        topics: [
            {
                heading: 'Seasons of India',
                points: [
                    'Winter (Dec–Feb): Western Disturbances bring rain/snow to NW. Cold waves in IGP. NE monsoon over SE India.',
                    'Pre-Monsoon/Hot Weather (Mar–May): NW India very hot (>45°C). Thunderstorms, dust storms (Andhi). Loo winds.',
                    'SW Monsoon (June–Sep): ITCZ moves north. SW winds bring rainfall from both coasts. Onset over Kerala ~1 June.',
                    'Retreating Monsoon/Post-Monsoon (Oct–Nov): Monsoon withdraws N→S. Bay of Bengal cyclones common.',
                ],
            },
            {
                heading: 'SW Monsoon',
                points: [
                    'Caused by differential heating — continent heats faster, low pressure draws in moist oceanic air.',
                    'Two branches: Arabian Sea branch (W coast, Gujarat, central India) and Bay of Bengal branch (NE states, Gangetic plain, central India).',
                    'Normal onset Kerala: 1 June. Withdrawal NW Rajasthan: ~1 September.',
                    'Rainfall distribution: very heavy over Western Ghats/NE India (>200 cm), scanty in NW India (<25 cm).',
                    'Break monsoon: jet stream at 200 hPa shifts south — monsoon weakens temporarily.',
                ],
            },
            {
                heading: 'Aviation Climatology of India',
                points: [
                    'Fog: North India (Oct–Jan). Severe reduction in visibility — affects Delhi, Patiala, Amritsar.',
                    'Dust storms: Pre-monsoon NW India — sudden visibility drops below 200 m.',
                    'Thunderstorms: most frequent April–August. NE states highest frequency.',
                    'Icing: Himalayas (Oct–April), above FL200 elsewhere in monsoon.',
                    'Turbulence: near jet stream Oct–March, Himalayan mountain wave all year.',
                ],
            },
        ],
    },
    {
        part: 'PART VI — Tropical & Indian Meteorology',
        partColor: '#B45309',
        id: 'jch20', num: 20, icon: '🌐', color: '#92400E',
        title: 'General Circulation',
        ref: 'IC Joshi Ch.20 · pp 187–193',
        topics: [
            {
                heading: 'Global Circulation Cells',
                points: [
                    'Hadley Cell: 0–30°N/S. Rising air at ITCZ, poleward flow aloft, sinking at STH, equatorial return as trade winds.',
                    'Ferrel Cell: 30–60°N/S. Indirect cell — westerlies at surface, poleward and equatorward flow.',
                    'Polar Cell: 60–90°N/S. Cold sinking air at poles, low pressure at ~60°, polar easterlies at surface.',
                    'Surface wind belts: Trade winds (5–30°), Westerlies (30–60°), Polar easterlies (60–90°).',
                    'Subtropical High (STH): 25–35°N/S — Horse Latitudes. Descending air, clear skies, deserts.',
                    'Subpolar Low: ~60°N/S — convergence of polar and mid-latitude air.',
                ],
            },
            {
                heading: 'Walker Circulation & ENSO',
                points: [
                    'Walker Circulation: E–W circulation along equator driven by SST differences.',
                    'El Niño: warm SST in eastern Pacific — disrupts Walker circulation. Reduces Indian monsoon.',
                    'La Niña: cool SST in eastern Pacific — enhances Indian monsoon.',
                    'ENSO (El Niño Southern Oscillation): coupled ocean-atmosphere phenomenon affecting global weather patterns.',
                ],
            },
        ],
    },
    {
        part: 'PART VII — Met Services & Codes',
        partColor: '#1D4ED8',
        id: 'jch21', num: 21, icon: '🏛️', color: '#1D4ED8',
        title: 'Meteorological Services for Aviation',
        ref: 'IC Joshi Ch.21 · pp 194–205',
        topics: [
            {
                heading: 'ICAO Annex 3 Requirements',
                points: [
                    'World Area Forecast System (WAFS): two WAFCs (London, Washington) provide global gridded forecasts.',
                    'SIGMETs: issued by MWOs (Meteorological Watch Offices). India MWO: New Delhi and Chennai.',
                    'Aerodrome Met: TAF, METAR/SPECI — issued by AMO (Aerodrome Met Office).',
                    'VOLMET broadcasts: weather reports broadcast on VHF/HF for aircraft in flight.',
                    'D-VOLMET: digital VOLMET via VHF datalink.',
                ],
            },
            {
                heading: 'India Met Organisation (IMD)',
                points: [
                    'Indian Meteorological Department (IMD): national met service. Headquarters: New Delhi.',
                    'Met offices at all major Indian airports: AMOs at major airports, DMOs at smaller ones.',
                    'Regional Specialised Meteorological Centre (RSMC) New Delhi: tropical cyclone advisory for Bay of Bengal/Arabian Sea.',
                    'Area Forecast Centre (AFC) New Delhi and Chennai: provide en-route forecasts.',
                ],
            },
            {
                heading: 'Aviation Weather Products',
                points: [
                    'METAR/SPECI: surface observation at aerodrome.',
                    'TAF: terminal forecast. ARFOR: area forecast for low-level flights. ROFOR: route forecast.',
                    'SIGMET: en-route hazards (TS, severe icing, turbulence, volcanic ash, dust storm).',
                    'AIRMET: less severe en-route phenomena for lower levels.',
                    'PIREP (UA/UUA): pilot weather reports — valuable real-time data.',
                    'SIGWX charts: significant weather prognostic charts — WAFS products.',
                ],
            },
        ],
    },
    {
        part: 'PART VII — Met Services & Codes',
        partColor: '#1D4ED8',
        id: 'jch22', num: 22, icon: '📡', color: '#2563EB',
        title: 'Weather Radar & Met Satellites',
        ref: 'IC Joshi Ch.22 · pp 206–213',
        topics: [
            {
                heading: 'Weather Radar',
                points: [
                    'Principle: microwave energy backscattered by precipitation particles.',
                    'C-band (5.5 cm): most common met radar. X-band: airborne radar.',
                    'Radar returns: precipitation type and intensity. DBz scale: light rain <30, heavy >50, hail >55.',
                    'Doppler radar: measures velocity of precipitation — wind speed/direction at various levels. Detects windshear.',
                    'VAD (Velocity Azimuth Display): technique to derive vertical wind profile from Doppler.',
                    'Dual-polarisation radar: distinguishes rain, hail, snow, ice crystals more accurately.',
                ],
            },
            {
                heading: 'Meteorological Satellites',
                points: [
                    'GEO (Geostationary) satellites: 36,000 km altitude. Fixed position over equator. INSAT/METEOSAT/GOES.',
                    'LEO (Low Earth Orbit) satellites: 800–1400 km. Polar orbits. NOAA, MODIS, Suomi NPP.',
                    'Imagery types: VIS (visible — sunlit), IR (infrared — cloud top temp), WV (water vapour — mid/upper troposphere).',
                    'INSAT series: India\'s geostationary met satellite. Current: INSAT-3D, 3DR, 3DS.',
                    'Cloud top temperature from IR: cooler = higher cloud = more significant.',
                ],
            },
        ],
    },
    {
        part: 'PART VII — Met Services & Codes',
        partColor: '#1D4ED8',
        id: 'jch23', num: 23, icon: '🔭', color: '#1E40AF',
        title: 'Met Instruments',
        ref: 'IC Joshi Ch.23 · pp 214–215',
        topics: [
            {
                heading: 'Surface Met Instruments',
                points: [
                    'Barometer: mercury (Fortin/Kew) or aneroid. Measures atmospheric pressure.',
                    'Thermometer: mercury, min/max, Stevenson screen (screen prevents solar radiation).',
                    'Hygrometer/Psychrometer: wet and dry bulb — measures humidity/dew point.',
                    'Anemometer: cup or sonic — wind speed. Wind vane: direction.',
                    'Rain gauge: funnel and measuring cylinder. Tipping bucket rain gauge: automatic.',
                    'Sunshine recorder (Campbell-Stokes): glass sphere burns trace on card.',
                    'Ceilometer: laser/light beam measures cloud base height.',
                    'Transmissometer: measures visibility/RVR along runway.',
                ],
            },
        ],
    },
    {
        part: 'PART VII — Met Services & Codes',
        partColor: '#1D4ED8',
        id: 'jch24', num: 24, icon: '🗺️', color: '#3B82F6',
        title: 'Station Model',
        ref: 'IC Joshi Ch.24 · pp 216–226',
        topics: [
            {
                heading: 'Station Model Plotting',
                points: [
                    'Synoptic chart observation coded around a station circle.',
                    'Wind: shaft from circle in wind direction; barbs = speed (short = 5 kt, long = 10 kt, flag = 50 kt).',
                    'Cloud cover: fill of station circle (0 = clear, half = 4 oktas, full = 8 oktas).',
                    'Temperature (TT) top left; Dew point (TdTd) bottom left; Pressure (PPP) top right; Pressure tendency (pp) bottom right.',
                    'Present weather (ww): 100 codes — various precipitation, fog, TS symbols.',
                    'Cloud types: low cloud type (CL), middle cloud type (CM), high cloud type (CH).',
                ],
            },
        ],
    },
    {
        part: 'PART VII — Met Services & Codes',
        partColor: '#1D4ED8',
        id: 'jch25', num: 25, icon: '📋', color: '#0369A1',
        title: 'METAR, SPECI & TREND',
        ref: 'IC Joshi Ch.25 · pp 227–241',
        topics: [
            {
                heading: 'METAR Decode',
                points: [
                    'Format: TYPE ICAO DDHHMMz WIND VIS WX CLOUD T/Td QNH TREND=',
                    'METAR VIDP 151230Z 27015KT 8000 -RA FEW020 SCT040 BKN080 30/22 Q1005 BECMG 5000 RA=',
                    'Wind: 270° at 15 kt. VIS: 8000 m. Light rain (-RA). Clouds: FEW at 2000 ft, SCT 4000 ft, BKN 8000 ft.',
                    'Temp 30°C / Dew point 22°C. QNH 1005 hPa. Trend: becoming 5000 m in rain.',
                    'SPECI: special report when: wind change >10 kt, VIS improves/deteriorates past threshold, new significant WX, CB appears, cloud base changes past threshold.',
                ],
            },
            {
                heading: 'Weather Codes (WX)',
                points: [
                    'Intensity: – (light), no symbol (moderate), + (heavy), VC (vicinity 8–16 km).',
                    'Descriptor: MI (shallow), BC (patches), DR (drifting), BL (blowing), SH (shower), TS (thunderstorm), FZ (freezing), PR (partial).',
                    'Precipitation: DZ (drizzle), RA (rain), SN (snow), SG (snow grains), PL (ice pellets), GR (hail ≥5mm), GS (small hail), UP (unknown).',
                    'Obscuration: BR (mist, VIS 1000–5000 m), FG (fog <1000 m), FU (smoke), VA (volcanic ash), DU (dust), SA (sand), HZ (haze), PY (spray).',
                    'Other: PO (dust whirl), SQ (squall), FC (funnel cloud/waterspout), SS (sandstorm), DS (dust storm).',
                ],
            },
            {
                heading: 'TREND Forecast',
                points: [
                    'Appended to METAR — short-range forecast for next 2 hours.',
                    'NOSIG: no significant change expected.',
                    'BECMG: conditions expected to change to given values (change complete within 2 hours).',
                    'TEMPO: temporary fluctuations lasting less than 1 hour at a time, occurring less than half the period.',
                ],
            },
        ],
    },
    {
        part: 'PART VII — Met Services & Codes',
        partColor: '#1D4ED8',
        id: 'jch26', num: 26, icon: '📅', color: '#0891B2',
        title: 'TAF, ARFOR & ROFOR',
        ref: 'IC Joshi Ch.26 · pp 242–254',
        topics: [
            {
                heading: 'TAF (Terminal Aerodrome Forecast)',
                points: [
                    'Valid periods: 9, 12, 18 or 30 hours. Issued 4×/day. ICAO format.',
                    'Format: TAF AMD/COR ICAO DDHHmm/DDHHmm WIND VIS WX CLOUD [change groups]=',
                    'Change groups: BECMG DDHHmm/DDHHmm (gradual change), TEMPO DDHHmm/DDHHmm (temporary fluctuation), FM DDHHmm (rapid change from time), AT DDHHmm (condition at specific time).',
                    'PROB30/PROB40: probability of conditions. Minimum PROB used = 30%.',
                    'TX/TN: maximum/minimum temperature in TAF.',
                ],
            },
            {
                heading: 'ARFOR & ROFOR',
                points: [
                    'ARFOR (Area Forecast for Low-Level Flights): for flights typically below FL100. Issued in plain language or code.',
                    'Covers: surface wind, visibility, weather, clouds, icing, turbulence.',
                    'ROFOR (Route Forecast): specific to a route. Includes significant weather along route.',
                    'Both used for flight planning — filed with flight plan.',
                ],
            },
        ],
    },
    {
        part: 'PART VII — Met Services & Codes',
        partColor: '#1D4ED8',
        id: 'jch27', num: 27, icon: '⚠️', color: '#DC2626',
        title: 'Radar Report, SIGMET & Satellite Bulletin',
        ref: 'IC Joshi Ch.27 · pp 255–259',
        topics: [
            {
                heading: 'SIGMET',
                points: [
                    'Issued for: TS (thunderstorm), SEV TURB (severe turbulence), SEV ICE (severe icing), SEV MTW (severe mountain wave), DS/SS (dust/sand storm), VA (volcanic ash), TC (tropical cyclone).',
                    'Format: [ICAO FIR] SIGMET [X] VALID DDHHmm/DDHHmm [MWO] [phenomenon] [location/FL] MOV [direction speed] INTSF/WKN/STNR NC.',
                    'Validity: max 4 hours (6 hours for VA/TC).',
                    'WS: turbulence/icing SIGMET. WV: volcanic ash. WC: tropical cyclone.',
                ],
            },
            {
                heading: 'Radar Weather Report (RAREP)',
                points: [
                    'Reports intensity, type, and movement of precipitation echoes.',
                    'Intensity levels 1–6 (VIP levels). Level 1–2: light. 3–4: moderate. 5–6: extreme.',
                    'Contours: location of echoes on radar — reported as geographic area or bearing/range.',
                ],
            },
        ],
    },
    {
        part: 'PART VII — Met Services & Codes',
        partColor: '#1D4ED8',
        id: 'jch28', num: 28, icon: '📁', color: '#1D4ED8',
        title: 'Met Documentation & Briefing',
        ref: 'IC Joshi Ch.28 · pp 260–264',
        topics: [
            {
                heading: 'Pre-flight Met Briefing',
                points: [
                    'Standard documents: SIGWX chart, upper wind/temp charts, SIGMET, METARs, TAFs, NOTAM with wx implications.',
                    'Met briefing should cover: departure, en-route, destination, alternate weather.',
                    'Self-briefing: pilot uses internet/ATC systems to access weather products directly.',
                    'Dispatcher: provides met package to crew with route forecasts and significant weather.',
                ],
            },
            {
                heading: 'Significant Weather Charts (SIGWX)',
                points: [
                    'WAFC London/Washington provide global SIGWX for FL100–FL450 and FL250–FL630.',
                    'Shows: TS/CB areas, jet streams, tropopause height, turbulence areas, icing areas, tropical cyclones.',
                    'Valid at specific times. Used for flight planning and en-route decision-making.',
                    'Low-level SIGWX (below FL100): issued by regional met centres.',
                ],
            },
        ],
    },
    {
        part: 'PART VII — Met Services & Codes',
        partColor: '#1D4ED8',
        id: 'jch29', num: 29, icon: '📊', color: '#0369A1',
        title: 'Flight Forecast & Cross-Section',
        ref: 'IC Joshi Ch.29 · pp 265–267',
        topics: [
            {
                heading: 'Tabular Route Forecast',
                points: [
                    'Tabular form presents wind, temperature, turbulence and icing at selected waypoints and FLs.',
                    'Allows pilot to select optimum cruise level for minimum headwind or best temperature.',
                    'Data from WAFS GRIB files processed into pilot-friendly table.',
                ],
            },
            {
                heading: 'Cross-Section Forecast',
                points: [
                    'Vertical cross-section along route showing: temperature, wind, isotherms, icing, turbulence, cloud.',
                    'X-axis: route waypoints. Y-axis: pressure levels (hPa) or FLs.',
                    'Allows visualisation of tropopause height, jet stream, frontal zones, icing layers along intended route.',
                ],
            },
        ],
    },
];

// ─── SUBJECT → CHAPTERS MAP ───────────────────────────────────────────────────
const SUBJECT_CHAPTERS = {
    'air-reg': AIR_REG_CHAPTERS,
    'meteorology': METEO_CHAPTERS,
    'navigation': NAV_CHAPTERS,
    'technical': TECH_CHAPTERS,
    'radio': RADIO_CHAPTERS,
    'meteo-joshi': JOSHI_METEO_CHAPTERS,
};

// ─── QUIZ QUESTIONS GENERATOR ─────────────────────────────────────────────────
function generateQuizQuestions(chapters, limit = 20) {
    const questions = [];
    chapters.forEach(ch => {
        ch.topics.forEach(topic => {
            topic.points.forEach(point => {
                const colonIdx = point.indexOf(':');
                if (colonIdx > 0 && colonIdx < 60) {
                    const term = point.substring(0, colonIdx).trim();
                    const definition = point.substring(colonIdx + 1).trim();
                    if (term.length > 2 && definition.length > 10) {
                        questions.push({
                            id: `${ch.id}-${questions.length}`,
                            question: `What is "${term}"?`,
                            answer: definition,
                            chapter: ch.title,
                            chapterColor: ch.color,
                        });
                    }
                }
            });
        });
    });
    // Shuffle and limit
    for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    return questions.slice(0, limit);
}

// ─── PROGRESS STORAGE ─────────────────────────────────────────────────────────
function useProgress() {
    const [progress, setProgress] = useState(() => {
        try { return JSON.parse(localStorage.getItem('studyProgress') || '{}'); } catch { return {}; }
    });

    const markRead = useCallback((chapterId) => {
        setProgress(prev => {
            const next = { ...prev, [chapterId]: { ...prev[chapterId], read: true, readAt: Date.now() } };
            try { localStorage.setItem('studyProgress', JSON.stringify(next)); } catch { }
            return next;
        });
    }, []);

    const saveQuizScore = useCallback((subjectId, score, total) => {
        setProgress(prev => {
            const key = `quiz-${subjectId}`;
            const best = prev[key]?.best || 0;
            const next = { ...prev, [key]: { score, total, best: Math.max(best, score), lastAt: Date.now() } };
            try { localStorage.setItem('studyProgress', JSON.stringify(next)); } catch { }
            return next;
        });
    }, []);

    return { progress, markRead, saveQuizScore };
}

// ─── GLOBAL SEARCH ────────────────────────────────────────────────────────────
function GlobalSearch({ onNavigate, onClose }) {
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    const results = query.trim().length < 2 ? [] : (() => {
        const q = query.toLowerCase();
        const hits = [];
        Object.entries(SUBJECT_CHAPTERS).forEach(([subjectId, chapters]) => {
            const subject = SUBJECTS.find(s => s.id === subjectId);
            chapters.forEach(ch => {
                ch.topics.forEach((topic, ti) => {
                    const topicMatch = topic.heading.toLowerCase().includes(q);
                    topic.points.forEach((pt, pi) => {
                        const ptMatch = pt.toLowerCase().includes(q);
                        const chMatch = ch.title.toLowerCase().includes(q);
                        if (ptMatch || topicMatch || chMatch) {
                            const existing = hits.find(h => h.chapterId === ch.id && h.topicIdx === ti);
                            if (!existing) {
                                hits.push({
                                    subjectId,
                                    subjectTitle: subject?.title,
                                    subjectColor: subject?.color,
                                    chapterId: ch.id,
                                    chapterTitle: ch.title,
                                    chapterColor: ch.color,
                                    topicIdx: ti,
                                    topicHeading: topic.heading,
                                    matchPoint: pt,
                                });
                            }
                        }
                    });
                });
            });
        });
        return hits.slice(0, 12);
    })();

    function highlight(text, q) {
        if (!q) return text;
        const idx = text.toLowerCase().indexOf(q.toLowerCase());
        if (idx < 0) return text.slice(0, 80) + (text.length > 80 ? '…' : '');
        const start = Math.max(0, idx - 30);
        const end = Math.min(text.length, idx + q.length + 50);
        return (start > 0 ? '…' : '') + text.slice(start, idx) + '【' + text.slice(idx, idx + q.length) + '】' + text.slice(idx + q.length, end) + (end < text.length ? '…' : '');
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 80 }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 680, maxHeight: '70vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 20 }}>🔍</span>
                    <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
                        placeholder="Search across all subjects, chapters, topics…"
                        style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, color: C.text }} />
                    <button onClick={onClose} style={{ background: C.bg, border: 'none', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: C.muted }}>ESC</button>
                </div>
                {query.length < 2 ? (
                    <div style={{ padding: '24px 20px', color: C.muted, fontSize: 14, textAlign: 'center' }}>Type at least 2 characters to search…</div>
                ) : results.length === 0 ? (
                    <div style={{ padding: '24px 20px', color: C.muted, fontSize: 14, textAlign: 'center' }}>No results for "{query}"</div>
                ) : (
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {results.map((r, i) => (
                            <button key={i}
                                onClick={() => { onNavigate(r.subjectId, r.chapterId); onClose(); }}
                                style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', padding: '12px 20px', cursor: 'pointer', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 12 }}
                                onMouseEnter={e => e.currentTarget.style.background = C.bg}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: r.chapterColor + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📄</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: r.subjectColor, background: r.subjectColor + '15', padding: '1px 7px', borderRadius: 99 }}>{r.subjectTitle}</span>
                                        <span style={{ fontSize: 11, color: C.muted }}>{r.chapterTitle}</span>
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{r.topicHeading}</div>
                                    <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
                                        {highlight(r.matchPoint, query).split('【').map((part, j) => {
                                            if (j === 0) return <span key={j}>{part}</span>;
                                            const [match, rest] = part.split('】');
                                            return <span key={j}><mark style={{ background: '#FEF08A', borderRadius: 2, padding: '0 1px' }}>{match}</mark>{rest}</span>;
                                        })}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── QUIZ MODE ────────────────────────────────────────────────────────────────
function QuizMode({ subjectId, onClose, onSaveScore }) {
    const subject = SUBJECTS.find(s => s.id === subjectId);
    const chapters = SUBJECT_CHAPTERS[subjectId] || [];
    const [questions] = useState(() => generateQuizQuestions(chapters, 15));
    const [currentIdx, setCurrentIdx] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const [scores, setScores] = useState([]);
    const [done, setDone] = useState(false);
    const [mode, setMode] = useState('flashcard'); // 'flashcard' | 'mcq'

    const current = questions[currentIdx];

    function answer(correct) {
        setScores(prev => [...prev, correct]);
        if (currentIdx + 1 >= questions.length) {
            const finalScores = [...scores, correct];
            const total = finalScores.filter(Boolean).length;
            onSaveScore(subjectId, total, questions.length);
            setDone(true);
        } else {
            setCurrentIdx(i => i + 1);
            setRevealed(false);
        }
    }

    if (!questions.length) return (
        <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
            <div style={{ fontSize: 16, color: C.muted }}>Not enough structured content for quiz in this subject yet.</div>
            <button onClick={onClose} style={{ marginTop: 20, padding: '10px 24px', background: C.primary, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Back</button>
        </div>
    );

    if (done) {
        const correct = scores.filter(Boolean).length;
        const pct = Math.round((correct / questions.length) * 100);
        return (
            <div style={{ padding: '40px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>{pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '📚'}</div>
                <h2 style={{ fontSize: 28, fontWeight: 900, color: C.text, margin: '0 0 8px' }}>Quiz Complete!</h2>
                <div style={{ fontSize: 16, color: C.muted, marginBottom: 32 }}>{subject?.title}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 32 }}>
                    <div style={{ background: '#DCFCE7', borderRadius: 14, padding: 16 }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#16A34A' }}>{correct}</div>
                        <div style={{ fontSize: 12, color: '#16A34A' }}>Correct</div>
                    </div>
                    <div style={{ background: '#FEE2E2', borderRadius: 14, padding: 16 }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#DC2626' }}>{questions.length - correct}</div>
                        <div style={{ fontSize: 12, color: '#DC2626' }}>Wrong</div>
                    </div>
                    <div style={{ background: C.primaryLight, borderRadius: 14, padding: 16 }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: C.primary }}>{pct}%</div>
                        <div style={{ fontSize: 12, color: C.primary }}>Score</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button onClick={() => { setCurrentIdx(0); setScores([]); setRevealed(false); setDone(false); }}
                        style={{ padding: '12px 24px', background: subject?.color, color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                        Retry Quiz
                    </button>
                    <button onClick={onClose}
                        style={{ padding: '12px 24px', background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                        Back to Notes
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px 32px', maxWidth: 640, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{subject?.icon}</span>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Quiz — {subject?.title}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>Question {currentIdx + 1} of {questions.length}</div>
                    </div>
                </div>
                <button onClick={onClose} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, color: C.muted }}>✕ Exit</button>
            </div>

            {/* Progress bar */}
            <div style={{ background: C.border, borderRadius: 99, height: 6, marginBottom: 28, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: subject?.color, borderRadius: 99, width: `${((currentIdx) / questions.length) * 100}%`, transition: 'width 0.3s' }} />
            </div>

            <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${C.border}`, overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ background: (current?.chapterColor || C.primary) + '12', padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 11, color: current?.chapterColor, fontWeight: 700, marginBottom: 6 }}>📖 {current?.chapter}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.text, lineHeight: 1.5 }}>{current?.question}</div>
                </div>

                {!revealed ? (
                    <div style={{ padding: 24, textAlign: 'center' }}>
                        <button onClick={() => setRevealed(true)}
                            style={{ padding: '14px 40px', background: subject?.color, color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>
                            Reveal Answer
                        </button>
                    </div>
                ) : (
                    <div style={{ padding: 24 }}>
                        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', marginBottom: 6 }}>✅ Answer</div>
                            <div style={{ fontSize: 14, color: C.text, lineHeight: 1.7 }}>{current?.answer}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => answer(false)}
                                style={{ flex: 1, padding: '12px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                                ✗ Didn't know
                            </button>
                            <button onClick={() => answer(true)}
                                style={{ flex: 1, padding: '12px', background: '#DCFCE7', color: '#16A34A', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                                ✓ Got it!
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
                {scores.map((s, i) => (
                    <div key={i} style={{ width: 24, height: 6, borderRadius: 99, background: s ? '#16A34A' : '#DC2626' }} />
                ))}
                {Array.from({ length: questions.length - scores.length }).map((_, i) => (
                    <div key={i} style={{ width: 24, height: 6, borderRadius: 99, background: C.border }} />
                ))}
            </div>
        </div>
    );
}

// ─── PROGRESS DASHBOARD ──────────────────────────────────────────────────────
function ProgressDashboard({ progress }) {
    const allChapters = Object.values(SUBJECT_CHAPTERS).flat();
    const totalChapters = allChapters.length;
    const readChapters = allChapters.filter(ch => progress[ch.id]?.read).length;
    const pct = Math.round((readChapters / totalChapters) * 100);

    return (
        <div style={{ padding: '32px 40px', maxWidth: 900, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
                <div style={{ width: 4, height: 28, borderRadius: 2, background: C.green }} />
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>My Progress</h2>
            </div>

            <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${C.border}`, padding: 24, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                        <div style={{ fontSize: 32, fontWeight: 900, color: C.text }}>{pct}%</div>
                        <div style={{ fontSize: 13, color: C.muted }}>Overall completion — {readChapters}/{totalChapters} chapters read</div>
                    </div>
                    <div style={{ width: 80, height: 80, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="80" height="80" viewBox="0 0 80 80">
                            <circle cx="40" cy="40" r="34" fill="none" stroke={C.border} strokeWidth="8" />
                            <circle cx="40" cy="40" r="34" fill="none" stroke={C.green} strokeWidth="8"
                                strokeDasharray={`${2 * Math.PI * 34}`}
                                strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
                                strokeLinecap="round" transform="rotate(-90 40 40)" />
                        </svg>
                        <span style={{ position: 'absolute', fontSize: 16, fontWeight: 800, color: C.text }}>{pct}%</span>
                    </div>
                </div>
                <div style={{ background: C.bg, borderRadius: 99, height: 10, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: `linear-gradient(90deg, ${C.green}, ${C.primary})`, borderRadius: 99, width: `${pct}%`, transition: 'width 0.5s' }} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                {SUBJECTS.map(subject => {
                    const chapters = SUBJECT_CHAPTERS[subject.id] || [];
                    const read = chapters.filter(ch => progress[ch.id]?.read).length;
                    const spct = chapters.length ? Math.round((read / chapters.length) * 100) : 0;
                    const quizKey = `quiz-${subject.id}`;
                    const quizData = progress[quizKey];

                    return (
                        <div key={subject.id} style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                                <span style={{ fontSize: 22 }}>{subject.icon}</span>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{subject.title}</div>
                                    <div style={{ fontSize: 11, color: C.muted }}>{read}/{chapters.length} chapters read</div>
                                </div>
                                <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 800, color: subject.color }}>{spct}%</span>
                            </div>
                            <div style={{ background: C.bg, borderRadius: 99, height: 6, overflow: 'hidden', marginBottom: 10 }}>
                                <div style={{ height: '100%', background: subject.color, borderRadius: 99, width: `${spct}%`, transition: 'width 0.5s' }} />
                            </div>
                            {quizData && (
                                <div style={{ background: subject.color + '10', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 11, color: C.muted }}>🎯 Last quiz</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: subject.color }}>{quizData.score}/{quizData.total} · Best: {quizData.best}/{quizData.total}</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({ onSelectSubject, progress }) {
    return (
        <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 4, height: 28, borderRadius: 2, background: C.primary }} />
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>All Subjects</h2>
                </div>
                <span style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>{SUBJECTS.length} subjects</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                {SUBJECTS.map(subject => {
                    const chapters = SUBJECT_CHAPTERS[subject.id] || [];
                    const read = chapters.filter(ch => progress[ch.id]?.read).length;
                    const spct = chapters.length ? Math.round((read / chapters.length) * 100) : 0;
                    return (
                        <div key={subject.id}
                            style={{ background: '#fff', borderRadius: 18, border: `1px solid ${C.border}`, padding: 24, display: 'flex', flexDirection: 'column', gap: 14, transition: 'box-shadow .2s, transform .2s', cursor: 'pointer' }}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 32px ${subject.color}22`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{ width: 52, height: 52, borderRadius: 14, background: subject.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
                                        {subject.icon}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>{subject.title}</div>
                                        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{subject.subtitle}</div>
                                    </div>
                                </div>
                                <span style={{ background: C.bg, color: C.muted, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, whiteSpace: 'nowrap' }}>
                                    {subject.lectureCount} lectures
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {subject.tags.map(tag => (
                                    <span key={tag} style={{ background: subject.color + '12', color: subject.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>{tag}</span>
                                ))}
                            </div>
                            {/* Progress bar */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ fontSize: 11, color: C.muted }}>Progress</span>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: spct === 100 ? C.green : subject.color }}>{spct}% · {read}/{chapters.length}</span>
                                </div>
                                <div style={{ background: C.bg, borderRadius: 99, height: 5, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', background: spct === 100 ? C.green : subject.color, borderRadius: 99, width: `${spct}%`, transition: 'width 0.5s' }} />
                                </div>
                            </div>
                            <button
                                onClick={() => onSelectSubject(subject.id)}
                                style={{ width: '100%', padding: '12px', borderRadius: 12, background: C.bg, border: `1px solid ${C.border}`, fontSize: 14, fontWeight: 700, color: C.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background .15s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = subject.color + '12'; e.currentTarget.style.color = subject.color; }}
                                onMouseLeave={e => { e.currentTarget.style.background = C.bg; e.currentTarget.style.color = C.text; }}>
                                📁 Open Subject →
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── NOTES PAGE ───────────────────────────────────────────────────────────────
function NotesPage({ subjectId, initialChapterId, onBack, onQuiz, progress, markRead }) {
    const subject = SUBJECTS.find(s => s.id === subjectId);
    const chapters = SUBJECT_CHAPTERS[subjectId] || [];
    const [selectedId, setSelectedId] = useState(initialChapterId || chapters[0]?.id);
    const [search, setSearch] = useState('');
    const [expandedTopics, setExpandedTopics] = useState({});
    const contentRef = useRef(null);

    const selected = chapters.find(c => c.id === selectedId);

    const filtered = search.trim()
        ? chapters.filter(c =>
            c.title.toLowerCase().includes(search.toLowerCase()) ||
            c.topics.some(t =>
                t.heading.toLowerCase().includes(search.toLowerCase()) ||
                t.points.some(p => p.toLowerCase().includes(search.toLowerCase()))
            )
        )
        : chapters;

    function toggleTopic(key) {
        setExpandedTopics(prev => ({ ...prev, [key]: !prev[key] }));
    }

    useEffect(() => {
        if (selected) {
            const initial = {};
            selected.topics.forEach((_, i) => { initial[`${selected.id}-${i}`] = true; });
            setExpandedTopics(initial);
            markRead(selected.id);
        }
        if (contentRef.current) contentRef.current.scrollTop = 0;
    }, [selectedId]);

    const parts = [...new Set(chapters.map(c => c.part))];

    // Filtered topics with highlighted points
    function getFilteredTopics(ch) {
        if (!search.trim()) return ch.topics;
        const q = search.toLowerCase();
        return ch.topics.map(t => ({
            ...t,
            points: t.points.filter(p =>
                p.toLowerCase().includes(q) ||
                t.heading.toLowerCase().includes(q) ||
                ch.title.toLowerCase().includes(q)
            )
        })).filter(t => t.points.length > 0 || t.heading.toLowerCase().includes(q));
    }

    function highlightText(text, q) {
        if (!q) return text;
        const idx = text.toLowerCase().indexOf(q.toLowerCase());
        if (idx < 0) return text;
        return (
            <>
                {text.slice(0, idx)}
                <mark style={{ background: '#FEF08A', borderRadius: 2 }}>{text.slice(idx, idx + q.length)}</mark>
                {text.slice(idx + q.length)}
            </>
        );
    }

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 128px)', background: C.bg, borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.border}` }}>
            {/* Sidebar */}
            <div style={{ width: 280, flexShrink: 0, background: '#fff', borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <div style={{ padding: '14px 14px 10px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
                    <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 12, fontWeight: 600, marginBottom: 10, padding: 0 }}>
                        ← All Subjects
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 18 }}>{subject?.icon}</span>
                        <div style={{ fontWeight: 800, fontSize: 13, color: C.text }}>{subject?.title} Notes</div>
                    </div>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search chapters or topics…"
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, color: C.text, outline: 'none', background: C.bg, boxSizing: 'border-box' }}
                    />
                    <button onClick={() => onQuiz(subjectId)}
                        style={{ width: '100%', marginTop: 8, padding: '8px', borderRadius: 8, background: subject?.color, border: 'none', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                        🎯 Start Quiz
                    </button>
                </div>
                <div style={{ flex: 1, padding: '8px 0' }}>
                    {parts.map(part => {
                        const partChapters = filtered.filter(c => c.part === part);
                        if (!partChapters.length) return null;
                        const partColor = chapters.find(c => c.part === part)?.partColor || subject?.color;
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
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: selectedId === ch.id ? ch.color : C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                Ch {ch.num}. {ch.title}
                                            </div>
                                            <div style={{ fontSize: 10, color: C.muted }}>{ch.topics.length} topics</div>
                                        </div>
                                        {progress[ch.id]?.read && <span style={{ fontSize: 10, color: C.green, flexShrink: 0 }}>✓</span>}
                                    </button>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
                {selected && (
                    <>
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
                                        {progress[selected.id]?.read && (
                                            <span style={{ background: '#DCFCE7', color: '#16A34A', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>✓ Read</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {search.trim() ? (
                            // Search results view
                            <div>
                                {getFilteredTopics(selected).map((topic, i) => (
                                    <div key={i} style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 12, overflow: 'hidden' }}>
                                        <div style={{ padding: '12px 18px', background: selected.color + '08', borderBottom: `1px solid ${selected.color}20` }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{topic.heading}</span>
                                        </div>
                                        <ul style={{ margin: 0, padding: '12px 18px 16px 18px', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {topic.points.map((pt, j) => (
                                                <li key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: selected.color, flexShrink: 0, marginTop: 7 }} />
                                                    <span style={{ fontSize: 13, color: C.text, lineHeight: 1.65 }}>{highlightText(pt, search)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
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

                                {selected.topics.map((topic, i) => {
                                    const key = `${selected.id}-${i}`;
                                    const open = expandedTopics[key] !== false;
                                    return (
                                        <div key={key} style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 12, overflow: 'hidden' }}>
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
                                            {open && (
                                                <ul style={{ margin: 0, padding: '12px 18px 16px 18px', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                    {topic.points.map((pt, j) => (
                                                        <li key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: selected.color, flexShrink: 0, marginTop: 7 }} />
                                                            <span style={{ fontSize: 13, color: C.text, lineHeight: 1.65 }}>{pt}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    );
                                })}
                            </>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                            {(() => {
                                const idx = chapters.findIndex(c => c.id === selected.id);
                                const prev = chapters[idx - 1];
                                const next = chapters[idx + 1];
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

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function StudyNotesApp() {
    const [view, setView] = useState('home'); // 'home' | 'notes' | 'quiz' | 'progress'
    const [activeSubject, setActiveSubject] = useState(null);
    const [activeChapter, setActiveChapter] = useState(null);
    const [showGlobalSearch, setShowGlobalSearch] = useState(false);
    const { progress, markRead, saveQuizScore } = useProgress();

    function handleSelectSubject(id) {
        setActiveSubject(id);
        setActiveChapter(null);
        setView('notes');
    }

    function handleNavigate(subjectId, chapterId) {
        setActiveSubject(subjectId);
        setActiveChapter(chapterId);
        setView('notes');
    }

    // Keyboard shortcut for search
    useEffect(() => {
        function onKey(e) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setShowGlobalSearch(true);
            }
            if (e.key === 'Escape') setShowGlobalSearch(false);
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const allChapters = Object.values(SUBJECT_CHAPTERS).flat();
    const readCount = allChapters.filter(ch => progress[ch.id]?.read).length;

    return (
        <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {/* Top bar */}
            <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ cursor: 'pointer' }} onClick={() => setView('home')}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: C.text }}>✈️ Study Notes</div>
                        <div style={{ fontSize: 11, color: C.muted }}>
                            {view === 'home' ? 'Home'
                                : view === 'progress' ? 'My Progress'
                                    : view === 'quiz' ? `Quiz — ${SUBJECTS.find(s => s.id === activeSubject)?.title}`
                                        : `${SUBJECTS.find(s => s.id === activeSubject)?.title}`}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                        {[
                            { label: '🏠 Home', v: 'home' },
                            { label: '📊 Progress', v: 'progress' },
                        ].map(tab => (
                            <button key={tab.v} onClick={() => setView(tab.v)}
                                style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: view === tab.v ? 700 : 500, background: view === tab.v ? C.primaryLight : 'none', color: view === tab.v ? C.primary : C.muted }}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {readCount > 0 && (
                        <span style={{ fontSize: 12, color: C.green, fontWeight: 700, background: '#DCFCE7', padding: '4px 10px', borderRadius: 99 }}>
                            ✓ {readCount} read
                        </span>
                    )}
                    <button onClick={() => setShowGlobalSearch(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '8px 16px', cursor: 'pointer' }}>
                        <span style={{ fontSize: 16 }}>🔍</span>
                        <span style={{ fontSize: 13, color: C.muted }}>Search everything…</span>
                        <span style={{ fontSize: 10, color: C.muted, background: C.border, padding: '2px 6px', borderRadius: 5 }}>⌘K</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            {view === 'home' && <HomePage onSelectSubject={handleSelectSubject} progress={progress} />}
            {view === 'progress' && <ProgressDashboard progress={progress} />}
            {view === 'notes' && (
                <div style={{ padding: '20px 40px' }}>
                    <NotesPage
                        subjectId={activeSubject}
                        initialChapterId={activeChapter}
                        onBack={() => setView('home')}
                        onQuiz={(id) => { setActiveSubject(id); setView('quiz'); }}
                        progress={progress}
                        markRead={markRead}
                    />
                </div>
            )}
            {view === 'quiz' && (
                <div style={{ padding: '20px 40px' }}>
                    <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${C.border}`, minHeight: 400 }}>
                        <QuizMode
                            subjectId={activeSubject}
                            onClose={() => setView('notes')}
                            onSaveScore={saveQuizScore}
                        />
                    </div>
                </div>
            )}

            {/* Global Search */}
            {showGlobalSearch && (
                <GlobalSearch
                    onNavigate={handleNavigate}
                    onClose={() => setShowGlobalSearch(false)}
                />
            )}
        </div>
    );
}