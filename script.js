// 全局变量
let labData = [];

// 初始化数据
document.addEventListener('DOMContentLoaded', function() {
    // 检查登录状态
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn && !window.location.pathname.includes('index.html')) {
        window.location.href = 'index.html';
        return;
    }

    // 初始化数据
    try {
        // 先尝试从 localStorage 加载数据
        const savedData = localStorage.getItem('labData');
        if (savedData) {
            labData = JSON.parse(savedData);
            console.log('从 localStorage 加载数据成功');
        } else {
            // 如果没有保存的数据，则使用默认数据
            const userData = {
                "labData": [
                    {
                        "name": "101电梯控制综合实训室",
                        "equipment": [
                            "电梯安装与调试实训考核设备  SX-811C （一套六个）",
                            "VVVF透明群控电梯实训考核设备  SX-811B （一套三连梯）"
                        ],
                        "reservations": [
                            {
                                "date": "2024-12-29",
                                "time": "5-6节",
                                "person": "11",
                                "purpose": ""
                            },
                            {
                                "date": "2024-12-29",
                                "time": "1-2节",
                                "person": "11",
                                "purpose": ""
                            }
                        ],
                        "borrowHistory": [
                            {
                                "borrowTime": "2024-12-30T12:44",
                                "borrower": "11",
                                "equipment": [
                                    {
                                        "name": "1",
                                        "model": "1",
                                        "quantity": "1",
                                        "unit": "个"
                                    }
                                ],
                                "expectedReturnTime": "2024-12-31T20:44",
                                "purpose": "",
                                "returnTime": "2024-12-30T20:49",
                                "returner": "11",
                                "returnNote": "完好",
                                "returnStatus": "confirmed"
                            }
                        ],
                        "status": "free"
                    },
                    {
                        "name": "201电工电子电力实训室（一）",
                        "equipment": [
                            "电工电子电力拖动实验装置  TH-DZ3 （25台）"
                        ],
                        "borrowHistory": [/* ... 借出历史记录 ... */],
                        "reservations": [
                            {
                                "date": "2024-12-31",
                                "time": "5-6节",
                                "person": "11",
                                "purpose": ""
                            }
                        ],
                        "status": "reserved"
                    },
                    {
                        "name": "202国培基地电工电子实训室（二）",
                        "equipment": [
                            "求是电工电子教学实验台  QS-NDG3 （25台）"
                        ],
                        "reservations": [
                            {
                                "date": "2024-12-29",
                                "time": "1-2节",
                                "person": "11",
                                "purpose": ""
                            },
                            {
                                "date": "2024-12-30",
                                "time": "1-2节",
                                "person": "11",
                                "purpose": ""
                            }
                        ],
                        "status": "free"
                    },
                    {
                        "name": "401工业机器人实训室",
                        "equipment": [
                            "FANUC机器人系统集成 （2台）",
                            "慧谷机器人 (1台）",
                            "博诺（ABB机器人）设备 （1台）",
                            "电脑 （5台）"
                        ],
                        "status": "free"
                    },
                    {
                        "name": "414智能传感器实训室",
                        "equipment": [
                            "三向智能传感器 SX-815V （2台）",
                            "电脑 （15台）"
                        ],
                        "status": "free"
                    },
                    {
                        "name": "综合仓库",
                        "equipment": [
                            "器材"
                        ],
                        "status": "free"
                    }
                ]
            };
            labData = userData.labData;
            localStorage.setItem('labData', JSON.stringify(labData));
            console.log('使用默认数据初始化');
        }
    } catch (error) {
        console.error('初始化数据失败:', error);
        labData = [];
    }

    // 渲染实训室列表
    if (window.location.pathname.includes('dashboard.html')) {
        renderLabs();
    }

    // 绑定顶部按钮事件
    const addLabBtn = document.getElementById('addLabBtn');
    if (addLabBtn) {
        addLabBtn.onclick = openAddLab;
    }

    const summaryReservationBtn = document.getElementById('summaryReservationBtn');
    if (summaryReservationBtn) {
        summaryReservationBtn.onclick = showReservationSummary;
    }

    const summaryBorrowBtn = document.getElementById('summaryBorrowBtn');
    if (summaryBorrowBtn) {
        summaryBorrowBtn.onclick = showBorrowSummary;
    }

    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
        exportDataBtn.onclick = exportData;
    }

    // 绑定导入按钮事件
    const importDataBtn = document.getElementById('importDataBtn');
    if (importDataBtn) {
        importDataBtn.onclick = function() {
            const importFile = document.getElementById('importFile');
            if (importFile) {
                importFile.click();
            }
        };
    }

    const importFile = document.getElementById('importFile');
    if (importFile) {
        importFile.onchange = function(e) {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const importedData = JSON.parse(e.target.result);
                        
                        if (!importedData.labData || !Array.isArray(importedData.labData)) {
                            throw new Error('数据格式不正确');
                        }
                        
                        if (confirm('确定要导入数据吗？这将覆盖当前所有数据。')) {
                            labData = importedData.labData;
                            localStorage.setItem('labData', JSON.stringify(labData));
                            renderLabs();
                            alert('数据导入成功！');
                        }
                    } catch (error) {
                        alert('导入失败：' + error.message);
                    }
                };
                reader.readAsText(file);
            }
        };
    }

    // 启动自动状态更新
    if (window.location.pathname.includes('dashboard.html')) {
        startAutoStatusUpdate();
        
        // 立即执行一次状态更新
        labData.forEach(lab => {
            lab.status = updateLabStatus(lab);
        });
        localStorage.setItem('labData', JSON.stringify(labData));
        renderLabs();
    }
});

// 渲染实训室列表
function renderLabs() {
    console.log('开始渲染实训室列表');
    const labGrid = document.getElementById('labGrid');
    if (!labGrid) {
        console.error('找不到 labGrid 元素');
        return;
    }

    try {
    labGrid.innerHTML = '';
        console.log('当前实训室数据:', labData);
        
        labData.forEach((lab, index) => {
        const status = updateLabStatus(lab);
        lab.status = status;

            // 获取最新的未归还借出记录
            let borrowInfo = '';
            if (lab.borrowHistory && lab.borrowHistory.length > 0) {
                const latestBorrow = lab.borrowHistory[lab.borrowHistory.length - 1];
                if (!latestBorrow.returnStatus || latestBorrow.returnStatus !== 'confirmed') {
                    borrowInfo = `<p>借出：<span class="status-text-${status}">${latestBorrow.borrower}已借出</span></p>`;
                }
            }

        const labCard = document.createElement('div');
            labCard.className = `lab-card status-${status}`;
        labCard.innerHTML = `
            <h3>${lab.name}</h3>
            <p>状态：<span class="status-text-${status}">${getStatusDisplay(status, lab)}</span></p>
            
            <!-- 功能按钮容器 -->
            <div class="function-buttons">
                <button class="btn btn-info btn-sm" onclick="toggleEquipment(${index})">查看设备</button>
                <button class="btn btn-info btn-sm" onclick="toggleReservation(${index})">查看预约</button>
                <button class="btn btn-info btn-sm" onclick="toggleBorrow(${index})">查看借出</button>
            </div>

            <!-- 设备列表 -->
            <div class="equipment-list" style="display: none;">
                <h4>设备列表：</h4>
                <ul>
                    ${(lab.equipment || []).map((item, i) => `<li>${i + 1}. ${item}</li>`).join('')}
                </ul>
            </div>

            <!-- 预约信息 -->
            <div class="reservation-info" style="display: none;">
                <h4>预约信息：</h4>
                ${renderReservations(lab.reservations)}
            </div>

            <!-- 借出信息 -->
            <div class="borrow-info" style="display: none;">
                ${getBorrowStatusDisplay(lab)}
            </div>

            <!-- 主要操作按钮组 -->
            <div class="button-group">
                <button class="btn btn-primary" onclick="openBorrowManagement(${index})">借出</button>
                <button class="btn btn-primary" onclick="openReservation(${index})">预约</button>
                <button class="btn btn-warning" onclick="editLab(${index})">编辑</button>
                <button class="btn btn-danger" onclick="deleteLab(${index})">删除</button>
            </div>
        `;
        labGrid.appendChild(labCard);
    });

        console.log('实训室渲染完成');
    } catch (error) {
        console.error('渲染实训室时出错:', error);
    }
}

// 获取状态文本
function getStatusText(status) {
    switch (status) {
        case 'free':
            return '空闲';
        case 'occupied':
            return '使用中';
        case 'reserved':
            return '已预约';
        case 'today-reserved':
            return '今天有预约';
        default:
            return '未知状态';
    }
}

// 更新实训室状态
function updateLabStatus(lab) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // 检查预约状态
    if (lab.reservations && lab.reservations.length > 0) {
        // 先检查是否有今天的预约
        const hasToday = lab.reservations.some(res => {
            if (res.date === today) {
                const timeSlot = getTimeSlotMinutes(res.time);
                if (timeSlot) {
                    // 如果当前时间在课节时间范围内
                    if (currentTime >= timeSlot.start && currentTime <= timeSlot.end) {
                        return true; // 当前正在使用
                    }
                    // 如果课节还未开始但在今天
                    if (currentTime < timeSlot.end) {
                        return true; // 今天有预约
                    }
                }
            }
            return false;
        });

        if (hasToday) {
            // 检查当前时间是否在预约时间段内
            const currentReservation = lab.reservations.find(res => {
                if (res.date === today) {
                    const timeSlot = getTimeSlotMinutes(res.time);
                    return timeSlot && currentTime >= timeSlot.start && currentTime <= timeSlot.end;
                }
                return false;
            });

            return currentReservation ? 'occupied' : 'today-reserved';
        }

        // 检查是否有未来的预约
        const hasFuture = lab.reservations.some(res => res.date > today);
        if (hasFuture) {
            return 'reserved';
        }
    }

    return 'free';
}

// 获取课节时间范围（返回分钟数）
function getTimeSlotMinutes(timeSlot) {
    switch (timeSlot) {
        case '1-2节':
            return { start: 8 * 60 + 30, end: 10 * 60 }; // 8:30-10:00
        case '3-4节':
            return { start: 10 * 60 + 15, end: 11 * 60 + 45 }; // 10:15-11:45
        case '5-6节':
            return { start: 14 * 60 + 30, end: 16 * 60 }; // 14:30-16:00
        case '7-8节':
            return { start: 16 * 60 + 10, end: 17 * 60 + 40 }; // 16:10-17:40
        default:
            return null;
    }
}

// 添加自动状态更新
function startAutoStatusUpdate() {
    // 每分钟更新一次状态
    setInterval(() => {
        let needsUpdate = false;
        
        labData.forEach(lab => {
            const newStatus = updateLabStatus(lab);
            if (lab.status !== newStatus) {
                lab.status = newStatus;
                needsUpdate = true;
            }
        });

        // 只有在状态发生变化时才重新渲染和保存
        if (needsUpdate) {
            localStorage.setItem('labData', JSON.stringify(labData));
            renderLabs();
            console.log('实训室状态已自动更新');
        }
    }, 60000); // 每分钟检查一次
}

// 渲染预约信息
function renderReservations(reservations) {
    if (!reservations || reservations.length === 0) {
        return '<p class="no-reservations">暂无预约</p>';
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // 过滤并排序预约
    const validReservations = reservations
        .filter(res => {
            // 如果是今天的预约，检查是否已结束
            if (res.date === today) {
                const timeSlot = getTimeSlotMinutes(res.time);
                return timeSlot && currentTime <= timeSlot.end;
            }
            // 保留未来的预约
            return res.date > today;
        })
        .sort((a, b) => a.date.localeCompare(b.date));

    if (validReservations.length === 0) {
        return '<p class="no-reservations">暂无有效预约</p>';
    }

    return `
        <ul class="reservation-list">
            ${validReservations.map(res => `
                <li>
                    <div class="reservation-item">
                        <div class="reservation-date">${res.date}</div>
                        <div class="reservation-time">${res.time}</div>
                        <div class="reservation-person">预约人：${res.person}</div>
                        ${res.purpose ? `<div class="reservation-purpose">用途：${res.purpose}</div>` : ''}
                    </div>
                </li>
            `).join('')}
        </ul>
    `;
}

// 修改切换设备列表显示的函数
window.toggleEquipment = function(index) {
    const labCard = document.querySelectorAll('.lab-card')[index];
    const equipmentList = labCard.querySelector('.equipment-list');
    const button = labCard.querySelector('button[onclick^="toggleEquipment"]');
    
    if (equipmentList.style.display === 'none') {
        equipmentList.style.display = 'block';
        button.textContent = '隐藏设备';
    } else {
        equipmentList.style.display = 'none';
        button.textContent = '查看设备';
    }
};

// 修改切换预约信息显示的函数
window.toggleReservation = function(index) {
    const labCard = document.querySelectorAll('.lab-card')[index];
    const reservationInfo = labCard.querySelector('.reservation-info');
    const button = labCard.querySelector('button[onclick^="toggleReservation"]');
    
    if (reservationInfo.style.display === 'none') {
        reservationInfo.style.display = 'block';
        button.textContent = '隐藏预约';
    } else {
        reservationInfo.style.display = 'none';
        button.textContent = '查看预约';
    }
};

// 添加实训室
window.openAddLab = function() {
    const modal = document.getElementById('labModal');
    const form = document.getElementById('labForm');
    const modalTitle = document.getElementById('modalTitle');

    modalTitle.textContent = '添加实训室';
    form.reset();
    delete form.dataset.editIndex;
    openModal('labModal');
};

// 修改编辑实训室函数
window.editLab = function(index) {
    const modal = document.getElementById('labModal');
    const form = document.getElementById('labForm');
    const modalTitle = document.getElementById('modalTitle');
    const lab = labData[index];

    // 设置标题
    modalTitle.textContent = '编辑实训室';
    
    // 填充基本信息
    document.getElementById('labName').value = lab.name;
    document.getElementById('labStatus').value = lab.status || 'free';
    document.getElementById('labEquipment').value = (lab.equipment || []).join('\n');
    
    // 添加借出记录管理部分
    const borrowHistoryDiv = document.createElement('div');
    borrowHistoryDiv.className = 'records-management';
    borrowHistoryDiv.innerHTML = `
        <h3>借出记录管理</h3>
        <div class="records-list">
            ${renderBorrowRecords(lab, index)}
        </div>
    `;
    
    // 移除已存在的记录管理部分（如果有）
    const existingHistory = form.querySelector('.records-management');
    if (existingHistory) {
        existingHistory.remove();
    }
    
    // 在按钮组之前插入记录管理部分
    const buttonGroup = form.querySelector('.button-group');
    form.insertBefore(borrowHistoryDiv, buttonGroup);

    // 设置表单的编辑索引
    form.dataset.editIndex = index;
    
    // 打开模态框
    openModal('labModal');
};

// 渲染借出记录列表
function renderBorrowRecords(lab, labIndex) {
    if (!lab.borrowHistory || lab.borrowHistory.length === 0) {
        return '<p class="no-records">暂无借出记录</p>';
    }

    const now = new Date();
    return lab.borrowHistory.map((record, index) => {
        const isOverdue = !record.returnStatus && new Date(record.expectedReturnTime) < now;
        return `
            <div class="record-item ${isOverdue ? 'overdue' : ''} ${record.returnStatus === 'confirmed' ? 'returned' : ''}">
                <div class="record-content">
                    <div class="record-header">
                        <span class="record-time">借出时间：${formatDateTime(record.borrowTime)}</span>
                        <span class="record-person">借出人：${record.borrower}</span>
                    </div>
                    ${record.equipment ? `
                        <div class="record-equipment">
                            <p>借出器材：</p>
                            <ul>
                                ${record.equipment.map(eq => `
                                    <li>${eq.name} ${eq.model} ${eq.quantity}${eq.unit}</li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    ${record.returnStatus === 'confirmed' ? `
                        <div class="return-info">
                            归还时间：${formatDateTime(record.returnTime)}<br>
                            归还人：${record.returner}
                            ${record.returnNote ? `<br>备注：${record.returnNote}` : ''}
                        </div>
                    ` : `
                        <div class="record-status ${isOverdue ? 'overdue' : ''}">
                            ${isOverdue ? '已超过' : '预计'}归还时间：${formatDateTime(record.expectedReturnTime)}
                        </div>
                    `}
                </div>
                <div class="record-actions">
                    ${!record.returnStatus ? `
                        <button class="btn btn-primary btn-sm" onclick="handleReturn(${labIndex}, ${index})">归还</button>
                    ` : ''}
                    <button class="btn btn-danger btn-sm" onclick="deleteBorrowRecord(${labIndex}, ${index})">删除</button>
                </div>
            </div>
        `;
    }).join('');
}

// 删除借出记录
window.deleteBorrowRecord = function(labIndex, recordIndex) {
    if (confirm('确定要删除这条借出记录吗？')) {
        labData[labIndex].borrowHistory.splice(recordIndex, 1);
        localStorage.setItem('labData', JSON.stringify(labData));
        editLab(labIndex); // 重新打开编辑窗口以刷新显示
        renderLabs(); // 更新主界面显示
    }
};

// 打开归还对话框
window.openReturnDialog = function(labIndex, borrowIndex) {
    const modal = document.getElementById('returnModal');
    const form = document.getElementById('returnForm');
    
    // 设置当前时间为默认值
    const now = new Date();
    document.getElementById('returnTime').value = now.toISOString().slice(0, 16);
    
    // 存储实训室和借出记录的索引
    form.dataset.labIndex = labIndex;
    form.dataset.borrowIndex = borrowIndex;
    
    // 绑定表单提交事件
    form.onsubmit = handleReturnSubmit;
    
    openModal('returnModal');
};

// 处理归还表单提交
function handleReturnSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const labIndex = parseInt(form.dataset.labIndex);
    const borrowIndex = parseInt(form.dataset.borrowIndex);
    
    // 获取归还信息
    const returnInfo = {
        returnTime: document.getElementById('returnTime').value,
        returner: document.getElementById('returner').value,
        returnNote: document.getElementById('returnNote').value,
        returnStatus: 'confirmed'
    };
    
    // 更新借出记录
    Object.assign(labData[labIndex].borrowHistory[borrowIndex], returnInfo);
    
    // 保存数据
    localStorage.setItem('labData', JSON.stringify(labData));
    
    // 关闭归还模态框
    closeModal('returnModal');
    
    // 重新打开编辑窗口以刷新显示
    editLab(labIndex);
    
    // 重新渲染实训室列表
    renderLabs();
    
    // 显示归还成功提示
    alert('归还成功！');
    
    // 更新借出情况汇总
    updateBorrowSummary();
};

// 添加更新借出情况汇总的函数
function updateBorrowSummary() {
    const modal = document.getElementById('summaryBorrowModal');
    const content = document.getElementById('borrowSummaryContent');
    if (!modal || !content) return;

    const now = new Date();
    const allRecords = [];

    // 收集所有借出记录
    labData.forEach(lab => {
        if (lab.borrowHistory) {
            lab.borrowHistory.forEach(record => {
                allRecords.push({
                    ...record,
                    labName: lab.name
                });
            });
        }
    });
    
    // 按借出时间倒序排序
    allRecords.sort((a, b) => new Date(b.borrowTime) - new Date(a.borrowTime));
    
    // 生成汇总内容
    let html = '';
    if (allRecords.length > 0) {
        // 分类统计
        const activeRecords = allRecords.filter(record => !record.returnStatus || record.returnStatus !== 'confirmed');
        const returnedRecords = allRecords.filter(record => record.returnStatus === 'confirmed');
        
        html = `
            <div class="summary-section">
                <h3>当前未归还（${activeRecords.length}）</h3>
                ${activeRecords.map(record => {
                    const isOverdue = new Date(record.expectedReturnTime) < now;
                    return renderBorrowRecord(record, isOverdue);
                }).join('')}
            </div>

            <div class="summary-section">
                <h3>已归还记录（${returnedRecords.length}）</h3>
                ${returnedRecords.map(record => renderBorrowRecord(record)).join('')}
            </div>
        `;
    } else {
        html = '<div class="no-data">当前没有任何借出记录</div>';
    }

    content.innerHTML = html;
    modal.style.display = 'block';

    // 绑定关闭按钮
    const closeBtn = document.getElementById('closeSummaryBorrowBtn');
    if (closeBtn) {
        closeBtn.onclick = () => modal.style.display = 'none';
    }
};

// 添加渲染单条借出记录的辅助函数
function renderBorrowRecord(record, isOverdue = false) {
    return `
        <div class="record ${isOverdue ? 'overdue' : ''} ${record.returnStatus === 'confirmed' ? 'returned' : ''}">
            <div class="record-header">
                <div class="record-lab">${record.labName}</div>
                <div class="record-time">
                    借出时间：${formatDateTime(record.borrowTime)}
                </div>
            </div>
            <div class="record-person">
                借出人：${record.borrower}
            </div>
            ${record.equipment ? `
                <div class="record-equipment">
                    借出器材：
                    <ul>
                        ${record.equipment.map(eq => `
                            <li>${eq.name} ${eq.model} ${eq.quantity}${eq.unit}</li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
            ${record.returnStatus === 'confirmed' ? `
                <div class="record-return">
                    归还时间：${formatDateTime(record.returnTime)}<br>
                    归还人：${record.returner}
                    ${record.returnNote ? `<br>备注：${record.returnNote}` : ''}
                </div>
            ` : `
                <div class="record-status ${isOverdue ? 'overdue' : ''}">
                    ${isOverdue ? '逾期未归还' : '未归还'}<br>
                    预计归还时间：${formatDateTime(record.expectedReturnTime)}
                </div>
            `}
        </div>
    `;
}

// 删除预约记录
window.deleteReservation = function(labIndex, reservationIndex) {
    if (confirm('确定要删除这条预约记录吗？')) {
        labData[labIndex].reservations.splice(reservationIndex, 1);
        localStorage.setItem('labData', JSON.stringify(labData));
        // 重新打开编辑窗口以刷新显示
        editLab(labIndex);
        // 重新渲染实训室列表
        renderLabs();
    }
};

// 删除实训室
window.deleteLab = function(index) {
    if (confirm('确定要删除这个实训室吗？')) {
            labData.splice(index, 1);
            localStorage.setItem('labData', JSON.stringify(labData));
            renderLabs();
        }
};

// 处理实训室表单提交
window.handleLabSubmit = function(e) {
    e.preventDefault();
    const form = e.target;
    const name = document.getElementById('labName').value.trim();
    const status = document.getElementById('labStatus').value;
    const equipment = document.getElementById('labEquipment').value
        .split('\n')
        .filter(item => item.trim());

    const newLab = {
                name: name,
        status: status,
        equipment: equipment,
        reservations: [],
        borrowHistory: []
    };

    if (form.dataset.editIndex !== undefined) {
        // 编辑现有实训室
        const index = parseInt(form.dataset.editIndex);
        labData[index] = { 
            ...labData[index], 
            ...newLab 
        };
    } else {
        // 添加新实训室
        labData.push(newLab);
    }

    // 保存到本地存储
            localStorage.setItem('labData', JSON.stringify(labData));
            
    // 关闭模态框
    closeModal('labModal');
    
    // 重新渲染实训室列表
            renderLabs();
};

// 通用的模态框操作函数
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
            delete form.dataset.editIndex;
        }
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

// 登出功能
window.logout = function() {
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'index.html';
};

// 处理登录
function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // 验证用户名和密码
    if (username === '罗志涛' && password === '123456') {
        // 设置登录状态
        localStorage.setItem('isLoggedIn', 'true');
        // 跳转到管理界面
        window.location.href = 'dashboard.html';
    } else {
        alert('用户名或密码错误！');
    }
}

// 预约情况汇总
window.showReservationSummary = function() {
    const modal = document.getElementById('summaryReservationModal');
    const content = document.getElementById('reservationSummaryContent');
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    let html = '';
    labData.forEach(lab => {
        if (lab.reservations && lab.reservations.length > 0) {
            // 过滤有效预约
            const validReservations = lab.reservations.filter(res => {
                if (res.date === today) {
                    const timeSlot = getTimeSlotMinutes(res.time);
                    return timeSlot && currentTime <= timeSlot.end;
                }
                return res.date > today;
            });

            if (validReservations.length > 0) {
                html += `
                    <div class="summary-item">
                        <h3>${lab.name}</h3>
                        ${validReservations
                            .sort((a, b) => new Date(a.date) - new Date(b.date))
                            .map(res => `
                                <div class="record">
                                    <span class="record-time">${res.date} ${res.time}</span>
                                    <span class="record-person">预约人：${res.person}</span>
                                    ${res.purpose ? `<div class="record-purpose">用途：${res.purpose}</div>` : ''}
                                </div>
                            `).join('')}
                    </div>
                `;
            }
        }
    });

    if (!html) {
        html = '<div class="no-data">当前没有任何有效预约记录</div>';
    }

    content.innerHTML = html;
    modal.style.display = 'block';

    // 绑定关闭按钮
    const closeBtn = document.getElementById('closeSummaryReservationBtn');
    if (closeBtn) {
        closeBtn.onclick = () => modal.style.display = 'none';
    }
};

// 显示借出情况
window.showBorrowSummary = function() {
    const modal = document.getElementById('summaryBorrowModal');
    const content = document.getElementById('borrowSummaryContent');
    if (!modal || !content) return;

    // 生成实训室选择下拉框
    const labSelector = `
        <div class="lab-selector">
            <label for="labFilter">选择实训室：</label>
            <select id="labFilter" class="form-control" onchange="filterBorrowRecords()">
                <option value="all">所有实训室</option>
                ${labData.map(lab => `
                    <option value="${lab.name}">${lab.name}</option>
                `).join('')}
            </select>
        </div>
    `;

    // 添加选择器和内容容器
    content.innerHTML = `
        ${labSelector}
        <div id="borrowRecordsContent"></div>
    `;

    // 显示模态框
    modal.style.display = 'block';

    // 绑定关闭按钮
    const closeBtn = document.getElementById('closeSummaryBorrowBtn');
    if (closeBtn) {
        closeBtn.onclick = () => modal.style.display = 'none';
    }

    // 初始显示所有记录
    filterBorrowRecords();
};

// 过滤借出记录
window.filterBorrowRecords = function() {
    const content = document.getElementById('borrowRecordsContent');
    const selectedLab = document.getElementById('labFilter').value;
    const now = new Date();
    let allRecords = [];

    // 收集所有借出记录
    labData.forEach(lab => {
        if (lab.borrowHistory) {
            lab.borrowHistory.forEach(record => {
                allRecords.push({
                    ...record,
                    labName: lab.name
                });
            });
        }
    });

    // 按选择的实训室过滤记录
    if (selectedLab !== 'all') {
        allRecords = allRecords.filter(record => record.labName === selectedLab);
    }

    // 按借出时间倒序排序
    allRecords.sort((a, b) => new Date(b.borrowTime) - new Date(a.borrowTime));

    // 分类统计
    const activeRecords = allRecords.filter(record => !record.returnStatus || record.returnStatus !== 'confirmed');
    const returnedRecords = allRecords.filter(record => record.returnStatus === 'confirmed');

    // 生成汇总内容
    let html = '';
    if (allRecords.length > 0) {
        html = `
            <div class="summary-stats">
                <div class="stat-item">
                    <span class="stat-label">总借出次数：</span>
                    <span class="stat-value">${allRecords.length}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">未归还：</span>
                    <span class="stat-value ${activeRecords.length > 0 ? 'text-danger' : ''}">${activeRecords.length}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">已归还：</span>
                    <span class="stat-value text-success">${returnedRecords.length}</span>
                </div>
            </div>

            <div class="summary-section">
                <h3>当前未归还（${activeRecords.length}）</h3>
                ${activeRecords.map(record => {
                    const isOverdue = new Date(record.expectedReturnTime) < now;
                    return renderBorrowRecord(record, isOverdue);
                }).join('')}
            </div>

            <div class="summary-section">
                <h3>已归还记录（${returnedRecords.length}）</h3>
                ${returnedRecords.map(record => renderBorrowRecord(record)).join('')}
            </div>
        `;
    } else {
        html = '<div class="no-data">当前没有任何借出记录</div>';
    }

    content.innerHTML = html;
};

// 渲染单条借出记录
function renderBorrowRecord(record, isOverdue = false) {
    return `
        <div class="record ${isOverdue ? 'overdue' : ''} ${record.returnStatus === 'confirmed' ? 'returned' : ''}">
            <div class="record-header">
                <div class="record-lab">${record.labName}</div>
                <div class="record-time">
                    借出时间：${formatDateTime(record.borrowTime)}
                </div>
            </div>
            <div class="record-person">
                借出人：${record.borrower}
            </div>
            ${record.equipment ? `
                <div class="record-equipment">
                    借出器材：
                    <ul>
                        ${record.equipment.map(eq => `
                            <li>${eq.name} ${eq.model} ${eq.quantity}${eq.unit}</li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
            ${record.returnStatus === 'confirmed' ? `
                <div class="record-return">
                    归还时间：${formatDateTime(record.returnTime)}<br>
                    归还人：${record.returner}
                    ${record.returnNote ? `<br>备注：${record.returnNote}` : ''}
                </div>
            ` : `
                <div class="record-status ${isOverdue ? 'overdue' : ''}">
                    ${isOverdue ? '逾期未归还' : '未归还'}<br>
                    预计归还时间：${formatDateTime(record.expectedReturnTime)}
                </div>
            `}
        </div>
    `;
}

// 导出数据
window.exportData = function() {
        const data = {
            labData: labData,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        
    const defaultFileName = `lab_data_${new Date().toISOString().split('T')[0]}.json`;
    
    // 使用传统的下载方式
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
    a.download = defaultFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
};

// 格式化日期时间
function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 打开预约模态框
window.openReservation = function(index) {
    const modal = document.getElementById('reservationModal');
    const form = document.getElementById('reservationForm');
    
    // 设置最小日期为今天
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reservationDate').min = today;
    
    form.dataset.labIndex = index;
    openModal('reservationModal');

    // 绑定取消按钮事件
    const cancelBtn = document.getElementById('cancelReservationBtn');
    if (cancelBtn) {
        cancelBtn.onclick = () => closeModal('reservationModal');
    }

    // 绑定表单提交事件
    form.onsubmit = handleReservationSubmit;
};

// 处理预约表单提交
function handleReservationSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const labIndex = parseInt(form.dataset.labIndex);
    
    const reservation = {
        date: document.getElementById('reservationDate').value,
        time: document.getElementById('classTime').value,
        person: document.getElementById('reservationPerson').value,
        purpose: document.getElementById('reservationPurpose').value
    };

    // 添加预约记录
    if (!labData[labIndex].reservations) {
        labData[labIndex].reservations = [];
    }
    labData[labIndex].reservations.push(reservation);

    // 保存数据
                    localStorage.setItem('labData', JSON.stringify(labData));
    
    // 关闭模态框
    closeModal('reservationModal');
    
    // 重新渲染
                    renderLabs();
    alert('预约成功！');
}

// 打开借出管理
window.openBorrowManagement = function(index) {
    const modal = document.getElementById('borrowModal');
    const form = document.getElementById('borrowForm');
    
    // 设置当前时间为借出时间的默认值
    const now = new Date();
    document.getElementById('borrowTime').value = now.toISOString().slice(0, 16);
    
    // 设置预计归还时间默认值（当前时间加8小时）
    const expectedReturn = new Date(now);
    expectedReturn.setHours(expectedReturn.getHours() + 8);
    document.getElementById('expectedReturnTime').value = expectedReturn.toISOString().slice(0, 16);
    
    form.dataset.labIndex = index;
    openModal('borrowModal');

    // 绑定表单提交事件
    form.onsubmit = handleBorrowSubmit;
};

// 处理借出表单提交
function handleBorrowSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const labIndex = parseInt(form.dataset.labIndex);

    // 获取并验证时间
    const borrowTime = document.getElementById('borrowTime').value;
    const expectedReturnTime = document.getElementById('expectedReturnTime').value;
    
    // 验证预计归还时间是否晚于借出时间
    if (new Date(expectedReturnTime) <= new Date(borrowTime)) {
        alert('预计归还时间必须晚于借出时间！');
        return;
    }

    // 获取借出信息
    const borrowRecord = {
        borrowTime: borrowTime,
        borrower: document.getElementById('borrower').value,
        equipment: [],
        expectedReturnTime: expectedReturnTime,
        purpose: document.getElementById('borrowPurpose').value
    };

    // 获取借出设备信息
    const equipmentList = document.getElementById('borrowEquipmentList');
    const equipmentItems = equipmentList.getElementsByClassName('equipment-item');
    for (let item of equipmentItems) {
        const inputs = item.getElementsByTagName('input');
        const select = item.querySelector('.unit-select');
        if (inputs[0].value) {
            borrowRecord.equipment.push({
                name: inputs[0].value,
                model: inputs[1].value,
                quantity: inputs[2].value,
                unit: select.value
            });
        }
    }

    // 添加借出记录
    if (!labData[labIndex].borrowHistory) {
        labData[labIndex].borrowHistory = [];
    }
    labData[labIndex].borrowHistory.push(borrowRecord);

    // 保存数据
    localStorage.setItem('labData', JSON.stringify(labData));
    
    // 关闭模态框
    closeModal('borrowModal');
    
    // 重新渲染
    renderLabs();
    alert('借出成功！');
}

// 修改借出状态显示函数
function getBorrowStatusDisplay(lab) {
    if (lab.borrowHistory && lab.borrowHistory.length > 0) {
        // 获取所有未归还的借出记录
        const unreturnedBorrows = lab.borrowHistory.filter(borrow => 
            !borrow.returnStatus || borrow.returnStatus !== 'confirmed'
        );

        if (unreturnedBorrows.length > 0) {
            const now = new Date();
            
            return `
                <h4>未归还器材：</h4>
                ${unreturnedBorrows.map(borrow => {
                    const isOverdue = new Date(borrow.expectedReturnTime) < now;
                    return `
                        <div class="borrow-record ${isOverdue ? 'overdue' : ''}">
                            <p>借出人：${borrow.borrower}</p>
                            <p>借出时间：${formatDateTime(borrow.borrowTime)}</p>
                            <p class="${isOverdue ? 'text-danger' : 'text-muted'}">
                                ${isOverdue ? '已超过' : '预计'}归还时间：${formatDateTime(borrow.expectedReturnTime)}
                            </p>
                            ${borrow.equipment ? `
                                <div class="equipment-details">
                                    <p>借出器材：</p>
                                    <ul>
                                        ${borrow.equipment.map(eq => `
                                            <li>${eq.name} ${eq.model} ${eq.quantity}${eq.unit}</li>
                                        `).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                            ${borrow.purpose ? `
                                <p class="text-muted">用途：${borrow.purpose}</p>
                            ` : ''}
                        </div>
                    `;
                }).join('<hr>')}
            `;
        }
    }
    
    // 如果没有未归还的借出记录
    return '<p class="no-borrow">暂无未归还器材</p>';
}

// 修改渲染实训室列表中的状态文本显示函数
function getStatusDisplay(status, lab) {
    let statusText = '';
    
    // 基本状态显示
    switch (status) {
        case 'free':
            statusText = '空闲';
            break;
        case 'occupied':
            statusText = '使用中';
            break;
        case 'reserved':
            statusText = '未来有预约';
            break;
        case 'today-reserved':
            statusText = '今天有预约';
            break;
        default:
            statusText = '未知状态';
    }

    // 检查是否有未归还的借出
    if (lab.borrowHistory && lab.borrowHistory.length > 0) {
        const latestBorrow = lab.borrowHistory[lab.borrowHistory.length - 1];
        if (!latestBorrow.returnStatus || latestBorrow.returnStatus !== 'confirmed') {
            statusText = '器材借出中';
        }
    }

    return statusText;
}

// 修改折叠功能的 JavaScript 函数
window.toggleBorrowInfo = function(labId) {
    const details = document.getElementById(`borrowInfo_${labId}`);
    if (details) {
        details.style.display = details.style.display === 'none' ? 'block' : 'none';
    }
};

// 添加切换借出信息显示的函数
window.toggleBorrow = function(index) {
    const labCard = document.querySelectorAll('.lab-card')[index];
    const borrowInfo = labCard.querySelector('.borrow-info');
    const button = labCard.querySelector('button[onclick^="toggleBorrow"]');
    
    if (borrowInfo.style.display === 'none') {
        borrowInfo.style.display = 'block';
        button.textContent = '隐藏借出';
    } else {
        borrowInfo.style.display = 'none';
        button.textContent = '查看借出';
    }
};

// 添加检查是否有未归还借出记录的辅助函数
function hasUnreturnedBorrows(lab) {
    if (lab.borrowHistory && lab.borrowHistory.length > 0) {
        return lab.borrowHistory.some(borrow => 
            !borrow.returnStatus || borrow.returnStatus !== 'confirmed'
        );
    }
    return false;
}

// 添加处理归还的函数
window.handleReturn = function(labIndex, recordIndex) {
    // 打开归还模态框
    const modal = document.getElementById('returnModal');
    const form = document.getElementById('returnForm');
    
    // 设置当前时间为默认值
    const now = new Date();
    document.getElementById('returnTime').value = now.toISOString().slice(0, 16);
    
    // 清空其他字段
    document.getElementById('returner').value = '';
    document.getElementById('returnNote').value = '';
    
    // 存储实训室和借出记录的索引
    form.dataset.labIndex = labIndex;
    form.dataset.borrowIndex = recordIndex;
    
    // 绑定表单提交事件
    form.onsubmit = handleReturnSubmit;
    
    // 打开归还模态框
    openModal('returnModal');
    
    // 关闭编辑模态框
    closeModal('labModal');
};
