// supabaseClient.js
const supabaseUrl = 'https://iohhwiviuugoawsmxjyy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvaGh3aXZpdXVnb2F3c214anl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1NzQ5NzYsImV4cCI6MjA2MTE1MDk3Nn0.4KTa7AqBVgurN30gy3han9WTxD2x_7TsMDbdEDxVmSQ';

// 创建Supabase客户端
function createSupabaseClient() {
  return supabase.createClient(supabaseUrl, supabaseAnonKey);
}

// 生成同步码
function generateSyncCode() {
  const adjectives = ['快乐', '聪明', '勇敢', '温柔', '活泼', '安静', '明亮', '敏捷', '友好', '善良'];
  const nouns = ['猫咪', '狗狗', '兔子', '熊猫', '老虎', '狮子', '大象', '长颈鹿', '海豚', '企鹅'];
  
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 100);
  
  return `${randomAdjective}-${randomNoun}-${randomNumber}`;
}

// 获取同步码
function getSyncCode() {
  let syncCode = localStorage.getItem('bedtimeSyncCode');
  if (!syncCode) {
    syncCode = generateSyncCode();
    localStorage.setItem('bedtimeSyncCode', syncCode);
  }
  return syncCode;
}

// 从Supabase获取备忘录内容
async function fetchMemoFromSupabase(syncCode) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('memo_sync')
    .select('content, updated_at')
    .eq('sync_code', syncCode)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 是"没有找到结果"的错误
    console.error('从Supabase获取备忘录时出错:', error);
    return null;
  }
  
  return data;
}

// 保存备忘录内容到Supabase
async function saveMemoToSupabase(syncCode, content) {
  const supabase = createSupabaseClient();
  const { error } = await supabase
    .from('memo_sync')
    .upsert({ 
      sync_code: syncCode, 
      content: content,
      updated_at: new Date().toISOString()
    });
  
  if (error) {
    console.error('保存备忘录到Supabase时出错:', error);
    return false;
  }
  
  return true;
}

// 检查Supabase是否有更新
async function checkForUpdates(syncCode, localUpdatedAt) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('memo_sync')
    .select('updated_at')
    .eq('sync_code', syncCode)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') { // 没有找到结果
      return false;
    }
    console.error('检查更新时出错:', error);
    return false;
  }
  
  if (!data) return false;
  
  // 比较时间戳
  const remoteUpdatedAt = new Date(data.updated_at);
  const localDate = new Date(localUpdatedAt);
  
  return remoteUpdatedAt > localDate;
}
