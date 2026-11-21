// core.js
const DEFAULT_OFFERING_TYPES = [
    { id: 'sunday', name: '주정' }, { id: 'tithing', name: '십일조' }, { id: 'thanks', name: '감사헌금' },
    { id: 'serving', name: '섬김헌금' }, { id: 'mission', name: '선교헌금' }, { id: 'building', name: '건축헌금' },
    { id: 'thousand', name: '일천번제' }, { id: 'special', name: '특별헌금' }, { id: 'womens', name: '여전도헌금' }
];

const DEFAULT_WORSHIP_TYPES = [
    '주일 1부 예배', '주일 2부 예배', '주일 3부 예배', '주일 오후 예배',
    '수요 예배', '금요 철야', '새벽 기도회', '특별 집회'
];

function loadOfferingTypes() {
    try {
        const saved = JSON.parse(localStorage.getItem('church_offering_types'));
        if (Array.isArray(saved) && saved.length > 0) {
            return saved;
        }
    } catch (e) {}
    return DEFAULT_OFFERING_TYPES.map(item => ({ ...item }));
}

function loadWorshipTypes() {
    try {
        const saved = JSON.parse(localStorage.getItem('church_worship_types'));
        if (Array.isArray(saved) && saved.length > 0) {
            return saved;
        }
    } catch (e) {}
    return [...DEFAULT_WORSHIP_TYPES];
}

let offeringTypes = loadOfferingTypes();
let worshipTypes = loadWorshipTypes();

let memberOfferings = [], globalMembers = [];
let activeDateStr = '', activeWorshipType = '';
let statsChartInstance = null;
let sortCol = null, sortAsc = true, currentPage = 1, pageSize = 'all';

// ==========================================
// 예배 구분 관리 로직
// ==========================================
function saveWorshipTypesToStorage() {
    localStorage.setItem('church_worship_types', JSON.stringify(worshipTypes));
}

function renderWorshipTypesDropdown(selectedValue = null) {
    const select = document.getElementById('worshipType');
    if (!select) return;
    const targetVal = selectedValue || activeWorshipType || select.value || worshipTypes[0];
    select.innerHTML = '';

    worshipTypes.forEach(wt => {
        const opt = document.createElement('option');
        opt.value = wt;
        opt.textContent = wt;
        select.appendChild(opt);
    });

    if (targetVal && !worshipTypes.includes(targetVal)) {
        const extraOpt = document.createElement('option');
        extraOpt.value = targetVal;
        extraOpt.textContent = `${targetVal} (삭제됨)`;
        select.appendChild(extraOpt);
    }

    select.value = targetVal || worshipTypes[0];
    if (typeof updateWorshipTypeDropdownIndicators === 'function' && activeDateStr) {
        updateWorshipTypeDropdownIndicators(activeDateStr);
    }
}

function renderWorshipTypesManager() {
    const container = document.getElementById('worshipTypesManageList');
    if (!container) return;
    container.innerHTML = '';

    worshipTypes.forEach((wt, idx) => {
        const row = document.createElement('div');
        row.className = 'flex items-center justify-between px-3.5 py-2 text-sm hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors';
        row.innerHTML = `
            <div class="flex items-center gap-2.5">
                <span class="text-xs font-bold text-slate-400 w-5 text-center">${idx + 1}</span>
                <span class="font-bold text-slate-800 dark:text-slate-100">${wt}</span>
            </div>
            <div class="flex items-center gap-1">
                <button type="button" onclick="moveWorshipType(${idx}, -1)" ${idx === 0 ? 'disabled' : ''} class="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 transition-colors" title="위로 이동">▲</button>
                <button type="button" onclick="moveWorshipType(${idx}, 1)" ${idx === worshipTypes.length - 1 ? 'disabled' : ''} class="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 transition-colors" title="아래로 이동">▼</button>
                <button type="button" onclick="removeCustomWorshipType(${idx})" class="ml-1 px-2.5 py-1 text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white rounded transition-colors">삭제</button>
            </div>
        `;
        container.appendChild(row);
    });
}

function addCustomWorshipType() {
    const input = document.getElementById('newWorshipNameInput');
    const name = input ? input.value.trim() : '';
    if (!name) return showMsg('입력 오류', '추가할 예배 이름을 입력해 주세요.');
    if (worshipTypes.includes(name)) {
        return showMsg('중복 알림', `'${name}' 예배는 이미 목록에 있습니다.`);
    }

    worshipTypes.push(name);
    saveWorshipTypesToStorage();
    if (input) input.value = '';
    renderWorshipTypesDropdown(activeWorshipType);
    renderWorshipTypesManager();
    showMsg('추가 완료', `'${name}' 예배가 목록에 추가되었습니다.`);
}

function removeCustomWorshipType(index) {
    if (worshipTypes.length <= 1) {
        return showMsg('삭제 불가', '최소 1개 이상의 예배 구분은 유지되어야 합니다.');
    }
    const target = worshipTypes[index];
    if (!confirm(`'${target}' 항목을 예배 목록에서 삭제하시겠습니까?\n(기존에 저장된 헌금 기록은 삭제되지 않고 예배 기록 목록에서 그대로 확인할 수 있습니다.)`)) {
        return;
    }
    worshipTypes.splice(index, 1);
    saveWorshipTypesToStorage();
    renderWorshipTypesDropdown(activeWorshipType);
    renderWorshipTypesManager();
}

function moveWorshipType(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= worshipTypes.length) return;
    const temp = worshipTypes[index];
    worshipTypes[index] = worshipTypes[targetIndex];
    worshipTypes[targetIndex] = temp;
    saveWorshipTypesToStorage();
    renderWorshipTypesDropdown(activeWorshipType);
    renderWorshipTypesManager();
}

function resetDefaultWorshipTypes() {
    if (!confirm('예배 구분 목록을 기본 8개 항목(주일 1부~특별 집회)으로 되돌리시겠습니까?')) return;
    worshipTypes = [...DEFAULT_WORSHIP_TYPES];
    saveWorshipTypesToStorage();
    renderWorshipTypesDropdown(activeWorshipType);
    renderWorshipTypesManager();
    showMsg('복원 완료', '예배 구분 목록이 기본 8개 항목으로 복원되었습니다.');
}

// ==========================================
// 헌금 항목 관리 로직
// ==========================================
function saveOfferingTypesToStorage() {
    localStorage.setItem('church_offering_types', JSON.stringify(offeringTypes));
}

function refreshAllViewsAfterOfferingTypeChange() {
    if (typeof initMemberTable === 'function') initMemberTable();
    if (typeof renderMemberRows === 'function') renderMemberRows();
    if (typeof renderOfferingRows === 'function') renderOfferingRows();
    if (typeof calculateTotals === 'function') calculateTotals();
    if (typeof renderStats === 'function' && document.getElementById('statMonth')?.value) {
        renderStats();
    }
    renderOfferingTypesManager();
}

function renderOfferingTypesManager() {
    const container = document.getElementById('offeringTypesManageList');
    if (!container) return;
    container.innerHTML = '';

    offeringTypes.forEach((ot, idx) => {
        const row = document.createElement('div');
        row.className = 'flex items-center justify-between px-3.5 py-2 text-sm hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors';
        row.innerHTML = `
            <div class="flex items-center gap-2.5">
                <span class="text-xs font-bold text-slate-400 w-5 text-center">${idx + 1}</span>
                <span class="font-bold text-slate-800 dark:text-slate-100">${ot.name}</span>
            </div>
            <div class="flex items-center gap-1">
                <button type="button" onclick="moveOfferingType(${idx}, -1)" ${idx === 0 ? 'disabled' : ''} class="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 transition-colors" title="위로 이동">▲</button>
                <button type="button" onclick="moveOfferingType(${idx}, 1)" ${idx === offeringTypes.length - 1 ? 'disabled' : ''} class="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 transition-colors" title="아래로 이동">▼</button>
                <button type="button" onclick="removeCustomOfferingType(${idx})" class="ml-1 px-2.5 py-1 text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white rounded transition-colors">삭제</button>
            </div>
        `;
        container.appendChild(row);
    });
}

function addCustomOfferingType() {
    const input = document.getElementById('newOfferingNameInput');
    const name = input ? input.value.trim() : '';
    if (!name) return showMsg('입력 오류', '추가할 헌금 이름을 입력해 주세요.');
    if (offeringTypes.some(ot => ot.name === name)) {
        return showMsg('중복 알림', `'${name}' 항목은 이미 목록에 있습니다.`);
    }

    const newId = 'custom_' + Date.now();
    offeringTypes.push({ id: newId, name });
    saveOfferingTypesToStorage();
    if (input) input.value = '';
    refreshAllViewsAfterOfferingTypeChange();
    showMsg('추가 완료', `'${name}' 헌금 항목이 추가되었습니다.`);
}

function removeCustomOfferingType(index) {
    if (offeringTypes.length <= 1) {
        return showMsg('삭제 불가', '최소 1개 이상의 헌금 항목은 유지되어야 합니다.');
    }
    const target = offeringTypes[index];
    if (!confirm(`'${target.name}' 항목을 헌금 목록에서 삭제하시겠습니까?\n(기존에 저장된 금액 데이터 자체는 백업에 보존되며, 화면과 출력 양식에서 해당 열이 제외됩니다.)`)) {
        return;
    }
    offeringTypes.splice(index, 1);
    saveOfferingTypesToStorage();
    refreshAllViewsAfterOfferingTypeChange();
}

function moveOfferingType(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= offeringTypes.length) return;
    const temp = offeringTypes[index];
    offeringTypes[index] = offeringTypes[targetIndex];
    offeringTypes[targetIndex] = temp;
    saveOfferingTypesToStorage();
    refreshAllViewsAfterOfferingTypeChange();
}

function resetDefaultOfferingTypes() {
    if (!confirm('헌금 항목 목록을 기본 9개 항목(주정~여전도헌금)으로 되돌리시겠습니까?')) return;
    offeringTypes = DEFAULT_OFFERING_TYPES.map(item => ({ ...item }));
    saveOfferingTypesToStorage();
    refreshAllViewsAfterOfferingTypeChange();
    showMsg('복원 완료', '헌금 목록이 기본 9개 항목으로 복원되었습니다.');
}

// 교회 이름 및 담임목사 성함 가져오기 / 화면 전체 반영
function getChurchName() {
    const saved = localStorage.getItem('church_setting_name');
    return (saved && saved.trim() !== '') ? saved.trim() : '우리교회';
}

function getPastorName() {
    const saved = localStorage.getItem('church_setting_pastor');
    return (saved && saved.trim() !== '') ? saved.trim() : '';
}

function applyChurchNameUI() {
    const cName = getChurchName();
    const pName = getPastorName();
    const isCustom = localStorage.getItem('church_setting_name') && localStorage.getItem('church_setting_name').trim() !== '';
    
    document.title = isCustom ? `${cName} 교회 헌금 정산기 v1.2.0` : `교회 헌금 정산기 v1.2.0`;
    const badge = document.getElementById('headerChurchBadge');
    if (badge) badge.innerText = isCustom ? cName : '';
    
    const cardTitle = document.getElementById('tableCardChurchName');
    if (cardTitle) cardTitle.innerText = cName;

    const receiptChurchCell = document.getElementById('receiptChurchNameCell');
    if (receiptChurchCell) receiptChurchCell.innerText = cName;

    const receiptBottomChurch = document.getElementById('receiptBottomChurchName');
    if (receiptBottomChurch) receiptBottomChurch.innerText = cName;

    const receiptPastor = document.getElementById('receiptPastorNameText');
    if (receiptPastor) receiptPastor.innerText = pName ? pName : '   ';

    const printHeaderTitle = document.getElementById('printHeaderChurchTitle');
    if (printHeaderTitle) {
        const year = activeDateStr ? activeDateStr.substring(0, 4) : new Date().getFullYear();
        printHeaderTitle.innerText = `${cName} ${year}년도 헌금(수입) 현황`;
    }
}

function getLocalDateString() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function getKoreanWeekday(dateStr) {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3) return '';
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return days[d.getDay()] || '';
}

window.onload = function() {
    initDarkMode();
    applyChurchNameUI();
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (/^church_offering_\d{4}-\d{2}-\d{2}$/.test(key) || /^church_offering_\d{4}-\d{2}-\d{2}_.*$/.test(key)) {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                let wType = data.worshipType || '주일 2부 예배';
                let modified = false;
                if(data.members) {
                    data.members.forEach(m => {
                        if(m.isFace === undefined && m.attendType !== undefined) { m.isFace = (m.attendType === 'face'); m.isNonFace = (m.attendType === 'nonface'); modified = true; } 
                        else if (m.isFace === undefined && m.attend !== undefined) { m.isFace = m.attend; m.isNonFace = false; modified = true; }
                        if (m.isMale === undefined && m.gender !== undefined) { m.isMale = (m.gender === '남'); m.isFemale = (m.gender === '여'); modified = true; }
                        if(m.isOnline === undefined) { m.isOnline = (m.memo && (m.memo.includes('온라인')||m.memo.includes('계좌')||m.memo.includes('이체'))) || false; modified = true; }
                        if(m.isSunday !== undefined) { m.isFace = m.isSunday; delete m.isSunday; modified = true; }
                    });
                }
                if (modified || !key.includes('_'+wType)) {
                    localStorage.setItem(`church_offering_${data.date}_${wType}`, JSON.stringify(data));
                    if(!key.includes('_'+wType)) localStorage.removeItem(key);
                }
            } catch(e) {}
        }
    }
    
    loadRegistry();
    renderWorshipTypesDropdown();
    initDate(); 
    
    const today = getLocalDateString();
    document.getElementById('calcDate').value = today;
    
    initMemberTable(); renderOfferingRows(); 
    loadFromLocalStorage(today, null);
    document.getElementById('committeeNames').addEventListener('input', updateSignatures);
};

// ==========================================
// 환경 설정 탭 전환 및 데이터 백업/복원/초기화 제어
// ==========================================
function switchSettingsTab(tabId) {
    const tabs = ['basic', 'worships', 'offerings', 'backup', 'reset'];
    tabs.forEach(t => {
        const panel = document.getElementById(`settings-panel-${t}`);
        const btn = document.getElementById(`settings-tab-${t}`);
        if (panel) panel.classList.toggle('hidden', t !== tabId);
        if (btn) {
            if (t === tabId) {
                btn.className = (t === 'reset')
                    ? 'py-3 px-3 text-xs sm:text-sm font-bold border-b-2 border-rose-600 dark:border-rose-400 text-rose-600 dark:text-rose-400 transition whitespace-nowrap'
                    : 'py-3 px-3 text-xs sm:text-sm font-bold border-b-2 border-indigo-600 dark:border-indigo-400 text-indigo-700 dark:text-indigo-300 transition whitespace-nowrap';
            } else {
                btn.className = (t === 'reset')
                    ? 'py-3 px-3 text-xs sm:text-sm font-medium border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition whitespace-nowrap'
                    : 'py-3 px-3 text-xs sm:text-sm font-medium border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition whitespace-nowrap';
            }
        }
    });

    if (tabId === 'worships') renderWorshipTypesManager();
    if (tabId === 'offerings') renderOfferingTypesManager();
    if (tabId === 'backup') updateSettingsBackupSummary();
}

function updateSettingsBackupSummary() {
    let recordCount = 0;
    for (let i = 0; i < localStorage.length; i++) {
        if (/^church_offering_\d{4}-\d{2}-\d{2}_.*$/.test(localStorage.key(i))) {
            recordCount++;
        }
    }
    const summaryEl = document.getElementById('backupStatusSummary');
    if (summaryEl) {
        summaryEl.innerText = `성도 명부 ${globalMembers.length}명 / 정산 기록 ${recordCount}건`;
    }
}

function openSettingsModal(initialTab = 'basic') {
    const savedName = localStorage.getItem('church_setting_name') || '';
    const savedPastor = localStorage.getItem('church_setting_pastor') || '';
    document.getElementById('settingChurchNameInput').value = savedName;
    if (document.getElementById('settingPastorNameInput')) {
        document.getElementById('settingPastorNameInput').value = savedPastor;
    }
    renderWorshipTypesManager();
    renderOfferingTypesManager();
    updateSettingsBackupSummary();
    switchSettingsTab(initialTab);
    document.getElementById('settingsModal').classList.remove('hidden');
}

function closeSettingsModal() {
    document.getElementById('settingsModal').classList.add('hidden');
}

function saveChurchNameSetting() {
    const inputVal = document.getElementById('settingChurchNameInput').value.trim();
    const pastorVal = document.getElementById('settingPastorNameInput')?.value.trim() || '';
    if (inputVal) {
        localStorage.setItem('church_setting_name', inputVal);
    } else {
        localStorage.removeItem('church_setting_name');
    }
    if (pastorVal) {
        localStorage.setItem('church_setting_pastor', pastorVal);
    } else {
        localStorage.removeItem('church_setting_pastor');
    }
    applyChurchNameUI();
    showMsg('설정 저장 완료', `교회 이름(${getChurchName()}) 및 기본 정보가 저장되었습니다.`);
}

// 2단계 경고 확인 후 전체 헌금 입력 기록만 초기화
function resetAllOfferingRecords() {
    const offeringKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('church_offering_')) {
            offeringKeys.push(key);
        }
    }

    const recordCount = offeringKeys.filter(k => /^church_offering_\d{4}-\d{2}-\d{2}_.*$/.test(k)).length;
    if (recordCount === 0 && memberOfferings.length === 0) {
        return showMsg('알림', '초기화할 헌금 입력 기록이 없습니다.');
    }

    // 1차 경고 확인
    const firstConfirm = confirm(
        `[경고 1/2] 저장된 모든 헌금 입력 기록(${recordCount}건)을 초기화하시겠습니까?\n\n` +
        `- 삭제 대상: 전체 날짜·예배 헌금 입력 기록 및 임시 백업\n` +
        `- 유지 대상: 성도 명부, 예배 구분, 헌금 목록, 교회 이름 설정, 다크모드 설정`
    );
    if (!firstConfirm) return;

    // 2차 최종 경고 확인
    const secondConfirm = confirm(
        `[최종 경고 2/2] 정말로 모든 헌금 입력 기록을 영구 삭제하시겠습니까?\n\n` +
        `삭제된 헌금 입력 기록은 되돌릴 수 없습니다.\n` +
        `필요한 경우 먼저 [전체 데이터 백업 저장]을 진행해 주세요.`
    );
    if (!secondConfirm) return;

    offeringKeys.forEach(key => localStorage.removeItem(key));
    memberOfferings = [];
    if (document.getElementById('committeeNames')) {
        document.getElementById('committeeNames').value = '';
    }
    if (typeof updateSignatures === 'function') updateSignatures();
    if (typeof renderMemberRows === 'function') renderMemberRows();
    if (typeof calculateTotals === 'function') calculateTotals();
    if (typeof updateWorshipTypeDropdownIndicators === 'function') updateWorshipTypeDropdownIndicators(activeDateStr);
    if (typeof renderStats === 'function' && document.getElementById('statMonth')?.value) {
        renderStats();
    }
    if (document.getElementById('receiptPrintArea')) {
        document.getElementById('receiptPrintArea').classList.add('hidden');
    }
    if (document.getElementById('receiptActionButtons')) {
        document.getElementById('receiptActionButtons').classList.add('hidden');
    }

    updateSettingsBackupSummary();
    showMsg('초기화 완료', '저장된 전체 헌금 입력 기록이 모두 초기화되었습니다.');
}

function initDarkMode() {
    if (localStorage.getItem('church_dark_mode') === 'true') { document.documentElement.classList.add('dark'); document.getElementById('themeIcon').innerText = '☀️'; }
}
function toggleDarkMode() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) { html.classList.remove('dark'); localStorage.setItem('church_dark_mode', 'false'); document.getElementById('themeIcon').innerText = '🌙'; } 
    else { html.classList.add('dark'); localStorage.setItem('church_dark_mode', 'true'); document.getElementById('themeIcon').innerText = '☀️'; }
}

function switchTab(tabId) {
    ['calc', 'registry', 'stats', 'receipt'].forEach(t => {
        document.getElementById(t + 'View').classList.toggle('hidden', t !== tabId);
        document.getElementById('tab-' + t).className = (t === tabId) ? 'py-3 px-4 border-b-2 border-indigo-600 dark:border-indigo-400 font-bold text-indigo-700 dark:text-indigo-300 whitespace-nowrap' : 'py-3 px-4 border-b-2 border-transparent font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 whitespace-nowrap';
    });
    if (tabId === 'registry') renderRegistry(); 
    else if (tabId === 'stats') { 
        if (!document.getElementById('statMonth').value) {
            const d = new Date();
            document.getElementById('statMonth').value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }
        renderStats(); 
    } 
    else if (tabId === 'receipt') { 
        if (!document.getElementById('searchYear').value) {
            document.getElementById('searchYear').value = new Date().getFullYear();
        }
        if (document.getElementById('receiptIssueNoInput') && !document.getElementById('receiptIssueNoInput').value) {
            document.getElementById('receiptIssueNoInput').value = `제 ${document.getElementById('searchYear').value} - 001 호`;
        }
        document.getElementById('nameOptions').innerHTML = ''; 
        globalMembers.forEach(m => document.getElementById('nameOptions').appendChild(new Option(m.name))); 
    }
}

function showMsg(title, content) { 
    document.getElementById('msgTitle').innerText = title; document.getElementById('msgContent').innerText = content; 
    const box = document.getElementById('messageBox'); box.classList.remove('hidden');
    setTimeout(() => box.firstElementChild.classList.remove('scale-95'), 10);
}
function closeMessage() { 
    document.getElementById('messageBox').firstElementChild.classList.add('scale-95');
    setTimeout(() => document.getElementById('messageBox').classList.add('hidden'), 150);
}
function formatCurrency(num) { return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
function getSortIcon(col) { return (sortCol === col) ? (sortAsc ? '<span class="text-indigo-600 dark:text-indigo-400 text-[10px] ml-1 no-print">▲</span>' : '<span class="text-indigo-600 dark:text-indigo-400 text-[10px] ml-1 no-print">▼</span>') : ''; }