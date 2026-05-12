export const SCENARIOS = [
    {
        id: 'scenario_01',
        title: 'VT-SKY | Delhi to Agra',
        callsign: 'VT-SKY',
        aircraft: 'Cessna 172',
        departure: 'VIDP',
        departureName: 'Delhi',
        destination: 'VIAR',
        destinationName: 'Agra',
        squawk: '2341',
        atis: 'Golf',
        cruiseAlt: '5500',
        difficulty: 'beginner',

        phases: [
            {
                id: 'startup',
                label: 'Startup Clearance',
                phase: 1,
                atcUnit: 'Delhi Clearance',
                frequency: '121.5',
                atcSpeech:
                    'VT-SKY, Delhi Clearance, cleared to Agra via Amber One, maintain five thousand five hundred feet, squawk two three four one, runway two eight, QNH one zero one three.',
                atcDisplay:
                    'VT-SKY, Delhi Clearance, cleared to Agra via Amber One, maintain 5500 feet, squawk 2341, Runway 28, QNH 1013.',
                hint: 'Read back: destination, route, altitude, squawk, runway, QNH and your callsign.',
                expectedReadback:
                    'Cleared to Agra via Amber One, five thousand five hundred feet, squawk two three four one, runway two eight, QNH one zero one three, VT-SKY.',
                requiredKeywords: [
                    'agra', 'amber', '5500', '2341', 'runway 28', '1013', 'VT-SKY'
                ],
                criticalKeywords: ['2341', 'runway 28', '1013'],
                maxScore: 20,
            },
            {
                id: 'taxi',
                label: 'Taxi',
                phase: 2,
                atcUnit: 'Delhi Ground',
                frequency: '121.9',
                atcSpeech:
                    'VT-SKY, taxi to holding point runway two eight via taxiway alpha charlie, hold short of runway ten.',
                atcDisplay:
                    'VT-SKY, taxi to holding point Runway 28 via taxiway Alpha Charlie. Hold short of Runway 10.',
                hint: 'Read back the route, holding point, and the runway you must hold short of.',
                expectedReadback:
                    'Taxi to holding point runway two eight via alpha charlie, hold short runway ten, VT-SKY.',
                requiredKeywords: [
                    'runway 28', 'alpha', 'charlie', 'hold short', 'runway 10', 'VT-SKY'
                ],
                criticalKeywords: ['hold short', 'runway 10'],
                maxScore: 15,
            },
            {
                id: 'departure',
                label: 'Departure',
                phase: 3,
                atcUnit: 'Delhi Tower',
                frequency: '118.1',
                atcSpeech:
                    'VT-SKY, winds two eight zero degrees one two knots, runway two eight, cleared for takeoff.',
                atcDisplay:
                    'VT-SKY, winds 280°/12 kts, Runway 28, cleared for takeoff.',
                hint: 'Read back runway and the takeoff clearance with your callsign.',
                expectedReadback:
                    'Runway two eight, cleared for takeoff, VT-SKY.',
                requiredKeywords: ['runway 28', 'cleared for takeoff', 'VT-SKY'],
                criticalKeywords: ['runway 28', 'cleared for takeoff'],
                maxScore: 15,
            },
            {
                id: 'enroute',
                label: 'Frequency Change',
                phase: 4,
                atcUnit: 'Delhi Radar',
                frequency: '125.4',
                atcSpeech:
                    'VT-SKY, contact Delhi Radar on one two five decimal four.',
                atcDisplay:
                    'VT-SKY, contact Delhi Radar on 125.4.',
                hint: 'Acknowledge the frequency change and read back the frequency.',
                expectedReadback:
                    'Delhi Radar one two five decimal four, VT-SKY.',
                requiredKeywords: ['125.4', 'VT-SKY'],
                criticalKeywords: ['125.4'],
                maxScore: 10,
            },
            {
                id: 'emergency',
                label: 'Emergency — Engine Failure',
                phase: 5,
                atcUnit: 'Delhi Radar',
                frequency: '125.4',
                atcSpeech:
                    '[SIMULATED SCENARIO] Your engine has failed at three thousand feet. Declare an emergency.',
                atcDisplay:
                    '⚠️ SIMULATED: Engine failure at 3000 ft. You must declare MAYDAY.',
                hint: 'Transmit MAYDAY three times. Include: callsign, nature of emergency, position, altitude, intentions, persons on board.',
                expectedReadback:
                    'MAYDAY MAYDAY MAYDAY, VT-SKY, engine failure, three thousand feet, two persons on board, request immediate landing.',
                requiredKeywords: ['mayday', 'VT-SKY', 'engine failure', 'feet'],
                criticalKeywords: ['mayday'],
                maxScore: 25,
            },
            {
                id: 'arrival',
                label: 'Arrival & Landing',
                phase: 6,
                atcUnit: 'Agra Information',
                frequency: '126.3',
                atcSpeech:
                    'VT-SKY, Agra Information, QNH one zero one zero, runway two six in use, report field in sight.',
                atcDisplay:
                    'VT-SKY, Agra Information, QNH 1010, Runway 26 in use, report field in sight.',
                hint: 'Acknowledge QNH, active runway, and confirm you will report field in sight.',
                expectedReadback:
                    'QNH one zero one zero, runway two six, wilco, VT-SKY.',
                requiredKeywords: ['1010', 'runway 26', 'wilco', 'VT-SKY'],
                criticalKeywords: ['1010', 'runway 26'],
                maxScore: 15,
            },
        ],
    },
];

export function getScenarioById(id) {
    return SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
}

export function getRandomScenario() {
    return SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
}