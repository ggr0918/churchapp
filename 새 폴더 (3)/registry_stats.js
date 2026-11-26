// registry_stats.js
// ==========================================
// 명부 관리 (Registry) 로직
// ==========================================
function loadRegistry() {
    try {
        const raw = JSON.parse(localStorage.getItem('church_global_members')) || [];
        globalMembers = raw.map(m => ({
            name: m.name || '',
            group: m.group || '성도',
            gender: m.gender || '',
            role: m.role || ''
        }));
    } catch (e) {
        globalMembers = [];
    }
    renderGroupFilterOptions();
    renderRegistry();
}

function renderGroupFilterOptions() {
    const regFilter = document.getElementById('regGroupFilter');
    if (regFilter) {
        const current = regFilter.value || 'all';
        regFilter.innerHTML = `<option value="all">구역 전체</option>` +
            memberGroups.map(g => `<option value="${g}">${g}</option>`).join('');
        regFilter.value = (current === 'all' || memberGroups.includes(current)) ? current : 'all';
    }

    const newGroupSelect = document.getElementById('newRegGroup');
    if (newGroupSelect) {
        const curNew = newGroupSelect.value;
        newGroupSelect.innerHTML = memberGroups.map(g => `<option value="${g}">${g}</option>`).join('');
        newGroupSelect.value = memberGroups.includes(curNew) ? curNew : (memberGroups[0] || '성도');
    }

    const calcGroupFilter = document.getElementById('filterGroup');
    if (calcGroupFilter) {
        const curCalc = calcGroupFilter.value || 'all';
        calcGroupFilter.innerHTML = `<option value="all">구역(전체)</option>` +
            memberGroups.map(g => `<option value="${g}">${g}</option>`).join('');
        calcGroupFilter.value = (curCalc === 'all' || memberGroups.includes(curCalc)) ? curCalc : 'all';
    }
}

function addCustomMemberGroupFromRegistry() {
    const input = document.getElementById('newRegCustomGroupInput');
    const name = input ? input.value.trim() : '';
    if (!name) return showMsg('입력 오류', '추가할 구역 이름을 입력해 주세요.');
    if (memberGroups.includes(name)) return showMsg('중복 알림', `'${name}' 구역은 이미 목록에 있습니다.`);

    memberGroups.push(name);
    saveMemberGroupsToStorage();
    if (input) input.value = '';
    renderGroupFilterOptions();
    renderRegistry();
    showMsg('추가 완료', `'${name}' 구역이 추가되었습니다.`);
}

function renderRegistry() {
    const tbody = document.getElementById('registryRows');
    const groupFilter = document.getElementById('regGroupFilter')?.value || 'all';
    tbody.innerHTML = '';

    const filtered = globalMembers
        .map((m, idx) => ({ ...m, _origIdx: idx }))
        .filter(m => groupFilter === 'all' || (m.group || '성도') === groupFilter);

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="py-8 text-center text-slate-400">명부가 없습니다. 추가해주세요.</td></tr>';
    } else {
        filtered.forEach((m, displayIdx) => appendRegistryRowDOM(m.name, m.group || '성도', m.gender, m.role, displayIdx, m._origIdx));
    }
    if (document.getElementById('regSelectAll')) document.getElementById('regSelectAll').checked = false;
}

function saveRegistry(silent = false) {
    const groupFilter = document.getElementById('regGroupFilter')?.value || 'all';
    const rows = document.querySelectorAll('.registry-row');

    if (groupFilter === 'all') {
        const newData = [];
        rows.forEach(row => {
            const name = row.querySelector('.reg-name').value.trim();
            if (name) {
                newData.push({
                    name,
                    group: row.querySelector('.reg-group')?.value || '성도',
                    gender: row.querySelector('.reg-gender').value,
                    role: row.querySelector('.reg-role').value.trim()
                });
            }
        });
        globalMembers = newData;
    } else {
        const visibleIndices = new Set();
        const updatedByIdx = {};
        rows.forEach(row => {
            const origIdx = Number.parseInt(row.dataset.origIdx, 10);
            const name = row.querySelector('.reg-name').value.trim();
            if (Number.isFinite(origIdx)) {
                visibleIndices.add(origIdx);
                if (name) {
                    updatedByIdx[origIdx] = {
                        name,
                        group: row.querySelector('.reg-group')?.value || '성도',
                        gender: row.querySelector('.reg-gender').value,
                        role: row.querySelector('.reg-role').value.trim()
                    };
                }
            }
        });

        const merged = [];
        globalMembers.forEach((m, idx) => {
            if (!visibleIndices.has(idx)) {
                merged.push(m);
            } else if (updatedByIdx[idx]) {
                merged.push(updatedByIdx[idx]);
            }
        });
        globalMembers = merged;
    }

    localStorage.setItem('church_global_members', JSON.stringify(globalMembers));
    if (!silent) {
        showMsg('명부 저장 완료', '저장되었습니다.');
        renderRegistry();
    }
}

function registerNewMember() {
    const name = document.getElementById('newRegName').value.trim();
    if (!name) return showMsg('입력 오류', '이름을 입력해주세요.');
    const group = document.getElementById('newRegGroup')?.value || '성도';
    const gender = document.getElementById('newRegGender').value;
    const role = document.getElementById('newRegRole').value.trim();

    saveRegistry(true);
    globalMembers.push({ name, group, gender, role });
    localStorage.setItem('church_global_members', JSON.stringify(globalMembers));
    document.getElementById('newRegName').value = '';
    document.getElementById('newRegGender').value = '남';
    document.getElementById('newRegRole').value = '';
    renderRegistry();
    document.getElementById('newRegName').focus();
}

function appendRegistryRowDOM(name, group, gender, role, idx, origIdx = idx) {
    const tbody = document.getElementById('registryRows');
    if (tbody.querySelector('.text-slate-400')) tbody.innerHTML = '';
    const tr = document.createElement('tr');
    tr.className = 'registry-row hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-200 dark:border-slate-700 print:border-black transition-colors';
    tr.dataset.origIdx = origIdx;

    const groupList = memberGroups.includes(group) ? memberGroups : [...memberGroups, group];
    const groupOpts = groupList
        .map(g => `<option value="${g}" ${group === g ? 'selected' : ''}>${g}</option>`)
        .join('');

    tr.innerHTML = `
        <td class="py-1 px-2 text-center no-print">
            <input type="checkbox" class="check-ui reg-row-check" data-orig-idx="${origIdx}">
        </td>
        <td class="py-1 px-4 text-center text-slate-500 dark:text-slate-400 print:border print:border-black">${idx + 1}</td>
        <td class="py-1 px-4 print:border print:border-black"><input type="text" class="reg-name w-full border dark:border-slate-600 bg-transparent rounded px-2 py-1 outline-none focus:border-indigo-500 print:border-none print:text-center print:text-black" value="${name}"></td>
        <td class="py-1 px-4 text-center print:border print:border-black">
            <select class="reg-group border dark:border-slate-600 bg-transparent rounded px-2 py-1 text-xs font-bold outline-none focus:border-indigo-500 print:border-none print:appearance-none print:text-black">${groupOpts}</select>
        </td>
        <td class="py-1 px-4 text-center print:border print:border-black"><select class="reg-gender w-16 border dark:border-slate-600 bg-transparent rounded px-1 py-1 outline-none text-center focus:border-indigo-500 print:border-none print:appearance-none print:text-black"><option value=""></option><option value="남" ${gender==='남'?'selected':''}>남</option><option value="여" ${gender==='여'?'selected':''}>여</option></select></td>
        <td class="py-1 px-4 print:border print:border-black"><input type="text" class="reg-role w-full border dark:border-slate-600 bg-transparent rounded px-2 py-1 outline-none text-center focus:border-indigo-500 print:border-none print:text-black" value="${role}"></td>
        <td class="py-1 px-4 text-center no-print"><button onclick="this.closest('tr').remove()" class="text-rose-400 hover:text-white hover:bg-rose-500 font-bold px-2 py-1 rounded transition-colors">X</button></td>
    `;
    tbody.appendChild(tr);
}

function toggleAllRegistry(checked) {
    document.querySelectorAll('.reg-row-check').forEach(cb => cb.checked = checked);
}

function deleteSelectedRegistry() {
    saveRegistry(true);
    const checkboxes = document.querySelectorAll('.reg-row-check');
    const toDeleteOrig = new Set();

    checkboxes.forEach((cb) => {
        if (cb.checked) {
            const origIdx = Number.parseInt(cb.dataset.origIdx, 10);
            if (Number.isFinite(origIdx)) toDeleteOrig.add(origIdx);
        }
    });

    if (toDeleteOrig.size === 0) return showMsg('알림', '삭제할 성도를 선택해주세요.');
    if (!confirm(`선택한 ${toDeleteOrig.size}명의 성도를 명부에서 삭제하시겠습니까?`)) return;

    globalMembers = globalMembers.filter((_, idx) => !toDeleteOrig.has(idx));
    localStorage.setItem('church_global_members', JSON.stringify(globalMembers));
    renderRegistry();
    showMsg('삭제 완료', '선택한 성도가 삭제되었습니다.');
}

function deleteAllRegistry() {
    if (globalMembers.length === 0) return;
    if (!confirm('정말 모든 성도 명부를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    
    globalMembers = [];
    localStorage.setItem('church_global_members', JSON.stringify(globalMembers));
    renderRegistry();
    showMsg('삭제 완료', '모든 성도 명부가 삭제되었습니다.');
}

function handleExcelUpload(event) {
    const file = event.target.files[0]; 
    if (!file) return; 
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 }); 
            
            let count = 0;
            globalMembers = []; 
            
            json.forEach((row, rowIndex) => {
                if (!row || row.length === 0) return; 
                
                let colA = String(row[0] || '').trim();
                let colB = String(row[1] || '').trim();
                let colC = String(row[2] || '').trim();
                let colD = String(row[3] || '').trim();

                if (rowIndex === 0 && (colA.includes('이름') || colA.includes('성명') || colA === 'A' || colA.includes('순번') || colA.includes('이 름'))) return;

                let nameVal = colA;
                let groupVal = colB;
                let genderVal = colC;
                let roleVal = colD;

                if (!isNaN(parseInt(colA)) && colB !== '') {
                    nameVal = colB;
                    groupVal = colC;
                    genderVal = colD;
                    roleVal = String(row[4] || '').trim();
                }

                if ((groupVal === '남' || groupVal === '여' || groupVal === '') && (genderVal !== '남' && genderVal !== '여')) {
                    roleVal = genderVal || roleVal;
                    genderVal = groupVal;
                    groupVal = '성도';
                }

                if (nameVal && nameVal !== '') {
                    let finalGroup = groupVal && groupVal !== '' ? groupVal : '성도';
                    if (!memberGroups.includes(finalGroup)) {
                        memberGroups.push(finalGroup);
                    }

                    let finalGender = '';
                    if (genderVal.includes('남')) finalGender = '남';
                    else if (genderVal.includes('여')) finalGender = '여';

                    let finalRole = roleVal;
                    if (!finalRole || finalRole === '') finalRole = '성도';

                    globalMembers.push({ name: nameVal, group: finalGroup, gender: finalGender, role: finalRole }); 
                    count++; 
                }
            });
            
            saveMemberGroupsToStorage();
            renderGroupFilterOptions();
            localStorage.setItem('church_global_members', JSON.stringify(globalMembers));
            renderRegistry(); 
            event.target.value = ''; 
            showMsg('완료', `${count}명의 성도가 추가되었습니다.\n반드시 [명부 저장하기]를 눌러 확정해 주세요.`);
        } catch (error) { 
            console.error(error);
            showMsg('실패', '엑셀 파일을 읽을 수 없습니다.\nA열: 이름, B열: 구역, C열: 성별, D열: 직분 형식인지 확인해 주세요.'); 
        }
    }; 
    reader.readAsArrayBuffer(file);
}

async function downloadRegistryTemplate() {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('성도명부업로드양식');

        worksheet.addRow(['성명', '구역', '성별', '직분']);
        worksheet.addRow(['홍길동', '장년부(남자)', '남', '안수집사']);
        worksheet.addRow(['김영희', '여전도회', '여', '권사']);
        worksheet.addRow(['이청년', '청년부', '남', '청년']);
        worksheet.addRow(['박성도', '성도', '', '성도']);

        const headRow = worksheet.getRow(1);
        headRow.font = { bold: true, name: '맑은 고딕', size: 11 };
        headRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
        headRow.alignment = { vertical: 'middle', horizontal: 'center' };
        
        worksheet.getColumn(1).width = 15;
        worksheet.getColumn(2).width = 18;
        worksheet.getColumn(3).width = 12;
        worksheet.getColumn(4).width = 15;

        [2, 3, 4, 5].forEach(rowNum => {
            worksheet.getRow(rowNum).eachCell(cell => {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.font = { name: '맑은 고딕', size: 11 };
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const churchName = getChurchName();
        saveAs(blob, `${churchName}_성도명부_업로드양식.xlsx`);
        
        showMsg('다운로드 완료', '작성용 엑셀 양식이 다운로드되었습니다.\n2행부터 있는 예시를 지우고 실제 성도 명단을 채워서 업로드해주세요.');
    } catch (e) {
        console.error(e);
        showMsg('오류', '엑셀 양식 다운로드 중 문제가 발생했습니다.');
    }
}

// ==========================================
// 전체 데이터 백업 및 복원 (JSON + 시트명 YYYYMMDD[_NN] 엑셀 복구)
// ==========================================
const EXCEL_RESTORE_MAX_ROWS = 3000;
const EXCEL_RESTORE_MAX_SESSIONS = 60;

function exportAllData() {
    const allData = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('church_') && key !== 'church_pre_excel_restore_snapshot') {
            allData[key] = localStorage.getItem(key);
        }
    }
    if (Object.keys(allData).length === 0) return showMsg('오류', '백업할 데이터가 없습니다.');
    
    const churchName = getChurchName();
    const todayStr = typeof getLocalDateString === 'function' ? getLocalDateString() : new Date().toISOString().split('T')[0];
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
    saveAs(blob, `${churchName}_전체데이터백업_${todayStr}.json`);
    showMsg('백업 완료', '성도 명부(구역 포함), 전체 헌금 기록, 예배 구분, 헌금 목록, 교회 설정이 파일로 다운로드되었습니다.\n새 PC의 [⚙️ 설정 → 백업 / 복원]에서 이 파일을 선택하면 모든 데이터가 그대로 복원됩니다.');
}

function importAllData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            let restoredCount = 0;
            for (const key in data) {
                if (key.startsWith('church_') && key !== 'church_pre_excel_restore_snapshot') {
                    localStorage.setItem(key, data[key]);
                    restoredCount++;
                }
            }
            if (restoredCount === 0) {
                return showMsg('복원 실패', '유효한 교회 헌금 정산기 백업 데이터가 들어있지 않은 파일입니다.');
            }
            showMsg('복원 성공', `총 ${restoredCount}개의 데이터 항목(명부/헌금기록/예배구분/헌금목록/설정)이 복원되었습니다.\n잠시 후 화면이 자동으로 새로고침 됩니다.`);
            setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
            showMsg('실패', '올바른 백업(.json) 파일이 아닙니다.');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function normalizeExcelDateValue(rawVal) {
    if (rawVal === null || rawVal === undefined || rawVal === '') return '';

    if (typeof rawVal === 'number' && Number.isFinite(rawVal) && rawVal > 20000) {
        const utcDays = Math.floor(rawVal - 25569);
        const dt = new Date(utcDays * 86400 * 1000);
        if (!Number.isNaN(dt.getTime())) {
            const y = dt.getUTCFullYear();
            const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
            const d = String(dt.getUTCDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }
    }

    const str = String(rawVal).trim();
    const korMatch = str.match(/(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일?/);
    if (korMatch) {
        return `${korMatch[1]}-${String(korMatch[2]).padStart(2, '0')}-${String(korMatch[3]).padStart(2, '0')}`;
    }

    const isoMatch = str.match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
    if (isoMatch) {
        return `${isoMatch[1]}-${String(isoMatch[2]).padStart(2, '0')}-${String(isoMatch[3]).padStart(2, '0')}`;
    }

    return '';
}

function parseDateFromSheetName(sheetName) {
    const str = String(sheetName || '').trim();
    const match8 = str.match(/(\d{4})(\d{2})(\d{2})/);
    if (match8) {
        return `${match8[1]}-${match8[2]}-${match8[3]}`;
    }
    return normalizeExcelDateValue(str);
}

function detectWorshipTypeFromSheetTop(rows, headerRowIdx) {
    const limit = Math.min(headerRowIdx, rows.length);
    for (let rIdx = 0; rIdx < limit; rIdx++) {
        const row = rows[rIdx];
        if (!Array.isArray(row)) continue;
        for (let cIdx = 0; cIdx < row.length; cIdx++) {
            const cellText = String(row[cIdx] || '').trim();
            if (!cellText) continue;
            if (worshipTypes.includes(cellText)) return cellText;
            const m = cellText.match(/(?:예배\s*구분\s*[:：]\s*)?(.+예배|금요\s*철야|새벽\s*기도회|특별\s*집회)/);
            if (m && m[1]) {
                return m[1].trim();
            }
        }
    }
    return '';
}

function findHeaderRowIndex(rows) {
    const maxScan = Math.min(15, rows.length);
    let bestIdx = 0;
    let bestScore = -1;

    for (let i = 0; i < maxScan; i++) {
        const row = rows[i];
        if (!Array.isArray(row)) continue;
        const cells = row.map(c => String(c || '').trim());
        let score = 0;
        if (cells.some(c => ['성명', '이름', '성도명'].includes(c))) score += 3;
        if (cells.some(c => ['예배구분', '예배', '구분'].includes(c))) score += 2;
        if (cells.some(c => ['금액', '헌금액', '현금', '온라인', '소계', '총액'].includes(c))) score += 2;
        if (cells.some(c => offeringTypes.some(ot => ot.name === c))) score += 2;

        if (score > bestScore) {
            bestScore = score;
            bestIdx = i;
        }
    }
    return bestIdx;
}

async function downloadRestoreExcelTemplate() {
    try {
        const churchName = typeof getChurchName === 'function' ? getChurchName() : '우리교회';
        const workbook = new ExcelJS.Workbook();
        workbook.creator = churchName;
        workbook.created = new Date();

        const guideSheet = workbook.addWorksheet('작성안내');
        guideSheet.addRow(['[HLC 교회 관리] 시트명 기반 엑셀 데이터 복구 템플릿 안내']);
        guideSheet.getRow(1).font = { name: '맑은 고딕', size: 14, bold: true };
        guideSheet.addRow([]);
        guideSheet.addRow(['1. 같은 날짜에 여러 예배가 있을 때는 시트를 분리해 시트 이름을 20261127_01, 20261127_02처럼 지정해 주세요.']);
        guideSheet.addRow(['2. 날짜는 시트 이름(YYYYMMDD)에서 자동 추출해 주차를 구분하며, 예배 구분은 시트 내부(예배구분 열 또는 상단 제목)에서 읽습니다.']);
        guideSheet.addRow(['3. 프로그램 안정성을 위해 1회 업로드 한도는 최대 3,000행 / 최대 60건 예배(약 1년치)로 제한됩니다.']);
        guideSheet.getColumn(1).width = 96;

        const memberSheet = workbook.addWorksheet('성도명부');
        memberSheet.addRow(['성명', '구역', '성별', '직분']);
        memberSheet.addRow(['홍길동', '장년부(남자)', '남', '안수집사']);
        memberSheet.addRow(['김영희', '여전도회', '여', '권사']);

        const sheet1 = workbook.addWorksheet('20261127_01');
        sheet1.addRow(['주일 1부 예배']);
        sheet1.addRow([
            '예배구분', '순번', '성명', '구역',
            '남자', '여자', '주일', '비대면',
            '헌금종류', '금액', '결제구분', '메모', '결재자'
        ]);
        sheet1.addRow([
            '주일 1부 예배', 1, '홍길동', '장년부(남자)',
            1, 0, 1, 0,
            '주정', 20000, '현금', '', '홍길동, 김철수'
        ]);

        const sheet2 = workbook.addWorksheet('20261127_02');
        sheet2.addRow(['주일 2부 예배']);
        sheet2.addRow([
            '예배구분', '순번', '성명', '구역',
            '남자', '여자', '주일', '비대면',
            '헌금종류', '금액', '결제구분', '메모', '결재자'
        ]);
        sheet2.addRow([
            '주일 2부 예배', 1, '김영희', '여전도회',
            0, 1, 1, 0,
            '십일조', 100000, '온라인', '계좌이체', '홍길동, 김철수'
        ]);

        [memberSheet, sheet1, sheet2].forEach(sheet => {
            sheet.columns.forEach(col => {
                col.width = 16;
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        saveAs(blob, `${churchName}_시트별_데이터복구_템플릿.xlsx`);
        showMsg(
            '템플릿 다운로드 완료',
            `시트명(YYYYMMDD / YYYYMMDD_01, 02) 기반 복구 템플릿이 다운로드되었습니다.\n(1회 최대 ${formatCurrency(EXCEL_RESTORE_MAX_ROWS)}행 / 예배 ${EXCEL_RESTORE_MAX_SESSIONS}건까지 일괄 복구 가능)`
        );
    } catch (e) {
        console.error(e);
        showMsg('오류', '복구 템플릿 생성 중 문제가 발생했습니다.');
    }
}

function savePreRestoreSafetySnapshot() {
    const snap = {};
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('church_') && k !== 'church_pre_excel_restore_snapshot') {
            snap[k] = localStorage.getItem(k);
        }
    }
    localStorage.setItem('church_pre_excel_restore_snapshot', JSON.stringify({
        savedAt: new Date().toISOString(),
        data: snap
    }));
}

function restorePreExcelSnapshot() {
    const raw = localStorage.getItem('church_pre_excel_restore_snapshot');
    if (!raw) return showMsg('알림', '되돌릴 엑셀 복구 전 스냅샷이 없습니다.');
    if (!confirm('엑셀 복구 직전 상태로 되돌리시겠습니까? 화면이 새로고침 됩니다.')) return;
    try {
        const parsed = JSON.parse(raw);
        const snap = parsed.data || {};
        const toRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('church_') && k !== 'church_pre_excel_restore_snapshot') {
                toRemove.push(k);
            }
        }
        toRemove.forEach(k => localStorage.removeItem(k));
        Object.entries(snap).forEach(([k, v]) => localStorage.setItem(k, v));
        showMsg('복구 완료', '엑셀 복구 이전 상태로 되돌렸습니다.');
        setTimeout(() => window.location.reload(), 1000);
    } catch (e) {
        showMsg('오류', '스냅샷 복원 중 오류가 발생했습니다.');
    }
}

async function processChunkedArray(items, chunkSize, onProgress, onItem) {
    for (let i = 0; i < items.length; i += chunkSize) {
        const end = Math.min(i + chunkSize, items.length);
        for (let j = i; j < end; j++) {
            onItem(items[j], j);
        }
        if (typeof onProgress === 'function') {
            onProgress(end, items.length);
        }
        if (end < items.length) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }
}

function findOrCreateOfferingTypeByName(nameStr) {
    const clean = String(nameStr || '').trim();
    if (!clean) return null;
    let found = offeringTypes.find(ot => ot.name === clean);
    if (found) return found;

    const newId = 'custom_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    found = { id: newId, name: clean };
    offeringTypes.push(found);
    saveOfferingTypesToStorage();
    return found;
}

async function handleExcelRestoreUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const conflictMode = document.getElementById('excelRestoreConflictMode')?.value || 'merge';
    const progressEl = document.getElementById('excelRestoreProgressText');

    try {
        if (progressEl) progressEl.innerText = '엑셀 시트 및 데이터 행 수를 검사하는 중입니다...';
        const buf = await file.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(buf), { type: 'array' });

        let totalDataRows = 0;
        const sheetPayloads = [];

        for (const sheetName of workbook.SheetNames) {
            if (sheetName.includes('안내')) continue;
            const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
            if (!rows || rows.length === 0) continue;

            const headerRowIdx = findHeaderRowIndex(rows);
            const headers = (rows[headerRowIdx] || []).map(h => String(h || '').trim());
            const sheetHeaderWorship = detectWorshipTypeFromSheetTop(rows, headerRowIdx);
            const sheetDateStr = parseDateFromSheetName(sheetName);

            const nonEmptyRows = rows.slice(headerRowIdx + 1).filter(r =>
                Array.isArray(r) && r.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
            );

            if (nonEmptyRows.length === 0) continue;
            totalDataRows += nonEmptyRows.length;
            sheetPayloads.push({
                sheetName,
                sheetDateStr,
                sheetHeaderWorship,
                headers,
                bodyRows: nonEmptyRows
            });
        }

        if (totalDataRows === 0) {
            if (progressEl) progressEl.innerText = '';
            return showMsg('알림', '업로드한 엑셀 파일에 처리할 데이터 행이 없습니다.');
        }

        if (totalDataRows > EXCEL_RESTORE_MAX_ROWS) {
            if (progressEl) progressEl.innerText = `초과 중단: ${formatCurrency(totalDataRows)}행 (최대 ${formatCurrency(EXCEL_RESTORE_MAX_ROWS)}행 허용)`;
            return showMsg(
                '데이터 한도 초과',
                `선택한 파일에 총 ${formatCurrency(totalDataRows)}행이 들어 있습니다.\n` +
                `프로그램 부하 방지를 위해 1회 최대 ${formatCurrency(EXCEL_RESTORE_MAX_ROWS)}행까지만 복구할 수 있습니다.\n\n` +
                `연도별 또는 반기별로 엑셀 파일을 나누어 차례대로 업로드해 주세요.`
            );
        }

        savePreRestoreSafetySnapshot();

        let importedMembers = 0;
        let skippedRows = 0;
        const sessionBuckets = {};
        const defaultFallbackWorship = worshipTypes[0] || '주일 2부 예배';

        for (const payload of sheetPayloads) {
            const { sheetName, sheetDateStr, sheetHeaderWorship, headers, bodyRows } = payload;

            if (sheetName.includes('명부') || (!sheetDateStr && headers.includes('성명') && headers.includes('구역') && !headers.includes('금액'))) {
                const idxName = headers.indexOf('성명');
                const idxGroup = headers.indexOf('구역');
                const idxGender = headers.indexOf('성별');
                const idxRole = headers.indexOf('직분');

                await processChunkedArray(
                    bodyRows,
                    250,
                    (done, total) => {
                        if (progressEl) progressEl.innerText = `[${sheetName}] 명부 처리 중: ${done} / ${total}행`;
                    },
                    (r) => {
                        const name = idxName >= 0 ? String(r[idxName] || '').trim() : '';
                        if (!name) {
                            skippedRows++;
                            return;
                        }
                        const group = idxGroup >= 0 ? (String(r[idxGroup] || '').trim() || '성도') : '성도';
                        const genderRaw = idxGender >= 0 ? String(r[idxGender] || '').trim() : '';
                        const gender = genderRaw.includes('남') ? '남' : (genderRaw.includes('여') ? '여' : '');
                        const role = idxRole >= 0 ? (String(r[idxRole] || '').trim() || '성도') : '성도';

                        if (!memberGroups.includes(group)) {
                            memberGroups.push(group);
                        }
                        const existingIdx = globalMembers.findIndex(m => (m.name || '').trim() === name);
                        if (existingIdx >= 0) {
                            globalMembers[existingIdx] = { name, group, gender, role };
                        } else {
                            globalMembers.push({ name, group, gender, role });
                        }
                        importedMembers++;
                    }
                );
                continue;
            }

            const idxDate = headers.findIndex(h => ['날짜', '일자', '정산일자'].includes(h));
            const idxWorship = headers.findIndex(h => ['예배구분', '예배', '구분'].includes(h));
            const idxListNo = headers.findIndex(h => ['순번', '번호', 'No.'].includes(h));
            const idxName = headers.findIndex(h => ['성명', '이름', '성도명'].includes(h));
            const idxGroup = headers.findIndex(h => ['구역', '그룹', '부서'].includes(h));
            const idxMale = headers.indexOf('남자');
            const idxFemale = headers.indexOf('여자');
            const idxFace = headers.indexOf('주일');
            const idxNonFace = headers.indexOf('비대면');
            const idxType = headers.findIndex(h => ['헌금종류', '헌금항목', '항목'].includes(h));
            const idxAmt = headers.findIndex(h => ['금액', '헌금액'].includes(h));
            const idxMethod = headers.findIndex(h => ['결제구분', '납부방법', '현금/온라인', '온라인'].includes(h));
            const idxMemo = headers.findIndex(h => ['메모', '비고'].includes(h));
            const idxCommittee = headers.findIndex(h => ['결재자', '서명'].includes(h));

            const knownMetaIndices = new Set(
                [idxDate, idxWorship, idxListNo, idxName, idxGroup, idxMale, idxFemale, idxFace, idxNonFace, idxType, idxAmt, idxMethod, idxMemo, idxCommittee]
                    .filter(i => i >= 0)
            );
            const excludedSummaryHeaders = new Set(['현금', '소계', '총액', '합계', '총계']);

            const wideOfferingCols = (idxType >= 0 && idxAmt >= 0)
                ? []
                : headers
                    .map((h, idx) => ({ name: h, idx }))
                    .filter(col => col.name && !knownMetaIndices.has(col.idx) && !excludedSummaryHeaders.has(col.name));

            await processChunkedArray(
                bodyRows,
                250,
                (done, total) => {
                    if (progressEl) progressEl.innerText = `[${sheetName}] 헌금 내역 변환 중: ${done} / ${total}행`;
                },
                (r) => {
                    const rowDateStr = idxDate >= 0 ? normalizeExcelDateValue(r[idxDate]) : '';
                    const dateStr = sheetDateStr || rowDateStr;
                    const rowWorship = idxWorship >= 0 ? String(r[idxWorship] || '').trim() : '';
                    const worshipType = rowWorship || sheetHeaderWorship || defaultFallbackWorship;
                    const name = idxName >= 0 ? String(r[idxName] || '').trim() : '';

                    if (!dateStr || !name) {
                        skippedRows++;
                        return;
                    }

                    if (!worshipTypes.includes(worshipType)) {
                        worshipTypes.push(worshipType);
                    }

                    const bucketKey = `${dateStr}__${worshipType}`;
                    if (!sessionBuckets[bucketKey]) {
                        sessionBuckets[bucketKey] = {
                            date: dateStr,
                            worshipType,
                            committee: idxCommittee >= 0 ? String(r[idxCommittee] || '').trim() : '',
                            members: []
                        };
                    }
                    const bucket = sessionBuckets[bucketKey];
                    if (!bucket.committee && idxCommittee >= 0 && r[idxCommittee]) {
                        bucket.committee = String(r[idxCommittee]).trim();
                    }

                    const listNo = idxListNo >= 0 && Number.isFinite(Number(r[idxListNo])) && Number(r[idxListNo]) > 0
                        ? Number(r[idxListNo])
                        : bucket.members.length + 1;
                    const group = idxGroup >= 0 ? (String(r[idxGroup] || '').trim() || '성도') : '성도';
                    if (!memberGroups.includes(group)) {
                        memberGroups.push(group);
                    }

                    let memberObj = bucket.members.find(m => (m.name || '').trim() === name);
                    if (!memberObj) {
                        memberObj = {
                            listNo,
                            name,
                            group,
                            role: '',
                            memo: idxMemo >= 0 ? String(r[idxMemo] || '').trim() : '',
                            isMale: idxMale >= 0 ? Number(r[idxMale]) === 1 || String(r[idxMale]).trim() === '1' : false,
                            isFemale: idxFemale >= 0 ? Number(r[idxFemale]) === 1 || String(r[idxFemale]).trim() === '1' : false,
                            isFace: idxFace >= 0 ? Number(r[idxFace]) === 1 || String(r[idxFace]).trim() === '1' : false,
                            isNonFace: idxNonFace >= 0 ? Number(r[idxNonFace]) === 1 || String(r[idxNonFace]).trim() === '1' : false,
                            isOnline: false,
                            onlineByType: {}
                        };
                        offeringTypes.forEach(ot => {
                            memberObj[ot.id] = '';
                            memberObj.onlineByType[ot.id] = false;
                        });
                        bucket.members.push(memberObj);
                    } else if (idxMemo >= 0 && r[idxMemo] && !memberObj.memo) {
                        memberObj.memo = String(r[idxMemo]).trim();
                    }

                    const methodStr = idxMethod >= 0 ? String(r[idxMethod] || '').trim() : '';
                    const isOnlineRow = methodStr.includes('온라인') || methodStr.toLowerCase() === 'online' || Number(methodStr) === 1;

                    if (idxType >= 0 && idxAmt >= 0) {
                        const typeName = String(r[idxType] || '').trim();
                        const amtNum = Number.parseInt(String(r[idxAmt] || '0').replace(/[^0-9-]/g, ''), 10) || 0;
                        if (typeName && amtNum > 0) {
                            const ot = findOrCreateOfferingTypeByName(typeName);
                            if (ot) {
                                const prevAmt = parseInt(memberObj[ot.id], 10) || 0;
                                memberObj[ot.id] = prevAmt + amtNum;
                                memberObj.onlineByType[ot.id] = isOnlineRow;
                                if (isOnlineRow) memberObj.isOnline = true;
                            }
                        }
                    } else if (wideOfferingCols.length > 0) {
                        wideOfferingCols.forEach(col => {
                            const amtNum = Number.parseInt(String(r[col.idx] || '0').replace(/[^0-9-]/g, ''), 10) || 0;
                            if (amtNum > 0) {
                                const ot = findOrCreateOfferingTypeByName(col.name);
                                if (ot) {
                                    const prevAmt = parseInt(memberObj[ot.id], 10) || 0;
                                    memberObj[ot.id] = prevAmt + amtNum;
                                    memberObj.onlineByType[ot.id] = isOnlineRow;
                                    if (isOnlineRow) memberObj.isOnline = true;
                                }
                            }
                        });
                    }
                }
            );
        }

        const sessionList = Object.values(sessionBuckets);
        if (sessionList.length > EXCEL_RESTORE_MAX_SESSIONS) {
            if (progressEl) progressEl.innerText = `초과 중단: 예배 ${sessionList.length}건 (최대 ${EXCEL_RESTORE_MAX_SESSIONS}건 허용)`;
            return showMsg(
                '예배 건수 한도 초과',
                `선택한 파일에 총 ${sessionList.length}건의 예배 정산이 포함되어 있습니다.\n` +
                `1회 최대 ${formatCurrency(EXCEL_RESTORE_MAX_SESSIONS)}건(약 1년치)까지만 복구할 수 있습니다.\n` +
                `연도별로 파일을 나누어 업로드해 주세요.`
            );
        }

        saveMemberGroupsToStorage();
        saveWorshipTypesToStorage();
        saveOfferingTypesToStorage();
        localStorage.setItem('church_global_members', JSON.stringify(globalMembers));

        let savedSessions = 0;
        let skippedSessions = 0;

        sessionList.forEach(bucket => {
            const storageKey = `church_offering_${bucket.date}_${bucket.worshipType}`;
            const existingRaw = localStorage.getItem(storageKey);

            if (existingRaw && conflictMode === 'skip') {
                skippedSessions++;
                return;
            }

            if (existingRaw && conflictMode === 'merge') {
                try {
                    const existingData = JSON.parse(existingRaw);
                    const mergedMembers = Array.isArray(existingData.members) ? [...existingData.members] : [];
                    bucket.members.forEach(incomingM => {
                        const foundIdx = mergedMembers.findIndex(em => (em.name || '').trim() === (incomingM.name || '').trim());
                        if (foundIdx >= 0) {
                            const targetM = mergedMembers[foundIdx];
                            targetM.group = incomingM.group || targetM.group || '성도';
                            targetM.isMale = targetM.isMale || incomingM.isMale;
                            targetM.isFemale = targetM.isFemale || incomingM.isFemale;
                            targetM.isFace = targetM.isFace || incomingM.isFace;
                            targetM.isNonFace = targetM.isNonFace || incomingM.isNonFace;
                            if (incomingM.memo) targetM.memo = incomingM.memo;
                            targetM.onlineByType = Object.assign({}, targetM.onlineByType || {}, incomingM.onlineByType || {});
                            offeringTypes.forEach(ot => {
                                const addAmt = parseInt(incomingM[ot.id], 10) || 0;
                                if (addAmt > 0) {
                                    targetM[ot.id] = (parseInt(targetM[ot.id], 10) || 0) + addAmt;
                                }
                            });
                            targetM.isOnline = offeringTypes.some(ot => (parseInt(targetM[ot.id], 10) || 0) > 0 && Boolean(targetM.onlineByType[ot.id]));
                        } else {
                            mergedMembers.push(incomingM);
                        }
                    });
                    bucket.members = mergedMembers;
                    if (!bucket.committee && existingData.committee) {
                        bucket.committee = existingData.committee;
                    }
                } catch (e) {}
            }

            localStorage.setItem(storageKey, JSON.stringify(bucket));
            savedSessions++;
        });

        if (progressEl) {
            progressEl.innerText = `완료: 명부 ${importedMembers}건, 예배 ${savedSessions}건 반영 (제외 ${skippedRows}행)`;
        }

        showMsg(
            '엑셀 복구 완료',
            `명부 ${importedMembers}건, 헌금 정산 ${savedSessions}건이 반영되었습니다.\n` +
            `(제외된 빈/오류 행: ${skippedRows}건 / 중복 건너뜀: ${skippedSessions}건)\n` +
            `잠시 후 화면이 자동으로 새로고침 됩니다.`
        );
        setTimeout(() => window.location.reload(), 1400);
    } catch (err) {
        console.error(err);
        if (progressEl) progressEl.innerText = '오류로 인해 복구가 중단되었습니다.';
        showMsg('복구 실패', '엑셀 파일을 처리하는 중 오류가 발생했습니다. 템플릿 양식을 확인해 주세요.');
    } finally {
        event.target.value = '';
    }
}

// ==========================================
// 통계 (주간 / 월간 / 연간 결산) 및 영수증 로직
// 규칙:
// - 각 달의 마지막 일요일부터 시작되는 7일(일~토)을 그 달의 '마지막주'로 산정
// - 다음 달의 '1주차'는 전 달의 마지막 주가 끝난 다음 일요일부터 7일(일~토) 단위로 시작 (중복 없음)
// ==========================================
function formatKoreanShortDate(dateObj) {
    return `${dateObj.getMonth() + 1}월${dateObj.getDate()}일`;
}

function addDays(dateObj, days) {
    return new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate() + days);
}

function getLastSundayOfMonth(year, monthIndex) {
    const lastDay = new Date(year, monthIndex + 1, 0);
    const offset = lastDay.getDay(); // 일요일(0) 기준 경과일
    return new Date(year, monthIndex, lastDay.getDate() - offset);
}

function getFirstWeekStartForMonth(year, monthIndex) {
    const prevMonth = new Date(year, monthIndex - 1, 1);
    const prevLastSun = getLastSundayOfMonth(prevMonth.getFullYear(), prevMonth.getMonth());
    // 전 달 마지막 주(prevLastSun ~ prevLastSun + 6일)가 끝난 다음 일요일부터 해당 달 1주차 시작
    return addDays(prevLastSun, 7);
}

function buildMonthWeekRanges(monthStr) {
    const [yStr, mStr] = String(monthStr || '').split('-');
    const year = Number.parseInt(yStr, 10);
    const month = Number.parseInt(mStr, 10);
    if (!Number.isFinite(year) || !Number.isFinite(month)) return [];

    const mIdx = month - 1;
    const firstWeekStart = getFirstWeekStartForMonth(year, mIdx);
    const lastSun = getLastSundayOfMonth(year, mIdx);

    const ranges = [];
    let weekCounter = 1;
    let cursor = new Date(firstWeekStart.getFullYear(), firstWeekStart.getMonth(), firstWeekStart.getDate());

    while (cursor < lastSun) {
        const wStart = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
        const wEnd = addDays(wStart, 6);
        ranges.push({
            weekNum: weekCounter,
            isLastWeek: false,
            start: wStart,
            end: wEnd,
            label: `${weekCounter}주차(${formatKoreanShortDate(wStart)}~${formatKoreanShortDate(wEnd)})`
        });
        weekCounter++;
        cursor = addDays(wStart, 7);
    }

    const lastStart = new Date(lastSun.getFullYear(), lastSun.getMonth(), lastSun.getDate());
    const lastEnd = addDays(lastStart, 6);
    ranges.push({
        weekNum: weekCounter,
        isLastWeek: true,
        start: lastStart,
        end: lastEnd,
        label: `마지막주(${formatKoreanShortDate(lastStart)}~${formatKoreanShortDate(lastEnd)})`
    });

    return ranges;
}

function getAssignedMonthWeekInfo(dateStr) {
    const parts = String(dateStr || '').split('-').map(Number);
    if (parts.length !== 3 || parts.some(n => !Number.isFinite(n))) {
        return { monthStr: '', weekNum: 1, isLastWeek: false, label: '' };
    }
    const y = parts[0];
    const mIdx = parts[1] - 1;
    const dNum = parts[2];
    const curDate = new Date(y, mIdx, dNum);

    // 1) 현재 달력 월의 '마지막주'(lastSun ~ lastSun + 6일)에 포함되는지 먼저 확인
    const curMonthStr = `${y}-${String(mIdx + 1).padStart(2, '0')}`;
    const curRanges = buildMonthWeekRanges(curMonthStr);
    const curLastRange = curRanges[curRanges.length - 1];
    if (curLastRange && curDate >= curLastRange.start && curDate <= curLastRange.end) {
        return {
            monthStr: curMonthStr,
            weekNum: curLastRange.weekNum,
            isLastWeek: true,
            label: curLastRange.label
        };
    }

    // 2) 이전 달의 '마지막주'(예: 9월27일~10월3일 중 10월 1~3일)에 포함되는지 확인
    const prevMonthDate = new Date(y, mIdx - 1, 1);
    const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
    const prevRanges = buildMonthWeekRanges(prevMonthStr);
    const prevLastRange = prevRanges[prevRanges.length - 1];
    if (prevLastRange && curDate >= prevLastRange.start && curDate <= prevLastRange.end) {
        return {
            monthStr: prevMonthStr,
            weekNum: prevLastRange.weekNum,
            isLastWeek: true,
            label: prevLastRange.label
        };
    }

    // 3) 그 외 날짜는 현재 달력 월의 일반 주차(1주차, 2주차...)에 배정
    for (let i = 0; i < curRanges.length; i++) {
        const wr = curRanges[i];
        if (curDate >= wr.start && curDate <= wr.end) {
            return {
                monthStr: curMonthStr,
                weekNum: wr.weekNum,
                isLastWeek: wr.isLastWeek,
                label: wr.label
            };
        }
    }

    const fallback = curRanges[0] || { weekNum: 1, isLastWeek: false, label: '1주차' };
    return {
        monthStr: curMonthStr,
        weekNum: fallback.weekNum,
        isLastWeek: fallback.isLastWeek,
        label: fallback.label
    };
}

function getWeekDateRangeText(monthStr, weekNum) {
    const ranges = buildMonthWeekRanges(monthStr);
    if (!ranges.length) return `${weekNum}주차`;

    if (String(weekNum) === 'last') {
        return ranges[ranges.length - 1].label;
    }

    const num = Number.parseInt(weekNum, 10);
    const found = ranges.find(r => r.weekNum === num);
    if (found) return found.label;
    return ranges[ranges.length - 1].label;
}

function syncStatWeekDropdownRanges(monthStr) {
    const weekSelect = document.getElementById('statWeek');
    if (!weekSelect || !monthStr) return;

    const ranges = buildMonthWeekRanges(monthStr);
    const prevValue = weekSelect.value || 'all';

    weekSelect.innerHTML = `<option value="all">전체 합계</option>`;
    ranges.forEach(r => {
        const opt = document.createElement('option');
        opt.value = String(r.weekNum);
        opt.textContent = r.label;
        weekSelect.appendChild(opt);
    });

    const exists = Array.from(weekSelect.options).some(o => o.value === prevValue);
    weekSelect.value = exists ? prevValue : 'all';
}

function toggleStatPeriodMode() {
    const mode = document.getElementById('statPeriodMode')?.value || 'month';
    const monthEl = document.getElementById('statMonth');
    const weekEl = document.getElementById('statWeek');
    const yearEl = document.getElementById('statYear');
    const worshipCheckLabel = document.getElementById('includeWorshipCheckLabel');
    const worshipSection = document.getElementById('statsWorshipPrintSection');
    const annualSection = document.getElementById('annualReportSection');

    if (mode === 'year') {
        if (monthEl) monthEl.classList.add('hidden');
        if (weekEl) weekEl.classList.add('hidden');
        if (yearEl) {
            yearEl.classList.remove('hidden');
            if (!yearEl.value) yearEl.value = new Date().getFullYear();
        }
        if (worshipCheckLabel) worshipCheckLabel.classList.add('hidden');
        if (worshipSection) worshipSection.classList.add('hidden');
        if (annualSection) annualSection.classList.remove('hidden');
    } else {
        if (monthEl) monthEl.classList.remove('hidden');
        if (weekEl) weekEl.classList.remove('hidden');
        if (yearEl) yearEl.classList.add('hidden');
        if (worshipCheckLabel) worshipCheckLabel.classList.remove('hidden');
        if (worshipSection) worshipSection.classList.remove('hidden');
        if (annualSection) annualSection.classList.add('hidden');
    }
    renderStats();
}

function countSessionAttendFlag(m) {
    return Boolean(m && (m.isFace || m.isNonFace || m.isMale || m.isFemale));
}

function getMemberKeyForUniqueAttend(m, fallbackIdx) {
    const cleanName = (m && m.name ? String(m.name) : '').trim();
    if (cleanName) return `name:${cleanName.toLowerCase()}`;
    return `anon:${fallbackIdx}`;
}

function renderAnnualAnalytics(yearStr, memberGroupMap, typeStats) {
    const monthlyBody = document.getElementById('annualMonthlyBody');
    const groupBody = document.getElementById('annualGroupBody');
    const matrixHead = document.getElementById('annualMatrixHead');
    const matrixBody = document.getElementById('annualMatrixBody');
    if (!monthlyBody || !groupBody) return;

    const monthlyStats = Array.from({ length: 12 }, (_, idx) => {
        const byType = {};
        offeringTypes.forEach(ot => { byType[ot.id] = 0; });
        return {
            month: idx + 1,
            sessions: 0,
            uniqueAttendees: new Set(),
            newAddedCount: 0,
            cash: 0,
            online: 0,
            total: 0,
            byType
        };
    });

    const groupStats = {};
    memberGroups.forEach(g => {
        groupStats[g] = { members: new Set(), count: 0, cash: 0, online: 0, total: 0 };
    });
    groupStats['미분류/기타'] = { members: new Set(), count: 0, cash: 0, online: 0, total: 0 };

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const match = key.match(/^church_offering_(\d{4}-\d{2}-\d{2})_(.*)$/);
        if (!match) continue;

        const dateStr = match[1];
        const info = getAssignedMonthWeekInfo(dateStr);
        if (!info.monthStr) continue;

        const [aYearStr, aMonthStr] = info.monthStr.split('-');
        if (aYearStr !== String(yearStr)) continue;

        const mIdx = Number.parseInt(aMonthStr, 10) - 1;
        if (mIdx < 0 || mIdx > 11) continue;

        try {
            const data = JSON.parse(localStorage.getItem(key));
            if (!Array.isArray(data.members)) continue;

            let sessionHasData = false;
            data.members.forEach((m, mIdxInSession) => {
                if (countSessionAttendFlag(m)) {
                    monthlyStats[mIdx].uniqueAttendees.add(getMemberKeyForUniqueAttend(m, `${key}_${mIdxInSession}`));
                    sessionHasData = true;
                }

                let rowCash = 0;
                let rowOnline = 0;
                offeringTypes.forEach(ot => {
                    const amt = parseInt(m[ot.id], 10) || 0;
                    if (amt > 0) {
                        sessionHasData = true;
                        monthlyStats[mIdx].byType[ot.id] += amt;
                        const isItemOnline = (m.onlineByType && typeof m.onlineByType[ot.id] === 'boolean')
                            ? m.onlineByType[ot.id]
                            : Boolean(m.isOnline);
                        if (isItemOnline) rowOnline += amt;
                        else rowCash += amt;
                    }
                });

                const rowSum = rowCash + rowOnline;
                if (rowSum > 0) {
                    monthlyStats[mIdx].cash += rowCash;
                    monthlyStats[mIdx].online += rowOnline;
                    monthlyStats[mIdx].total += rowSum;

                    const mName = (m.name || '').trim();
                    const gName = m.group || memberGroupMap[mName] || '미분류/기타';
                    if (!groupStats[gName]) {
                        groupStats[gName] = { members: new Set(), count: 0, cash: 0, online: 0, total: 0 };
                    }
                    if (mName) groupStats[gName].members.add(mName);
                    groupStats[gName].count += 1;
                    groupStats[gName].cash += rowCash;
                    groupStats[gName].online += rowOnline;
                    groupStats[gName].total += rowSum;
                }
            });

            if (sessionHasData) {
                monthlyStats[mIdx].sessions += 1;
            }
        } catch (e) {}
    }

    const seenBeforeMonth = new Set();
    monthlyStats.forEach((ms, idx) => {
        let addedThisMonth = 0;
        ms.uniqueAttendees.forEach(personKey => {
            if (!seenBeforeMonth.has(personKey)) {
                addedThisMonth += 1;
            }
        });
        ms.newAddedCount = idx === 0 ? ms.uniqueAttendees.size : addedThisMonth;
        ms.uniqueAttendees.forEach(personKey => seenBeforeMonth.add(personKey));
    });

    const annualUniqueAll = new Set();
    monthlyStats.forEach(ms => ms.uniqueAttendees.forEach(k => annualUniqueAll.add(k)));

    monthlyBody.innerHTML = '';
    let sumSessions = 0, sumCash = 0, sumOnline = 0, sumTotal = 0;
    monthlyStats.forEach(ms => {
        sumSessions += ms.sessions;
        sumCash += ms.cash;
        sumOnline += ms.online;
        sumTotal += ms.total;
        const attCount = ms.uniqueAttendees.size;
        const addBadge = attCount > 0 ? ` <span class="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">(+${ms.newAddedCount}명)</span>` : '';
        monthlyBody.innerHTML += `
            <tr class="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <td class="py-2 px-3 text-center font-bold">${ms.month}월</td>
                <td class="py-2 px-3 text-center">${formatCurrency(ms.sessions)} 건</td>
                <td class="py-2 px-3 text-center">${formatCurrency(attCount)} 명${addBadge}</td>
                <td class="py-2 px-3 text-right">${formatCurrency(ms.cash)}</td>
                <td class="py-2 px-3 text-right">${formatCurrency(ms.online)}</td>
                <td class="py-2 px-3 text-right font-extrabold text-indigo-700 dark:text-indigo-300">${formatCurrency(ms.total)}</td>
            </tr>
        `;
    });
    monthlyBody.innerHTML += `
        <tr class="bg-indigo-50/80 dark:bg-slate-700/70 font-extrabold border-t-2 border-slate-300 dark:border-slate-600">
            <td class="py-2.5 px-3 text-center">연간 합계</td>
            <td class="py-2.5 px-3 text-center">${formatCurrency(sumSessions)} 건</td>
            <td class="py-2.5 px-3 text-center">${formatCurrency(annualUniqueAll.size)} 명 <span class="text-xs font-semibold text-slate-500">(중복제외)</span></td>
            <td class="py-2.5 px-3 text-right">${formatCurrency(sumCash)}</td>
            <td class="py-2.5 px-3 text-right">${formatCurrency(sumOnline)}</td>
            <td class="py-2.5 px-3 text-right text-indigo-700 dark:text-indigo-300">${formatCurrency(sumTotal)}</td>
        </tr>
    `;

    groupBody.innerHTML = '';
    let grpTotalAll = 0;
    Object.entries(groupStats).forEach(([gName, gData]) => {
        if (gName === '미분류/기타' && gData.total === 0) return;
        grpTotalAll += gData.total;
        groupBody.innerHTML += `
            <tr class="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <td class="py-2 px-3 text-center font-bold">${gName}</td>
                <td class="py-2 px-3 text-center">${formatCurrency(gData.members.size)} 명</td>
                <td class="py-2 px-3 text-center">${formatCurrency(gData.count)} 건</td>
                <td class="py-2 px-3 text-right font-extrabold text-emerald-700 dark:text-emerald-300">${formatCurrency(gData.total)}</td>
            </tr>
        `;
    });
    groupBody.innerHTML += `
        <tr class="bg-emerald-50/80 dark:bg-slate-700/70 font-extrabold border-t-2 border-slate-300 dark:border-slate-600">
            <td colspan="3" class="py-2.5 px-3 text-center">구역 합계</td>
            <td class="py-2.5 px-3 text-right text-emerald-700 dark:text-emerald-300">${formatCurrency(grpTotalAll)}</td>
        </tr>
    `;

    if (matrixHead && matrixBody) {
        let headHtml = `<tr><th class="py-2 px-2.5 text-center border-r dark:border-slate-600 sticky left-0 bg-slate-100 dark:bg-slate-700">월</th>`;
        offeringTypes.forEach(ot => {
            headHtml += `<th class="py-2 px-2 text-right border-r dark:border-slate-600 whitespace-nowrap">${ot.name}</th>`;
        });
        headHtml += `<th class="py-2 px-2.5 text-right bg-indigo-50 dark:bg-indigo-900/30 whitespace-nowrap">월 합계</th></tr>`;
        matrixHead.innerHTML = headHtml;

        matrixBody.innerHTML = '';
        monthlyStats.forEach(ms => {
            let rowHtml = `<tr class="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td class="py-1.5 px-2.5 text-center font-bold border-r dark:border-slate-600 sticky left-0 bg-white dark:bg-slate-800">${ms.month}월</td>`;
            offeringTypes.forEach(ot => {
                const v = ms.byType[ot.id] || 0;
                rowHtml += `<td class="py-1.5 px-2 text-right border-r dark:border-slate-600 tabular-nums">${v > 0 ? formatCurrency(v) : '-'}</td>`;
            });
            rowHtml += `<td class="py-1.5 px-2.5 text-right font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-50/40 dark:bg-indigo-900/10 tabular-nums">${ms.total > 0 ? formatCurrency(ms.total) : '0'}</td></tr>`;
            matrixBody.innerHTML += rowHtml;
        });

        let footHtml = `<tr class="bg-slate-100 dark:bg-slate-700 font-extrabold border-t-2 border-slate-300 dark:border-slate-600">
            <td class="py-2 px-2.5 text-center border-r dark:border-slate-600 sticky left-0 bg-slate-100 dark:bg-slate-700">연간 합계</td>`;
        offeringTypes.forEach(ot => {
            const v = typeStats[ot.id]?.sum || 0;
            footHtml += `<td class="py-2 px-2 text-right border-r dark:border-slate-600 tabular-nums">${formatCurrency(v)}</td>`;
        });
        footHtml += `<td class="py-2 px-2.5 text-right text-indigo-700 dark:text-indigo-300 tabular-nums">${formatCurrency(sumTotal)}</td></tr>`;
        matrixBody.innerHTML += footHtml;
    }

    return monthlyStats;
}

function renderStats() {
    const periodMode = document.getElementById('statPeriodMode')?.value || 'month';
    const monthStr = document.getElementById('statMonth').value;
    const weekFilter = document.getElementById('statWeek').value;
    const yearStr = document.getElementById('statYear')?.value || String(new Date().getFullYear());

    if (periodMode === 'month' && !monthStr) return;
    if (periodMode === 'month') syncStatWeekDropdownRanges(monthStr);

    const isWeeklyView = periodMode === 'month' && weekFilter !== 'all';

    const memberGroupMap = {};
    globalMembers.forEach(gm => {
        if (gm.name) memberGroupMap[gm.name.trim()] = gm.group || '성도';
    });

    let totalSum = 0, daysCount = 0, onlineSum = 0;
    const uniqueAttendees = new Set();
    const priorAttendees = new Set();
    let typeStats = {};
    offeringTypes.forEach(ot => typeStats[ot.id] = { count: 0, sum: 0 });
    let worshipSessions = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const match = key.match(/^church_offering_(\d{4}-\d{2}-\d{2})_(.*)$/);
        if (!match) continue;

        const dateStr = match[1];
        const wType = match[2];
        const weekInfo = getAssignedMonthWeekInfo(dateStr);
        if (!weekInfo.monthStr) continue;

        const wNum = weekInfo.weekNum;
        let inCurrentPeriod = false;
        let inPriorPeriod = false;

        if (periodMode === 'year') {
            const [aYearStr] = weekInfo.monthStr.split('-');
            inCurrentPeriod = aYearStr === String(yearStr);
            const prevYear = String(Number.parseInt(yearStr, 10) - 1);
            inPriorPeriod = aYearStr === prevYear;
        } else {
            if (weekInfo.monthStr === monthStr) {
                if (weekFilter === 'all') {
                    inCurrentPeriod = true;
                } else {
                    const targetW = Number.parseInt(weekFilter, 10);
                    if (wNum === targetW) inCurrentPeriod = true;
                    else if (wNum === targetW - 1) inPriorPeriod = true;
                }
            }
            if (weekFilter === 'all') {
                const [yN, mN] = monthStr.split('-').map(Number);
                const prevDate = new Date(yN, mN - 2, 1);
                const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
                if (weekInfo.monthStr === prevMonthStr) inPriorPeriod = true;
            }
        }

        if (!inCurrentPeriod && !inPriorPeriod) continue;

        try {
            const data = JSON.parse(localStorage.getItem(key));
            if (!Array.isArray(data.members)) continue;

            let dayHasData = false;
            let sessionAttend = 0;
            let sessionSum = 0;
            const sessionUnique = new Set();

            data.members.forEach((m, mIdxInSession) => {
                const attended = countSessionAttendFlag(m);
                const pKey = getMemberKeyForUniqueAttend(m, `${key}_${mIdxInSession}`);

                if (inPriorPeriod && attended) {
                    priorAttendees.add(pKey);
                }

                if (inCurrentPeriod) {
                    if (attended) {
                        uniqueAttendees.add(pKey);
                        sessionUnique.add(pKey);
                        dayHasData = true;
                    }

                    let mOnlineSum = 0;
                    offeringTypes.forEach(ot => {
                        const amt = parseInt(m[ot.id], 10) || 0;
                        if (amt > 0) {
                            typeStats[ot.id].count++;
                            typeStats[ot.id].sum += amt;
                            totalSum += amt;
                            sessionSum += amt;
                            dayHasData = true;
                            const isItemOnline = (m.onlineByType && typeof m.onlineByType[ot.id] === 'boolean')
                                ? m.onlineByType[ot.id]
                                : Boolean(m.isOnline);
                            if (isItemOnline) mOnlineSum += amt;
                        }
                    });
                    onlineSum += mOnlineSum;
                }
            });

            sessionAttend = sessionUnique.size;

            if (inCurrentPeriod && dayHasData) {
                daysCount++;
                worshipSessions.push({ dateStr, wNum, wType, sessionAttend, sessionSum });
            }
        } catch (e) {}
    }

    let addedCount = 0;
    uniqueAttendees.forEach(pKey => {
        if (!priorAttendees.has(pKey)) addedCount += 1;
    });

    const churchName = getChurchName();
    let periodLabel = '';
    if (periodMode === 'year') {
        periodLabel = `${yearStr}년도 연간 결산`;
        document.getElementById('printStatDateTitle').innerText = `${churchName} ${yearStr}년도 연간 결산 보고서`;
    } else {
        const weekText = weekFilter === 'all' ? '전체' : getWeekDateRangeText(monthStr, Number.parseInt(weekFilter, 10));
        periodLabel = `${monthStr} ${weekText}`;
        document.getElementById('printStatDateTitle').innerText = `${churchName} 주간/월간 결산 보고서 (기준: ${periodLabel})`;
    }
    if (document.getElementById('printStatWorshipTitle')) {
        document.getElementById('printStatWorshipTitle').innerText = `${churchName} 주간/월간 결산 보고서 - 예배 상세 내역 (기준: ${periodLabel})`;
    }

    document.getElementById('statTotalSum').innerText = formatCurrency(totalSum) + ' 원';
    document.getElementById('statDaysCount').innerText = daysCount + ' 건';
    if (document.getElementById('statOnlineSum')) document.getElementById('statOnlineSum').innerText = formatCurrency(onlineSum) + ' 원';

    if (document.getElementById('statAttendCount')) {
        const addedText = uniqueAttendees.size > 0 ? ` (+${addedCount}명)` : '';
        document.getElementById('statAttendCount').innerHTML = `${formatCurrency(uniqueAttendees.size)} 명<span class="block text-xs font-semibold text-blue-600/80 dark:text-blue-300/80 mt-0.5">중복제외${addedText}</span>`;
    }

    const statTableEl = document.getElementById('statRows')?.closest('table');
    const headCountTh = statTableEl?.querySelector('thead th:nth-child(2)');
    const footCountTd = document.getElementById('statTotalCountFoot');
    if (headCountTh) headCountTh.classList.toggle('hidden', !isWeeklyView);
    if (footCountTd) footCountTd.classList.toggle('hidden', !isWeeklyView);

    const tbody = document.getElementById('statRows');
    tbody.innerHTML = '';
    let totalCount = 0;
    offeringTypes.forEach(ot => {
        totalCount += typeStats[ot.id].count;
        const countCellHtml = isWeeklyView
            ? `<td class="py-2 px-4 text-center print:border print:border-black">${formatCurrency(typeStats[ot.id].count)} 명</td>`
            : '';
        tbody.innerHTML += `<tr class="border-b dark:border-slate-700 transition-colors"><td class="py-2 px-4 text-center print:border print:border-black">${ot.name}</td>${countCellHtml}<td class="py-2 px-4 text-right print:border print:border-black">${formatCurrency(typeStats[ot.id].sum)}</td></tr>`;
    });
    if (footCountTd) footCountTd.innerText = formatCurrency(totalCount) + ' 명';
    document.getElementById('statTotalSumFoot').innerText = formatCurrency(totalSum);

    let annualMonthlyData = null;
    if (periodMode === 'year') {
        annualMonthlyData = renderAnnualAnalytics(yearStr, memberGroupMap, typeStats);
    } else {
        const worshipListBody = document.getElementById('statWorshipListBody');
        if (worshipListBody) {
            worshipSessions.sort((a, b) => {
                if (a.dateStr !== b.dateStr) return b.dateStr.localeCompare(a.dateStr);
                const idxA = worshipTypes.indexOf(a.wType);
                const idxB = worshipTypes.indexOf(b.wType);
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return a.wType.localeCompare(b.wType);
            });
            worshipListBody.innerHTML = '';
            if (worshipSessions.length === 0) {
                worshipListBody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-400">해당 기간에 기록된 예배가 없습니다.</td></tr>`;
            } else {
                worshipSessions.forEach(s => {
                    const weekday = typeof getKoreanWeekday === 'function' ? getKoreanWeekday(s.dateStr) : '';
                    const tr = document.createElement('tr');
                    tr.className = 'border-b dark:border-slate-700 hover:bg-indigo-50/70 dark:hover:bg-slate-700/60 transition-colors cursor-pointer';
                    tr.onclick = () => { if (typeof jumpToWorshipRecord === 'function') jumpToWorshipRecord(s.dateStr, s.wType); };
                    tr.innerHTML = `
                        <td class="py-2 px-4 text-center font-medium">${s.dateStr} (${weekday})</td>
                        <td class="py-2 px-4 text-center font-bold text-indigo-700 dark:text-indigo-300">${s.wType}</td>
                        <td class="py-2 px-4 text-center">${formatCurrency(s.sessionAttend)} 명</td>
                        <td class="py-2 px-4 text-right font-bold">${formatCurrency(s.sessionSum)}</td>
                        <td class="py-2 px-4 text-center"><button type="button" class="px-2.5 py-1 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded transition-colors">열기</button></td>
                    `;
                    worshipListBody.appendChild(tr);
                });
            }
        }

        const weeklyPrintContainer = document.getElementById('statWorshipWeeklyPrintContainer');
        if (weeklyPrintContainer) {
            weeklyPrintContainer.innerHTML = '';
            if (worshipSessions.length === 0) {
                weeklyPrintContainer.innerHTML = `<div class="border border-black p-4 text-center text-sm">해당 기간에 기록된 예배가 없습니다.</div>`;
            } else {
                const weekMap = {};
                worshipSessions.forEach(s => {
                    if (!weekMap[s.wNum]) weekMap[s.wNum] = { totalCount: 0, totalAttend: 0, totalSum: 0, byType: {} };
                    const wk = weekMap[s.wNum];
                    wk.totalCount += 1;
                    wk.totalAttend += s.sessionAttend;
                    wk.totalSum += s.sessionSum;

                    if (!wk.byType[s.wType]) wk.byType[s.wType] = { count: 0, attend: 0, sum: 0 };
                    wk.byType[s.wType].count += 1;
                    wk.byType[s.wType].attend += s.sessionAttend;
                    wk.byType[s.wType].sum += s.sessionSum;
                });

                const sortedWeeks = Object.keys(weekMap).map(Number).sort((a, b) => a - b);
                sortedWeeks.forEach(wNum => {
                    const wk = weekMap[wNum];
                    const weekRangeTitle = getWeekDateRangeText(monthStr, wNum);
                    const typeNames = Object.keys(wk.byType).sort((a, b) => {
                        const idxA = typeof worshipTypes !== 'undefined' ? worshipTypes.indexOf(a) : -1;
                        const idxB = typeof worshipTypes !== 'undefined' ? worshipTypes.indexOf(b) : -1;
                        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                        if (idxA !== -1) return -1;
                        if (idxB !== -1) return 1;
                        return a.localeCompare(b);
                    });

                    let rowsHtml = '';
                    typeNames.forEach(tName => {
                        const info = wk.byType[tName];
                        rowsHtml += `
                            <tr>
                                <td class="py-1.5 px-3 text-center border border-black font-bold">${tName}</td>
                                <td class="py-1.5 px-3 text-center border border-black">${formatCurrency(info.count)} 건</td>
                                <td class="py-1.5 px-3 text-center border border-black">${formatCurrency(info.attend)} 명</td>
                                <td class="py-1.5 px-3 text-right border border-black font-bold">${formatCurrency(info.sum)}</td>
                            </tr>
                        `;
                    });

                    const block = document.createElement('div');
                    block.className = 'print-week-block';
                    block.innerHTML = `
                        <div class="flex justify-between items-center bg-slate-100 border-2 border-b-0 border-black px-3 py-1.5 font-bold text-sm">
                            <span>📌 ${weekRangeTitle} 예배 요약</span>
                            <span>총 ${formatCurrency(wk.totalCount)}건 · 출석 ${formatCurrency(wk.totalAttend)}명 · 합계 ${formatCurrency(wk.totalSum)}원</span>
                        </div>
                        <table class="w-full text-left text-xs border-collapse border-2 border-black">
                            <thead>
                                <tr class="bg-slate-50">
                                    <th class="py-1.5 px-3 text-center border border-black w-[35%]">예배 구분</th>
                                    <th class="py-1.5 px-3 text-center border border-black w-[15%]">예배 건수</th>
                                    <th class="py-1.5 px-3 text-center border border-black w-[20%]">총 출석 인원</th>
                                    <th class="py-1.5 px-3 text-right border border-black w-[30%]">헌금 합계 (원)</th>
                                </tr>
                            </thead>
                            <tbody>${rowsHtml}</tbody>
                        </table>
                    `;
                    weeklyPrintContainer.appendChild(block);
                });
            }
        }
    }

    if (statsChartInstance) statsChartInstance.destroy(); 
    if (periodMode === 'year' && annualMonthlyData) {
        statsChartInstance = new Chart(document.getElementById('statsChart'), {
            type: 'bar',
            data: {
                labels: annualMonthlyData.map(ms => `${ms.month}월`),
                datasets: [
                    { label: '현금', data: annualMonthlyData.map(ms => ms.cash), backgroundColor: '#6366f1' },
                    { label: '온라인', data: annualMonthlyData.map(ms => ms.online), backgroundColor: '#10b981' }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { x: { stacked: true }, y: { stacked: true } }
            }
        });
    } else {
        statsChartInstance = new Chart(document.getElementById('statsChart'), { type: 'bar', data: { labels: offeringTypes.map(ot => ot.name), datasets: [{ label: '총액', data: offeringTypes.map(ot => typeStats[ot.id].sum), backgroundColor: '#4f46e5' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
    }
}

async function exportStatsToExcel() {
    const periodMode = document.getElementById('statPeriodMode')?.value || 'month';
    const monthEl = document.getElementById('statMonth');
    const weekEl = document.getElementById('statWeek');
    const yearEl = document.getElementById('statYear');
    const m = monthEl ? monthEl.value : '';
    const weekVal = weekEl ? weekEl.value : 'all';
    const yearVal = yearEl ? yearEl.value : String(new Date().getFullYear());
    const w = weekVal !== 'all' ? getWeekDateRangeText(m, Number.parseInt(weekVal, 10)) : '전체';
    const churchName = getChurchName();

    if (periodMode === 'month' && !m) return showMsg('오류', '조회할 연도와 월을 선택하세요.');
    if (periodMode === 'year' && !yearVal) return showMsg('오류', '조회할 연도를 입력하세요.');

    showMsg('다운로드 중', '결산 보고서 엑셀 파일을 생성하고 있습니다...');

    try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = churchName;
        workbook.subject = periodMode === 'year' ? `${yearVal}년 연간 결산 보고서` : '주간 / 월간 결산 보고서';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('결산보고서');
        worksheet.views = [{ showGridLines: true }];
        worksheet.pageSetup = {
            paperSize: 9,
            orientation: 'portrait',
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 1,
            margins: { left: 0.55, right: 0.55, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 }
        };

        const borderColor = { argb: 'FFCBD5E1' };
        const strongBorderColor = { argb: 'FF334155' };
        const thinBorder = {
            top: { style: 'thin', color: borderColor },
            left: { style: 'thin', color: borderColor },
            bottom: { style: 'thin', color: borderColor },
            right: { style: 'thin', color: borderColor }
        };
        const numberFormat = '#,##0';

        const bannerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
        const labelFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        const valFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
        const zebraFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        const highlightLabelFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };
        const highlightValFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

        const bannerFont = { name: '맑은 고딕', size: 17, bold: true, color: { argb: 'FFFFFFFF' } };
        const labelFont = { name: '맑은 고딕', size: 11, bold: true, color: { argb: 'FF334155' } };
        const valFont = { name: '맑은 고딕', size: 11, bold: true, color: { argb: 'FF0F172A' } };
        const highlightLabelFont = { name: '맑은 고딕', size: 11.5, bold: true, color: { argb: 'FF3730A3' } };
        const highlightValFont = { name: '맑은 고딕', size: 12.5, bold: true, color: { argb: 'FF1E3A8A' } };

        const getSafeNumFromText = (value) => {
            const digits = String(value == null ? '' : value).replace(/[^0-9-]/g, '');
            const num = Number.parseInt(digits, 10);
            return Number.isFinite(num) ? num : 0;
        };
        const getSafeNum = (id) => {
            const el = document.getElementById(id);
            return el ? getSafeNumFromText(el.innerText) : 0;
        };

        const calcSpaciousRowHeight = (fontSize, lineCount = 1, extraPadding = 14) => {
            return Math.max(26, Math.round(fontSize * 1.45 * lineCount + extraPadding));
        };

        const calcSpaciousColWidth = (texts, fontSize, minWidth = 14, paddingChars = 6) => {
            const scale = fontSize / 11;
            let maxLen = 0;
            texts.forEach(t => {
                const str = String(t == null ? '' : t);
                let visualLen = 0;
                for (let i = 0; i < str.length; i++) {
                    visualLen += str.charCodeAt(i) > 127 ? 1.85 : 1.05;
                }
                if (visualLen * scale > maxLen) maxLen = visualLen * scale;
            });
            return Math.max(minWidth, Math.ceil(maxLen + paddingChars));
        };

        const daysNum = getSafeNum('statDaysCount');
        const attendNum = getSafeNum('statAttendCount');
        const onlineNum = getSafeNum('statOnlineSum');
        const totalSumNum = getSafeNum('statTotalSum');

        const titleText = periodMode === 'year'
            ? `${churchName} ${yearVal}년도 연간 결산 보고서`
            : `${churchName} 주간 / 월간 결산 보고서`;
        const periodValueText = periodMode === 'year' ? `${yearVal}년 전체 (1월 ~ 12월)` : `${m} · ${w}`;

        const titleRow = worksheet.addRow([titleText, '', '', '']);
        titleRow.height = calcSpaciousRowHeight(17, 1, 20);
        worksheet.mergeCells('A1:D1');
        for (let c = 1; c <= 4; c++) {
            const cell = titleRow.getCell(c);
            cell.fill = bannerFill;
            cell.font = bannerFont;
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }

        const spacer1 = worksheet.addRow(['', '', '', '']);
        spacer1.height = 12;

        const metaRowHeight = calcSpaciousRowHeight(11, 1, 14);
        const meta1 = worksheet.addRow(['조회 기간', periodValueText, '총 예배 건수', daysNum]);
        const meta2 = worksheet.addRow(['총 출석 인원', attendNum, '온라인 입금 총액', onlineNum]);
        const meta3 = worksheet.addRow(['총 헌금 합계', totalSumNum, '', '']);
        meta1.height = metaRowHeight;
        meta2.height = metaRowHeight;
        meta3.height = calcSpaciousRowHeight(12.5, 1, 16);

        const spacer2 = worksheet.addRow(['', '', '', '']);
        spacer2.height = 12;

        const headTexts = ['No.', '헌금 종류', '참여 인원 (명)', '결산 금액 (원)'];
        const headRow = worksheet.addRow(headTexts);
        headRow.height = calcSpaciousRowHeight(11, 1, 14);

        const dataRows = document.querySelectorAll('#statRows tr');
        const offeringNames = [];
        const amountTexts = [formatCurrency(totalSumNum), formatCurrency(onlineNum), formatCurrency(daysNum), formatCurrency(attendNum)];
        let index = 1;

        dataRows.forEach(tr => {
            const typeName = tr.cells[0] ? tr.cells[0].innerText.trim() : '';
            const count = tr.cells.length >= 4 && tr.cells[1] ? getSafeNumFromText(tr.cells[1].innerText) : 0;
            const amountCell = tr.cells[tr.cells.length - 1];
            const amount = amountCell ? getSafeNumFromText(amountCell.innerText) : 0;
            offeringNames.push(typeName);
            amountTexts.push(formatCurrency(amount));
            const row = worksheet.addRow([index++, typeName, count, amount]);
            row.height = calcSpaciousRowHeight(11, 1, 12);
        });

        const footTotalCount = getSafeNum('statTotalCountFoot');
        const footTotalSum = getSafeNum('statTotalSumFoot');
        amountTexts.push(formatCurrency(footTotalSum));
        const footRow = worksheet.addRow(['결산 총계', '', footTotalCount, footTotalSum]);
        footRow.height = calcSpaciousRowHeight(11.5, 1, 16);

        worksheet.getColumn(1).width = calcSpaciousColWidth(['No.', '조회 기간', '총 출석 인원', '총 헌금 합계', '결산 총계'], 11.5, 15, 6);
        worksheet.getColumn(2).width = calcSpaciousColWidth([periodValueText, ...offeringNames], 11.5, 32, 8);
        worksheet.getColumn(3).width = calcSpaciousColWidth(['총 예배 건수', '온라인 입금 총액', '참여 인원 (명)', formatCurrency(footTotalCount)], 11, 21, 6);
        worksheet.getColumn(4).width = calcSpaciousColWidth(['결산 금액 (원)', ...amountTexts], 12.5, 24, 7);

        worksheet.mergeCells('B5:D5');
        worksheet.mergeCells(`A${footRow.number}:B${footRow.number}`);

        [meta1, meta2].forEach(row => {
            for (let col = 1; col <= 4; col++) {
                const cell = row.getCell(col);
                cell.border = thinBorder;
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                if (col === 1 || col === 3) {
                    cell.fill = labelFill;
                    cell.font = labelFont;
                } else {
                    cell.fill = valFill;
                    cell.font = valFont;
                }
            }
        });
        meta1.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
        meta1.getCell(4).numFmt = numberFormat;
        meta1.getCell(4).alignment = { vertical: 'middle', horizontal: 'right' };
        meta2.getCell(2).numFmt = numberFormat;
        meta2.getCell(2).alignment = { vertical: 'middle', horizontal: 'right' };
        meta2.getCell(4).numFmt = numberFormat;
        meta2.getCell(4).alignment = { vertical: 'middle', horizontal: 'right' };

        const meta3Label = meta3.getCell(1);
        meta3Label.fill = highlightLabelFill;
        meta3Label.font = highlightLabelFont;
        meta3Label.border = thinBorder;
        meta3Label.alignment = { vertical: 'middle', horizontal: 'center' };

        const meta3Value = meta3.getCell(2);
        meta3Value.fill = highlightValFill;
        meta3Value.font = highlightValFont;
        meta3Value.border = thinBorder;
        meta3Value.numFmt = numberFormat;
        meta3Value.alignment = { vertical: 'middle', horizontal: 'right' };

        for (let col = 3; col <= 4; col++) {
            const cCell = meta3.getCell(col);
            cCell.border = thinBorder;
            cCell.fill = highlightValFill;
        }

        headRow.eachCell(cell => {
            cell.font = { name: '맑은 고딕', size: 11, bold: true, color: { argb: 'FF1E293B' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'medium', color: strongBorderColor },
                left: { style: 'thin', color: borderColor },
                bottom: { style: 'medium', color: strongBorderColor },
                right: { style: 'thin', color: borderColor }
            };
        });

        for (let rowNo = headRow.number + 1; rowNo < footRow.number; rowNo++) {
            const row = worksheet.getRow(rowNo);
            const isEven = (rowNo - headRow.number) % 2 === 0;
            row.eachCell((cell, colNum) => {
                cell.font = { name: '맑은 고딕', size: 11, color: { argb: 'FF1E293B' } };
                if (isEven) cell.fill = zebraFill;
                cell.border = thinBorder;
                cell.alignment = {
                    vertical: 'middle',
                    horizontal: colNum >= 3 ? 'right' : 'center'
                };
                if (colNum >= 3) cell.numFmt = numberFormat;
            });
        }

        const footBorder = {
            top: { style: 'medium', color: strongBorderColor },
            left: { style: 'thin', color: borderColor },
            bottom: { style: 'medium', color: strongBorderColor },
            right: { style: 'thin', color: borderColor }
        };

        const footLabel = footRow.getCell(1);
        footLabel.font = highlightLabelFont;
        footLabel.fill = highlightLabelFill;
        footLabel.border = footBorder;
        footLabel.alignment = { vertical: 'middle', horizontal: 'center' };

        const footHidden = footRow.getCell(2);
        footHidden.fill = highlightLabelFill;
        footHidden.border = footBorder;

        [3, 4].forEach(colNum => {
            const cell = footRow.getCell(colNum);
            cell.font = { name: '맑은 고딕', size: 11.5, bold: true, color: { argb: 'FF0F172A' } };
            cell.fill = highlightLabelFill;
            cell.border = footBorder;
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            cell.numFmt = numberFormat;
        });

        if (periodMode === 'year') {
            const monthlySheet = workbook.addWorksheet('월별_구역별_연간내역');
            monthlySheet.addRow([`${churchName} ${yearVal}년도 월별 추이`]).getCell(1).font = { name: '맑은 고딕', size: 14, bold: true };
            monthlySheet.addRow([]);
            const mHead = monthlySheet.addRow(['월', '예배 건수', '출석 인원', '현금 (원)', '온라인 (원)', '월 합계 (원)']);
            mHead.eachCell(c => { c.font = labelFont; c.fill = labelFill; c.border = thinBorder; c.alignment = { horizontal: 'center', vertical: 'middle' }; });

            document.querySelectorAll('#annualMonthlyBody tr').forEach(tr => {
                const vals = Array.from(tr.cells).map((td, idx) => idx === 0 ? td.innerText.trim() : getSafeNumFromText(td.innerText));
                const r = monthlySheet.addRow(vals);
                r.eachCell((c, colNo) => {
                    c.border = thinBorder;
                    if (colNo > 1) { c.numFmt = numberFormat; c.alignment = { horizontal: 'right', vertical: 'middle' }; }
                    else { c.alignment = { horizontal: 'center', vertical: 'middle' }; }
                });
            });

            monthlySheet.addRow([]);
            monthlySheet.addRow([`${churchName} ${yearVal}년도 구역별 합계`]).getCell(1).font = { name: '맑은 고딕', size: 14, bold: true };
            const gHead = monthlySheet.addRow(['구역', '참여 성도수', '헌금 건수', '연간 합계 (원)']);
            gHead.eachCell(c => { c.font = labelFont; c.fill = labelFill; c.border = thinBorder; c.alignment = { horizontal: 'center', vertical: 'middle' }; });

            document.querySelectorAll('#annualGroupBody tr').forEach(tr => {
                if (tr.cells.length === 4) {
                    const vals = [
                        tr.cells[0].innerText.trim(),
                        getSafeNumFromText(tr.cells[1].innerText),
                        getSafeNumFromText(tr.cells[2].innerText),
                        getSafeNumFromText(tr.cells[3].innerText)
                    ];
                    const r = monthlySheet.addRow(vals);
                    r.eachCell((c, colNo) => {
                        c.border = thinBorder;
                        if (colNo > 1) { c.numFmt = numberFormat; c.alignment = { horizontal: 'right', vertical: 'middle' }; }
                        else { c.alignment = { horizontal: 'center', vertical: 'middle' }; }
                    });
                }
            });
            monthlySheet.columns.forEach(col => { col.width = 18; });
        }

        const safeWeekFilePart = weekVal === 'all' ? '전체' : `${weekVal}주차`;
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const fileName = periodMode === 'year'
            ? `${churchName}_연간결산_${yearVal}년.xlsx`
            : `${churchName}_결산_${m}_${safeWeekFilePart}.xlsx`;
        saveAs(blob, fileName);
        closeMessage();
    } catch (error) {
        console.error('결산 엑셀 생성 오류:', error);
        showMsg('오류', '엑셀 다운로드 중 문제가 발생했습니다. 개발자 콘솔에서 상세 오류를 확인하세요.');
    }
}

function updateReceiptPurposeDisplay() {
    const purposeInput = document.getElementById('receiptPurpose');
    const displayEl = document.getElementById('receiptPurposeDisplay');
    if (purposeInput && displayEl) {
        const val = purposeInput.value.trim();
        displayEl.innerText = val || '연말정산용(세무서제출)';
    }
}

function collectMemberAnnualRecords(year, name) {
    const records = [];
    const byOffering = {};
    offeringTypes.forEach(ot => {
        byOffering[ot.id] = { name: ot.name, amount: 0, count: 0 };
    });
    let total = 0;

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const match = key.match(/^church_offering_(\d{4}-\d{2}-\d{2})_(.*)$/);
        if (match && match[1].startsWith(String(year))) {
            try {
                const parsed = JSON.parse(localStorage.getItem(key));
                const worshipName = parsed.worshipType || match[2];
                const m = parsed.members?.find(x => (x.name || '').trim() === name);
                if (m) {
                    offeringTypes.forEach(ot => {
                        const amt = parseInt(m[ot.id], 10) || 0;
                        if (amt > 0) {
                            const weekday = typeof getKoreanWeekday === 'function' ? getKoreanWeekday(match[1]) : '';
                            const isItemOnline = (m.onlineByType && typeof m.onlineByType[ot.id] === 'boolean')
                                ? m.onlineByType[ot.id]
                                : Boolean(m.isOnline);
                            records.push({
                                dateStr: match[1],
                                weekday,
                                worshipType: worshipName,
                                offeringName: ot.name,
                                method: isItemOnline ? '온라인' : '현금',
                                amount: amt,
                                memo: m.memo || ''
                            });
                            byOffering[ot.id].amount += amt;
                            byOffering[ot.id].count += 1;
                            total += amt;
                        }
                    });
                }
            } catch (e) {}
        }
    }

    records.sort((a, b) => {
        if (a.dateStr !== b.dateStr) return a.dateStr.localeCompare(b.dateStr);
        return a.worshipType.localeCompare(b.worshipType);
    });

    const summaryByOffering = offeringTypes
        .map(ot => byOffering[ot.id])
        .filter(item => item.amount > 0);

    return { records, summaryByOffering, total };
}

function searchMemberHistory() {
    const year = document.getElementById('searchYear').value;
    const name = document.getElementById('searchName').value.trim();
    if (!year || !name) return showMsg('오류', '귀속 연도와 성도 이름을 입력해주세요.');

    const { records, summaryByOffering, total } = collectMemberAnnualRecords(year, name);
    if (!records.length) return showMsg('결과 없음', `${year}년 '${name}' 성도의 헌금 내역이 없습니다.`);

    const regMember = globalMembers.find(gm => (gm.name || '').trim() === name);
    const roleText = (regMember && regMember.role && regMember.role.trim()) ? regMember.role.trim() : '성도';
    const churchName = getChurchName();
    const todayFormatted = typeof getLocalDateString === 'function'
        ? getLocalDateString().replace(/-/g, '년 ').replace(/년 (\d{2})년 /, '년 $1월 ') + '일'
        : new Date().toLocaleDateString('ko-KR');

    updateReceiptPurposeDisplay();
    document.getElementById('receiptUserName').innerText = name;
    document.getElementById('receiptUserRole').innerText = roleText;
    document.getElementById('receiptTargetYear').innerText = year;
    document.getElementById('receiptChurchName').innerText = churchName;
    document.getElementById('receiptSignChurchName').innerText = churchName;
    document.getElementById('receiptTotalAmount').innerText = formatCurrency(total);
    document.getElementById('receiptIssuedDate').innerText = todayFormatted;

    const tbody = document.getElementById('receiptTableBody');
    tbody.innerHTML = '';
    summaryByOffering.forEach((item, idx) => {
        const label = idx === 0 ? '헌금 내역' : '';
        tbody.innerHTML += `
            <tr>
                <td class="py-2 px-3 border-r border-black text-center font-bold bg-slate-50">${label}</td>
                <td class="py-2 px-4 border-r border-black text-center font-bold">${item.name}</td>
                <td class="py-2 px-4 border-r border-black text-right font-semibold">${formatCurrency(item.amount)}</td>
                <td class="py-2 px-4 text-center text-xs"></td>
            </tr>
        `;
    });

    document.getElementById('receiptPrintArea').classList.remove('hidden');
    document.getElementById('receiptActionButtons').classList.remove('hidden');
}

async function exportMemberAnnualDetailToExcel() {
    const year = document.getElementById('searchYear').value;
    const name = document.getElementById('searchName').value.trim();
    const churchName = getChurchName();
    if (!year || !name) return showMsg('오류', '귀속 연도와 성도 이름을 입력해주세요.');

    const { records, total } = collectMemberAnnualRecords(year, name);
    if (!records.length) return showMsg('결과 없음', `${year}년 '${name}' 성도의 헌금 내역이 없습니다.`);

    showMsg('다운로드 중', `${year}년도 ${name} 성도의 예배별 헌금 내역 엑셀을 생성하고 있습니다...`);

    try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = churchName;
        workbook.subject = `${year}년 ${name} 예배별 헌금 내역`;
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('예배별헌금내역');
        worksheet.pageSetup = {
            paperSize: 9,
            orientation: 'portrait',
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 }
        };

        const thinBorder = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
        const numberFormat = '#,##0';

        const titleRow = worksheet.addRow([`${churchName} ${year}년도 ${name} 성도 헌금 내역`, '', '', '', '', '']);
        titleRow.height = 38;
        worksheet.mergeCells('A1:F1');
        const titleCell = titleRow.getCell(1);
        titleCell.font = { name: '맑은 고딕', size: 16, bold: true };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

        const subRow = worksheet.addRow([`성명: ${name}`, `귀속 연도: ${year}년`, `총 헌금 횟수: ${records.length}건`, `총 헌금액: ${formatCurrency(total)}원`, '', '']);
        subRow.height = 24;
        worksheet.mergeCells('D2:F2');
        subRow.eachCell(cell => {
            cell.font = { name: '맑은 고딕', size: 10.5, bold: true };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        const spacer = worksheet.addRow(['', '', '', '', '', '']);
        spacer.height = 8;

        const headRow = worksheet.addRow(['날짜', '요일', '예배 구분', '헌금 종류', '구분', '금액 (원)']);
        headRow.height = 24;
        headRow.eachCell(cell => {
            cell.font = { name: '맑은 고딕', size: 11, bold: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = thinBorder;
        });

        records.forEach(rec => {
            const r = worksheet.addRow([
                rec.dateStr,
                rec.weekday,
                rec.worshipType,
                rec.offeringName,
                rec.method,
                rec.amount
            ]);
            r.height = 21;
            r.eachCell((cell, colNum) => {
                cell.font = { name: '맑은 고딕', size: 10.5, bold: colNum === 3 || colNum === 5 };
                cell.border = thinBorder;
                if (colNum === 6) {
                    cell.alignment = { vertical: 'middle', horizontal: 'right' };
                    cell.numFmt = numberFormat;
                } else {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                }
            });
        });

        const totalRow = worksheet.addRow(['합계', '', '', '', '', total]);
        totalRow.height = 26;
        worksheet.mergeCells(`A${totalRow.number}:E${totalRow.number}`);
        for (let c = 1; c <= 6; c++) {
            const cell = totalRow.getCell(c);
            cell.font = { name: '맑은 고딕', size: 11, bold: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF08A' } };
            cell.border = thinBorder;
        }
        totalRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
        totalRow.getCell(6).alignment = { vertical: 'middle', horizontal: 'right' };
        totalRow.getCell(6).numFmt = numberFormat;

        worksheet.getColumn(1).width = 14;
        worksheet.getColumn(2).width = 8;
        worksheet.getColumn(3).width = 20;
        worksheet.getColumn(4).width = 16;
        worksheet.getColumn(5).width = 12;
        worksheet.getColumn(6).width = 18;

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        saveAs(blob, `${churchName}_1년헌금내역_${name}_${year}.xlsx`);
        closeMessage();
    } catch (error) {
        console.error('예배별 헌금 내역 엑셀 생성 오류:', error);
        showMsg('오류', '1년 예배별 헌금 내역 엑셀 다운로드 중 문제가 발생했습니다.');
    }
}

async function exportReceiptToExcel() {
    const year = document.getElementById('searchYear').value;
    const name = document.getElementById('searchName').value.trim();
    const churchName = getChurchName();
    if (!year || !name || document.getElementById('receiptPrintArea').classList.contains('hidden')) {
        return showMsg('오류', '확인증 조회 먼저 진행하세요.');
    }

    const { summaryByOffering, total } = collectMemberAnnualRecords(year, name);
    const regMember = globalMembers.find(gm => (gm.name || '').trim() === name);
    const roleText = (regMember && regMember.role && regMember.role.trim()) ? regMember.role.trim() : '성도';
    const purposeText = document.getElementById('receiptPurpose')?.value.trim() || '연말정산용(세무서제출)';
    const todayFormatted = typeof getLocalDateString === 'function'
        ? getLocalDateString().replace(/-/g, '년 ').replace(/년 (\d{2})년 /, '년 $1월 ') + '일'
        : new Date().toLocaleDateString('ko-KR');

    showMsg('다운로드 중', '헌금 기부 확인증 엑셀 파일을 생성하고 있습니다...');

    try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = churchName;
        workbook.subject = '헌금 기부 확인증';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('헌금 기부 확인증');
        worksheet.pageSetup = {
            paperSize: 9,
            orientation: 'portrait',
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 1,
            margins: { left: 0.6, right: 0.6, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 }
        };

        const thin = { style: 'thin', color: { argb: 'FF000000' } };
        const med = { style: 'medium', color: { argb: 'FF000000' } };
        const numberFormat = '#,##0';

        const titleRow = worksheet.addRow(['헌금 기부 확인증', '', '', '']);
        titleRow.height = 44;
        worksheet.mergeCells('A1:D1');
        const titleCell = titleRow.getCell(1);
        titleCell.font = { name: '맑은 고딕', size: 18, bold: true };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        for (let c = 1; c <= 4; c++) {
            titleRow.getCell(c).border = {
                top: med,
                bottom: med,
                left: c === 1 ? med : undefined,
                right: c === 4 ? med : undefined
            };
        }

        const row2 = worksheet.addRow(['성 명', name, '직 분', roleText]);
        row2.height = 25;
        for (let c = 1; c <= 4; c++) {
            const cell = row2.getCell(c);
            cell.font = { name: '맑은 고딕', size: 10.5, bold: c === 1 || c === 3 };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: thin,
                bottom: thin,
                left: c === 1 ? med : thin,
                right: c === 4 ? med : thin
            };
            if (c === 1 || c === 3) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
            }
        }

        const row3 = worksheet.addRow(['기부교회', churchName, '', '']);
        row3.height = 25;
        worksheet.mergeCells(`B${row3.number}:D${row3.number}`);
        row3.getCell(1).font = { name: '맑은 고딕', size: 10.5, bold: true };
        row3.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
        row3.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        row3.getCell(2).font = { name: '맑은 고딕', size: 10.5, bold: true };
        row3.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
        for (let c = 1; c <= 4; c++) {
            row3.getCell(c).border = {
                top: thin,
                bottom: med,
                left: c === 1 ? med : (c === 2 ? thin : undefined),
                right: c === 4 ? med : (c === 1 ? thin : undefined)
            };
        }

        const headRow = worksheet.addRow(['구 분', '헌금 종류', '금 액', '비 고']);
        headRow.height = 25;
        for (let c = 1; c <= 4; c++) {
            const cell = headRow.getCell(c);
            cell.font = { name: '맑은 고딕', size: 10.5, bold: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
            cell.alignment = { vertical: 'middle', horizontal: c === 3 ? 'right' : 'center' };
            cell.border = {
                top: med,
                bottom: thin,
                left: c === 1 ? med : thin,
                right: c === 4 ? med : thin
            };
        }

        const firstItemRowNum = headRow.number + 1;
        summaryByOffering.forEach((item, idx) => {
            const r = worksheet.addRow([idx === 0 ? '헌금 내역' : '', item.name, item.amount, '']);
            r.height = 23;
            for (let c = 1; c <= 4; c++) {
                const cell = r.getCell(c);
                cell.font = { name: '맑은 고딕', size: 10.5, bold: c === 1 || c === 2 };
                cell.border = {
                    top: thin,
                    bottom: thin,
                    left: c === 1 ? med : thin,
                    right: c === 4 ? med : thin
                };
                if (c === 1) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                } else if (c === 3) {
                    cell.alignment = { vertical: 'middle', horizontal: 'right' };
                    cell.numFmt = numberFormat;
                } else {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                }
            }
        });
        const lastItemRowNum = worksheet.lastRow.number;
        if (lastItemRowNum > firstItemRowNum) {
            worksheet.mergeCells(`A${firstItemRowNum}:A${lastItemRowNum}`);
            for (let rNo = firstItemRowNum; rNo <= lastItemRowNum; rNo++) {
                worksheet.getRow(rNo).getCell(1).border = {
                    top: rNo === firstItemRowNum ? thin : undefined,
                    bottom: rNo === lastItemRowNum ? thin : undefined,
                    left: med,
                    right: thin
                };
            }
        }

        const totalRow = worksheet.addRow(['합 계', '', total, '단위 : 원']);
        totalRow.height = 27;
        worksheet.mergeCells(`A${totalRow.number}:B${totalRow.number}`);
        for (let c = 1; c <= 4; c++) {
            const cell = totalRow.getCell(c);
            cell.font = { name: '맑은 고딕', size: 11, bold: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
            cell.border = {
                top: med,
                bottom: med,
                left: c === 1 ? med : (c === 2 ? undefined : thin),
                right: c === 4 ? med : (c === 1 ? undefined : thin)
            };
        }
        totalRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
        totalRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'right' };
        totalRow.getCell(3).numFmt = numberFormat;
        totalRow.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };

        const noticeRow1 = worksheet.addRow(['상기와 같이 종교의 보급 및 교화비조로 헌금하였음을 소득세법', '', '', '']);
        noticeRow1.height = 24;
        worksheet.mergeCells(`A${noticeRow1.number}:D${noticeRow1.number}`);
        noticeRow1.getCell(1).font = { name: '맑은 고딕', size: 10 };
        noticeRow1.getCell(1).alignment = { vertical: 'bottom', horizontal: 'center' };

        const noticeRow2 = worksheet.addRow(['제 68조 3항, 동법 제47조 규정에 의거 증명하여 주시기 바랍니다.', '', '', '']);
        noticeRow2.height = 22;
        worksheet.mergeCells(`A${noticeRow2.number}:D${noticeRow2.number}`);
        noticeRow2.getCell(1).font = { name: '맑은 고딕', size: 10 };
        noticeRow2.getCell(1).alignment = { vertical: 'top', horizontal: 'center' };

        const purposeRow = worksheet.addRow([`용도 : ${purposeText} (${year}년 귀속)`, '', '', '']);
        purposeRow.height = 26;
        worksheet.mergeCells(`A${purposeRow.number}:D${purposeRow.number}`);
        purposeRow.getCell(1).font = { name: '맑은 고딕', size: 10.5, bold: true };
        purposeRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

        for (let rNo = noticeRow1.number; rNo <= purposeRow.number; rNo++) {
            const rowObj = worksheet.getRow(rNo);
            for (let c = 1; c <= 4; c++) {
                rowObj.getCell(c).border = {
                    top: rNo === noticeRow1.number ? med : undefined,
                    left: c === 1 ? med : undefined,
                    right: c === 4 ? med : undefined,
                    bottom: rNo === purposeRow.number ? med : undefined
                };
            }
        }

        const spacerAfterBox = worksheet.addRow(['', '', '', '']);
        spacerAfterBox.height = 16;

        const proveRow = worksheet.addRow(['위의 사실을 증명합니다.', '', '', '']);
        proveRow.height = 24;
        worksheet.mergeCells(`A${proveRow.number}:D${proveRow.number}`);
        proveRow.getCell(1).font = { name: '맑은 고딕', size: 11, bold: true };
        proveRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

        const signRow = worksheet.addRow([`${churchName} 담임목사   (직인)`, '', '', '']);
        signRow.height = 30;
        worksheet.mergeCells(`A${signRow.number}:D${signRow.number}`);
        signRow.getCell(1).font = { name: '맑은 고딕', size: 14, bold: true };
        signRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

        const issueDateRow = worksheet.addRow(['', '', todayFormatted, '']);
        issueDateRow.height = 22;
        worksheet.mergeCells(`C${issueDateRow.number}:D${issueDateRow.number}`);
        issueDateRow.getCell(3).font = { name: '맑은 고딕', size: 10.5, bold: true };
        issueDateRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'right' };

        worksheet.getColumn(1).width = 16;
        worksheet.getColumn(2).width = 24;
        worksheet.getColumn(3).width = 18;
        worksheet.getColumn(4).width = 18;

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        saveAs(blob, `${churchName}_헌금기부확인증_${name}_${year}.xlsx`);
        closeMessage();
    } catch (error) {
        console.error('헌금 기부 확인증 엑셀 생성 오류:', error);
        showMsg('오류', '헌금 기부 확인증 엑셀 다운로드 중 문제가 발생했습니다.');
    }
}