// components/DoubtAgentPage.jsx
// Quick integration example for the DoubtAgent component

'use client';

import DoubtAgent from '@/components/DoubtAgent';
import { useState, useEffect } from 'react';

/**
 * Example component showing how to integrate DoubtAgent into your dashboard
 * Usage: <DoubtAgentPage studentId={user?.id} />
 */
export function DoubtAgentPage({ studentId }) {
    const [subjects, setSubjects] = useState([
        {
            id: '080e1703-da7d-477a-a143-5ed07ffc50b7',
            name: 'Air Regulations',
            code: 'AR',
        },
        {
            id: '0ea5e9e1-d0e1-4234-f567-890123456789',
            name: 'Meteorology',
            code: 'MET',
        },
        {
            id: '10b981e1-d0e1-4234-f567-890123456789',
            name: 'Navigation',
            code: 'NAV',
        },
    ]);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                gap: '20px',
            }}
        >
            {/* Header */}
            <div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '800' }}>
                    ✈️ Ask AI Doubts
                </h2>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                    Get instant answers to your DGCA aviation questions using AI
                </p>
            </div>

            {/* Chat Component */}
            <div style={{ flex: 1, minHeight: '600px' }}>
                <DoubtAgent
                    studentId={studentId || 'guest'}
                    subjects={subjects}
                    defaultSubjectId={subjects[0]?.id}
                />
            </div>
        </div>
    );
}

export default DoubtAgentPage;
