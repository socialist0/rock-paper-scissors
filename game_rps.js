let rpsStreak = 0; 
let lastRpsUploadedId = null; // 내가 방금 등록한 순위를 기억하기 위한 변수

async function playGame(userChoice) {
    if (!currentUsername) {
        alert("시작하기 버튼을 먼저 눌러주세요!");
        return;
    }
    if (typeof canSubmitRpsScore === 'function' && !canSubmitRpsScore()) return;

    const choices = ['rock', 'paper', 'scissors'];
    const computerChoice = choices[Math.floor(Math.random() * 3)];
    const koreanChoices = { rock: '👊 주먹', paper: '🖐️ 보', scissors: '✌️ 가위' };
    let result = '';

    if (userChoice === computerChoice) {
        result = `무승부입니다! 🤝\n현재 ${rpsStreak}연승 유지 중!`;
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
        result = `이겼습니다! 🎉\n현재 ${rpsStreak}연승 중!`;
        document.getElementById('user-score').innerText = rpsStreak;
        
    } else {
        // 졌을 때: 연승 기록 업로드 후 result-text에 순위 함께 표시
        if (rpsStreak > 0) {
            const finalStreak = rpsStreak;
            rpsStreak = 0;
            document.getElementById('user-score').innerText = rpsStreak;
            document.getElementById('result-text').innerText =
                `나: ${koreanChoices[userChoice]} vs 컴퓨터: ${koreanChoices[computerChoice]}\n\n졌습니다... 😭\n최종 기록: ${finalStreak}연승\n\n다시 도전해 보세요!`;
            await uploadRpsScore(finalStreak);
            return;
        } else {
            lastRpsUploadedId = null;
        }
        result = `졌습니다... 😭\n최종 기록: ${rpsStreak}연승`;
        rpsStreak = 0; 
        document.getElementById('user-score').innerText = rpsStreak;
    }

    document.getElementById('result-text').innerText = 
        `나: ${koreanChoices[userChoice]} vs 컴퓨터: ${koreanChoices[computerChoice]}\n\n${result}`;
}

async function uploadRpsScore(score) {
    if (!initSupabase() || score < 0 || score > 100) return;
    try {
        let verificationHash = "";
        if (typeof generateVerificationToken === 'function') {
            verificationHash = generateVerificationToken(currentUsername, score);
        } else if (typeof generateVerificationHash === 'function') {
            verificationHash = generateVerificationHash(currentUsername, score);
        }
        
        const { data, error } = await window._supabase.from('rankings').insert([{ 
            username: currentUsername, 
            score: score, 
            verification_token: verificationHash 
        }]).select();
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            lastRpsUploadedId = String(data[0].id);
        }
        
        if (typeof lockRpsSubmitTime === 'function') lockRpsSubmitTime();

        // ✨ 랭킹 갱신 + 내 순위를 result-text 옆에 표시
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
        
        // 화면에 바인딩 및 하이라이트
        uniqueRankings.forEach((player, index) => {
            const dateString = new Date(player.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false });
            const li = document.createElement('li');
            const isMyNewScore = lastRpsUploadedId && (String(player.id) === lastRpsUploadedId);
            
            if (isMyNewScore) {
                li.style.backgroundColor = '#e6f4ea'; 
                li.style.color = '#137333';
                li.style.fontWeight = 'bold';
                li.style.borderRadius = '5px';
                li.style.padding = '6px 10px';
                li.style.margin = '4px 0';
                li.style.transition = 'all 0.5s ease';
                li.innerHTML = `<strong>${index + 1}위.</strong> ${player.username} — 🏆 ${player.score}연승 <span style="font-size:0.85rem; color:#137333; float:right;">(${dateString})</span>`;
            } else {
                li.style.padding = '4px 8px';
                li.innerHTML = `<strong>${index + 1}위.</strong> ${player.username} — 🏆 ${player.score}연승 <span style="font-size:0.85rem; color:#888; float:right;">(${dateString})</span>`;
            }
            rankingList.appendChild(li);
        });

        // ✨ 졌을 때 result-text에 최종기록 + 현재 순위 함께 표시
        if (showMyRank && myScore !== null && lastRpsUploadedId) {
            const allUnique = [];
            const allSeen = new Set();
            for (const player of data) {
                const key = `${player.username}_${player.score}`;
                if (!allSeen.has(key)) {
                    allSeen.add(key);
                    allUnique.push(player);
                }
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

        // ✨ 축하 페이지 이동 조건
        if (showMyRank && myScore !== null && myScore >= RPS_THRESHOLD) {
            sessionStorage.setItem('rps_celebration_verified', 'true');
            sessionStorage.setItem('rps_celebration_score', myScore.toString());
            setTimeout(() => {
                window.location.href = `suddenwinner.html?game=rps&score=${myScore}`;
            }, 800);
        }

    } catch (err) { 
        console.error("가위바위보 랭킹 로드 실패:", err); 
    }
}