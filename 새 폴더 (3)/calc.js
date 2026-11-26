// calc.js
// ==========================================
// 정산 입력 화면 (Calc) 구성 로직
// ==========================================
function ensureMemberOnlineMap(m) {
    if (!m.onlineByType || typeof m.onlineByType !== 'object') {
        m.onlineByType = {};
    }
    const fallbackOnline = Boolean(m.isOnline);
    offeringTypes.forEach(ot => {
        if (typeof m.onlineByType[ot.id] !== 'boolean') {
            m.onlineByType[ot.id] = fallbackOnline;
        }
    });
    return m.onlineByType;
}

function getOfferingAmountByMethod(m) {
    const map = ensureMemberOnlineMap(m);
    let cashAmt = 0;
    let onlineAmt = 0;
    let rowSum = 0;

    offeringTypes.forEach(ot => {
        const amt = parseInt(m[ot.id], 10) || 0;
        rowSum += amt;
        if (amt > 0) {
            if (map[ot.id]) onlineAmt += amt;
            else cashAmt += amt;
        }
    });

    const anyOnline = rowSum > 0
        ? onlineAmt > 0
        : offeringTypes.some(ot => Boolean(map[ot.id])) || Boolean(m.isOnline);

    return { rowSum, cashAmt, onlineAmt, anyOnline };
}

function initMemberTable() {
    const thead = document.getElementById('memberTableHead');
    let ths = `<th class="py-2 px-1 border-r border-slate-300 dark:border-slate-600 w-10 text-center text-[12px] cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" onclick="sortTable('listNo')" title="클릭: 오름차순 → 내림차순 → 원래 순서">No.${getSortIcon('listNo')}</th>
        <th class="py-2 px-2 border-r border-slate-300 dark:border-slate-600 min-w-[116px] w-28 text-center text-[12px] cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" onclick="sortTable('name')" title="클릭: 오름차순 → 내림차순 → 원래 순서">성명${getSortIcon('name')}</th>
        <th class="py-2 px-1 border-r border-slate-300 dark:border-slate-600 w-12 text-center text-[12px] cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" onclick="sortTable('isMale')" title="클릭: 오름차순 → 내림차순 → 원래 순서">남자${getSortIcon('isMale')}</th>
        <th class="py-2 px-1 border-r border-slate-300 dark:border-slate-600 w-12 text-center text-[12px] cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" onclick="sortTable('isFemale')" title="클릭: 오름차순 → 내림차순 → 원래 순서">여자${getSortIcon('isFemale')}</th>
        <th class="py-2 px-1 border-r border-slate-300 dark:border-slate-600 w-12 text-center text-[12px] cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" onclick="sortTable('isFace')" title="클릭: 오름차순 → 내림차순 → 원래 순서">주일${getSortIcon('isFace')}</th>
        <th class="py-2 px-1 border-r border-slate-300 dark:border-slate-600 w-12 text-center text-[12px] cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" onclick="sortTable('isNonFace')" title="클릭: 오름차순 → 내림차순 → 원래 순서">비대면${getSortIcon('isNonFace')}</th>`;

    offeringTypes.forEach(ot => {
        ths += `<th class="py-2 px-1 border-r border-slate-300 dark:border-slate-600 min-w-[82px] text-center text-[12px] font-bold cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" onclick="sortTable('${ot.id}')" title="클릭: 오름차순 → 내림차순 → 원래 순서">${ot.name}${getSortIcon(ot.id)}</th>`;
    });

    ths += `<th class="py-2 px-1 border-r border-slate-300 dark:border-slate-600 min-w-[92px] text-center text-[12px] cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" onclick="sortTable('total')" title="클릭: 오름차순 → 내림차순 → 원래 순서">총액${getSortIcon('total')}</th>
        <th class="py-2 px-1 border-r border-slate-300 dark:border-slate-600 w-16 text-center text-[12px] cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 transition-colors" onclick="sortTable('isOnline')" title="클릭: 오름차순 → 내림차순 → 원래 순서">온라인${getSortIcon('isOnline')}</th>
        <th class="py-2 px-1 border-r border-slate-300 dark:border-slate-600 w-20 text-center text-[12px] cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" onclick="sortTable('memo')" title="클릭: 오름차순 → 내림차순 → 원래 순서">메모${getSortIcon('memo')}</th>
        <th class="py-2 px-1 border-r w-8 text-center text-[12px] no-print">삭제</th>`;

    thead.innerHTML = `<tr>${ths}</tr>`;
}

function hasCurrentCalcData() {
    if (!Array.isArray(memberOfferings) || memberOfferings.length === 0) return false;
    if ((document.getElementById('committeeNames')?.value || '').trim() !== '') return true;
    return memberOfferings.some(m => {
        if (m.name || m.isMale || m.isFemale || m.isFace || m.isNonFace || m.memo) return true;
        return offeringTypes.some(ot => (parseInt(m[ot.id], 10) || 0) > 0);
    });
}

function mergeMemberListIntoTarget(targetMembers, incomingMembers) {
    const merged = Array.isArray(targetMembers)
        ? targetMembers.map(item => ({ ...item, onlineByType: { ...(item.onlineByType || {}) } }))
        : [];

    incomingMembers.forEach(inc => {
        ensureMemberOnlineMap(inc);
        const incName = (inc.name || '').trim();
        const foundIdx = incName ? merged.findIndex(tm => (tm.name || '').trim() === incName) : -1;
        if (foundIdx >= 0) {
            const target = merged[foundIdx];
            ensureMemberOnlineMap(target);
            target.group = inc.group || target.group || '성도';
            target.role = inc.role || target.role || '';
            target.isMale = target.isMale || inc.isMale;
            target.isFemale = target.isFemale || inc.isFemale;
            target.isFace = target.isFace || inc.isFace;
            target.isNonFace = target.isNonFace || inc.isNonFace;
            if (inc.memo) {
                target.memo = target.memo ? `${target.memo} / ${inc.memo}` : inc.memo;
            }
            offeringTypes.forEach(ot => {
                const addAmt = parseInt(inc[ot.id], 10) || 0;
                if (addAmt > 0) {
                    target[ot.id] = (parseInt(target[ot.id], 10) || 0) + addAmt;
                    target.onlineByType[ot.id] = Boolean(inc.onlineByType && inc.onlineByType[ot.id]);
                }
            });
            syncRowOnlineFlag(target);
        } else {
            merged.push({ ...inc, onlineByType: { ...(inc.onlineByType || {}) } });
        }
    });
    return merged;
}

// ==========================================
// 예배 이동 저장 점프 메뉴 모달
// ==========================================
function openWorshipMoveJumpModal() {
    if (!hasCurrentCalcData()) {
        return showMsg('알림', '현재 화면에 이동할 헌금/출석 데이터가 없습니다.');
    }

    const dateStr = activeDateStr || document.getElementById('calcDate').value || getLocalDateString();
    const sourceType = activeWorshipType;
    const targetSelect = document.getElementById('worshipMoveTargetSelect');
    const sourceLabel = document.getElementById('worshipMoveSourceLabel');

    if (sourceLabel) {
        sourceLabel.textContent = `${dateStr} · ${sourceType}`;
    }

    if (targetSelect) {
        targetSelect.innerHTML = '';
        worshipTypes.forEach(wt => {
            if (wt === sourceType) return;
            const hasExisting = !!localStorage.getItem(`church_offering_${dateStr}_${wt}`);
            const opt = document.createElement('option');
            opt.value = wt;
            opt.textContent = hasExisting ? `${wt} (✅ 기존 기록 있음)` : wt;
            targetSelect.appendChild(opt);
        });
    }

    updateWorshipMoveTargetNotice();
    const modal = document.getElementById('worshipMoveModal');
    if (modal) modal.classList.remove('hidden');
}

function updateWorshipMoveTargetNotice() {
    const dateStr = activeDateStr || document.getElementById('calcDate').value || getLocalDateString();
    const targetType = document.getElementById('worshipMoveTargetSelect')?.value || '';
    const noticeBox = document.getElementById('worshipMoveConflictNotice');
    const directBtn = document.getElementById('worshipMoveDirectBtn');
    const conflictBtns = document.getElementById('worshipMoveConflictBtns');
    if (!targetType) return;

    const rawTarget = localStorage.getItem(`church_offering_${dateStr}_${targetType}`);
    let hasTargetData = false;
    let existingCount = 0;

    if (rawTarget) {
        try {
            const parsed = JSON.parse(rawTarget);
            if (Array.isArray(parsed.members) && parsed.members.length > 0) {
                hasTargetData = true;
                existingCount = parsed.members.length;
            }
        } catch (e) {}
    }

    if (hasTargetData) {
        if (noticeBox) {
            noticeBox.classList.remove('hidden');
            noticeBox.textContent = `⚠️ '${targetType}'에 이미 저장된 기록(${existingCount}명)이 있습니다. 덮어쓸지, 기존 기록에 추가할지 선택해 주세요.`;
        }
        if (directBtn) directBtn.classList.add('hidden');
        if (conflictBtns) conflictBtns.classList.remove('hidden');
    } else {
        if (noticeBox) noticeBox.classList.add('hidden');
        if (directBtn) directBtn.classList.remove('hidden');
        if (conflictBtns) conflictBtns.classList.add('hidden');
    }
}

function closeWorshipMoveModal() {
    const modal = document.getElementById('worshipMoveModal');
    if (modal) modal.classList.add('hidden');
}

function executeWorshipMove(mode) {
    if (mode === 'cancel') {
        closeWorshipMoveModal();
        return;
    }

    const dateStr = activeDateStr || document.getElementById('calcDate').value || getLocalDateString();
    const sourceWorshipType = activeWorshipType;
    const targetWorshipType = document.getElementById('worshipMoveTargetSelect')?.value || '';

    if (!targetWorshipType || targetWorshipType === sourceWorshipType) {
        return showMsg('오류', '이동할 대상 예배를 선택해 주세요.');
    }

    const snapshotMembers = memberOfferings.map(m => ({
        ...m,
        onlineByType: { ...(m.onlineByType || {}) }
    }));
    const snapshotCommittee = document.getElementById('committeeNames').value || '';

    const targetKey = `church_offering_${dateStr}_${targetWorshipType}`;
    const sourceKey = `church_offering_${dateStr}_${sourceWorshipType}`;

    let existingTargetData = null;
    const rawTarget = localStorage.getItem(targetKey);
    if (rawTarget) {
        try {
            existingTargetData = JSON.parse(rawTarget);
        } catch (e) {}
    }

    let finalMembers = snapshotMembers;
    let finalCommittee = snapshotCommittee;

    if (mode === 'append' && existingTargetData) {
        finalMembers = mergeMemberListIntoTarget(existingTargetData.members || [], snapshotMembers);
        if (!finalCommittee && existingTargetData.committee) {
            finalCommittee = existingTargetData.committee;
        }
    }

    localStorage.setItem(targetKey, JSON.stringify({
        date: dateStr,
        worshipType: targetWorshipType,
        committee: finalCommittee,
        members: finalMembers
    }));

    localStorage.removeItem(sourceKey);
    updateWorshipTypeDropdownIndicators(dateStr);

    activeDateStr = dateStr;
    activeWorshipType = targetWorshipType;
    currentPage = 1;
    closeWorshipMoveModal();

    loadFromLocalStorage(activeDateStr, activeWorshipType);
    const actionLabel = mode === 'append' ? '추가(병합) 저장' : (mode === 'overwrite' ? '덮어쓰기 저장' : '이동 저장');
    showMsg('예배 데이터 이동 완료', `'${sourceWorshipType}' 데이터가 '${targetWorshipType}'로 ${actionLabel}되었습니다.`);
}

function initDate() {
    document.getElementById('calcDate').addEventListener('change', (e) => {
        if (!e.target.value || e.target.value === activeDateStr) return;
        saveToLocalStorage();
        activeDateStr = e.target.value;
        currentPage = 1;
        loadFromLocalStorage(activeDateStr, activeWorshipType);
    });

    // 상단 예배 구분 드롭다운은 단순 조회/전환만 수행 (데이터 자동 이동 안 함)
    document.getElementById('worshipType').addEventListener('change', (e) => {
        if (!e.target.value || e.target.value === activeWorshipType) return;
        saveToLocalStorage();
        activeWorshipType = e.target.value;
        currentPage = 1;
        loadFromLocalStorage(activeDateStr, activeWorshipType);
    });
}

function updateDateDisplay(dateStr, typeStr) {
    const d = new Date(dateStr);
    document.getElementById('currentDate').innerText = `${d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })} - ${typeStr}`;
}

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
    const tbody = document.getElementById('offeringRows');
    tbody.innerHTML = '';
    offeringTypes.forEach(item => {
        tbody.innerHTML += `<tr class="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"><td class="py-2 px-4 text-center dark:text-slate-300">${item.name}</td><td class="py-2 px-4 text-center dark:text-slate-400" id="count_${item.id}">0 명</td><td class="py-2 px-4 text-right font-bold dark:text-slate-200" id="sub_${item.id}">0 원</td></tr>`;
    });
}

function restoreOriginalMemberOrder() {
    memberOfferings.sort((a, b) => (a.listNo || 0) - (b.listNo || 0));
}

function sortTable(col) {
    if (sortCol !== col) {
        sortCol = col;
        sortAsc = true;
    } else if (sortAsc === true) {
        sortAsc = false;
    } else {
        sortCol = null;
        sortAsc = null;
        restoreOriginalMemberOrder();
        initMemberTable();
        renderMemberRows();
        calculateTotals();
        return;
    }

    memberOfferings.sort((a, b) => {
        let valA, valB;
        if (col === 'total') {
            valA = offeringTypes.reduce((sum, ot) => sum + (parseInt(a[ot.id], 10) || 0), 0);
            valB = offeringTypes.reduce((sum, ot) => sum + (parseInt(b[ot.id], 10) || 0), 0);
        } else if (col === 'listNo') {
            valA = a.listNo || 0;
            valB = b.listNo || 0;
        } else if (col === 'isMale') {
            valA = a.isMale ? 1 : 0;
            valB = b.isMale ? 1 : 0;
        } else if (col === 'isFemale') {
            valA = a.isFemale ? 1 : 0;
            valB = b.isFemale ? 1 : 0;
        } else if (col === 'isFace') {
            valA = a.isFace ? 1 : 0;
            valB = b.isFace ? 1 : 0;
        } else if (col === 'isNonFace') {
            valA = a.isNonFace ? 1 : 0;
            valB = b.isNonFace ? 1 : 0;
        } else if (col === 'isOnline') {
            valA = getOfferingAmountByMethod(a).anyOnline ? 1 : 0;
            valB = getOfferingAmountByMethod(b).anyOnline ? 1 : 0;
        } else {
            valA = a[col];
            valB = b[col];
        }

        if (offeringTypes.some(ot => ot.id === col) || col === 'total' || col === 'listNo') {
            valA = parseInt(valA, 10) || 0;
            valB = parseInt(valB, 10) || 0;
        }
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
    });

    initMemberTable();
    renderMemberRows();
    calculateTotals();
}

function addMemberRow(data = null) {
    let maxNo = memberOfferings.reduce((max, m) => Math.max(max, m.listNo || 0), 0);
    const item = data || {
        listNo: maxNo + 1,
        name: '',
        group: '성도',
        role: '',
        memo: '',
        isMale: false,
        isFemale: false,
        isFace: false,
        isNonFace: false,
        isOnline: false,
        onlineByType: {}
    };
    ensureMemberOnlineMap(item);
    memberOfferings.push(item);
    renderMemberRows();
    calculateTotals();
}

function removeMemberRow(index) {
    backupCurrentState();
    memberOfferings.splice(index, 1);
    renderMemberRows();
    calculateTotals();
}

function changePageSize() {
    pageSize = document.getElementById('pageSize').value;
    currentPage = 1;
    renderMemberRows();
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderMemberRows();
    }
}

function nextPage() {
    const max = Math.ceil(getFilteredMembers().length / parseInt(pageSize)) || 1;
    if (currentPage < max) {
        currentPage++;
        renderMemberRows();
    }
}

function getFilteredMembers() {
    const fName = document.getElementById('searchMemberName') ? document.getElementById('searchMemberName').value.toLowerCase().trim() : '';
    const fGender = document.getElementById('filterGender') ? document.getElementById('filterGender').value : 'all';
    const fGroup = document.getElementById('filterGroup') ? document.getElementById('filterGroup').value : 'all';

    return memberOfferings.map((m, index) => ({ ...m, originalIndex: index })).filter(m => {
        if (fName && (!m.name || !m.name.toLowerCase().includes(fName))) return false;
        if (fGender === '남' && !m.isMale) return false;
        if (fGender === '여' && !m.isFemale) return false;
        if (fGroup !== 'all' && (m.group || '성도') !== fGroup) return false;
        return true;
    });
}

function syncRowOnlineFlag(m) {
    const map = ensureMemberOnlineMap(m);
    const hasAnyAmt = offeringTypes.some(ot => (parseInt(m[ot.id], 10) || 0) > 0);
    if (hasAnyAmt) {
        m.isOnline = offeringTypes.some(ot => {
            const amt = parseInt(m[ot.id], 10) || 0;
            return amt > 0 && Boolean(map[ot.id]);
        });
    } else {
        m.isOnline = offeringTypes.some(ot => Boolean(map[ot.id]));
    }
}

function toggleAllRowOnline(index, checked, refreshModal = false) {
    const m = memberOfferings[index];
    if (!m) return;
    const map = ensureMemberOnlineMap(m);
    m.isOnline = Boolean(checked);
    offeringTypes.forEach(ot => {
        map[ot.id] = Boolean(checked);
    });
    updateRowTotal(index);
    calculateTotals();
    renderMemberRows();
    if (refreshModal) refreshItemMethodModal(index);
}

function toggleItemOnline(index, otId, checked, refreshModal = false) {
    const m = memberOfferings[index];
    if (!m) return;
    const map = ensureMemberOnlineMap(m);
    map[otId] = Boolean(checked);
    syncRowOnlineFlag(m);
    updateRowTotal(index);
    calculateTotals();
    renderMemberRows();
    if (refreshModal) refreshItemMethodModal(index);
}

function refreshItemMethodModal(index) {
    const modal = document.getElementById('itemMethodModal');
    if (!modal) return;
    const m = memberOfferings[index];
    if (!m) return;
    const map = ensureMemberOnlineMap(m);

    const titleEl = document.getElementById('itemMethodModalTitle');
    if (titleEl) {
        titleEl.textContent = `${m.name || '성도'} · 헌금 종류별 현금/온라인 구분`;
    }

    offeringTypes.forEach(ot => {
        const amt = parseInt(m[ot.id], 10) || 0;
        const isOnl = Boolean(map[ot.id]);
        const card = document.getElementById(`method-card-${ot.id}`);
        const amtEl = document.getElementById(`method-amt-${ot.id}`);
        const cashBtn = document.getElementById(`method-cash-${ot.id}`);
        const onlineBtn = document.getElementById(`method-online-${ot.id}`);

        if (amtEl) {
            amtEl.textContent = amt > 0 ? `${formatCurrency(amt)} 원` : '0 원';
        }
        if (card) {
            card.className = `flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl border transition-colors ${
                isOnl
                    ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700'
                    : 'bg-slate-50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-600'
            }`;
        }
        if (cashBtn) {
            cashBtn.className = `px-3 py-1.5 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                !isOnl
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300 dark:ring-emerald-700'
                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
            }`;
        }
        if (onlineBtn) {
            onlineBtn.className = `px-3 py-1.5 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                isOnl
                    ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-300 dark:ring-amber-700'
                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
            }`;
        }
    });
}

function openItemMethodModal(index) {
    const m = memberOfferings[index];
    if (!m) return;
    ensureMemberOnlineMap(m);

    const existing = document.getElementById('itemMethodModal');
    if (existing) existing.remove();

    let rowsHtml = '';
    offeringTypes.forEach(ot => {
        const amt = parseInt(m[ot.id], 10) || 0;
        rowsHtml += `
            <div id="method-card-${ot.id}" class="flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-600">
                <div class="min-w-0">
                    <div class="text-sm font-bold text-slate-800 dark:text-slate-100">${ot.name}</div>
                    <div id="method-amt-${ot.id}" class="text-xs font-semibold ${amt > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}">${amt > 0 ? formatCurrency(amt) + ' 원' : '0 원'}</div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <button id="method-cash-${ot.id}" type="button" onclick="toggleItemOnline(${index}, '${ot.id}', false, true)">현금(오프라인)</button>
                    <button id="method-online-${ot.id}" type="button" onclick="toggleItemOnline(${index}, '${ot.id}', true, true)">온라인</button>
                </div>
            </div>
        `;
    });

    const modal = document.createElement('div');
    modal.id = 'itemMethodModal';
    modal.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 no-print';
    modal.innerHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div class="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-indigo-50 dark:bg-slate-700/60">
                <div>
                    <h3 id="itemMethodModalTitle" class="text-base font-extrabold text-indigo-950 dark:text-indigo-200">${m.name || '성도'} · 헌금 종류별 현금/온라인 구분</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">주정·십일조 등 항목마다 현금(오프라인)과 온라인을 각각 선택할 수 있습니다.</p>
                </div>
                <button type="button" onclick="closeItemMethodModal()" class="text-slate-400 hover:text-rose-500 font-bold text-2xl leading-none">×</button>
            </div>
            <div class="p-4 space-y-2 overflow-y-auto custom-scrollbar flex-grow">
                ${rowsHtml}
            </div>
            <div class="p-4 border-t dark:border-slate-700 flex flex-wrap justify-between items-center gap-2 bg-slate-50 dark:bg-slate-800/60">
                <div class="flex gap-2">
                    <button type="button" onclick="toggleAllRowOnline(${index}, false, true)" class="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold cursor-pointer">모두 현금</button>
                    <button type="button" onclick="toggleAllRowOnline(${index}, true, true)" class="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-200 rounded-lg text-xs font-bold cursor-pointer">모두 온라인</button>
                </div>
                <button type="button" onclick="closeItemMethodModal()" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold cursor-pointer">적용 완료</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    refreshItemMethodModal(index);
}

function closeItemMethodModal() {
    const modal = document.getElementById('itemMethodModal');
    if (modal) modal.remove();
}

function renderMemberRows() {
    const tbody = document.getElementById('memberRows');
    const notice = document.getElementById('emptyMemberNotice');
    tbody.innerHTML = '';
    const filteredMembers = getFilteredMembers();

    if (memberOfferings.length === 0) {
        notice.classList.remove('hidden');
        document.getElementById('memberTableFoot').style.display = 'none';
        document.getElementById('paginationControls').style.display = 'none';
        return;
    } else {
        notice.classList.add('hidden');
        document.getElementById('memberTableFoot').style.display = '';
    }

    let displayMembers = filteredMembers;
    if (pageSize !== 'all') {
        const size = parseInt(pageSize);
        const maxPage = Math.ceil(filteredMembers.length / size) || 1;
        if (currentPage > maxPage) currentPage = maxPage;
        displayMembers = filteredMembers.slice((currentPage - 1) * size, currentPage * size);
        document.getElementById('paginationControls').style.display = 'flex';
        document.getElementById('pageInfo').innerText = `${currentPage} / ${maxPage}`;
    } else {
        document.getElementById('paginationControls').style.display = 'none';
    }

    displayMembers.forEach((m) => {
        const index = m.originalIndex;
        const { rowSum, cashAmt, onlineAmt, anyOnline } = getOfferingAmountByMethod(m);
        const mixedOrPartial = rowSum > 0 && cashAmt > 0 && onlineAmt > 0;
        const groupTitle = m.group ? `구역: ${m.group}` : '구역 미지정';

        let tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-b border-slate-200 dark:border-slate-700';
        const inputClass = "w-full h-8 min-w-0 border border-transparent hover:border-slate-300 dark:hover:border-slate-600 px-1.5 py-1 text-[12px] font-bold text-slate-800 dark:text-slate-100 bg-transparent outline-none focus:bg-indigo-50 dark:focus:bg-indigo-900/50 focus:border-indigo-400 rounded transition-colors text-center";
        const nameInputClass = "w-full h-8 min-w-[108px] border border-transparent hover:border-slate-300 dark:hover:border-slate-600 px-2 py-1 text-[12px] font-bold text-slate-800 dark:text-slate-100 bg-transparent outline-none focus:bg-indigo-50 dark:focus:bg-indigo-900/50 focus:border-indigo-400 rounded transition-colors text-center whitespace-nowrap";
        const numInputClass = inputClass.replace("text-center", "text-right");

        let tds = `
            <td class="py-1 px-1 text-center text-[12px] text-slate-500 dark:text-slate-400 font-bold cursor-pointer" title="클릭하면 번호순 정렬" onclick="sortTable('listNo')">${m.listNo || (index + 1)}</td>
            <td class="py-1 px-1.5 min-w-[116px]" title="${groupTitle}"><input type="text" value="${m.name || ''}" placeholder="이름" class="${nameInputClass}" oninput="updateMemberData(${index}, 'name', this.value)"></td>
            <td class="py-1 px-1 text-center"><input type="checkbox" ${m.isMale ? 'checked' : ''} class="check-ui" onchange="updateMemberData(${index}, 'isMale', this.checked)"></td>
            <td class="py-1 px-1 text-center"><input type="checkbox" ${m.isFemale ? 'checked' : ''} class="check-ui" onchange="updateMemberData(${index}, 'isFemale', this.checked)"></td>
            <td class="py-1 px-1 text-center"><input type="checkbox" ${m.isFace ? 'checked' : ''} class="check-ui" onchange="updateMemberData(${index}, 'isFace', this.checked)"></td>
            <td class="py-1 px-1 text-center"><input type="checkbox" ${m.isNonFace ? 'checked' : ''} class="check-ui" onchange="updateMemberData(${index}, 'isNonFace', this.checked)"></td>
        `;
        offeringTypes.forEach(ot => {
            const amt = parseInt(m[ot.id], 10) || 0;
            const isItemOnline = Boolean(m.onlineByType && m.onlineByType[ot.id]);
            const cellTint = amt > 0
                ? (isItemOnline ? 'bg-amber-50/70 dark:bg-amber-950/25' : 'bg-white dark:bg-transparent')
                : '';
            const badge = amt > 0
                ? `<span class="text-[9px] font-bold px-1 rounded ${isItemOnline ? 'text-amber-700 dark:text-amber-300' : 'text-slate-400'}">${isItemOnline ? '온라인' : '현금'}</span>`
                : '';
            tds += `<td class="py-1 px-1 ${cellTint}">
                <div class="flex flex-col items-stretch">
                    <input type="number" min="0" step="1000" value="${m[ot.id] || ''}" class="${numInputClass}" oninput="updateMemberData(${index}, '${ot.id}', this.value)">
                    <div class="flex justify-end pr-1 -mt-0.5 cursor-pointer" onclick="openItemMethodModal(${index})" title="${ot.name} 현금/온라인 변경">${badge}</div>
                </div>
            </td>`;
        });
        tds += `
            <td class="py-1 px-2 text-right font-extrabold text-indigo-700 dark:text-indigo-300 bg-slate-50 dark:bg-slate-800 text-[13px] whitespace-nowrap" id="rowSum_${index}">${rowSum > 0 ? formatCurrency(rowSum) : ''}</td>
            <td class="py-1 px-1 bg-green-50/50 dark:bg-green-900/20 text-center whitespace-nowrap">
                <div class="inline-flex items-center justify-center gap-1">
                    <input type="checkbox" ${anyOnline ? 'checked' : ''} class="check-ui accent-green-600 dark:accent-green-500" title="전체 항목 일괄 온라인/현금 전환" onchange="toggleAllRowOnline(${index}, this.checked)">
                    <button type="button" onclick="openItemMethodModal(${index})" class="px-1.5 py-0.5 text-[10px] font-extrabold rounded border ${mixedOrPartial ? 'bg-amber-200 text-amber-950 border-amber-400' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border-slate-300 dark:border-slate-600'} hover:bg-indigo-50 transition-colors" title="항목별 현금/온라인 개별 선택">항목</button>
                </div>
            </td>
            <td class="py-1 px-1"><input type="text" value="${m.memo || ''}" placeholder="비고" class="${inputClass.replace("font-bold", "font-normal text-slate-500 dark:text-slate-400")}" oninput="updateMemberData(${index}, 'memo', this.value)"></td>
            <td class="py-1 px-1 text-center no-print"><button onclick="removeMemberRow(${index})" class="text-rose-400 hover:text-white hover:bg-rose-500 p-1.5 rounded transition-colors"><svg class="h-3.5 w-3.5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button></td>
        `;
        tr.innerHTML = tds;
        tbody.appendChild(tr);
    });
}

function clearFilters() {
    document.getElementById('searchMemberName').value = '';
    document.getElementById('filterGender').value = 'all';
    if (document.getElementById('filterGroup')) document.getElementById('filterGroup').value = 'all';
    renderMemberRows();
}

function updateRowTotal(index) {
    let sum = 0;
    offeringTypes.forEach(ot => { sum += parseInt(memberOfferings[index][ot.id]) || 0; });
    if (document.getElementById(`rowSum_${index}`)) document.getElementById(`rowSum_${index}`).innerText = sum > 0 ? formatCurrency(sum) : '';
}

function updateMemberData(index, field, value) {
    memberOfferings[index][field] = value;
    ensureMemberOnlineMap(memberOfferings[index]);

    if (['isMale', 'isFemale', 'isFace', 'isNonFace'].includes(field) && value === true) {
        if (field !== 'isMale') memberOfferings[index].isMale = false;
        if (field !== 'isFemale') memberOfferings[index].isFemale = false;
        if (field !== 'isFace') memberOfferings[index].isFace = false;
        if (field !== 'isNonFace') memberOfferings[index].isNonFace = false;
    }

    updateRowTotal(index);
    calculateTotals();
    if (['isMale', 'isFemale', 'isFace', 'isNonFace', 'isOnline'].includes(field)) renderMemberRows();
}

function renderWideTableFooter(mTotal, fTotal, faceTotal, nonFaceTotal, totalAttend, colSums, grandTotalSum, cashSum, onlineSum) {
    const tfoot = document.getElementById('memberTableFoot');
    if (!tfoot) return;

    const typeCount = offeringTypes.length;
    const totalCols = 6 + typeCount + 4;

    let subRow = `<tr class="bg-slate-100 dark:bg-slate-700/60 font-bold text-slate-800 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-600 text-[12px]">
        <td colspan="2" class="py-2 px-2 text-center border-r border-slate-300 dark:border-slate-600 whitespace-nowrap">소계</td>
        <td class="py-2 px-1 text-center border-r border-slate-300 dark:border-slate-600 whitespace-nowrap">${mTotal || 0}</td>
        <td class="py-2 px-1 text-center border-r border-slate-300 dark:border-slate-600 whitespace-nowrap">${fTotal || 0}</td>
        <td class="py-2 px-1 text-center border-r border-slate-300 dark:border-slate-600 whitespace-nowrap">${faceTotal || 0}</td>
        <td class="py-2 px-1 text-center border-r border-slate-300 dark:border-slate-600 whitespace-nowrap">${nonFaceTotal || 0}</td>`;

    offeringTypes.forEach(ot => {
        const amt = colSums[ot.id] || 0;
        subRow += `<td class="py-2 px-1.5 text-right border-r border-slate-300 dark:border-slate-600 font-bold text-indigo-700 dark:text-indigo-400 whitespace-nowrap">${amt > 0 ? formatCurrency(amt) : '0'}</td>`;
    });

    subRow += `
        <td class="py-2 px-2 text-right border-r border-slate-300 dark:border-slate-600 font-extrabold text-indigo-700 dark:text-indigo-400 whitespace-nowrap">${formatCurrency(grandTotalSum)}</td>
        <td colspan="3" class="py-2 px-2 text-center font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">${formatCurrency(onlineSum)}</td>
    </tr>`;

    const sumBlockSpan = Math.max(4, Math.min(6, totalCols - 10));
    const cashLabelSpan = 2;
    const cashValSpan = 2;
    const onlineLabelSpan = 2;
    const onlineValSpan = Math.max(2, totalCols - 2 - sumBlockSpan - cashLabelSpan - cashValSpan - onlineLabelSpan);

    let row2 = `<tr class="bg-white dark:bg-slate-800 font-extrabold border-t-2 border-slate-400 dark:border-slate-500 text-[13px]">
        <td colspan="2" class="py-2.5 px-2 text-center border-r border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 whitespace-nowrap">총계</td>
        <td colspan="${sumBlockSpan}" class="py-2.5 px-3 text-center border-r border-slate-300 dark:border-slate-600 text-base whitespace-nowrap tabular-nums">${totalAttend || 0}</td>
        <td colspan="2" class="py-2.5 px-2 border-r border-slate-300 dark:border-slate-600"></td>
        <td colspan="${cashLabelSpan}" class="py-2.5 px-3 text-center border-r border-slate-300 dark:border-slate-600 bg-amber-100/90 dark:bg-amber-900/40 text-slate-950 dark:text-amber-200 whitespace-nowrap">헌금</td>
        <td colspan="${cashValSpan}" class="py-2.5 px-4 text-right border-r border-slate-300 dark:border-slate-600 bg-amber-50/90 dark:bg-amber-950/30 text-slate-950 dark:text-slate-100 whitespace-nowrap tabular-nums">${formatCurrency(cashSum)}</td>
        <td colspan="${onlineLabelSpan}" class="py-2.5 px-3 text-center border-r border-slate-300 dark:border-slate-600 bg-yellow-300/90 dark:bg-yellow-500/40 text-slate-950 dark:text-yellow-200 whitespace-nowrap">온라인</td>
        <td colspan="${onlineValSpan}" class="py-2.5 px-4 text-right bg-yellow-200/90 dark:bg-yellow-500/30 text-slate-950 dark:text-yellow-100 whitespace-nowrap tabular-nums">${formatCurrency(onlineSum)}</td>
    </tr>`;

    const grandLabelSpan = cashLabelSpan;
    const grandValSpan = cashValSpan + onlineLabelSpan + onlineValSpan;
    const leftBeforeGrandSpan = totalCols - grandLabelSpan - grandValSpan;

    let row3 = `<tr class="bg-white dark:bg-slate-800 font-extrabold border-t border-slate-300 dark:border-slate-600 text-[13px]">
        <td colspan="${leftBeforeGrandSpan}" class="py-2.5 px-3 border-r border-slate-300 dark:border-slate-600"></td>
        <td colspan="${grandLabelSpan}" class="py-2.5 px-3 text-center border-r border-slate-300 dark:border-slate-600 bg-emerald-200/90 dark:bg-emerald-900/50 text-slate-950 dark:text-emerald-200 whitespace-nowrap">헌금 총합</td>
        <td colspan="${grandValSpan}" class="py-2.5 px-5 text-center bg-emerald-100/90 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 text-sm whitespace-nowrap tabular-nums">${formatCurrency(grandTotalSum)}</td>
    </tr>`;

    tfoot.innerHTML = subRow + row2 + row3;
}

function calculateTotals() {
    let faceTotal = 0, nonFaceTotal = 0, totalAttend = 0, mTotal = 0, fTotal = 0;
    let onlineSum = 0, cashSum = 0, grandTotalSum = 0;
    let typeStats = {}, colSums = {};
    offeringTypes.forEach(item => { typeStats[item.id] = { count: 0, sum: 0 }; colSums[item.id] = 0; });

    memberOfferings.forEach(m => {
        if (m.isMale) mTotal++;
        if (m.isFemale) fTotal++;
        if (m.isFace) faceTotal++;
        if (m.isNonFace) nonFaceTotal++;

        offeringTypes.forEach(ot => {
            const amt = parseInt(m[ot.id], 10) || 0;
            colSums[ot.id] += amt;
            if (amt > 0) { typeStats[ot.id].count++; typeStats[ot.id].sum += amt; }
        });

        const methodTotals = getOfferingAmountByMethod(m);
        grandTotalSum += methodTotals.rowSum;
        cashSum += methodTotals.cashAmt;
        onlineSum += methodTotals.onlineAmt;
    });

    totalAttend = mTotal + fTotal + faceTotal + nonFaceTotal;

    renderWideTableFooter(mTotal, fTotal, faceTotal, nonFaceTotal, totalAttend, colSums, grandTotalSum, cashSum, onlineSum);

    let totalItemCount = 0;
    offeringTypes.forEach(item => {
        if (document.getElementById(`count_${item.id}`)) document.getElementById(`count_${item.id}`).innerText = formatCurrency(typeStats[item.id].count) + ' 명';
        if (document.getElementById(`sub_${item.id}`)) document.getElementById(`sub_${item.id}`).innerText = typeStats[item.id].sum > 0 ? formatCurrency(typeStats[item.id].sum) + ' 원' : '0 원';
        totalItemCount += typeStats[item.id].count;
    });

    if (document.getElementById('totalCount')) document.getElementById('totalCount').innerText = formatCurrency(totalItemCount) + ' 명';
    if (document.getElementById('totalOfferingSum')) document.getElementById('totalOfferingSum').innerText = formatCurrency(grandTotalSum) + ' 원';

    if (document.getElementById('summaryMaleCount')) document.getElementById('summaryMaleCount').innerText = mTotal + ' 명';
    if (document.getElementById('summaryFemaleCount')) document.getElementById('summaryFemaleCount').innerText = fTotal + ' 명';
    if (document.getElementById('summaryFaceCount')) document.getElementById('summaryFaceCount').innerText = faceTotal + ' 명';
    if (document.getElementById('summaryNonFaceCount')) document.getElementById('summaryNonFaceCount').innerText = nonFaceTotal + ' 명';
    if (document.getElementById('summaryAttendCount')) document.getElementById('summaryAttendCount').innerText = totalAttend + ' 명';
    if (document.getElementById('summaryOfferingSum')) document.getElementById('summaryOfferingSum').innerText = formatCurrency(grandTotalSum) + ' 원';
    if (document.getElementById('summaryCashSum')) document.getElementById('summaryCashSum').innerText = formatCurrency(cashSum) + ' 원';
    if (document.getElementById('summaryOnlineSum')) document.getElementById('summaryOnlineSum').innerText = formatCurrency(onlineSum) + ' 원';

    if (document.getElementById('printAtM')) document.getElementById('printAtM').innerText = mTotal;
    if (document.getElementById('printAtF')) document.getElementById('printAtF').innerText = fTotal;
    if (document.getElementById('printAtSunday')) document.getElementById('printAtSunday').innerText = faceTotal;
    if (document.getElementById('printAtNonFace')) document.getElementById('printAtNonFace').innerText = nonFaceTotal;
    if (document.getElementById('printAtTotal')) document.getElementById('printAtTotal').innerText = totalAttend;

    saveToLocalStorage();
}

function updateSignatures() {
    const names = document.getElementById('committeeNames').value.split(',').map(n => n.trim());
    const n1 = names[0] || '';
    const n2 = names[1] || '';
    if (document.getElementById('printSign1')) document.getElementById('printSign1').innerText = n1 ? `${n1} (서명)` : '(서명)';
    if (document.getElementById('printSign2')) document.getElementById('printSign2').innerText = n2 ? `${n2} (인)` : '(인)';
}

function saveDataManually() {
    saveToLocalStorage();
    showMsg('저장 완료', '저장되었습니다.');
}

function backupCurrentState() {
    localStorage.setItem('church_offering_backup', JSON.stringify(memberOfferings));
}

function restoreBackup() {
    const saved = localStorage.getItem('church_offering_backup');
    if (saved) {
        try {
            memberOfferings = (JSON.parse(saved) || []).map(m => {
                ensureMemberOnlineMap(m);
                return m;
            });
            renderMemberRows();
            calculateTotals();
            showMsg('복구 완료', '삭제/초기화 전 상태로 완벽히 복구되었습니다.');
        } catch (e) {
            showMsg('오류', '복구 데이터를 읽을 수 없습니다.');
        }
    } else {
        showMsg('알림', '복구할 이전 기록이 없습니다.');
    }
}

function resetAllData() {
    backupCurrentState();
    memberOfferings = [];
    document.getElementById('committeeNames').value = '';
    updateSignatures();
    renderMemberRows();
    calculateTotals();
    showMsg('초기화 완료', '모든 입력칸이 지워졌습니다. 되돌리려면 [되돌리기] 버튼을 누르세요.');
}

function saveToLocalStorage() {
    if (!activeDateStr || !activeWorshipType) return;

    let hasData = false;
    memberOfferings.forEach(m => {
        ensureMemberOnlineMap(m);
        if (m.isMale || m.isFemale || m.isFace || m.isNonFace || m.memo) hasData = true;
        offeringTypes.forEach(ot => {
            if ((parseInt(m[ot.id], 10) || 0) > 0) hasData = true;
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
    sortCol = null;
    sortAsc = null;
    document.getElementById('calcDate').value = targetDate;
    renderWorshipTypesDropdown(targetType);
    document.getElementById('worshipType').value = targetType;
    updateDateDisplay(targetDate, targetType);
    applyChurchNameUI();
    updateWorshipTypeDropdownIndicators(targetDate);

    const saved = localStorage.getItem(`church_offering_${targetDate}_${targetType}`);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            document.getElementById('committeeNames').value = data.committee || '';
            updateSignatures();
            memberOfferings = (data.members || []).map((m, i) => {
                const regMatch = globalMembers.find(gm => (gm.name || '').trim() === (m.name || '').trim());
                let newM = {
                    listNo: m.listNo || (i + 1),
                    name: m.name || '',
                    group: m.group || (regMatch ? regMatch.group : '성도'),
                    role: m.role || '',
                    memo: m.memo || '',
                    isMale: m.isMale || false,
                    isFemale: m.isFemale || false,
                    isFace: m.isFace || false,
                    isNonFace: m.isNonFace || false,
                    isOnline: m.isOnline || false,
                    onlineByType: (m.onlineByType && typeof m.onlineByType === 'object') ? { ...m.onlineByType } : {}
                };
                offeringTypes.forEach(ot => {
                    if (m[ot.id] !== undefined) newM[ot.id] = m[ot.id];
                    if (typeof newM.onlineByType[ot.id] !== 'boolean') {
                        newM.onlineByType[ot.id] = Boolean(m.isOnline);
                    }
                });
                return newM;
            });
        } catch (e) {
            memberOfferings = [];
        }
    } else {
        memberOfferings = [];
        document.getElementById('committeeNames').value = '';
        updateSignatures();
    }

    initMemberTable();
    renderMemberRows();
    calculateTotals();
}

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
                    totalSum += parseInt(m[ot.id], 10) || 0;
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

function openImportModal() {
    if (globalMembers.length === 0) return showMsg('오류', '명부에 등록된 성도가 없습니다. [성도 명부 관리] 탭에서 먼저 명부를 추가해주세요.');

    const groupFilterEl = document.getElementById('importGroupFilter');
    if (groupFilterEl) {
        groupFilterEl.innerHTML = `<option value="all">구역(전체)</option>` +
            memberGroups.map(g => `<option value="${g}">${g}</option>`).join('');
        groupFilterEl.value = 'all';
    }

    const tbody = document.getElementById('importModalBody');
    tbody.innerHTML = '';

    globalMembers.forEach((m, idx) => {
        const groupName = m.group || '성도';
        const isExist = memberOfferings.some(offering => offering.name === m.name);

        const tr = document.createElement('tr');
        tr.className = `import-row border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors ${isExist ? 'opacity-40 bg-slate-100 dark:bg-slate-800' : ''}`;
        tr.dataset.group = groupName;
        tr.innerHTML = `
            <td class="py-2 px-4 text-center">
                <input type="checkbox" class="check-ui import-check" value="${idx}" ${isExist ? 'disabled checked' : ''} onchange="updateImportCount()">
            </td>
            <td class="py-2 px-4 import-name font-bold text-slate-800 dark:text-slate-200">${m.name}</td>
            <td class="py-2 px-4 text-center text-xs font-bold text-indigo-700 dark:text-indigo-300">${groupName}</td>
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
        if (cb.closest('tr').style.display !== 'none') cb.checked = checked;
    });
    updateImportCount();
}

function filterImportModal() {
    const keyword = (document.getElementById('importSearch')?.value || '').toLowerCase();
    const selectedGroup = document.getElementById('importGroupFilter')?.value || 'all';
    document.querySelectorAll('.import-row').forEach(row => {
        const name = row.querySelector('.import-name').innerText.toLowerCase();
        const rowGroup = row.dataset.group || '성도';
        const matchName = name.includes(keyword);
        const matchGroup = selectedGroup === 'all' || rowGroup === selectedGroup;
        if (matchName && matchGroup) row.style.display = '';
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
        const newItem = {
            listNo: maxNo + 1,
            name: gm.name,
            group: gm.group || '성도',
            role: gm.role,
            memo: '',
            isMale: false,
            isFemale: false,
            isFace: false,
            isNonFace: false,
            isOnline: false,
            onlineByType: {}
        };
        ensureMemberOnlineMap(newItem);
        memberOfferings.push(newItem);
        addedCount++;
    });

    renderMemberRows();
    calculateTotals();
    closeImportModal();
    showMsg('추가 완료', `${addedCount}명의 성도를 입력창에 추가했습니다.`);
}

function applyDynamicPrintTypography(rowCount) {
    const typeCount = offeringTypes.length;
    const maxNameLen = offeringTypes.reduce((max, ot) => Math.max(max, (ot.name || '').length), 0);

    let headFontPt = 7.0;
    let bodyFontPt = 8.4;
    let rowHeightPx = 21;

    if (rowCount > 28) {
        headFontPt = 6.4;
        bodyFontPt = 7.8;
        rowHeightPx = 19;
    }

    if (typeCount > 9) {
        headFontPt = Math.max(5.5, headFontPt - (typeCount - 9) * 0.4);
        bodyFontPt = Math.max(7.2, bodyFontPt - (typeCount - 9) * 0.3);
    }

    if (maxNameLen >= 5) {
        headFontPt = Math.min(headFontPt, 6.2);
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
        if (document.getElementById('dedicatedPrintArea')) document.getElementById('dedicatedPrintArea').style.zoom = 1;

        const periodMode = document.getElementById('statPeriodMode')?.value || 'month';
        const includeWorship = periodMode === 'year'
            ? false
            : (document.getElementById('includeWorshipInPrint')?.checked ?? true);
        document.body.classList.toggle('hide-stats-worship', !includeWorship);

        if (statsPage1) {
            setTimeout(() => {
                const maxPage1Height = 960;
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
        document.documentElement.style.setProperty('--print-head-font', '7.0pt');
        document.documentElement.style.setProperty('--print-data-font', '8.4pt');
        document.documentElement.style.setProperty('--print-row-height', '21px');
        if (document.getElementById('dedicatedPrintArea')) document.getElementById('dedicatedPrintArea').style.zoom = 1;
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
    document.getElementById('printMetaDate').innerText = `${d.getFullYear()}년 ${String(d.getMonth() + 1).padStart(2, '0')}월 ${String(d.getDate()).padStart(2, '0')}일 (${weekNum}주) · ${activeWorshipType}`;

    let mTotal = 0, fTotal = 0, faTotal = 0, nfaTotal = 0, aTotal = 0, totalCash = 0, totalOnline = 0, grandTotal = 0;
    let totals = {};
    offeringTypes.forEach(ot => totals[ot.id] = 0);

    const tHead = document.getElementById('printDataHead');
    const tBody = document.getElementById('printDataBody');
    const tFoot = document.getElementById('printDataFoot');

    const fixedLeftWidths = [3.4, 6.2, 2.9, 2.9, 2.9, 4.0];
    const fixedRightWidths = [6.6, 7.2, 6.6];
    const remainingWidth = 100 - (22.3 + 20.4);

    const weights = offeringTypes.map(ot => {
        const len = (ot.name || '').length;
        if (len <= 2) return 0.9;
        if (len === 3) return 1.0;
        if (len === 4) return 1.1;
        return 1.3;
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

    const numCellStyle = 'padding:1px 2px !important; font-size:calc(var(--print-data-font) * 0.88) !important; letter-spacing:-0.4px !important; white-space:nowrap !important;';

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
        offeringTypes.forEach(ot => {
            const amt = parseInt(m[ot.id], 10) || 0;
            totals[ot.id] += amt;
            rowSum += amt;
            rowHTML += `<td class="text-body" style="${numCellStyle}">${amt > 0 ? formatCurrency(amt) : ''}</td>`;
        });

        const { cashAmt, onlineAmt } = getOfferingAmountByMethod(m);
        totalOnline += onlineAmt;
        totalCash += cashAmt;
        grandTotal += rowSum;

        rowHTML += `<td class="text-body" style="${numCellStyle}">${cashAmt > 0 ? formatCurrency(cashAmt) : ''}</td><td class="text-body" style="${numCellStyle}">${onlineAmt > 0 ? formatCurrency(onlineAmt) : ''}</td><td class="text-body" style="${numCellStyle} background-color:#f8fafc !important; font-weight:bold !important;">${rowSum > 0 ? formatCurrency(rowSum) : ''}</td></tr>`;
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

    let footHTML = `<tr>
        <td colspan="2" class="text-body" style="font-weight:bold !important; border-top:2px solid #000 !important;">소계</td>
        <td class="text-body" style="font-weight:bold !important; border-top:2px solid #000 !important;">${mTotal || ''}</td>
        <td class="text-body" style="font-weight:bold !important; border-top:2px solid #000 !important;">${fTotal || ''}</td>
        <td class="text-body" style="font-weight:bold !important; border-top:2px solid #000 !important;">${faTotal || ''}</td>
        <td class="text-body border-right-thick" style="font-weight:bold !important; border-top:2px solid #000 !important;">${nfaTotal || ''}</td>`;
    offeringTypes.forEach(ot => { footHTML += `<td class="text-body" style="${numCellStyle} border-top:2px solid #000 !important; font-weight:bold !important;">${totals[ot.id] > 0 ? formatCurrency(totals[ot.id]) : ''}</td>`; });
    footHTML += `
        <td class="text-body" style="${numCellStyle} border-top:2px solid #000 !important; font-weight:bold !important;">${totalCash > 0 ? formatCurrency(totalCash) : ''}</td>
        <td class="text-body" style="${numCellStyle} border-top:2px solid #000 !important; font-weight:bold !important;">${totalOnline > 0 ? formatCurrency(totalOnline) : ''}</td>
        <td class="text-body" style="${numCellStyle} border-top:2px solid #000 !important; font-weight:bold !important;">${grandTotal > 0 ? formatCurrency(grandTotal) : ''}</td>
    </tr>`;

    const attendSpan = 4;
    const blankSpan = Math.max(1, totalCols - (2 + attendSpan + 8));
    const cashLabelSpan = 2;
    const cashValSpan = 2;
    const onlineLabelSpan = 2;
    const onlineValSpan = Math.max(2, totalCols - 2 - attendSpan - blankSpan - cashLabelSpan - cashValSpan - onlineLabelSpan);

    footHTML += `<tr>
        <td colspan="2" class="text-body" style="font-weight:bold !important; border-top:2px solid #000 !important;">총계</td>
        <td colspan="${attendSpan}" class="text-body border-right-thick" style="font-weight:bold !important; border-top:2px solid #000 !important;">${aTotal || 0}</td>
        <td colspan="${blankSpan}" style="border:none !important; background:transparent !important;"></td>
        <td colspan="${cashLabelSpan}" class="text-body" style="font-weight:bold !important; border:1px solid #000 !important; background-color:#fde68a !important; padding:2px 3px !important;">헌금</td>
        <td colspan="${cashValSpan}" class="text-body" style="font-weight:bold !important; border:1px solid #000 !important; background-color:#fef3c7 !important; padding:2px 4px !important; text-align:right !important; ${numCellStyle}">${formatCurrency(totalCash)}</td>
        <td colspan="${onlineLabelSpan}" class="text-body print-bg-yellow" style="font-weight:bold !important; border:1px solid #000 !important; background-color:#fef08a !important; padding:2px 3px !important;">온라인</td>
        <td colspan="${onlineValSpan}" class="text-body print-bg-yellow" style="font-weight:bold !important; border:1px solid #000 !important; background-color:#fef08a !important; padding:2px 4px !important; text-align:center !important; ${numCellStyle}">${formatCurrency(totalOnline)}</td>
    </tr>`;

    const grandLabelSpan = cashLabelSpan;
    const grandValSpan = cashValSpan + onlineLabelSpan + onlineValSpan;
    const leftBeforeGrandSpan = totalCols - grandLabelSpan - grandValSpan;

    footHTML += `<tr>
        <td colspan="${leftBeforeGrandSpan}" style="border:none !important; background:transparent !important;"></td>
        <td colspan="${grandLabelSpan}" class="text-body print-bg-green" style="font-weight:bold !important; border:1px solid #000 !important; background-color:#bbf7d0 !important; padding:2px 3px !important;">헌금 총합</td>
        <td colspan="${grandValSpan}" class="text-body print-bg-green" style="font-weight:bold !important; border:1px solid #000 !important; background-color:#bbf7d0 !important; padding:2px 6px !important; text-align:center !important; ${numCellStyle}">${formatCurrency(grandTotal)}</td>
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
        const dateTitle = `${d.getFullYear()}년 ${String(d.getMonth() + 1).padStart(2, '0')}월 ${String(d.getDate()).padStart(2, '0')}일 (${weekNum}주) · ${activeWorshipType}`;
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

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('헌금정산내역');

        worksheet.pageSetup = { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 1, margins: { left: 0.2, right: 0.2, top: 0.4, bottom: 0.4, header: 0.3, footer: 0.3 } };

        const fontTitle = { name: '맑은 고딕', size: 18, bold: true };
        const fontSubTitle = { name: '맑은 고딕', size: 14, bold: true };
        const fontBody = { name: '맑은 고딕', size: 10 };
        const fontBoldBody = { name: '맑은 고딕', size: 10, bold: true };
        const thinBorder = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

        const typeCount = offeringTypes.length;
        const totalCols = Math.max(15, 6 + typeCount + 3);
        const lastColLetter = getExcelColLetter(totalCols);
        const sign1StartCol = totalCols - 4;
        const sign1EndCol = totalCols - 3;
        const sign2StartCol = totalCols - 2;
        const sign2EndCol = totalCols;

        const row1 = worksheet.addRow([`${churchName} ${d.getFullYear()}년도 헌금(수입) 현황`]);
        worksheet.mergeCells(`A1:${lastColLetter}1`);
        row1.getCell(1).font = fontTitle;
        row1.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
        row1.height = 35;

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

        const spacerRow = worksheet.addRow([]);
        spacerRow.height = 10;

        const headers = ['순번', '성명', '남자', '여자', '주일', '비대면'];
        offeringTypes.forEach(ot => headers.push(ot.name));
        headers.push('현금', '온라인', '소계');
        const headRow = worksheet.addRow(headers);
        headRow.eachCell(cell => { cell.font = fontBoldBody; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }; cell.alignment = { vertical: 'middle', horizontal: 'center' }; cell.border = thinBorder; });
        headRow.height = 20;

        let totals = {};
        offeringTypes.forEach(ot => totals[ot.id] = 0);
        let totalCash = 0, totalOnline = 0, grandTotal = 0;
        const numberFormat = '#,##0';

        memberOfferings.forEach((m, idx) => {
            let rowSum = 0;
            let isMale = m.isMale ? 1 : '';
            let isFemale = m.isFemale ? 1 : '';
            let isFace = m.isFace ? 1 : '';
            let isNonFace = m.isNonFace ? 1 : '';

            const dataRow = [m.listNo || (idx + 1), m.name || '', isMale, isFemale, isFace, isNonFace];
            offeringTypes.forEach(ot => { const amt = parseInt(m[ot.id], 10) || 0; totals[ot.id] += amt; rowSum += amt; dataRow.push(amt > 0 ? amt : ''); });
            const { cashAmt, onlineAmt } = getOfferingAmountByMethod(m);
            totalOnline += onlineAmt;
            totalCash += cashAmt;
            grandTotal += rowSum;
            dataRow.push(cashAmt > 0 ? cashAmt : '', onlineAmt > 0 ? onlineAmt : '', rowSum > 0 ? rowSum : '');

            const r = worksheet.addRow(dataRow);
            r.eachCell((cell, colNum) => {
                cell.font = fontBody;
                cell.border = thinBorder;
                if (colNum > 6) { cell.alignment = { vertical: 'middle', horizontal: 'right' }; cell.numFmt = numberFormat; }
                else { cell.alignment = { vertical: 'middle', horizontal: 'center' }; }
            });
        });

        const cashColIdx = 6 + typeCount + 1;
        const onlineColIdx = 6 + typeCount + 2;
        const subColIdx = 6 + typeCount + 3;

        const footData1 = ['소계', '', mTotal || '', fTotal || '', faTotal || '', nfaTotal || ''];
        offeringTypes.forEach(ot => footData1.push(totals[ot.id] > 0 ? totals[ot.id] : ''));
        footData1.push(totalCash > 0 ? totalCash : '', totalOnline > 0 ? totalOnline : '', grandTotal > 0 ? grandTotal : '');
        const footRow1 = worksheet.addRow(footData1);
        worksheet.mergeCells(`A${footRow1.number}:B${footRow1.number}`);
        footRow1.eachCell((cell, colNum) => {
            cell.font = fontBoldBody;
            cell.border = thinBorder;
            if (colNum > 6) { cell.numFmt = numberFormat; cell.alignment = { vertical: 'middle', horizontal: 'right' }; }
            else { cell.alignment = { vertical: 'middle', horizontal: 'center' }; }
        });

        const cashLabelStart = Math.max(8, cashColIdx - 2);
        const cashLabelEnd = cashColIdx - 1;
        const cashValCol = cashColIdx;
        const onlineLabelCol = onlineColIdx;
        const onlineValStart = onlineColIdx + 1;
        const onlineValEnd = subColIdx;

        const footData2 = new Array(subColIdx).fill('');
        footData2[0] = '총계';
        footData2[2] = aTotal || 0;
        footData2[cashLabelStart - 1] = '헌금';
        footData2[cashValCol - 1] = totalCash > 0 ? totalCash : 0;
        footData2[onlineLabelCol - 1] = '온라인';
        footData2[onlineValStart - 1] = totalOnline > 0 ? totalOnline : 0;

        const footRow2 = worksheet.addRow(footData2);
        footRow2.height = 24;
        worksheet.mergeCells(`A${footRow2.number}:B${footRow2.number}`);
        worksheet.mergeCells(`C${footRow2.number}:F${footRow2.number}`);
        if (cashLabelStart - 1 >= 7) {
            worksheet.mergeCells(`G${footRow2.number}:${getExcelColLetter(cashLabelStart - 1)}${footRow2.number}`);
        }
        if (cashLabelEnd > cashLabelStart) {
            worksheet.mergeCells(`${getExcelColLetter(cashLabelStart)}${footRow2.number}:${getExcelColLetter(cashLabelEnd)}${footRow2.number}`);
        }
        if (onlineValEnd > onlineValStart) {
            worksheet.mergeCells(`${getExcelColLetter(onlineValStart)}${footRow2.number}:${getExcelColLetter(onlineValEnd)}${footRow2.number}`);
        }

        for (let c = 1; c <= subColIdx; c++) {
            const cell = footRow2.getCell(c);
            cell.font = fontBoldBody;
            cell.border = thinBorder;
            if (c <= 6) {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            } else if (c >= cashLabelStart && c <= cashLabelEnd) {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDE68A' } };
            } else if (c === cashValCol) {
                cell.alignment = { vertical: 'middle', horizontal: 'right' };
                cell.numFmt = numberFormat;
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
            } else if (c === onlineLabelCol) {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
            } else if (c >= onlineValStart && c <= onlineValEnd) {
                cell.alignment = { vertical: 'middle', horizontal: 'right' };
                cell.numFmt = numberFormat;
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF08A' } };
            }
        }

        const grandLabelStart = cashLabelStart;
        const grandLabelEnd = cashLabelEnd;
        const grandValStart = cashValCol;
        const grandValEnd = subColIdx;

        const footData3 = new Array(subColIdx).fill('');
        footData3[grandLabelStart - 1] = '헌금 총합';
        footData3[grandValStart - 1] = grandTotal > 0 ? grandTotal : 0;

        const footRow3 = worksheet.addRow(footData3);
        footRow3.height = 24;
        if (grandLabelStart - 1 >= 1) {
            worksheet.mergeCells(`A${footRow3.number}:${getExcelColLetter(grandLabelStart - 1)}${footRow3.number}`);
        }
        if (grandLabelEnd > grandLabelStart) {
            worksheet.mergeCells(`${getExcelColLetter(grandLabelStart)}${footRow3.number}:${getExcelColLetter(grandLabelEnd)}${footRow3.number}`);
        }
        worksheet.mergeCells(`${getExcelColLetter(grandValStart)}${footRow3.number}:${getExcelColLetter(grandValEnd)}${footRow3.number}`);

        for (let c = grandLabelStart; c <= grandValEnd; c++) {
            const cell = footRow3.getCell(c);
            cell.font = fontBoldBody;
            cell.border = thinBorder;
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6E0B4' } };
            if (c <= grandLabelEnd) {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            } else {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.numFmt = numberFormat;
            }
        }

        worksheet.getColumn(1).width = 6;
        worksheet.getColumn(2).width = 14;
        worksheet.getColumn(3).width = 6;
        worksheet.getColumn(4).width = 6;
        worksheet.getColumn(5).width = 10;
        worksheet.getColumn(6).width = 10;
        for (let i = 0; i < typeCount; i++) {
            const nameLen = (offeringTypes[i].name || '').length;
            worksheet.getColumn(7 + i).width = nameLen >= 5 ? 12.5 : 11;
        }
        worksheet.getColumn(cashColIdx).width = 12;
        worksheet.getColumn(onlineColIdx).width = 12;
        worksheet.getColumn(subColIdx).width = 13;

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `${churchName}_헌금정산_${activeDateStr}_${activeWorshipType}.xlsx`);
        closeMessage();
    } catch (e) {
        showMsg('오류', '엑셀 다운로드 중 문제가 발생했습니다.');
        console.error(e);
    }
}