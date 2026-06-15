// End-to-end test: register user → save result → verify data

const API_BASE = 'http://localhost:3001';

async function e2eTest() {
  console.log('=== E2E Test: Register User & Save Result ===\n');

  const testUser = {
    email: `test_${Date.now()}@example.com`,
    phone: '+919876543210',
    name: 'Test User',
    password: 'TestPass123!',
  };

  try {
    // Step 1: Try auth/register via proxy
    console.log('Step 1: Register user via /api/auth/register...');
    const regRes = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testUser.name,
        email: testUser.email,
        phone: testUser.phone,
        password: testUser.password,
      }),
    });
    const regData = await regRes.json();
    console.log(`Status: ${regRes.status}`, regData);

    if (regRes.status !== 200) {
      console.log('\n⚠ Auth register failed. Trying direct /api/user POST instead...');
      const userRes = await fetch(`${API_BASE}/api/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: testUser.name,
          email: testUser.email,
          phone: testUser.phone,
        }),
      });
      const userData = await userRes.json();
      console.log(`Direct /api/user POST Status: ${userRes.status}`, userData);
    }

    // Step 2: Save a test result
    console.log('\nStep 2: Save test result via /api/results POST...');
    const saveRes = await fetch(`${API_BASE}/api/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail: testUser.email,
        chapterId: 'gn01',
        subjectId: 'navigation',
        score: 8,
        total: 10,
        answers: [
          { questionId: 'q1', selected: 1, correct: 1, isCorrect: true },
          { questionId: 'q2', selected: 2, correct: 2, isCorrect: true },
          { questionId: 'q3', selected: 0, correct: 1, isCorrect: false },
          { questionId: 'q4', selected: 3, correct: 3, isCorrect: true },
          { questionId: 'q5', selected: 1, correct: 1, isCorrect: true },
          { questionId: 'q6', selected: 2, correct: 2, isCorrect: true },
          { questionId: 'q7', selected: 0, correct: 0, isCorrect: true },
          { questionId: 'q8', selected: 3, correct: 3, isCorrect: true },
          { questionId: 'q9', selected: 1, correct: 2, isCorrect: false },
          { questionId: 'q10', selected: 2, correct: 2, isCorrect: true },
        ],
      }),
    });
    const saveData = await saveRes.json();
    console.log(`Status: ${saveRes.status}`, saveData);

    // Step 3: Query stats
    console.log('\nStep 3: Query /api/stats...');
    const statsRes = await fetch(`${API_BASE}/api/stats?email=${encodeURIComponent(testUser.email)}`);
    const statsData = await statsRes.json();
    console.log(`Status: ${statsRes.status}`, statsData);

    // Step 4: Query results
    console.log('\nStep 4: Query /api/results...');
    const resultsRes = await fetch(`${API_BASE}/api/results?email=${encodeURIComponent(testUser.email)}`);
    const resultsData = await resultsRes.json();
    console.log(`Status: ${resultsRes.status}`, resultsData);

    console.log('\n=== E2E Test Complete ===');
    process.exit(0);
  } catch (err) {
    console.error('E2E Test Error:', err);
    process.exit(1);
  }
}

e2eTest();
