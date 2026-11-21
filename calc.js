// calc.js
// ==========================================
// 정산 입력 화면 (Calc) 구성 로직
// ==========================================
function initMemberTable() {
    const thead = document.getElementById('memberTableHead'); const tfoot = document.getElementById('memberTableFootRow');
    let ths = `<th class="py-2 px-1 border-r border-slate-300 dark:border-slate-600 w-10 text-center text-[12px] cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" onclick="sortTable('listNo')" title="기존 명부 번호순으로 복구">No.${getSortIcon('listNo')}</th>
        <th class="py-2 px-1 border-r border-slate-300 dark:border-slate-600 w-16 text-center text-[12px] cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" onclick="sortTable('name')">성명${getSortIcon('name')}</th>
        <th class="py-2 px-1 border-r border-slate-300 dark:border-slate-600 w-12 text-center text-[12px] cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" onclick="sortTable('isMale')">남자${getSortIcon('isMale')}</th>
        <th class="py-2 px-1 border-r border-slate-300 dark:border-slate-600 w-12 text-center text-[12px] cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" onclick="sortTable('isFemale')">여자${getSortIcon('isFemale')}</th>
        <th class="py-2 px-1 border-r border-slate-300 dark:border-slate-600 w-12 text-center text-[12px] cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" onclick="sortTable('isFace')">주일${getSortIcon('isFace')}</th>
        <th class="py-2 px-1 border-r border-slate-300 dark:border-slate-600 w-12 text-center text-[12px] cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" onclick="sortTable('isNonFace')">비대면${getSortIcon('isNonFace')}</th>`;
    
    let fts = `<td colspan="5" class="py-2 px-2 text-right border-r border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/50 text-[12px]">합계:</td><td id="memberTableTotalAttend" class="py-2 px-1 text-center bg-slate-100 dark:bg-slate-700/50 font-bold text-indigo-700 dark:text-indigo-400 text-[12px]">0명</td>`;

    offeringTypes.forEach(ot => {
        ths += `<th class="py-2 px-1 border-r border-slate-300 dark:border-slate-600 min-w-[70px] text-center text-[12px] font-bold cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" onclick="sortTable('${ot.id}')">${ot.name}${getSortIcon(ot.id)}</th>`;
        fts += `<td class="py-2 px-1 text-right border-r border-slate-300 dark:border-slate-600 font-bold text-indigo-700 dark:text-indigo-400 text-[12px]" id="footSum_${ot.id}"></td>`;
    });

    ths += `<th class="py-2 px-1 border-r border-slate-300 dark:border-slate-600 w-16 text-center text-[12px] cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" onclick="sortTable('total')">총액${getSortIcon('total')}</th>
        <th class="py-2 px-1 border-r border-slate-300 dark:border-slate-600 w-12 text-center text-[12px] cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 transition-colors" onclick="sortTable('isOnline')">온라인${getSortIcon('isOnline')}</th>
        <th class="py-2 px-1 border-r border-slate-300 dark:border-slate-600 w-20 text-center text-[12px] cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" onclick="sortTable('memo')">메모${getSortIcon('memo')}</th>
        <th class="py-2 px-1 border-r w-8 text-center text-[12px] no-print">삭제</th>`;
    fts += `<td class="py-2 px-1 text-right border-r border-slate-300 dark:border-slate-600 font-bold text-indigo-700 dark:text-indigo-400 text-[12px]" id="memberTableTotalSum">0</td><td colspan="3" class="py-2 px-1 text-[12px] bg-slate-100 dark:bg-slate-700/50 no-print"></td>`;

    thead.innerHTML = `<tr>${ths}</tr>`; tfoot.innerHTML = fts;
}

function initDate() {
    document.getElementById('calcDate').addEventListener('change', (e) => {
        if (!e.target.value || e.target.value === activeDateStr) return;
        saveToLocalStorage(); activeDateStr = e.target.value; currentPage = 1; loadFromLocalStorage(activeDateStr, activeWorshipType);
    });
    document.getElementById('worshipType').addEventListener('change', (e) => {
        if (!e.target.value || e.target.value === activeWorshipType) return;
        saveToLocalStorage(); activeWorshipType = e.target.value; currentPage = 1; loadFromLocalStorage(activeDateStr, activeWorshipType);
    });
}

function updateDateDisplay(dateStr, typeStr) {
    const d = new Date(dateStr); document.getElementById('currentDate').innerText = `${d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })} - ${typeStr}`;
}

// ★ 선택한 날짜에 저장된 기록이 있는 예배 옆에 ✅ 자동 표시
function updateWorshipTypeDropdownIndicators(dateStr) {
    const select = document.getElementById('worshipType');
    if (!select || !dateStr) return;
    Array.from(select.options).forEach(opt => {
        const baseVal = opt.value;
        const isDeleted = !worshipTypes.includes(baseVal);
        const hasRecord = !!localStorage.getItem(`church_offering_${dateStr}_${baseVal}`);
        const label = isDeleted ? `${baseVal} (삭제됨)` : baseVal;
        opt.textContent = hasRecord ? `${label} ✅` : label;
    });
}

function renderOfferingRows() {
    const tbody = document.getElementById('offeringRows'); tbody.innerHTML = '';
    offeringTypes.forEach(item => { tbody.innerHTML += `<tr class="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"><td class="py-2 px-4 text-center dark:text-slate-300">${item.name}</td><td class="py-2 px-4 text-center dark:text-slate-400" id="count_${item.id}">0 명</td><td class="py-2 px-4 text-right font-bold dark:text-slate-200" id="sub_${item.id}">0 원</td></tr>`; });
}

function sortTable(col) {
    if (sortCol === col) sortAsc = !sortAsc; else { sortCol = col; sortAsc = true; }
    memberOfferings.sort((a, b) => {
        let valA, valB;
        if (col === 'total') { valA = offeringTypes.reduce((sum, ot) => sum + (parseInt(a[ot.id])||0), 0); valB = offeringTypes.reduce((sum, ot) => sum + (parseInt(b[ot.id])||0), 0); }
        else if (col === 'listNo') { valA = a.listNo || 0; valB = b.listNo || 0; }
        else if (col === 'isMale') { valA = a.isMale?1:0; valB = b.isMale?1:0; }
        else if (col === 'isFemale') { valA = a.isFemale?1:0; valB = b.isFemale?1:0; }
        else if (col === 'isFace') { valA = a.isFace?1:0; valB = b.isFace?1:0; }
        else if (col === 'isNonFace') { valA = a.isNonFace?1:0; valB = b.isNonFace?1:0; }
        else if (col === 'isOnline') { valA = a.isOnline?1:0; valB = b.isOnline?1:0; }
        else { valA = a[col]; valB = b[col]; }
        if (offeringTypes.some(ot => ot.id === col) || col === 'total' || col === 'listNo') { valA = parseInt(valA)||0; valB = parseInt(valB)||0; }
        if (typeof valA === 'string') valA = valA.toLowerCase(); if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return sortAsc ? -1 : 1; if (valA > valB) return sortAsc ? 1 : -1; return 0;
    });
    initMemberTable(); renderMemberRows();
}

function addMemberRow(data = null) {
    let maxNo = memberOfferings.reduce((max, m) => Math.max(max, m.listNo || 0), 0);
    const item = data || { listNo: maxNo + 1, name: '', role: '', memo: '', isMale: false, isFemale: false, isFace: false, isNonFace: false, isOnline: false };
    memberOfferings.push(item);
    renderMemberRows(); calculateTotals();
}
function removeMemberRow(index) { backupCurrentState(); memberOfferings.splice(index, 1); renderMemberRows(); calculateTotals(); }
function changePageSize() { pageSize = document.getElementById('pageSize').value; currentPage = 1; renderMemberRows(); }
function prevPage() { if (currentPage > 1) { currentPage--; renderMemberRows(); } }
function nextPage() { const max = Math.ceil(getFilteredMembers().length / parseInt(pageSize))||1; if (currentPage < max) { currentPage++; renderMemberRows(); } }

function getFilteredMembers() {
    const fName = document.getElementById('searchMemberName') ? document.getElementById('searchMemberName').value.toLowerCase().trim() : '';
    const fGender = document.getElementById('filterGender') ? document.getElementById('filterGender').value : 'all';
    return memberOfferings.map((m, index) => ({...m, originalIndex: index})).filter(m => {
        if (fName && (!m.name || !m.name.toLowerCase().includes(fName))) return false;
        if (fGender === '남' && !m.isMale) return false;
        if (fGender === '여' && !m.isFemale) return false;
        return true;
    });
}

function renderMemberRows() {
    const tbody = document.getElementById('memberRows'); const notice = document.getElementById('emptyMemberNotice'); tbody.innerHTML = '';
    const filteredMembers = getFilteredMembers();
    
    if (memberOfferings.length === 0) { 
        notice.classList.remove('hidden'); 
        document.getElementById('memberTableFoot').style.display = 'none'; 
        document.getElementById('paginationControls').style.display = 'none'; 
        return; 
    }
    else { 
        notice.classList.add('hidden'); 
        document.getElementById('memberTableFoot').style.display = ''; 
    }

    let displayMembers = filteredMembers;
    if (pageSize !== 'all') {
        const size = parseInt(pageSize); const maxPage = Math.ceil(filteredMembers.length / size) || 1;
        if (currentPage > maxPage) currentPage = maxPage;
        displayMembers = filteredMembers.slice((currentPage - 1) * size, currentPage * size);
        document.getElementById('paginationControls').style.display = 'flex'; document.getElementById('pageInfo').innerText = `${currentPage} / ${maxPage}`;
    } else document.getElementById('paginationControls').style.display = 'none';

    displayMembers.forEach((m, idxOnPage) => {
        const index = m.originalIndex;
        let rowSum = 0; offeringTypes.forEach(ot => { rowSum += parseInt(m[ot.id]) || 0; });
        
        let tr = document.createElement('tr'); tr.className = 'hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-b border-slate-200 dark:border-slate-700';
        const inputClass = "w-full h-8 min-w-0 border border-transparent hover:border-slate-300 dark:hover:border-slate-600 px-1 py-1 text-[12px] font-bold text-slate-800 dark:text-slate-100 bg-transparent outline-none focus:bg-indigo-50 dark:focus:bg-indigo-900/50 focus:border-indigo-400 rounded transition-colors text-center";
        const numInputClass = inputClass.replace("text-center", "text-right");

        let tds = `
            <td class="py-1 px-1 text-center text-[12px] text-slate-500 dark:text-slate-400 font-bold cursor-pointer" title="클릭하면 번호순 자동정렬" onclick="sortTable('listNo')">${m.listNo || (index + 1)}</td>
            <td class="py-1 px-1"><input type="text" value="${m.name || ''}" placeholder="이름" class="${inputClass}" oninput="updateMemberData(${index}, 'name', this.value)"></td>
            <td class="py-1 px-1 text-center"><input type="checkbox" ${m.isMale ? 'checked' : ''} class="check-ui" onchange="updateMemberData(${index}, 'isMale', this.checked)"></td>
            <td class="py-1 px-1 text-center"><input type="checkbox" ${m.isFemale ? 'checked' : ''} class="check-ui" onchange="updateMemberData(${index}, 'isFemale', this.checked)"></td>
            <td class="py-1 px-1 text-center"><input type="checkbox" ${m.isFace ? 'checked' : ''} class="check-ui" onchange="updateMemberData(${index}, 'isFace', this.checked)"></td>
            <td class="py-1 px-1 text-center"><input type="checkbox" ${m.isNonFace ? 'checked' : ''} class="check-ui" onchange="updateMemberData(${index}, 'isNonFace', this.checked)"></td>
        `;
        offeringTypes.forEach(ot => { tds += `<td class="py-1 px-1"><input type="number" min="0" step="1000" value="${m[ot.id] || ''}" class="${numInputClass}" oninput="updateMemberData(${index}, '${ot.id}', this.value)"></td>`; });
        tds += `
            <td class="py-1 px-2 text-right font-extrabold text-indigo-700 dark:text-indigo-300 bg-slate-50 dark:bg-slate-800 text-[13px]" id="rowSum_${index}">${rowSum > 0 ? formatCurrency(rowSum) : ''}</td>
            <td class="py-1 px-1 bg-green-50/50 dark:bg-green-900/20 text-center"><input type="checkbox" ${m.isOnline ? 'checked' : ''} class="check-ui accent-green-600 dark:accent-green-500" onchange="updateMemberData(${index}, 'isOnline', this.checked)"></td>
            <td class="py-1 px-1"><input type="text" value="${m.memo || ''}" placeholder="비고" class="${inputClass.replace("font-bold","font-normal text-slate-500 dark:text-slate-400")}" oninput="updateMemberData(${index}, 'memo', this.value)"></td>
            <td class="py-1 px-1 text-center no-print"><button onclick="removeMemberRow(${index})" class="text-rose-400 hover:text-white hover:bg-rose-500 p-1.5 rounded transition-colors"><svg class="h-3.5 w-3.5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button></td>
        `;
        tr.innerHTML = tds; tbody.appendChild(tr);
    });
}
function clearFilters() { document.getElementById('searchMemberName').value = ''; document.getElementById('filterGender').value = 'all'; renderMemberRows(); }

function updateRowTotal(index) {
    let sum = 0; offeringTypes.forEach(ot => { sum += parseInt(memberOfferings[index][ot.id]) || 0; });
    if(document.getElementById(`rowSum_${index}`)) document.getElementById(`rowSum_${index}`).innerText = sum > 0 ? formatCurrency(sum) : '';
}

function updateMemberData(index, field, value) { 
    memberOfferings[index][field] = value; 
    
    // ★ 4개의 항목 중 1개만 선택 가능하도록 강제 (완벽한 상호 배제 로직)
    if (['isMale', 'isFemale', 'isFace', 'isNonFace'].includes(field) && value === true) {
        if (field !== 'isMale') memberOfferings[index].isMale = false;
        if (field !== 'isFemale') memberOfferings[index].isFemale = false;
        if (field !== 'isFace') memberOfferings[index].isFace = false;
        if (field !== 'isNonFace') memberOfferings[index].isNonFace = false;
    }

    updateRowTotal(index); calculateTotals(); 
    if (['isMale', 'isFemale', 'isFace', 'isNonFace', 'isOnline'].includes(field)) renderMemberRows(); 
}

function calculateTotals() {
    let faceTotal = 0, nonFaceTotal = 0, totalAttend = 0, mTotal = 0, fTotal = 0;
    let onlineSum = 0, cashSum = 0, grandTotalSum = 0;
    let typeStats = {}, colSums = {};
    offeringTypes.forEach(item => { typeStats[item.id] = { count: 0, sum: 0 }; colSums[item.id] = 0; });

    memberOfferings.forEach(m => {
        let rowSum = 0;
        
        if (m.isMale) mTotal++; 
        if (m.isFemale) fTotal++; 
        if (m.isFace) faceTotal++;
        if (m.isNonFace) nonFaceTotal++;

        offeringTypes.forEach(ot => {
            const amt = parseInt(m[ot.id]) || 0; colSums[ot.id] += amt; rowSum += amt;
            if (amt > 0) { typeStats[ot.id].count++; typeStats[ot.id].sum += amt; }
        });
        grandTotalSum += rowSum;
        if (m.isOnline) onlineSum += rowSum; else cashSum += rowSum;
    });

    totalAttend = mTotal + fTotal + faceTotal + nonFaceTotal;

    if(document.getElementById('memberTableTotalAttend')) document.getElementById('memberTableTotalAttend').innerText = totalAttend + '명';
    offeringTypes.forEach(ot => { if (document.getElementById(`footSum_${ot.id}`)) document.getElementById(`footSum_${ot.id}`).innerText = colSums[ot.id] > 0 ? formatCurrency(colSums[ot.id]) : ''; });
    if(document.getElementById('memberTableTotalSum')) document.getElementById('memberTableTotalSum').innerText = grandTotalSum > 0 ? formatCurrency(grandTotalSum) : '0';

    let totalItemCount = 0;
    offeringTypes.forEach(item => {
        if (document.getElementById(`count_${item.id}`)) document.getElementById(`count_${item.id}`).innerText = formatCurrency(typeStats[item.id].count) + ' 명';
        if (document.getElementById(`sub_${item.id}`)) document.getElementById(`sub_${item.id}`).innerText = typeStats[item.id].sum > 0 ? formatCurrency(typeStats[item.id].sum) + ' 원' : '0 원';
        totalItemCount += typeStats[item.id].count;
    });
    
    if(document.getElementById('totalCount')) document.getElementById('totalCount').innerText = formatCurrency(totalItemCount) + ' 명';
    if(document.getElementById('totalOfferingSum')) document.getElementById('totalOfferingSum').innerText = formatCurrency(grandTotalSum) + ' 원';

    if(document.getElementById('summaryMaleCount')) document.getElementById('summaryMaleCount').innerText = mTotal + ' 명';
    if(document.getElementById('summaryFemaleCount')) document.getElementById('summaryFemaleCount').innerText = fTotal + ' 명';
    if(document.getElementById('summaryFaceCount')) document.getElementById('summaryFaceCount').innerText = faceTotal + ' 명';
    if(document.getElementById('summaryNonFaceCount')) document.getElementById('summaryNonFaceCount').innerText = nonFaceTotal + ' 명';
    if(document.getElementById('summaryAttendCount')) document.getElementById('summaryAttendCount').innerText = totalAttend + ' 명';
    if(document.getElementById('summaryOfferingSum')) document.getElementById('summaryOfferingSum').innerText = formatCurrency(grandTotalSum) + ' 원';
    if(document.getElementById('summaryCashSum')) document.getElementById('summaryCashSum').innerText = formatCurrency(cashSum) + ' 원';
    if(document.getElementById('summaryOnlineSum')) document.getElementById('summaryOnlineSum').innerText = formatCurrency(onlineSum) + ' 원';
    
    if(document.getElementById('printAtM')) document.getElementById('printAtM').innerText = mTotal;
    if(document.getElementById('printAtF')) document.getElementById('printAtF').innerText = fTotal;
    if(document.getElementById('printAtSunday')) document.getElementById('printAtSunday').innerText = faceTotal; 
    if(document.getElementById('printAtNonFace')) document.getElementById('printAtNonFace').innerText = nonFaceTotal;
    if(document.getElementById('printAtTotal')) document.getElementById('printAtTotal').innerText = totalAttend;

    saveToLocalStorage();
}

function updateSignatures() {
    const names = document.getElementById('committeeNames').value.split(',').map(n => n.trim());
    const n1 = names[0] || ''; const n2 = names[1] || '';
    if (document.getElementById('printSign1')) document.getElementById('printSign1').innerText = n1 ? `${n1} (서명)` : '(서명)';
    if (document.getElementById('printSign2')) document.getElementById('printSign2').innerText = n2 ? `${n2} (인)` : '(인)';
}

function saveDataManually() { saveToLocalStorage(); showMsg('저장 완료', '저장되었습니다.'); }

function backupCurrentState() { localStorage.setItem('church_offering_backup', JSON.stringify(memberOfferings)); }
function restoreBackup() {
    const saved = localStorage.getItem('church_offering_backup');
    if (saved) {
        try { memberOfferings = JSON.parse(saved); renderMemberRows(); calculateTotals(); showMsg('복구 완료', '삭제/초기화 전 상태로 완벽히 복구되었습니다.'); } 
        catch(e) { showMsg('오류', '복구 데이터를 읽을 수 없습니다.'); }
    } else { showMsg('알림', '복구할 이전 기록이 없습니다.'); }
}
function resetAllData() { backupCurrentState(); memberOfferings = []; document.getElementById('committeeNames').value = ''; updateSignatures(); renderMemberRows(); calculateTotals(); showMsg('초기화 완료', '모든 입력칸이 지워졌습니다. 되돌리려면 [되돌리기 (복구)] 버튼을 누르세요.'); }

function saveToLocalStorage() {
    if (!activeDateStr || !activeWorshipType) return;
    
    let hasData = false;
    memberOfferings.forEach(m => {
        if (m.isMale || m.isFemale || m.isFace || m.isNonFace || m.memo) hasData = true;
        offeringTypes.forEach(ot => {
            if ((parseInt(m[ot.id]) || 0) > 0) hasData = true;
        });
    });

    const key = `church_offering_${activeDateStr}_${activeWorshipType}`;
    
    if (hasData) {
        localStorage.setItem(key, JSON.stringify({ 
            date: activeDateStr, 
            worshipType: activeWorshipType, 
            committee: document.getElementById('committeeNames').value, 
            members: memberOfferings 
        }));
    } else {
        localStorage.removeItem(key);
    }
    
    localStorage.setItem('church_offering_last_date', activeDateStr); 
    localStorage.setItem('church_offering_last_type', activeWorshipType);
    updateWorshipTypeDropdownIndicators(activeDateStr);
}

function loadFromLocalStorage(targetDate, targetType) {
    targetDate = targetDate || localStorage.getItem('church_offering_last_date') || getLocalDateString();
    const lastType = localStorage.getItem('church_offering_last_type');
    targetType = targetType || (lastType && worshipTypes.includes(lastType) ? lastType : worshipTypes[0]) || '주일 2부 예배';

    activeDateStr = targetDate;
    activeWorshipType = targetType;
    document.getElementById('calcDate').value = targetDate;
    renderWorshipTypesDropdown(targetType);
    document.getElementById('worshipType').value = targetType;
    updateDateDisplay(targetDate, targetType);
    applyChurchNameUI();
    updateWorshipTypeDropdownIndicators(targetDate);

    const saved = localStorage.getItem(`church_offering_${targetDate}_${targetType}`);
    if (saved) {
        try {
            const data = JSON.parse(saved); document.getElementById('committeeNames').value = data.committee || ''; updateSignatures();
            memberOfferings = (data.members || []).map((m, i) => {
                let newM = { listNo: m.listNo || (i+1), name: m.name||'', role: m.role||'', memo: m.memo||'', isMale: m.isMale||false, isFemale: m.isFemale||false, isFace: m.isFace||false, isNonFace: m.isNonFace||false, isOnline: m.isOnline||false };
                offeringTypes.forEach(ot => { if (m[ot.id] !== undefined) newM[ot.id] = m[ot.id]; }); return newM;
            });
        } catch (e) { memberOfferings = []; }
    } else {
        memberOfferings = []; document.getElementById('committeeNames').value = ''; updateSignatures();
    }
    
    renderMemberRows(); calculateTotals();
}

// ==========================================
// ★ 저장된 예배 기록 목록 모달 로직 (v1.2.0)
// ==========================================
function openWorshipHistoryModal() {
    const filterEl = document.getElementById('historyMonthFilter');
    if (filterEl && !filterEl.value && activeDateStr) {
        filterEl.value = activeDateStr.substring(0, 7);
    }
    renderWorshipHistoryList();
    document.getElementById('worshipHistoryModal').classList.remove('hidden');
}

function closeWorshipHistoryModal() {
    document.getElementById('worshipHistoryModal').classList.add('hidden');
}

function clearHistoryMonthFilter() {
    const filterEl = document.getElementById('historyMonthFilter');
    if (filterEl) filterEl.value = '';
    renderWorshipHistoryList();
}

function renderWorshipHistoryList() {
    const tbody = document.getElementById('worshipHistoryBody');
    const countEl = document.getElementById('historyTotalCount');
    const monthFilter = document.getElementById('historyMonthFilter')?.value || '';
    if (!tbody) return;

    const records = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const match = key.match(/^church_offering_(\d{4}-\d{2}-\d{2})_(.*)$/);
        if (!match) continue;
        const dateStr = match[1];
        const wType = match[2];
        if (monthFilter && !dateStr.startsWith(monthFilter)) continue;

        try {
            const data = JSON.parse(localStorage.getItem(key));
            let attendCount = 0;
            let totalSum = 0;
            (data.members || []).forEach(m => {
                if (m.isMale || m.isFemale || m.isFace || m.isNonFace) attendCount++;
                offeringTypes.forEach(ot => {
                    totalSum += parseInt(m[ot.id]) || 0;
                });
            });
            records.push({ dateStr, wType, attendCount, totalSum });
        } catch (e) {}
    }

    records.sort((a, b) => {
        if (a.dateStr !== b.dateStr) return b.dateStr.localeCompare(a.dateStr);
        return a.wType.localeCompare(b.wType);
    });

    if (countEl) countEl.innerText = records.length;
    tbody.innerHTML = '';

    if (records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="py-10 text-center text-slate-400 text-sm">저장된 예배 기록이 없습니다.</td></tr>`;
        return;
    }

    records.forEach(rec => {
        const weekday = getKoreanWeekday(rec.dateStr);
        const isCurrent = (rec.dateStr === activeDateStr && rec.wType === activeWorshipType);
        const tr = document.createElement('tr');
        tr.className = `cursor-pointer hover:bg-indigo-50 dark:hover:bg-slate-700/70 transition-colors ${isCurrent ? 'bg-indigo-50/70 dark:bg-indigo-900/20' : ''}`;
        tr.onclick = () => jumpToWorshipRecord(rec.dateStr, rec.wType);
        tr.innerHTML = `
            <td class="py-2.5 px-4 text-center font-bold text-slate-700 dark:text-slate-200">${rec.dateStr} <span class="text-xs font-normal text-slate-500">(${weekday})</span></td>
            <td class="py-2.5 px-4 text-center font-bold text-indigo-700 dark:text-indigo-300">${rec.wType} ${isCurrent ? '<span class="ml-1 text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded">현재</span>' : ''}</td>
            <td class="py-2.5 px-4 text-center text-slate-600 dark:text-slate-300">${formatCurrency(rec.attendCount)} 명</td>
            <td class="py-2.5 px-4 text-right font-bold text-slate-800 dark:text-slate-100">${formatCurrency(rec.totalSum)} 원</td>
            <td class="py-2.5 px-4 text-center">
                <button type="button" class="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors">이동</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function jumpToWorshipRecord(dateStr, worshipType) {
    saveToLocalStorage();
    closeWorshipHistoryModal();
    switchTab('calc');
    currentPage = 1;
    loadFromLocalStorage(dateStr, worshipType);
}

// ==========================================
// 명부에서 선택 불러오기 (모달 기능)
// ==========================================
function openImportModal() {
    if (globalMembers.length === 0) return showMsg('오류', '명부에 등록된 성도가 없습니다. [성도 명부 관리] 탭에서 먼저 명부를 추가해주세요.');
    
    const tbody = document.getElementById('importModalBody');
    tbody.innerHTML = '';
    
    globalMembers.forEach((m, idx) => {
        const isExist = memberOfferings.some(offering => offering.name === m.name);
        
        const tr = document.createElement('tr');
        tr.className = `import-row border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors ${isExist ? 'opacity-40 bg-slate-100 dark:bg-slate-800' : ''}`;
        tr.innerHTML = `
            <td class="py-2 px-4 text-center">
                <input type="checkbox" class="check-ui import-check" value="${idx}" ${isExist ? 'disabled checked' : ''} onchange="updateImportCount()">
            </td>
            <td class="py-2 px-4 import-name font-bold text-slate-800 dark:text-slate-200">${m.name}</td>
            <td class="py-2 px-4 text-center text-slate-600 dark:text-slate-400">${m.gender}</td>
            <td class="py-2 px-4 text-center text-sm text-slate-500">${m.role}</td>
        `;
        tbody.appendChild(tr);
    });
    
    document.getElementById('importSearch').value = '';
    document.getElementById('importSelectAll').checked = false;
    updateImportCount();
    document.getElementById('importRegistryModal').classList.remove('hidden');
}

function closeImportModal() {
    document.getElementById('importRegistryModal').classList.add('hidden');
}

function toggleAllImport(checked) {
    document.querySelectorAll('.import-check:not([disabled])').forEach(cb => {
        if(cb.closest('tr').style.display !== 'none') cb.checked = checked;
    });
    updateImportCount();
}

function filterImportModal() {
    const keyword = document.getElementById('importSearch').value.toLowerCase();
    document.querySelectorAll('.import-row').forEach(row => {
        const name = row.querySelector('.import-name').innerText.toLowerCase();
        if (name.includes(keyword)) row.style.display = '';
        else row.style.display = 'none';
    });
    updateImportCount();
}

function updateImportCount() {
    const count = document.querySelectorAll('.import-check:not([disabled]):checked').length;
    document.getElementById('importSelectedCount').innerText = count;
}

function confirmImportMembers() {
    const checkboxes = document.querySelectorAll('.import-check:not([disabled]):checked');
    if (checkboxes.length === 0) return showMsg('알림', '선택된 성도가 없습니다.');
    
    let addedCount = 0;
    checkboxes.forEach(cb => {
        const gm = globalMembers[cb.value];
        let maxNo = memberOfferings.reduce((max, m) => Math.max(max, m.listNo || 0), 0);
        memberOfferings.push({ 
            listNo: maxNo + 1, 
            name: gm.name, 
            role: gm.role, 
            memo: '', 
            isMale: false, 
            isFemale: false, 
            isFace: false, 
            isNonFace: false, 
            isOnline: false 
        });
        addedCount++;
    });
    
    renderMemberRows();
    calculateTotals();
    closeImportModal();
    showMsg('추가 완료', `${addedCount}명의 성도를 입력창에 추가했습니다.`);
}

// ==========================================
// 인쇄 및 엑셀 다운로드 로직
// ==========================================
function applyDynamicPrintTypography(rowCount) {
    const width = window.innerWidth || 1200;
    const typeCount = offeringTypes.length;
    const maxNameLen = offeringTypes.reduce((max, ot) => Math.max(max, (ot.name || '').length), 0);

    let headFontPt = 7.8;
    let bodyFontPt = 10;
    let rowHeightPx = 22;

    if (rowCount <= 6) {
        headFontPt = 7.2;
        bodyFontPt = 9.5;
        rowHeightPx = 26;
    } else if (rowCount <= 15) {
        headFontPt = 7.5;
        bodyFontPt = 9.5;
        rowHeightPx = 23;
    } else if (rowCount <= 28) {
        headFontPt = 7.8;
        bodyFontPt = 10;
        rowHeightPx = 21;
    } else {
        headFontPt = 7.6;
        bodyFontPt = 9;
        rowHeightPx = 19;
    }

    // 헌금 항목 개수와 최대 글자 수에 따라 헤더/본문 글씨 크기 자동 보정
    if (typeCount > 9) {
        headFontPt = Math.max(5.8, headFontPt - (typeCount - 9) * 0.45);
        bodyFontPt = Math.max(7.8, bodyFontPt - (typeCount - 9) * 0.35);
    } else if (typeCount < 9) {
        headFontPt = Math.min(9.0, headFontPt + (9 - typeCount) * 0.25);
        bodyFontPt = Math.min(10.5, bodyFontPt + (9 - typeCount) * 0.15);
    }

    if (maxNameLen >= 5) {
        headFontPt = Math.min(headFontPt, typeCount <= 9 ? 7.1 : 6.4);
    }

    if (width < 850) {
        headFontPt = Math.max(5.8, headFontPt - 0.4);
        bodyFontPt = Math.max(7.8, bodyFontPt - 0.4);
    } else if (width > 1600 && typeCount <= 9) {
        headFontPt = Math.min(8.2, headFontPt + 0.2);
        bodyFontPt = Math.min(10.5, bodyFontPt + 0.2);
    }

    document.documentElement.style.setProperty('--print-head-font', `${headFontPt.toFixed(2)}pt`);
    document.documentElement.style.setProperty('--print-data-font', `${bodyFontPt.toFixed(2)}pt`);
    document.documentElement.style.setProperty('--print-row-height', `${rowHeightPx}px`);
}

function printSection(sectionName) {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
        document.body.setAttribute('data-was-dark', 'true');
        html.classList.remove('dark');
    } else {
        document.body.setAttribute('data-was-dark', 'false');
    }

    document.body.setAttribute('data-print', sectionName);
    document.body.classList.add('preview-mode'); 
    document.getElementById('printPreviewToolbar').classList.remove('hidden'); 
    window.scrollTo(0, 0); 

    const statsPage1 = document.getElementById('statsPage1Container');
    if (statsPage1) statsPage1.style.zoom = 1;

    if (sectionName === 'calc') {
        document.body.classList.remove('hide-stats-worship');
        const count = memberOfferings.length;
        applyDynamicPrintTypography(count);
        prepareExcelPrintTemplate();
        const maxRows = 30; 
        let scale = 1;
        if (count > maxRows) { 
            scale = maxRows / count; 
            if (scale < 0.5) scale = 0.5;
        }
        document.documentElement.style.setProperty('--print-scale', scale);
        document.getElementById('dedicatedPrintArea').style.zoom = scale;
    } else if (sectionName === 'stats') {
        document.documentElement.style.setProperty('--print-scale', 1);
        if(document.getElementById('dedicatedPrintArea')) document.getElementById('dedicatedPrintArea').style.zoom = 1;

        // ★ 예배 상세 내역 인쇄 포함/제외 반영
        const includeWorship = document.getElementById('includeWorshipInPrint')?.checked ?? true;
        document.body.classList.toggle('hide-stats-worship', !includeWorship);

        // ★ 1페이지 결산 보고서가 무조건 A4 한 장에 들어가도록 자동 축소 계산
        if (statsPage1) {
            setTimeout(() => {
                const maxPage1Height = 960; // A4 세로 인쇄 가능 영역 기준(여백 제외)
                const currentHeight = statsPage1.scrollHeight;
                if (currentHeight > maxPage1Height) {
                    const statScale = Math.max(0.55, maxPage1Height / currentHeight);
                    statsPage1.style.zoom = statScale;
                } else {
                    statsPage1.style.zoom = 1;
                }
            }, 60);
        }
    } else {
        document.body.classList.remove('hide-stats-worship');
        document.documentElement.style.setProperty('--print-scale', 1);
        document.documentElement.style.setProperty('--print-head-font', '7.8pt');
        document.documentElement.style.setProperty('--print-data-font', '10pt');
        document.documentElement.style.setProperty('--print-row-height', '22px');
        if(document.getElementById('dedicatedPrintArea')) document.getElementById('dedicatedPrintArea').style.zoom = 1;
    }
}

function executeRealPrint() {
    window.print();
}

function closePrintPreview() {
    if (document.body.getAttribute('data-was-dark') === 'true') {
        document.documentElement.classList.add('dark');
    }
    document.body.removeAttribute('data-was-dark');

    document.body.classList.remove('preview-mode');
    document.body.classList.remove('hide-stats-worship');
    document.body.removeAttribute('data-print');
    document.getElementById('printPreviewToolbar').classList.add('hidden');

    const statsPage1 = document.getElementById('statsPage1Container');
    if (statsPage1) statsPage1.style.zoom = 1;
}

function prepareExcelPrintTemplate() {
    const d = new Date(activeDateStr);
    const firstDay = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil((d.getDay() + 1 + Math.floor((d - firstDay) / 86400000)) / 7);
    const churchName = getChurchName();
    
    const headerTitleEl = document.getElementById('printHeaderChurchTitle');
    if (headerTitleEl) headerTitleEl.innerText = `${churchName} ${d.getFullYear()}년도 헌금(수입) 현황`;
    document.getElementById('printMetaDate').innerText = `${d.getFullYear()}년 ${String(d.getMonth()+1).padStart(2,'0')}월 ${String(d.getDate()).padStart(2,'0')}일 (${weekNum}주) · ${activeWorshipType}`;
    
    let mTotal = 0, fTotal = 0, faTotal = 0, nfaTotal = 0, aTotal = 0, totalCash = 0, totalOnline = 0, grandTotal = 0;
    let totals = {}; offeringTypes.forEach(ot => totals[ot.id] = 0);

    const tHead = document.getElementById('printDataHead'); const tBody = document.getElementById('printDataBody'); const tFoot = document.getElementById('printDataFoot');
    
    // 헌금 항목 개수 및 글자 길이에 따라 전체 100% 열 너비를 자동 배분
    const fixedLeftWidths = [3.6, 6.6, 3.2, 3.2, 3.2, 4.4]; // 합계 24.2%
    const fixedRightWidths = [5.8, 6.4, 5.8]; // 합계 18.0%
    const remainingWidth = 100 - (24.2 + 18.0); // 57.8%를 헌금 항목에 글자 수 비례 배분

    const weights = offeringTypes.map(ot => {
        const len = (ot.name || '').length;
        if (len <= 2) return 0.85;
        if (len === 3) return 0.95;
        if (len === 4) return 1.05;
        return 1.25; // 5글자 이상(예: 여전도헌금, 남전도헌금) 넉넉한 폭 배정
    });
    const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;

    let headHTML = `<th style="width:${fixedLeftWidths[0]}%;">순번</th><th style="width:${fixedLeftWidths[1]}%;">성명</th><th style="width:${fixedLeftWidths[2]}%;">남자</th><th style="width:${fixedLeftWidths[3]}%;">여자</th><th style="width:${fixedLeftWidths[4]}%;">주일</th><th style="width:${fixedLeftWidths[5]}%;">비대면</th>`;
    offeringTypes.forEach((ot, idx) => {
        const w = ((remainingWidth * weights[idx]) / totalWeight).toFixed(2);
        headHTML += `<th style="width:${w}%;">${ot.name}</th>`;
    });
    headHTML += `<th style="width:${fixedRightWidths[0]}%;">현금</th><th style="width:${fixedRightWidths[1]}%;">온라인</th><th style="width:${fixedRightWidths[2]}%;">소계</th>`;
    tHead.innerHTML = headHTML;
    
    tBody.innerHTML = '';
    
    memberOfferings.forEach((m, idx) => {
        let isMale = m.isMale ? '1' : ''; 
        let isFemale = m.isFemale ? '1' : '';
        let isFace = m.isFace ? '1' : ''; 
        let isNonFace = m.isNonFace ? '1' : '';
        
        if (m.isMale) mTotal++; 
        if (m.isFemale) fTotal++; 
        if (m.isFace) faTotal++; 
        if (m.isNonFace) nfaTotal++; 

        let rowHTML = `<tr><td class="text-body">${m.listNo || (idx + 1)}</td><td class="text-body">${m.name || ''}</td><td class="text-body">${isMale}</td><td class="text-body">${isFemale}</td><td class="text-body">${isFace}</td><td class="text-body border-right-thick">${isNonFace}</td>`;
        let rowSum = 0;
        offeringTypes.forEach(ot => { const amt = parseInt(m[ot.id]) || 0; totals[ot.id] += amt; rowSum += amt; rowHTML += `<td class="text-body">${amt > 0 ? formatCurrency(amt) : ''}</td>`; });
        
        let onlineAmt = (m.isOnline && rowSum > 0) ? rowSum : ''; let cashAmt = (!m.isOnline && rowSum > 0) ? rowSum : '';
        if (onlineAmt) totalOnline += onlineAmt; if (cashAmt) totalCash += cashAmt; grandTotal += rowSum;
        
        rowHTML += `<td class="text-body">${cashAmt > 0 ? formatCurrency(cashAmt) : ''}</td><td class="text-body">${onlineAmt > 0 ? formatCurrency(onlineAmt) : ''}</td><td class="text-body" style="background-color:#f8fafc !important; font-weight:bold !important;">${rowSum > 0 ? formatCurrency(rowSum) : ''}</td></tr>`;
        tBody.innerHTML += rowHTML;
    });

    aTotal = mTotal + fTotal + faTotal + nfaTotal;

    document.getElementById('printAtM').innerText = mTotal; 
    document.getElementById('printAtF').innerText = fTotal;
    document.getElementById('printAtSunday').innerText = faTotal; 
    document.getElementById('printAtNonFace').innerText = nfaTotal; 
    document.getElementById('printAtTotal').innerText = aTotal;

    const typeCount = offeringTypes.length;
    const totalCols = 6 + typeCount + 3;

    // 1행(소계): 2 + 1 + 1 + 1 + 1 + typeCount + 1 + 1 + 1 = totalCols
    let footHTML = `<tr>
        <td colspan="2" class="text-body" style="font-weight:bold !important; border-top:2px solid #000 !important;">소계</td>
        <td class="text-body" style="font-weight:bold !important; border-top:2px solid #000 !important;">${mTotal||''}</td>
        <td class="text-body" style="font-weight:bold !important; border-top:2px solid #000 !important;">${fTotal||''}</td>
        <td class="text-body" style="font-weight:bold !important; border-top:2px solid #000 !important;">${faTotal||''}</td>
        <td class="text-body border-right-thick" style="font-weight:bold !important; border-top:2px solid #000 !important;">${nfaTotal||''}</td>`;
    offeringTypes.forEach(ot => { footHTML += `<td class="text-body" style="border-top:2px solid #000 !important;">${totals[ot.id] > 0 ? formatCurrency(totals[ot.id]) : ''}</td>`; });
    footHTML += `
        <td class="text-body" style="border-top:2px solid #000 !important;">${grandTotal > 0 ? formatCurrency(grandTotal) : ''}</td>
        <td class="text-body" style="font-weight:bold !important; border-top:2px solid #000 !important; font-size:var(--print-head-font) !important; line-height:1.15 !important; padding:2px 1px !important;">온라인<br>입금(소계)</td>
        <td class="text-body" style="border-top:2px solid #000 !important;"></td>
    </tr>`;

    // 2행(총계): 2 + 4 + (totalCols - 10) + 1 + 1 + 2 = totalCols
    const emptySpanRow2 = Math.max(0, totalCols - 10);
    let totalAttendSum = aTotal; 
    footHTML += `<tr>
        <td colspan="2" class="text-body" style="font-weight:bold !important;">총계</td>
        <td colspan="4" class="text-body border-right-thick" style="font-weight:bold !important;">${totalAttendSum || ''}</td>
        ${emptySpanRow2 > 0 ? `<td colspan="${emptySpanRow2}" style="border:none !important; background:transparent !important;"></td>` : ''}
        <td class="text-body" style="font-weight:bold !important; font-size:var(--print-head-font) !important;">헌금 총합</td>
        <td class="text-body print-bg-green" style="font-weight:bold !important; background-color:#bbf7d0 !important;">${formatCurrency(grandTotal)}</td>
        <td colspan="2" class="text-body print-bg-yellow" style="font-weight:bold !important; background-color:#fef08a !important;">${formatCurrency(totalOnline)}</td>
    </tr>`;

    // 3행(현금): (totalCols - 4) + 1 + 1 + 2 = totalCols
    const emptySpanRow3 = Math.max(0, totalCols - 4);
    footHTML += `<tr>
        <td colspan="${emptySpanRow3}" style="border:none !important; background:transparent !important;"></td>
        <td class="text-body" style="font-weight:bold !important; border:1px solid #000 !important;">현금</td>
        <td class="text-body" style="font-weight:bold !important; border:1px solid #000 !important;">${formatCurrency(totalCash)}</td>
        <td colspan="2" style="border:none !important; background:transparent !important;"></td>
    </tr>`;
    
    tFoot.innerHTML = footHTML;
    
    const names = document.getElementById('committeeNames').value.split(',').map(n => n.trim());
    document.getElementById('printSign1').innerText = names[0] ? names[0] : '(서명)';
    document.getElementById('printSign2').innerText = names[1] ? names[1] : '(인)';
}

function getExcelColLetter(colNum) {
    let letter = '';
    while (colNum > 0) {
        let mod = (colNum - 1) % 26;
        letter = String.fromCharCode(65 + mod) + letter;
        colNum = Math.floor((colNum - mod) / 26);
    }
    return letter;
}

async function exportToStyledExcel() {
    if (memberOfferings.length === 0) return showMsg('오류', '데이터가 없습니다.');
    showMsg('다운로드 중', '엑셀 파일을 생성하고 있습니다...');
    
    try {
        const d = new Date(activeDateStr);
        const weekNum = Math.ceil((d.getDay() + 1 + Math.floor((d - new Date(d.getFullYear(), 0, 1)) / 86400000)) / 7);
        const dateTitle = `${d.getFullYear()}년 ${String(d.getMonth()+1).padStart(2,'0')}월 ${String(d.getDate()).padStart(2,'0')}일 (${weekNum}주) · ${activeWorshipType}`;
        const signNames = document.getElementById('committeeNames').value.split(',').map(n => n.trim());
        const churchName = getChurchName();
        
        let mTotal = 0, fTotal = 0, faTotal = 0, nfaTotal = 0, aTotal = 0;
        
        memberOfferings.forEach(m => {
            if (m.isMale) mTotal++; 
            if (m.isFemale) fTotal++; 
            if (m.isFace) faTotal++; 
            if (m.isNonFace) nfaTotal++;
        });
        aTotal = mTotal + fTotal + faTotal + nfaTotal;

        const workbook = new ExcelJS.Workbook(); const worksheet = workbook.addWorksheet('헌금정산내역');
        
        worksheet.pageSetup = { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 1, margins: { left: 0.2, right: 0.2, top: 0.4, bottom: 0.4, header: 0.3, footer: 0.3 } };

        const fontTitle = { name: '맑은 고딕', size: 18, bold: true };
        const fontSubTitle = { name: '맑은 고딕', size: 14, bold: true };
        const fontBody = { name: '맑은 고딕', size: 10 };
        const fontBoldBody = { name: '맑은 고딕', size: 10, bold: true };
        const thinBorder = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        
        const typeCount = offeringTypes.length;
        const totalCols = Math.max(15, 6 + typeCount + 3); // 기본 9개일 때 정확히 18열(R열)
        const lastColLetter = getExcelColLetter(totalCols);
        const sign1StartCol = totalCols - 4; // 18열 기준 14(N열)
        const sign1EndCol = totalCols - 3;   // 18열 기준 15(O열)
        const sign2StartCol = totalCols - 2; // 18열 기준 16(P열)
        const sign2EndCol = totalCols;       // 18열 기준 18(R열)

        // 1행: 교회 헌금 현황 제목 (A1:마지막열1)
        const row1 = worksheet.addRow([`${churchName} ${d.getFullYear()}년도 헌금(수입) 현황`]);
        worksheet.mergeCells(`A1:${lastColLetter}1`); 
        row1.getCell(1).font = fontTitle;
        row1.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
        row1.height = 35;
        
        // 2행: 날짜(예배 구분 포함) 및 결재란 헤더
        const row2Arr = new Array(totalCols).fill('');
        row2Arr[0] = dateTitle;
        row2Arr[sign1StartCol - 1] = '재정부';
        row2Arr[sign2StartCol - 1] = '담임목사';
        const row2 = worksheet.addRow(row2Arr);
        worksheet.mergeCells('A2:J2');
        worksheet.mergeCells(`${getExcelColLetter(sign1StartCol)}2:${getExcelColLetter(sign1EndCol)}2`);
        worksheet.mergeCells(`${getExcelColLetter(sign2StartCol)}2:${getExcelColLetter(sign2EndCol)}2`);
        row2.getCell(1).font = { name: '맑은 고딕', size: 13, bold: true };
        row2.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
        row2.getCell(sign1StartCol).font = fontSubTitle;
        row2.getCell(sign1StartCol).alignment = { vertical: 'middle', horizontal: 'center' };
        row2.getCell(sign1StartCol).border = thinBorder;
        row2.getCell(sign2StartCol).font = fontSubTitle;
        row2.getCell(sign2StartCol).alignment = { vertical: 'middle', horizontal: 'center' };
        row2.getCell(sign2StartCol).border = thinBorder;
        row2.height = 24;

        // 3~5행: 출석인원(A3:E5), 출석 항목 헤더(F3:J3) + 숫자 칸(F4:J5 세로병합), 결재 서명란
        const row3Arr = new Array(totalCols).fill('');
        row3Arr[0] = '출석인원';
        row3Arr[5] = '남자'; row3Arr[6] = '여자'; row3Arr[7] = '주일'; row3Arr[8] = '비대면'; row3Arr[9] = '소계';
        row3Arr[sign1StartCol - 1] = signNames[0] || '';
        row3Arr[sign2StartCol - 1] = signNames[1] || '';
        const row3 = worksheet.addRow(row3Arr);

        const row4Arr = new Array(totalCols).fill('');
        row4Arr[5] = mTotal; row4Arr[6] = fTotal; row4Arr[7] = faTotal; row4Arr[8] = nfaTotal; row4Arr[9] = aTotal;
        const row4 = worksheet.addRow(row4Arr);

        const row5 = worksheet.addRow(new Array(totalCols).fill(''));
        
        row3.height = 22;
        row4.height = 20;
        row5.height = 20;

        worksheet.mergeCells('A3:E5');
        row3.getCell(1).font = fontSubTitle;
        row3.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
        row3.getCell(1).border = thinBorder;

        [6, 7, 8, 9, 10].forEach(c => {
            row3.getCell(c).font = fontBoldBody;
            row3.getCell(c).alignment = { vertical: 'middle', horizontal: 'center' };
            row3.getCell(c).border = thinBorder;
        });

        ['F', 'G', 'H', 'I', 'J'].forEach((colLetter, idx) => {
            worksheet.mergeCells(`${colLetter}4:${colLetter}5`);
            const cell = row4.getCell(6 + idx);
            cell.font = fontBody;
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = thinBorder;
        });

        worksheet.mergeCells(`${getExcelColLetter(sign1StartCol)}3:${getExcelColLetter(sign1EndCol)}5`);
        row3.getCell(sign1StartCol).font = fontSubTitle;
        row3.getCell(sign1StartCol).alignment = { vertical: 'bottom', horizontal: 'center' };
        row3.getCell(sign1StartCol).border = thinBorder;

        worksheet.mergeCells(`${getExcelColLetter(sign2StartCol)}3:${getExcelColLetter(sign2EndCol)}5`);
        row3.getCell(sign2StartCol).font = fontSubTitle;
        row3.getCell(sign2StartCol).alignment = { vertical: 'bottom', horizontal: 'center' };
        row3.getCell(sign2StartCol).border = thinBorder;
        
        // 6행: 여백 행
        const spacerRow = worksheet.addRow([]);
        spacerRow.height = 10;
        
        // 7행: 본문 데이터 헤더
        const headers = ['순번', '성명', '남자', '여자', '주일', '비대면'];
        offeringTypes.forEach(ot => headers.push(ot.name));
        headers.push('현금', '온라인', '소계');
        const headRow = worksheet.addRow(headers);
        headRow.eachCell(cell => { cell.font = fontBoldBody; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }; cell.alignment = { vertical: 'middle', horizontal: 'center' }; cell.border = thinBorder; });
        headRow.height = 20;

        let totals = {}; offeringTypes.forEach(ot => totals[ot.id] = 0);
        let totalCash = 0, totalOnline = 0, grandTotal = 0; const numberFormat = '#,##0';

        memberOfferings.forEach((m, idx) => {
            let rowSum = 0;
            let isMale = m.isMale ? 1 : ''; 
            let isFemale = m.isFemale ? 1 : '';
            let isFace = m.isFace ? 1 : '';
            let isNonFace = m.isNonFace ? 1 : '';

            const dataRow = [m.listNo || (idx + 1), m.name || '', isMale, isFemale, isFace, isNonFace];
            offeringTypes.forEach(ot => { const amt = parseInt(m[ot.id])||0; totals[ot.id]+=amt; rowSum+=amt; dataRow.push(amt>0?amt:''); });
            let onlineAmt = (m.isOnline && rowSum > 0) ? rowSum : ''; let cashAmt = (!m.isOnline && rowSum > 0) ? rowSum : '';
            if (onlineAmt) totalOnline += onlineAmt; if (cashAmt) totalCash += cashAmt; grandTotal += rowSum;
            dataRow.push(cashAmt, onlineAmt, rowSum>0?rowSum:'');
            
            const r = worksheet.addRow(dataRow);
            r.eachCell((cell, colNum) => {
                cell.font = fontBody; cell.border = thinBorder;
                if (colNum > 6) { cell.alignment = { vertical: 'middle', horizontal: 'right' }; cell.numFmt = numberFormat; } 
                else { cell.alignment = { vertical: 'middle', horizontal: 'center' }; }
            });
        });

        const cashColIdx = 6 + typeCount + 1;   // 18열 기준 16(P)
        const onlineColIdx = 6 + typeCount + 2; // 18열 기준 17(Q)
        const subColIdx = 6 + typeCount + 3;    // 18열 기준 18(R)

        const footData1 = ['소계', '', mTotal||'', fTotal||'', faTotal||'', nfaTotal||''];
        offeringTypes.forEach(ot => footData1.push(totals[ot.id] > 0 ? totals[ot.id] : ''));
        footData1.push(grandTotal>0?grandTotal:'', '온라인 입금(소계)', '');
        const footRow1 = worksheet.addRow(footData1);
        worksheet.mergeCells(`A${footRow1.number}:B${footRow1.number}`);
        footRow1.eachCell((cell, colNum) => {
            cell.font = fontBoldBody; cell.border = thinBorder;
            if (colNum > 6 && colNum !== onlineColIdx) { cell.numFmt = numberFormat; cell.alignment = { vertical: 'middle', horizontal: 'right' }; }
            else { cell.alignment = { vertical: 'middle', horizontal: 'center' }; }
        });

        const labelColIdx = cashColIdx - 1; // 18열 기준 15(O)
        const footData2 = new Array(subColIdx).fill('');
        footData2[0] = '총계';
        footData2[2] = aTotal || '';
        footData2[labelColIdx - 1] = '헌금 총합';
        footData2[cashColIdx - 1] = grandTotal > 0 ? grandTotal : 0;
        footData2[onlineColIdx - 1] = totalOnline > 0 ? totalOnline : 0;

        const footRow2 = worksheet.addRow(footData2);
        worksheet.mergeCells(`A${footRow2.number}:B${footRow2.number}`);
        worksheet.mergeCells(`C${footRow2.number}:F${footRow2.number}`);
        if (labelColIdx - 1 >= 7) {
            worksheet.mergeCells(`G${footRow2.number}:${getExcelColLetter(labelColIdx - 1)}${footRow2.number}`);
        }
        worksheet.mergeCells(`${getExcelColLetter(onlineColIdx)}${footRow2.number}:${getExcelColLetter(subColIdx)}${footRow2.number}`);
        
        footRow2.eachCell((cell, colNum) => {
            if(colNum <= 6 || colNum === labelColIdx) { cell.font = fontBoldBody; cell.border = thinBorder; cell.alignment = { vertical: 'middle', horizontal: 'center' }; }
            if(colNum >= 7 && colNum < labelColIdx) { cell.border = thinBorder; }
            if(colNum === cashColIdx) { cell.font = fontBoldBody; cell.border = thinBorder; cell.alignment = { vertical: 'middle', horizontal: 'right' }; cell.numFmt = numberFormat; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6E0B4' } }; }
            if(colNum === onlineColIdx) { cell.font = fontBoldBody; cell.border = thinBorder; cell.alignment = { vertical: 'middle', horizontal: 'right' }; cell.numFmt = numberFormat; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }; }
        });

        const footData3 = new Array(subColIdx).fill('');
        footData3[labelColIdx - 1] = '현금';
        footData3[cashColIdx - 1] = totalCash > 0 ? totalCash : 0;
        const footRow3 = worksheet.addRow(footData3);
        worksheet.mergeCells(`A${footRow3.number}:${getExcelColLetter(labelColIdx - 1)}${footRow3.number}`);
        worksheet.mergeCells(`${getExcelColLetter(onlineColIdx)}${footRow3.number}:${getExcelColLetter(subColIdx)}${footRow3.number}`);
        
        footRow3.getCell(labelColIdx).font = fontBoldBody; footRow3.getCell(labelColIdx).border = thinBorder; footRow3.getCell(labelColIdx).alignment = { vertical: 'middle', horizontal: 'center' };
        footRow3.getCell(cashColIdx).font = fontBoldBody; footRow3.getCell(cashColIdx).border = thinBorder; footRow3.getCell(cashColIdx).alignment = { vertical: 'middle', horizontal: 'right' }; footRow3.getCell(cashColIdx).numFmt = numberFormat;
        
        worksheet.getColumn(1).width = 6; worksheet.getColumn(2).width = 12; worksheet.getColumn(3).width = 6; worksheet.getColumn(4).width = 6; worksheet.getColumn(5).width = 10; worksheet.getColumn(6).width = 10;
        for(let i = 0; i < typeCount; i++) {
            const nameLen = (offeringTypes[i].name || '').length;
            worksheet.getColumn(7 + i).width = nameLen >= 5 ? 12.5 : 11;
        }
        worksheet.getColumn(cashColIdx).width = 11;
        worksheet.getColumn(onlineColIdx).width = 11;
        worksheet.getColumn(subColIdx).width = 13;
        
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `${churchName}_헌금정산_${activeDateStr}_${activeWorshipType}.xlsx`);
        closeMessage();
    } catch (e) { showMsg('오류', '엑셀 다운로드 중 문제가 발생했습니다.'); console.error(e); }
}