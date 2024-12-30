// 全局变量
const ADMIN_PASSWORD = 'admin';
let labData = [];
let pendingAction = null;

// 初始化数据
try {
    const savedData = localStorage.getItem('labData');
    if (savedData) {
        labData = JSON.parse(savedData);
    }
} catch (error) {
    console.error('初始化数据失败:', error);
}

// 模拟用户数据
const validUser = {
    username: '罗志涛',
    password: '123456'
};

// 处理登录
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === validUser.username && password === validUser.password) {
        localStorage.setItem('isLoggedIn', 'true');
        window.location.href = 'dashboard.html';
    } else {
        alert('账号或密码错误！');
    }
}

// 验证管理员密码
function verifyAdminPassword(password) {
    return password === ADMIN_PASSWORD;
}

// 显示管理员验证模态框
function showAdminAuth(action) {
    const adminAuthModal = document.getElementById('adminAuthModal');
    const adminAuthForm = document.getElementById('adminAuthForm');
    const cancelAuthBtn = document.getElementById('cancelAuthBtn');

    // 保存当前打开的其他模态框
    const openModals = Array.from(document.querySelectorAll('.modal')).filter(modal => 
        modal.id !== 'adminAuthModal' && modal.style.display === 'block'
    );

    // 临时隐藏其他模态框
    openModals.forEach(modal => {
        modal.style.display = 'none';
    });

    pendingAction = () => {
        // 执行操作
        action();
        
        // 恢复之前打开的模态框
        openModals.forEach(modal => {
            modal.style.display = 'block';
        });
    };

    adminAuthModal.style.display = 'block';

    cancelAuthBtn.onclick = () => {
        adminAuthModal.style.display = 'none';
        adminAuthForm.reset();
        pendingAction = null;
        
        // 恢复之前打开的模态框
        openModals.forEach(modal => {
            modal.style.display = 'block';
        });
    };

    adminAuthForm.onsubmit = (e) => {
        e.preventDefault();
        const password = document.getElementById('adminPassword').value;

        if (verifyAdminPassword(password)) {
            adminAuthModal.style.display = 'none';
            adminAuthForm.reset();
            if (pendingAction) {
                pendingAction();
            }
        } else {
            alert('管理员密码错误！');
        }
    };
}

// 更新实训室状态
function updateLabStatus(lab) {
    // 如果没有预约记录，直接返回空闲状态
    if (!lab.reservations || lab.reservations.length === 0) {
        return 'free';
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const today = now.toISOString().split('T')[0];

    // 检查是否有当前正在进行的预约
    const currentReservation = lab.reservations.find(reservation => {
        if (reservation.date !== today) return false;

        const timeRange = getTimeRange(reservation.time);
        if (!timeRange) return false;

        return currentTime >= timeRange.start && currentTime <= timeRange.end;
    });

    if (currentReservation) {
        lab.currentUser = currentReservation.person;
        return 'occupied';
    }

    // 检查当天是否还有未开始的预约
    const hasTodayReservation = lab.reservations.some(reservation => {
        if (reservation.date === today) {
            const timeRange = getTimeRange(reservation.time);
            if (!timeRange) return false;
            
            // 只检查未开始的预约
            return currentTime < timeRange.start;
        }
        return false;
    });

    if (hasTodayReservation) {
        return 'today-reserved';
    }

    // 检查是否有未来的预约
    const hasUpcomingReservation = lab.reservations.some(reservation => {
        return reservation.date > today;
    });

    if (hasUpcomingReservation) {
        return 'reserved';  // 未来有预约，显示黄色
    }

    // 当天没有预约且没有使用，显示为空闲状态
    return 'free';
}

// 获取时间段的起止时间（分钟）
function getTimeRange(timeSlot) {
    const timeRanges = {
        '1-2节': { start: 8 * 60 + 30, end: 10 * 60 }, // 8:30-10:00
        '3-4节': { start: 10 * 60 + 15, end: 11 * 60 + 45 }, // 10:15-11:45
        '5-6节': { start: 14 * 60 + 30, end: 16 * 60 }, // 14:30-16:00
        '7-8节': { start: 16 * 60 + 10, end: 17 * 60 + 40 } // 16:10-17:40
    };
    return timeRanges[timeSlot];
}

// 检查是否逾期
function checkOverdue(record) {
    if (!record.returnStatus || record.returnStatus !== 'confirmed') {
        const expectedReturn = new Date(record.expectedReturnTime);
        const now = new Date();
        return now > expectedReturn;
    }
    return false;
}

// 渲染借用历史
function renderBorrowHistory(history, labIndex) {
    if (!history || history.length === 0) {
        return '<div class="no-history">暂无借用记录</div>';
    }

    return history.map((record, recordIndex) => {
        const isOverdue = checkOverdue(record);
        return `
        <div class="borrow-record ${isOverdue ? 'overdue' : ''}">
            <div>借出时间：${formatDateTime(record.borrowTime)}</div>
            <div>借出人：${record.borrower}</div>
            <div class="borrowed-equipment">
                <h4>借出器材：</h4>
                ${record.equipment ? record.equipment.map(item => `
                    <div class="equipment-detail">
                        <span>名称：${item.name}</span>
                        <span>型号：${item.model}</span>
                        <span>数量：${item.quantity}${item.unit || '个'}</span>
                    </div>
                `).join('') : '无器材记录'}
            </div>
            <div>预计归还：${formatDateTime(record.expectedReturnTime)}</div>
            ${!record.returnStatus || record.returnStatus !== 'confirmed' ? 
                isOverdue ? `<div class="status-tag overdue">逾期未还</div>` : 
                `<div class="status-tag">未归还</div>`
            : ''}
            ${record.returnTime ? `
                <div>归还时间：${formatDateTime(record.returnTime)}</div>
                <div>归还人：${record.returner}</div>
                ${record.returnNote ? `<div>备注：${record.returnNote}</div>` : ''}
                ${record.returnStatus === 'confirmed' ? 
                    `<div class="status-tag confirmed">已归还</div>` : 
                    `<div class="status-tag pending">待确认</div>`
                }
            ` : `
                <button class="btn btn-success btn-sm" onclick="confirmReturn(${labIndex}, ${recordIndex})">确认归还</button>
            `}
        </div>
    `}).join('');
}

// 格式化日期时间
function formatDateTime(dateTimeStr) {
    const date = new Date(dateTimeStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 渲染实训室列表
function renderLabs() {
    const labGrid = document.getElementById('labGrid');
    if (!labGrid) return;

    labGrid.innerHTML = '';
    labData.forEach((lab, index) => {
        // 检查是否有逾期记录
        const hasOverdue = lab.borrowHistory && lab.borrowHistory.some(record => checkOverdue(record));
        
        // 更新实训室状态
        const status = updateLabStatus(lab);
        lab.status = status;

        const labCard = document.createElement('div');
        labCard.className = `lab-card status-${status} ${hasOverdue ? 'has-overdue' : ''}`;
        labCard.innerHTML = `
            <h3>${lab.name}</h3>
            <p>状态: <span class="status-text ${status}">${getStatusText(status)}</span></p>
            ${status === 'occupied' ? `<p class="current-user">使用人：${lab.currentUser}</p>` : ''}
            ${status === 'borrowed' ? `
                <p class="current-user">借用人：${lab.currentBorrower}</p>
                ${hasOverdue ? '<p class="overdue-warning">⚠️ 存在逾期未还</p>' : ''}
            ` : ''}
            <div class="equipment-list" style="display: none;">
                <h4>设备列表：</h4>
                <ul>
                    ${(lab.equipment || []).map((item, i) => `<li>${i + 1}. ${item}</li>`).join('')}
                </ul>
            </div>
            <button class="btn btn-info btn-sm" onclick="toggleEquipment(${index})">查看设备</button>
            <div class="reservation-info" style="display: none;">
                <h4>预约信息：</h4>
                ${renderReservations(lab.reservations || [])}
            </div>
            <button class="btn btn-info btn-sm" onclick="toggleReservation(${index})">查看预约</button>
            <div class="button-group">
                <button class="btn btn-primary" onclick="openBorrowManagement(${index})">借出</button>
                <button class="btn btn-primary" onclick="openReservation(${index})">预约</button>
                <button class="btn btn-primary" onclick="editLab(${index})">编辑</button>
                <button class="btn btn-danger" onclick="deleteLab(${index})">删除</button>
            </div>
        `;
        labGrid.appendChild(labCard);
    });

    // 保存更新后的状态
    localStorage.setItem('labData', JSON.stringify(labData));
}

// 获取状态文本
function getStatusText(status) {
    const statusMap = {
        free: '空闲',
        reserved: '未来有预约',
        'today-reserved': '今天有预约',
        occupied: '使用中',
        borrowed: '已借出'
    };
    return statusMap[status] || status;
}

// 获取星期几的函数
function getWeekDay(dateString) {
    const date = new Date(dateString);
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekDays[date.getDay()];
}

// 渲染预约信息
function renderReservations(reservations) {
    if (!reservations || reservations.length === 0) {
        return '<div class="no-reservations">暂无预约</div>';
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // 过滤出当天和未来的预约
    const validReservations = reservations.filter(reservation => {
        if (reservation.date === today) {
            const timeRange = getTimeRange(reservation.time);
            return currentTime <= timeRange.end;
        }
        return reservation.date > today;
    });

    if (validReservations.length === 0) {
        return '<div class="no-reservations">暂无预约</div>';
    }

    // 按日期和时间排序
    validReservations.sort((a, b) => {
        if (a.date !== b.date) {
            return a.date.localeCompare(b.date);
        }
        return getTimeRange(a.time).start - getTimeRange(b.time).start;
    });

    return validReservations.map(reservation => {
        const timeRange = getTimeRange(reservation.time);
        let status = '未开始';
        let statusColor = '#ffc107';
        
        if (reservation.date === today) {
            if (currentTime >= timeRange.start && currentTime <= timeRange.end) {
                status = '使用中';
                statusColor = '#28a745';
            }
        } else {
            const weekDay = getWeekDay(reservation.date);
            status = `${weekDay}预约使用`;
            statusColor = '#ffc107';
        }

        return `
            <div class="reservation-item">
                <div>日期：${reservation.date}</div>
                <div>时间：${reservation.time}</div>
                <div>预约人：${reservation.person}</div>
                ${reservation.purpose ? `<div>用途：${reservation.purpose}</div>` : ''}
                <div style="color: ${statusColor}">状态：${status}</div>
            </div>
        `;
    }).join('');
}

// 处理实训室表单提交
function handleLabSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const editIndex = parseInt(form.dataset.editIndex);

    const labInfo = {
        name: document.getElementById('labName').value.trim(),
        status: document.getElementById('labStatus').value,
        equipment: document.getElementById('labEquipment').value
            .split('\n')
            .map(item => item.trim())
            .filter(item => item !== '')
    };

    if (editIndex >= 0) {
        labData[editIndex] = {
            ...labData[editIndex],
            ...labInfo
        };
    } else {
        labData.push(labInfo);
    }

    localStorage.setItem('labData', JSON.stringify(labData));
    renderLabs();
    document.getElementById('labModal').style.display = 'none';
    form.reset();
}

// 处理预约提交
function handleReservationSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const labIndex = parseInt(form.dataset.labIndex);
    
    if (isNaN(labIndex) || labIndex < 0 || labIndex >= labData.length) {
        alert('系统错误：未找到实训室信息');
        return;
    }

    const reservation = {
        date: document.getElementById('reservationDate').value,
        time: document.getElementById('classTime').value,
        person: document.getElementById('reservationPerson').value.trim(),
        purpose: document.getElementById('reservationPurpose').value.trim()
    };

    if (!reservation.date || !reservation.time || !reservation.person) {
        alert('请填写完整的预约信息');
        return;
    }

    const lab = labData[labIndex];
    if (!lab.reservations) {
        lab.reservations = [];
    }

    lab.reservations.push(reservation);
    localStorage.setItem('labData', JSON.stringify(labData));
    renderLabs();
    
    document.getElementById('reservationModal').style.display = 'none';
    form.reset();
}

// 页面加载的初始化
document.addEventListener('DOMContentLoaded', () => {
    // 清除可能存在的旧登录状态
    if (window.location.pathname.toLowerCase().includes('index.html') || 
        window.location.pathname.endsWith('/')) {
        localStorage.removeItem('isLoggedIn');
    }

    // 检查登录状态
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const isLoginPage = window.location.pathname.toLowerCase().includes('index.html') || 
                       window.location.pathname.endsWith('/');
    const isDashboard = window.location.pathname.toLowerCase().includes('dashboard.html');

    if (!isLoggedIn && isDashboard) {
        window.location.href = 'index.html';
        return;
    }

    if (isLoggedIn && isLoginPage) {
        window.location.href = 'dashboard.html';
        return;
    }

    // 获取登录表单
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        return;
    }

    // 如果是 dashboard 页面且已登录，初始化功能
    if (isDashboard && isLoggedIn) {
        // 渲染实训室列表
        renderLabs();

        // 每分钟更新一次状态
        setInterval(renderLabs, 60000);

        // 绑定按钮事件
        document.getElementById('addLabBtn').addEventListener('click', () => {
            showAdminAuth(() => {
                document.getElementById('modalTitle').textContent = '添加实训室';
                document.getElementById('labForm').reset();
                document.getElementById('labModal').style.display = 'block';
            });
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            if (confirm('确定要退出登录吗？')) {
                localStorage.clear(); // 清除所有本地存储数据
                window.location.href = 'index.html';
            }
        });

        // 绑定表单事件
        document.getElementById('labForm').addEventListener('submit', handleLabSubmit);
        document.getElementById('reservationForm').addEventListener('submit', handleReservationSubmit);

        // 绑定取消按钮事件
        document.getElementById('cancelBtn').addEventListener('click', () => {
            document.getElementById('labModal').style.display = 'none';
        });

        document.getElementById('cancelReservationBtn').addEventListener('click', () => {
            document.getElementById('reservationModal').style.display = 'none';
        });

        // 绑定借出和归还表单事件
        document.getElementById('borrowForm').addEventListener('submit', handleBorrowSubmit);
        document.getElementById('returnForm').addEventListener('submit', handleReturnSubmit);

        // 绑定取消按钮事件
        document.getElementById('cancelBorrowBtn').addEventListener('click', () => {
            document.getElementById('borrowModal').style.display = 'none';
        });

        document.getElementById('cancelReturnBtn').addEventListener('click', () => {
            document.getElementById('returnModal').style.display = 'none';
        });

        // 添加器材按钮事件
        const addEquipmentBtn = document.getElementById('addEquipmentBtn');
        if (addEquipmentBtn) {
            addEquipmentBtn.addEventListener('click', addEquipmentRow);
        }

        // 绑定汇总按钮事件
        document.getElementById('summaryReservationBtn').addEventListener('click', () => {
            const summaryContent = document.getElementById('reservationSummaryContent');
            summaryContent.innerHTML = generateReservationSummary();
            document.getElementById('summaryReservationModal').style.display = 'block';
        });

        document.getElementById('summaryBorrowBtn').addEventListener('click', () => {
            const summaryContent = document.getElementById('borrowSummaryContent');
            summaryContent.innerHTML = generateBorrowSummary();
            document.getElementById('summaryBorrowModal').style.display = 'block';
        });

        // 绑定关闭按钮事件
        document.getElementById('closeSummaryReservationBtn').addEventListener('click', () => {
            document.getElementById('summaryReservationModal').style.display = 'none';
        });

        document.getElementById('closeSummaryBorrowBtn').addEventListener('click', () => {
            document.getElementById('summaryBorrowModal').style.display = 'none';
        });

        // 绑定导出按钮事件
        document.getElementById('exportDataBtn').addEventListener('click', exportData);
        
        // 绑定导入按钮事件
        document.getElementById('importDataBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        
        document.getElementById('importFile').addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                importData(e.target.files[0]);
                e.target.value = ''; // 清除选择的文件，允许重复导入相同文件
            }
        });
    }
});

// 打开预约模态框
window.openReservation = function(index) {
    const reservationModal = document.getElementById('reservationModal');
    const reservationForm = document.getElementById('reservationForm');
    
    // 设置最小日期为今天
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reservationDate').min = today;
    
    reservationForm.dataset.labIndex = index;
    reservationModal.style.display = 'block';
};

// 编辑实训室
window.editLab = function(index) {
    showAdminAuth(() => {
        const lab = labData[index];
        document.getElementById('modalTitle').textContent = '编辑实训室';
        document.getElementById('labName').value = lab.name;
        document.getElementById('labStatus').value = lab.status || 'free';
        document.getElementById('labEquipment').value = (lab.equipment || []).join('\n');
        document.getElementById('labForm').dataset.editIndex = index;

        // 添加预约和借用管理部分
        const managementContent = document.createElement('div');
        managementContent.className = 'management-content';
        managementContent.innerHTML = `
            <div class="reservation-management">
                <h3>预约管理</h3>
                <div class="reservation-list">
                    ${(lab.reservations || []).map((reservation, resIndex) => `
                        <div class="reservation-item">
                            <div>日期：${reservation.date}</div>
                            <div>时间：${reservation.time}</div>
                            <div>预约人：${reservation.person}</div>
                            ${reservation.purpose ? `<div>用途：${reservation.purpose}</div>` : ''}
                            <button class="btn btn-danger btn-sm" onclick="deleteReservation(${index}, ${resIndex})">删除预约</button>
                        </div>
                    `).join('') || '<div class="no-reservations">暂无预约</div>'}
                </div>
            </div>
            <div class="borrow-management">
                <h3>借用管理</h3>
                <div class="borrow-list">
                    ${(lab.borrowHistory || []).map((record, recordIndex) => `
                        <div class="borrow-record">
                            <div>借出时间：${formatDateTime(record.borrowTime)}</div>
                            <div>借出人：${record.borrower}</div>
                            <div>预计归还：${formatDateTime(record.expectedReturnTime)}</div>
                            ${record.returnTime ? `
                                <div>归还时间：${formatDateTime(record.returnTime)}</div>
                                <div>归还人：${record.returner}</div>
                                ${record.returnNote ? `<div>备注：${record.returnNote}</div>` : ''}
                            ` : '<div class="status-tag">未归还</div>'}
                            <button class="btn btn-danger btn-sm" onclick="deleteBorrowRecord(${index}, ${recordIndex})">删除记录</button>
                        </div>
                    `).join('') || '<div class="no-history">暂无借用记录</div>'}
                </div>
            </div>
        `;

        const modalContent = document.querySelector('#labModal .modal-content');
        const existingManagement = modalContent.querySelector('.management-content');
        if (existingManagement) {
            existingManagement.remove();
        }
        modalContent.appendChild(managementContent);

        document.getElementById('labModal').style.display = 'block';
    });
};

// 删除预约
window.deleteReservation = function(labIndex, reservationIndex) {
    if (confirm('确定要删除这条预约记录吗？')) {
        labData[labIndex].reservations.splice(reservationIndex, 1);
        localStorage.setItem('labData', JSON.stringify(labData));
        
        // 新渲染预约管理部分
        const lab = labData[labIndex];
        const reservationList = document.querySelector('.reservation-list');
        reservationList.innerHTML = (lab.reservations || []).map((reservation, resIndex) => `
            <div class="reservation-item">
                <div>日期：${reservation.date}</div>
                <div>时间：${reservation.time}</div>
                <div>预约人：${reservation.person}</div>
                ${reservation.purpose ? `<div>用途：${reservation.purpose}</div>` : ''}
                <button class="btn btn-danger btn-sm" onclick="deleteReservation(${labIndex}, ${resIndex})">删除预约</button>
            </div>
        `).join('') || '<div class="no-reservations">暂无预约</div>';

        // 更新主界面显示
        renderLabs();
    }
};

// 删除实训室
window.deleteLab = function(index) {
    showAdminAuth(() => {
        if (confirm('确定要删除这个实训室吗？此操作不可恢复。')) {
            labData.splice(index, 1);
            localStorage.setItem('labData', JSON.stringify(labData));
            renderLabs();
        }
    });
};

// 切换设备列表显示
window.toggleEquipment = function(index) {
    const labCard = document.querySelectorAll('.lab-card')[index];
    const equipmentList = labCard.querySelector('.equipment-list');
    const toggleBtn = labCard.querySelector('.btn-info:nth-of-type(1)');

    if (equipmentList.style.display === 'none') {
        equipmentList.style.display = 'block';
        toggleBtn.textContent = '隐藏设备';
    } else {
        equipmentList.style.display = 'none';
        toggleBtn.textContent = '查看设备';
    }
};

// 打开借出模态框
window.openBorrow = function(index) {
    showAdminAuth(() => {
        const borrowModal = document.getElementById('borrowModal');
        const borrowForm = document.getElementById('borrowForm');
        
        // 设置当前时间为默认值
        const now = new Date();
        document.getElementById('borrowTime').value = now.toISOString().slice(0, 16);
        
        borrowForm.dataset.labIndex = index;
        borrowModal.style.display = 'block';
    });
};

// 打开归还模态框
window.openReturn = function(index) {
    showAdminAuth(() => {
        const returnModal = document.getElementById('returnModal');
        const returnForm = document.getElementById('returnForm');
        
        // 设置当前时间为默认值
        const now = new Date();
        document.getElementById('returnTime').value = now.toISOString().slice(0, 16);
        
        returnForm.dataset.labIndex = index;
        returnModal.style.display = 'block';
    });
};

// 处理借出表单提交
function handleBorrowSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const labIndex = parseInt(form.dataset.labIndex);
    
    if (isNaN(labIndex) || labIndex < 0 || labIndex >= labData.length) {
        alert('系统错误：未找到实训室信息');
        return;
    }

    const equipmentList = [];
    form.querySelectorAll('.equipment-item').forEach(item => {
        equipmentList.push({
            name: item.querySelector('input[placeholder="器材名称"]').value.trim(),
            model: item.querySelector('input[placeholder="型号"]').value.trim(),
            quantity: item.querySelector('input[placeholder="数量"]').value,
            unit: item.querySelector('.unit-select').value
        });
    });

    const borrowRecord = {
        borrowTime: document.getElementById('borrowTime').value,
        borrower: document.getElementById('borrower').value.trim(),
        expectedReturnTime: document.getElementById('expectedReturnTime').value,
        equipment: equipmentList
    };

    const lab = labData[labIndex];
    if (!lab.borrowHistory) {
        lab.borrowHistory = [];
    }

    lab.borrowHistory.push(borrowRecord);
    lab.status = 'borrowed';
    lab.currentBorrower = borrowRecord.borrower;

    localStorage.setItem('labData', JSON.stringify(labData));
    renderLabs();
    
    document.getElementById('borrowModal').style.display = 'none';
    form.reset();
}

// 处理归还表单提交
function handleReturnSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const labIndex = parseInt(form.dataset.labIndex);
    
    if (isNaN(labIndex) || labIndex < 0 || labIndex >= labData.length) {
        alert('系统错误：未找到实训室信息');
        return;
    }

    const lab = labData[labIndex];
    const currentBorrowRecord = lab.borrowHistory[lab.borrowHistory.length - 1];

    currentBorrowRecord.returnTime = document.getElementById('returnTime').value;
    currentBorrowRecord.returner = document.getElementById('returner').value.trim();
    currentBorrowRecord.returnNote = document.getElementById('returnNote').value.trim();
    currentBorrowRecord.returnStatus = 'pending';

    localStorage.setItem('labData', JSON.stringify(labData));
    renderLabs();
    
    document.getElementById('returnModal').style.display = 'none';
    form.reset();
    alert('归还申请已提交，等待管理员确认');
}

// 删除借用记录
window.deleteBorrowRecord = function(labIndex, recordIndex) {
    showAdminAuth(() => {
        if (confirm('确定要删除这条借用记录吗？')) {
            const lab = labData[labIndex];
            lab.borrowHistory.splice(recordIndex, 1);
            
            // 如果删除的是最后一条未归还的记录，更新实训室状态
            if (recordIndex === lab.borrowHistory.length && lab.status === 'borrowed') {
                lab.status = 'free';
                delete lab.currentBorrower;
            }
            
            localStorage.setItem('labData', JSON.stringify(labData));
            
            // 重新渲染借用管理部分
            const borrowList = document.querySelector('.borrow-list');
            if (borrowList) {
                borrowList.innerHTML = (lab.borrowHistory || []).map((record, recIndex) => `
                    <div class="borrow-record">
                        <div>借出时间：${formatDateTime(record.borrowTime)}</div>
                        <div>借出人：${record.borrower}</div>
                        <div>预计归还：${formatDateTime(record.expectedReturnTime)}</div>
                        ${record.returnTime ? `
                            <div>归还时间：${formatDateTime(record.returnTime)}</div>
                            <div>归还人：${record.returner}</div>
                            ${record.returnNote ? `<div>备注：${record.returnNote}</div>` : ''}
                        ` : '<div class="status-tag">未归还</div>'}
                        <button class="btn btn-danger btn-sm" onclick="deleteBorrowRecord(${labIndex}, ${recIndex})">删除记录</button>
                    </div>
                `).join('') || '<div class="no-history">暂无借用记录</div>';
            }
            
            // 更新主界面显示
            renderLabs();
        }
    });
};

// 确认归还
window.confirmReturn = function(labIndex, recordIndex) {
    showAdminAuth(() => {
        const lab = labData[labIndex];
        const record = lab.borrowHistory[recordIndex];
        
        if (confirm('确认归还该设备吗？')) {
            const now = new Date();
            record.returnTime = now.toISOString().slice(0, 16);
            record.returner = '管理员确认';
            record.returnNote = '管理员确认归还';
            record.returnStatus = 'confirmed';
            
            // 如果是最新的借用记录，更新实训室状态
            if (recordIndex === lab.borrowHistory.length - 1) {
                lab.status = 'free';
                delete lab.currentBorrower;
            }
            
            localStorage.setItem('labData', JSON.stringify(labData));
            
            // 更新当前显示的借用记录
            const borrowHistorySection = document.querySelector('.borrow-history-section');
            if (borrowHistorySection) {
                borrowHistorySection.innerHTML = `
                    <h3>借用记录</h3>
                    ${renderBorrowHistory(lab.borrowHistory || [], labIndex)}
                `;
            }
            
            // 更新主界面显示
            renderLabs();
            alert('设备已归还');
        }
    });
};

// 管理员提前归还
window.adminReturn = function(labIndex, recordIndex) {
    showAdminAuth(() => {
        const lab = labData[labIndex];
        const record = lab.borrowHistory[recordIndex];
        
        if (confirm('确定要执行管理员归还操作吗？')) {
            const now = new Date();
            record.returnTime = now.toISOString().slice(0, 16);
            record.returner = '管理员操作';
            record.returnNote = '管理员提前归还';
            record.returnStatus = 'confirmed';
            
            // 如果是最新的借用记录，更新实训室状态
            if (recordIndex === lab.borrowHistory.length - 1) {
                lab.status = 'free';
                delete lab.currentBorrower;
            }
            
            localStorage.setItem('labData', JSON.stringify(labData));
            renderLabs();
            alert('管理员归还操作已完成');
        }
    });
};

// 打开借出管理模态框
window.openBorrowManagement = function(index) {
    showAdminAuth(() => {
        const lab = labData[index];
        const borrowModal = document.getElementById('borrowModal');
        const modalContent = borrowModal.querySelector('.modal-content');
        
        // 添加借用历史到模态框
        const historySection = document.createElement('div');
        historySection.className = 'borrow-history-section';
        historySection.innerHTML = `
            <h3>借用记录</h3>
            ${renderBorrowHistory(lab.borrowHistory || [], index)}
        `;

        // 清除之前的历史记录部分
        const existingHistory = modalContent.querySelector('.borrow-history-section');
        if (existingHistory) {
            existingHistory.remove();
        }

        // 如果实训室已被借出，显示归还表单，否则显示借出表单
        const borrowForm = document.getElementById('borrowForm');
        const returnForm = document.getElementById('returnForm');
        
        if (lab.status === 'borrowed') {
            borrowForm.style.display = 'none';
            returnForm.style.display = 'block';
            modalContent.querySelector('h2').textContent = '实训室归还/管理';
            
            // 设置当前时间为默认值
            const now = new Date();
            document.getElementById('returnTime').value = now.toISOString().slice(0, 16);
            returnForm.dataset.labIndex = index;
        } else {
            borrowForm.style.display = 'block';
            returnForm.style.display = 'none';
            modalContent.querySelector('h2').textContent = '实训室借出/管理';
            
            // 设置当前时间为默认值
            const now = new Date();
            document.getElementById('borrowTime').value = now.toISOString().slice(0, 16);
            borrowForm.dataset.labIndex = index;
        }

        modalContent.appendChild(historySection);
        borrowModal.style.display = 'block';
    });
};

// 添加器材输入行
function addEquipmentRow() {
    const equipmentList = document.getElementById('borrowEquipmentList');
    const newItem = document.createElement('div');
    newItem.className = 'equipment-item';
    newItem.innerHTML = `
        <div class="input-group">
            <label>器材名称：</label>
            <input type="text" class="equipment-name" required>
        </div>
        <div class="input-group">
            <label>型号：</label>
            <input type="text" class="equipment-model" required>
        </div>
        <div class="input-group">
            <label>数量：</label>
            <input type="number" class="equipment-quantity" min="1" required>
        </div>
        <button type="button" class="btn btn-danger btn-sm remove-equipment">删除</button>
    `;
    equipmentList.appendChild(newItem);

    // 添加删除按钮事件
    newItem.querySelector('.remove-equipment').addEventListener('click', function() {
        newItem.remove();
    });
}

// 生成预约汇总
function generateReservationSummary() {
    // 按实训室分组
    const summary = labData.map(lab => {
        return {
            labName: lab.name,
            labIndex: labData.indexOf(lab),
            reservations: lab.reservations || []
        };
    }).filter(item => item.reservations.length > 0);

    // 按实训室名称排序
    summary.sort((a, b) => a.labName.localeCompare(b.labName));

    // 生成HTML
    return summary.map(item => `
        <div class="summary-group">
            <h3>${item.labName}</h3>
            ${item.reservations.map((reservation, resIndex) => {
                const now = new Date();
                const reservationDate = new Date(reservation.date);
                const timeRange = getTimeRange(reservation.time);
                const currentTime = now.getHours() * 60 + now.getMinutes();
                const isToday = now.toISOString().split('T')[0] === reservation.date;
                
                let status = '未开始';
                let statusColor = '#ffc107';
                
                if (reservationDate < now && !isToday) {
                    status = '已结束';
                    statusColor = '#6c757d';
                } else if (isToday) {
                    if (currentTime >= timeRange.end) {
                        status = '已结束';
                        statusColor = '#6c757d';
                    } else if (currentTime >= timeRange.start && currentTime <= timeRange.end) {
                        status = '使用中';
                        statusColor = '#28a745';
                    }
                }

                return `
                    <div class="summary-item">
                        <div class="item-header">
                            预约人：${reservation.person}
                            <button class="btn btn-danger btn-sm" onclick="deleteReservationRecord(${item.labIndex}, ${resIndex})">删除记录</button>
                        </div>
                        <div class="item-detail">日期：${reservation.date}</div>
                        <div class="item-detail">时间：${reservation.time}</div>
                        ${reservation.purpose ? `<div class="item-detail">用途：${reservation.purpose}</div>` : ''}
                        <div class="item-detail" style="color: ${statusColor}">状态：${status}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `).join('');
}

// 生成借出汇总
function generateBorrowSummary() {
    // 按实训室分组
    const summary = labData.map(lab => {
        return {
            labName: lab.name,
            borrows: lab.borrowHistory || []
        };
    }).filter(item => item.borrows.length > 0);

    // 按实训室名称排序
    summary.sort((a, b) => a.labName.localeCompare(b.labName));

    // 生成HTML
    return summary.map(item => `
        <div class="summary-group">
            <h3>${item.labName}</h3>
            ${item.borrows.map(borrow => `
                <div class="summary-item">
                    <div class="item-header">借出人：${borrow.borrower}</div>
                    <div class="item-detail">借出时间：${formatDateTime(borrow.borrowTime)}</div>
                    <div class="item-detail">预计归还：${formatDateTime(borrow.expectedReturnTime)}</div>
                    ${borrow.returnStatus === 'confirmed' ? 
                        `<div class="item-detail" style="color: #28a745">状态：已归还</div>
                         <div class="item-detail">归还时间：${formatDateTime(borrow.returnTime)}</div>
                         <div class="item-detail">归还人：${borrow.returner}</div>` :
                        checkOverdue(borrow) ? 
                            '<div class="item-detail" style="color: #dc3545">状态：逾期未还</div>' : 
                            '<div class="item-detail" style="color: #ffc107">状态：未归还</div>'
                    }
                    <div class="item-detail">借出器材：</div>
                    ${borrow.equipment ? borrow.equipment.map(equip => `
                        <div class="item-detail">
                            - ${equip.name} (${equip.model})
                            <span class="equipment-count">数量：${equip.quantity}</span>
                        </div>
                    `).join('') : ''}
                </div>
            `).join('')}
        </div>
    `).join('');
}

// 切换预约信息显示
window.toggleReservation = function(index) {
    const labCard = document.querySelectorAll('.lab-card')[index];
    const reservationInfo = labCard.querySelector('.reservation-info');
    const toggleBtn = labCard.querySelector('.btn-info:nth-of-type(2)');

    if (reservationInfo.style.display === 'none') {
        reservationInfo.style.display = 'block';
        toggleBtn.textContent = '隐藏预约';
    } else {
        reservationInfo.style.display = 'none';
        toggleBtn.textContent = '查看预约';
    }
};

// 删除预约记录
window.deleteReservationRecord = function(labIndex, reservationIndex) {
    showAdminAuth(() => {
        if (confirm('确定要删除这条预约记录吗？')) {
            const lab = labData[labIndex];
            lab.reservations.splice(reservationIndex, 1);
            localStorage.setItem('labData', JSON.stringify(labData));
            
            // 重新渲染预约汇总
            const summaryContent = document.getElementById('reservationSummaryContent');
            if (summaryContent) {
                summaryContent.innerHTML = generateReservationSummary();
            }
            
            // 更新主界面显示
            renderLabs();
        }
    });
};

// 导出数据
window.exportData = function() {
    showAdminAuth(() => {
        const data = {
            labData: labData,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lab_data_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
};

// 导入数据
window.importData = function(file) {
    showAdminAuth(() => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // 验证数据格式
                if (!importedData.labData || !importedData.timestamp || !importedData.version) {
                    throw new Error('数据格式不正确');
                }
                
                if (confirm(`确定要导入 ${new Date(importedData.timestamp).toLocaleString()} 的数据吗？这将覆盖当前所有数据。`)) {
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
    });
};