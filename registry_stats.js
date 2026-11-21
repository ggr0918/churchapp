// registry_stats.js
// ==========================================
// 명부 관리 (Registry) 로직
// ==========================================
function loadRegistry() { try { globalMembers = JSON.parse(localStorage.getItem('church_global_members')) || []; } catch(e) { globalMembers = []; } renderRegistry(); }

function renderRegistry() {
    const tbody = document.getElementById('registryRows'); tbody.innerHTML = '';
    if (globalMembers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-slate-400">명부가 없습니다. 추가해주세요.</td></tr>';
    } else {
        globalMembers.forEach((m, idx) => appendRegistryRowDOM(m.name, m.gender, m.role, idx));
    }
    if(document.getElementById('regSelectAll')) document.getElementById('regSelectAll').checked = false;
}

function saveRegistry(silent = false) {
    const rows = document.querySelectorAll('.registry-row'); const newData = [];
    rows.forEach(row => { 
        const name = row.querySelector('.reg-name').value.trim(); 
        if (name) newData.push({ name, gender: row.querySelector('.reg-gender').value, role: row.querySelector('.reg-role').value.trim() }); 
    });
    globalMembers = newData; 
    localStorage.setItem('church_global_members', JSON.stringify(globalMembers)); 
    if (!silent) {
        showMsg('명부 저장 완료', '저장되었습니다.'); 
        renderRegistry();
    }
}

function registerNewMember() {
    const name = document.getElementById('newRegName').value.trim(); if (!name) return showMsg('입력 오류', '이름을 입력해주세요.');
    const newData = []; document.querySelectorAll('.registry-row').forEach(row => {
        const rName = row.querySelector('.reg-name').value.trim(); if (rName) newData.push({ name: rName, gender: row.querySelector('.reg-gender').value, role: row.querySelector('.reg-role').value.trim() });
    });
    newData.push({ name, gender: document.getElementById('newRegGender').value, role: document.getElementById('newRegRole').value.trim() });
    globalMembers = newData; localStorage.setItem('church_global_members', JSON.stringify(globalMembers));
    document.getElementById('newRegName').value = ''; document.getElementById('newRegGender').value = '남'; document.getElementById('newRegRole').value = '';
    renderRegistry(); document.getElementById('newRegName').focus(); 
}

function appendRegistryRowDOM(name, gender, role, idx) {
    const tbody = document.getElementById('registryRows'); if (tbody.querySelector('.text-slate-400')) tbody.innerHTML = '';
    const tr = document.createElement('tr'); tr.className = 'registry-row hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-200 dark:border-slate-700 print:border-black transition-colors';
    
    tr.innerHTML = `
        <td class="py-1 px-2 text-center no-print">
            <input type="checkbox" class="check-ui reg-row-check">
        </td>
        <td class="py-1 px-4 text-center text-slate-500 dark:text-slate-400 print:border print:border-black">${idx + 1}</td>
        <td class="py-1 px-4 print:border print:border-black"><input type="text" class="reg-name w-full border dark:border-slate-600 bg-transparent rounded px-2 py-1 outline-none focus:border-indigo-500 print:border-none print:text-center print:text-black" value="${name}"></td>
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
    const toDelete = [];
    
    checkboxes.forEach((cb, idx) => {
        if (cb.checked) toDelete.push(idx);
    });
    
    if (toDelete.length === 0) return showMsg('알림', '삭제할 성도를 선택해주세요.');
    if (!confirm(`선택한 ${toDelete.length}명의 성도를 명부에서 삭제하시겠습니까?`)) return;
    
    globalMembers = globalMembers.filter((_, idx) => !toDelete.includes(idx));
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

                if (rowIndex === 0 && (colA.includes('이름') || colA.includes('성명') || colA === 'A' || colA.includes('순번') || colA.includes('이 름'))) return;

                let nameVal = colA;
                let genderVal = colB;
                let roleVal = colC;

                if (!isNaN(parseInt(colA)) && colB !== '') {
                    nameVal = colB;
                    genderVal = colC;
                    roleVal = String(row[3] || '').trim();
                }

                if (nameVal && nameVal !== '') {
                    let finalGender = '';
                    if (genderVal.includes('남')) finalGender = '남';
                    else if (genderVal.includes('여')) finalGender = '여';

                    let finalRole = roleVal;
                    if (!finalRole || finalRole === '') finalRole = '성도';

                    globalMembers.push({ name: nameVal, gender: finalGender, role: finalRole }); 
                    count++; 
                }
            });
            
            localStorage.setItem('church_global_members', JSON.stringify(globalMembers));
            renderRegistry(); 
            event.target.value = ''; 
            showMsg('완료', `${count}명의 성도가 추가되었습니다.\n반드시 [명부 저장하기]를 눌러 확정해 주세요.`);
        } catch (error) { 
            console.error(error);
            showMsg('실패', '엑셀 파일을 읽을 수 없습니다.\nA열: 이름, B열: 성별, C열: 직분 형식인지 확인해 주세요.'); 
        }
    }; 
    reader.readAsArrayBuffer(file);
}

async function downloadRegistryTemplate() {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('성도명부업로드양식');

        worksheet.addRow(['성명', '성별', '직분']);
        worksheet.addRow(['홍길동', '남', '안수집사']);
        worksheet.addRow(['김영희', '여', '권사']);
        worksheet.addRow(['이아무개', '', '성도']);

        const headRow = worksheet.getRow(1);
        headRow.font = { bold: true, name: '맑은 고딕', size: 11 };
        headRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
        headRow.alignment = { vertical: 'middle', horizontal: 'center' };
        
        worksheet.getColumn(1).width = 15;
        worksheet.getColumn(2).width = 12;
        worksheet.getColumn(3).width = 15;

        [2, 3, 4].forEach(rowNum => {
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
// 전체 데이터 백업 및 복원 (PC 이동용)
// ==========================================
function exportAllData() {
    const allData = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('church_')) {
            allData[key] = localStorage.getItem(key);
        }
    }
    if (Object.keys(allData).length === 0) return showMsg('오류', '백업할 데이터가 없습니다.');
    
    const churchName = getChurchName();
    const todayStr = typeof getLocalDateString === 'function' ? getLocalDateString() : new Date().toISOString().split('T')[0];
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
    saveAs(blob, `${churchName}_전체데이터백업_${todayStr}.json`);
    showMsg('백업 완료', '성도 명부, 전체 헌금 기록, 예배 구분, 헌금 목록, 교회 설정이 파일로 다운로드되었습니다.\n새 PC의 [⚙️ 설정 → 백업 / 복원]에서 이 파일을 선택하면 모든 데이터가 그대로 복원됩니다.');
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
                if (key.startsWith('church_')) {
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

// ==========================================
// 통계 및 영수증 로직
// ==========================================
function getWeekDateRangeText(monthStr, weekNum) {
    if (!monthStr) return '';
    const [yStr, mStr] = monthStr.split('-');
    const year = Number.parseInt(yStr, 10);
    const month = Number.parseInt(mStr, 10);
    if (!Number.isFinite(year) || !Number.isFinite(month)) return '';

    const monthNum = month;
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const firstDow = firstDayOfMonth.getDay();

    const datesInWeek = [];
    for (let day = 1; day <= lastDayOfMonth; day++) {
        const w = Math.floor((day - 1 + firstDow) / 7) + 1;
        if (w === Number(weekNum)) {
            datesInWeek.push(day);
        }
    }
    if (datesInWeek.length === 0) return `${weekNum}주차`;
    const startDay = datesInWeek[0];
    const endDay = datesInWeek[datesInWeek.length - 1];
    return `${weekNum}주차(${monthNum}월${startDay}일~${endDay}일)`;
}

function syncStatWeekDropdownRanges(monthStr) {
    const weekSelect = document.getElementById('statWeek');
    if (!weekSelect || !monthStr) return;

    Array.from(weekSelect.options).forEach(opt => {
        if (opt.value === 'all') {
            opt.textContent = '전체 합계';
        } else {
            const wNum = Number.parseInt(opt.value, 10);
            opt.textContent = getWeekDateRangeText(monthStr, wNum);
        }
    });
}

function renderStats() {
    const monthStr = document.getElementById('statMonth').value;
    const weekFilter = document.getElementById('statWeek').value;
    if (!monthStr) return;

    syncStatWeekDropdownRanges(monthStr);

    let totalSum = 0, daysCount = 0, attendCount = 0, onlineSum = 0;
    let typeStats = {}; offeringTypes.forEach(ot => typeStats[ot.id] = { count: 0, sum: 0 });
    let worshipSessions = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i); const match = key.match(/^church_offering_(\d{4}-\d{2}-\d{2})_(.*)$/);
        if (match) {
            const dateStr = match[1];
            const wType = match[2];
            if (dateStr.startsWith(monthStr)) {
                const parts = dateStr.split('-').map(Number);
                const d = new Date(parts[0], parts[1] - 1, parts[2]);
                const wNum = Math.floor((d.getDate() - 1 + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7) + 1;
                if (weekFilter !== 'all' && wNum.toString() !== weekFilter) continue;

                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.members) {
                        let dayHasData = false;
                        let sessionAttend = 0;
                        let sessionSum = 0;

                        data.members.forEach(m => {
                            if (m.isFace || m.isNonFace) attendCount++;
                            if (m.isFace || m.isNonFace || m.isMale || m.isFemale) {
                                dayHasData = true;
                                sessionAttend++;
                            }
                            
                            let mRowSum = 0;
                            offeringTypes.forEach(ot => { 
                                const amt = parseInt(m[ot.id]) || 0; 
                                if (amt > 0) { 
                                    typeStats[ot.id].count++; typeStats[ot.id].sum += amt; totalSum += amt; mRowSum += amt; sessionSum += amt;
                                    dayHasData = true; 
                                } 
                            });
                            if (m.isOnline) onlineSum += mRowSum;
                        });
                        
                        if (dayHasData) {
                            daysCount++;
                            worshipSessions.push({ dateStr, wNum, wType, sessionAttend, sessionSum });
                        }
                    }
                } catch(e) {}
            }
        }
    }

    const churchName = getChurchName();
    const weekText = weekFilter === 'all' ? '전체' : getWeekDateRangeText(monthStr, Number.parseInt(weekFilter, 10));
    const periodLabel = `${monthStr} ${weekText}`;
    document.getElementById('printStatDateTitle').innerText = `${churchName} 주간/월간 결산 보고서 (기준: ${periodLabel})`;
    if (document.getElementById('printStatWorshipTitle')) {
        document.getElementById('printStatWorshipTitle').innerText = `${churchName} 주간/월간 결산 보고서 - 예배 상세 내역 (기준: ${periodLabel})`;
    }

    document.getElementById('statTotalSum').innerText = formatCurrency(totalSum) + ' 원'; document.getElementById('statDaysCount').innerText = daysCount + ' 건';
    if (document.getElementById('statAttendCount')) document.getElementById('statAttendCount').innerText = formatCurrency(attendCount) + ' 명';
    if (document.getElementById('statOnlineSum')) document.getElementById('statOnlineSum').innerText = formatCurrency(onlineSum) + ' 원';
    
    const tbody = document.getElementById('statRows'); tbody.innerHTML = ''; let totalCount = 0;
    offeringTypes.forEach(ot => {
        totalCount += typeStats[ot.id].count;
        tbody.innerHTML += `<tr class="border-b dark:border-slate-700 transition-colors"><td class="py-2 px-4 text-center print:border print:border-black">${ot.name}</td><td class="py-2 px-4 text-center print:border print:border-black">${formatCurrency(typeStats[ot.id].count)} 명</td><td class="py-2 px-4 text-right print:border print:border-black">${formatCurrency(typeStats[ot.id].sum)}</td></tr>`;
    });
    document.getElementById('statTotalCountFoot').innerText = formatCurrency(totalCount) + ' 명'; document.getElementById('statTotalSumFoot').innerText = formatCurrency(totalSum);

    const worshipListBody = document.getElementById('statWorshipListBody');
    if (worshipListBody) {
        worshipSessions.sort((a, b) => {
            if (a.dateStr !== b.dateStr) return b.dateStr.localeCompare(a.dateStr);
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

    if (statsChartInstance) statsChartInstance.destroy(); 
    statsChartInstance = new Chart(document.getElementById('statsChart'), { type: 'bar', data: { labels: offeringTypes.map(ot => ot.name), datasets: [{ label: '총액', data: offeringTypes.map(ot => typeStats[ot.id].sum), backgroundColor: '#4f46e5' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
}

// 글자 크기에 맞춰 셀 크기와 여백을 여유롭게 자동 조절하는 결산 보고서 엑셀 생성
async function exportStatsToExcel() {
    const monthEl = document.getElementById('statMonth');
    const weekEl = document.getElementById('statWeek');
    const m = monthEl ? monthEl.value : '';
    const weekVal = weekEl ? weekEl.value : 'all';
    const w = weekVal !== 'all' ? getWeekDateRangeText(m, Number.parseInt(weekVal, 10)) : '전체';
    const churchName = getChurchName();

    if (!m) return showMsg('오류', '조회할 연도와 월을 선택하세요.');

    showMsg('다운로드 중', '결산 보고서 엑셀 파일을 생성하고 있습니다...');

    try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = churchName;
        workbook.subject = '주간 / 월간 결산 보고서';
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

        const titleText = `${churchName} 주간 / 월간 결산 보고서`;
        const periodValueText = `${m} · ${w}`;

        // 1행: 상단 타이틀 배너
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

        // 요약 카드 영역 (3~5행)
        const metaRowHeight = calcSpaciousRowHeight(11, 1, 14);
        const meta1 = worksheet.addRow(['조회 기간', periodValueText, '총 예배 건수', daysNum]);
        const meta2 = worksheet.addRow(['총 출석 인원', attendNum, '온라인 입금 총액', onlineNum]);
        const meta3 = worksheet.addRow(['총 헌금 합계', totalSumNum, '', '']);
        meta1.height = metaRowHeight;
        meta2.height = metaRowHeight;
        meta3.height = calcSpaciousRowHeight(12.5, 1, 16);

        const spacer2 = worksheet.addRow(['', '', '', '']);
        spacer2.height = 12;

        // 본문 테이블 헤더
        const headTexts = ['No.', '헌금 종류', '참여 인원 (명)', '결산 금액 (원)'];
        const headRow = worksheet.addRow(headTexts);
        headRow.height = calcSpaciousRowHeight(11, 1, 14);

        const dataRows = document.querySelectorAll('#statRows tr');
        const offeringNames = [];
        const amountTexts = [formatCurrency(totalSumNum), formatCurrency(onlineNum), formatCurrency(daysNum), formatCurrency(attendNum)];
        let index = 1;

        dataRows.forEach(tr => {
            const typeName = tr.cells[0] ? tr.cells[0].innerText.trim() : '';
            const count = tr.cells[1] ? getSafeNumFromText(tr.cells[1].innerText) : 0;
            const amount = tr.cells[2] ? getSafeNumFromText(tr.cells[2].innerText) : 0;
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

        // 글자 크기 및 길이에 맞춰 열 너비 여유롭게 설정
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
                if (isEven) {
                    cell.fill = zebraFill;
                }
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

        const safeWeekFilePart = weekVal === 'all' ? '전체' : `${weekVal}주차`;
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const fileName = `${churchName}_결산_${m}_${safeWeekFilePart}.xlsx`;
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
                            records.push({
                                dateStr: match[1],
                                weekday,
                                worshipType: worshipName,
                                offeringName: ot.name,
                                method: m.isOnline ? '온라인' : '현금',
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