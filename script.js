// 1. Supabase 클라이언트 초기화 (가장 상단에 위치)
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 페이지 로드 시 실행
window.onload = async function() {
    console.log("페이지 로드 완료, 랭킹을 불러옵니다...");
    await fetchGlobalRankings();
};

// 랭킹 불러오기 함수
async function fetchGlobalRankings() {
    try {
        // 여기서 _supabase를 사용하여 데이터를 가져옵니다.
        const { data, error } = await _supabase
            .from('ranking')
            .select('*')
            .order('score', { ascending: false })
            .limit(10);

        if (error) throw error;

        const rankingList = document.getElementById('rankingList');
        rankingList.innerHTML = ''; 

        data.forEach((player, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}위: ${player.username} - ${player.score}연승`;
            rankingList.appendChild(li);
        });
    } catch (err) {
        console.error("랭킹 로드 실패:", err.message);
    }
}

// 점수 저장 함수 (닉네임 등록 버튼 클릭 시 호출)
async function saveUsername() {
    const username = document.getElementById('username').value;
    if (!username) return alert("닉네임을 입력하세요!");

    try {
        const { error } = await _supabase
            .from('ranking')
            .insert([{ username: username, score: winStreak }]);

        if (error) throw error;

        alert("랭킹이 등록되었습니다!");
        location.reload(); // 새로고침하여 랭킹 갱신
    } catch (err) {
        console.error("등록 실패:", err.message);
        alert("등록에 실패했습니다: " + err.message);
    }
}

// --- 이 아래에 기존의 가위바위보 게임 로직(playGame 함수 등)을 붙여넣으세요 ---
