// 주소와 키 설정은 그대로 두세요!
const supabaseUrl = 'https://your-project-url.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// 🌟 여기 맨 앞에 언더바(_)를 붙여서 '_supabase'로 바꿉니다!
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);