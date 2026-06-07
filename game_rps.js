let rpsStreak = 0;
let lastRpsUploadedId = null;

async function playGame(userChoice) {
    if (typeof canSubmitRpsScore === 'function' && !canSubmitRpsScore()) return;

    const choices = ['rock', 'paper', 'scissors'];
    const computerChoice = choices[Math.floor(Math.random() * 3)];
    const koreanChoices = { rock: '👊 주먹', paper: '🖐️ 보', scissors: '✌️ 가위' };
    let result = '';

    if (userChoice === computerChoice) {
        result = `무승부입니다! 🤝 현재 ${rpsStreak}연승 유지 중!`;
        document.getElementById('result-text').innerText =
            `나: ${koreanChoices[userChoice]} vs 컴퓨터: ${koreanChoices[computerChoice]}\n\n${result}`;
        return;
    }

    if (
        (userChoice === 'rock' && computerChoice === 'scissors') ||
        (userChoice === 'paper' && computerChoice === 'rock') ||
        (userChoice === 'scissors' && computerChoice === 'paper')
    ) {
        rpsStreak++;
        result = `이겼습니다! 🎉 현재 ${rpsStreak}연승 중!`;
        document.getElementById('user-score').innerText = rpsStreak;

    } else {
        if (rpsStreak > 0) {
            const finalStreak = rpsStreak;
            rpsStreak = 0;
            document.getElementById('user-score').innerText = rpsStreak;
            await handleRpsGameOver(finalStreak);
            return;
        } else {
            lastRpsUploadedId = null;
        }
        result = `졌습니다... 😭\n최종 기록: ${rpsStreak}연승\n다시 도전해 보세요!`;
        rpsStreak = 0;
        document.getElementById('user-score').innerText = rpsStreak;
    }

    document.getElementById('result-text').innerText =
        `나: ${koreanChoices[userChoice]} vs 컴퓨터: ${koreanChoices[computerChoice]}\n\n${result}`;
}

// ==========================================
// 게임 오버 처리 — 닉네임 분기 포함
// ==========================================
async function handleRpsGameOver(score) {
    if (!initSupabase()) return;

    // 1. 현재 전체 데이터로 순위 계산
    const { data: allData } = await window._supabase
        .from('rankings')
        .select('score')
        .order('score', { ascending: false });

    const top10 = allData ? allData.slice(0, 10) : [];
    const rank = top10.length < 10 ? allData.filter(r => r.score > score).length + 1 : top10.filter(r => r.score > score).length + 1;
    // 2. 닉네임 분기
    const doSave = async (nickname) => {
        await uploadRpsScore(score, nickname);

        // 3. suddenwinner 조건 — 저장 완료 후 이동
        if (score >= RPS_THRESHOLD) {
            sessionStorage.setItem('rps_celebration_verified', 'true');
            sessionStorage.setItem('rps_celebration_score', score.toString());
            setTimeout(() => {
                window.location.href = `suddenwinner.html?game=rps&score=${score}`;
            }, 800);
        }
    };

    if (currentUsername) {
        // 이미 닉네임 있음 → 바로 저장
        await doSave(currentUsername);
    } else if (rank <= 10) {
        // 10위 안 + 닉네임 없음 → 모달
        showNicknameModal(score, rank, doSave);
    } else {
        // 10위 밖 + 닉네임 없음 → outranker로 저장
        await doSave('outranker');
    }
}

async function uploadRpsScore(score, nickname) {
    if (!initSupabase()) return;
    try {
        let verificationHash = "";
        if (typeof generateVerificationToken === 'function') {
            verificationHash = generateVerificationToken(nickname, score);
        } else if (typeof generateVerificationHash === 'function') {
            verificationHash = generateVerificationHash(nickname, score);
        }

        const { data, error } = await window._supabase.from('rankings').insert([{
            username: nickname,
            score: score,
            verification_token: verificationHash
        }]).select();

        if (error) throw error;

        if (data && data.length > 0) {
            lastRpsUploadedId = String(data[0].id);
        }

        if (typeof lockRpsSubmitTime === 'function') lockRpsSubmitTime();

        await fetchGlobalRankings({ showMyRank: true, myScore: score });

    } catch (err) {
        console.error("가위바위보 업로드 실패:", err);
    }
}

async function fetchGlobalRankings({ showMyRank = false, myScore = null } = {}) {
    if (!initSupabase()) return;
    try {
        const { data, error } = await window._supabase
            .from('rankings')
            .select('*')
            .order('score', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;
        const rankingList = document.getElementById('rankingList');
        if (!rankingList) return;

        rankingList.innerHTML = '';

        if (!data || data.length === 0) {
            rankingList.innerHTML = '<li>랭킹이 없습니다.</li>';
            return;
        }

        // 동일 닉네임 + 동일 점수 중복 제거
        const uniqueRankings = [];
        const seenPairs = new Set();
        for (const player of data) {
            const uniqueKey = `${player.username}_${player.score}`;
            if (!seenPairs.has(uniqueKey)) {
                seenPairs.add(uniqueKey);
                uniqueRankings.push(player);
            }
            if (uniqueRankings.length >= 10) break;
        }

        uniqueRankings.forEach((player, index) => {
            const dateString = formatBlockDate(player.created_at);
            const li = document.createElement('li');
            const isMyNewScore = lastRpsUploadedId && (String(player.id) === lastRpsUploadedId);

            if (isMyNewScore) {
                li.style.cssText = 'background-color:#e6f4ea;color:#137333;font-weight:bold;border-radius:5px;padding:6px 10px;margin:4px 0;transition:all 0.5s ease;';
                li.innerHTML = `<strong>${index + 1}위.</strong> ${player.username} — 🏆 ${player.score}연승 <span style="font-size:0.85rem;color:#137333;float:right;">(${dateString})</span>`;
            } else {
                li.style.padding = '4px 8px';
                li.innerHTML = `<strong>${index + 1}위.</strong> ${player.username} — 🏆 ${player.score}연승 <span style="font-size:0.85rem;color:#888;float:right;">(${dateString})</span>`;
            }
            rankingList.appendChild(li);
        });

        // 졌을 때 result-text에 최종기록 + 순위 표시
        if (showMyRank && myScore !== null && lastRpsUploadedId) {
            const allUnique = [];
            const allSeen = new Set();
            for (const player of data) {
                const key = `${player.username}_${player.score}`;
                if (!allSeen.has(key)) { allSeen.add(key); allUnique.push(player); }
            }
            const myRank = allUnique.findIndex(p => String(p.id) === lastRpsUploadedId);
            if (myRank !== -1) {
                const resultText = document.getElementById('result-text');
                if (resultText) {
                    resultText.innerText =
                        `졌습니다... 😭\n최종 기록: ${myScore}연승  |  내 순위: ${myRank + 1}위\n\n다시 도전해 보세요!`;
                }
            }
        }

    } catch (err) {
        console.error("가위바위보 랭킹 로드 실패:", err);
    }
}

function loadRpsRankings() {
    fetchGlobalRankings();
}

// ── 공통 날짜 포맷: yy/mm/dd hh:mm:ss (KST) ──
function formatBlockDate(isoString) {
    const d = new Date(isoString);
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const yy = String(kst.getUTCFullYear()).slice(2);
    const mo = String(kst.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(kst.getUTCDate()).padStart(2, '0');
    const hh = String(kst.getUTCHours()).padStart(2, '0');
    const mm = String(kst.getUTCMinutes()).padStart(2, '0');
    const ss = String(kst.getUTCSeconds()).padStart(2, '0');
    return `${yy}/${mo}/${dd} ${hh}:${mm}:${ss}`;
}