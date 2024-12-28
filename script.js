// 全局变量和常量定义
const ADMIN_PASSWORD = 'admin';
let pendingAction = null;
let labData = [];

// 课节时间映射
const CLASS_TIMES = {
    '1-2': { start: '08:30', end: '10:00' },
    '3-4': { start: '10:15', end: '11:45' },
    '5-6': { start: '14:30', end: '16:00' },
    '7-8': { start: '16:10', end: '17:40' }
};

// 工具函数
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const weekDay = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()];
    return `${month}月${day}日 ${weekDay}`;
}

function verifyAdminPassword(password) {
    return password === ADMIN_PASSWORD;
}

function showAdminAuth(action) {
    const adminAuthModal = document.getElementById('adminAuthModal');
    const adminAuthForm = document.getElementById('adminAuthForm');
    const cancelAuthBtn = document.getElementById('cancelAuthBtn');

    pendingAction = action;
    adminAuthModal.style.display = 'block';

    cancelAuthBtn.onclick = () => {
        adminAuthModal.style.display = 'none';
        adminAuthForm.reset();
        pendingAction = null;
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

// 页面加载时的初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检查登录状态
    checkLogin();

    // 获取页面元素
const dashboard = document.querySelector('.dashboard');
    if (!dashboard) return;

    const labGrid = document.getElementById('labGrid');
    const labModal = document.getElementById('labModal');
    const labForm = document.getElementById('labForm');
    const addLabBtn = document.getElementById('addLabBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const summaryBtn = document.getElementById('summaryBtn');
    const summaryModal = document.getElementById('summaryModal');
    const closeSummaryBtn = document.getElementById('closeSummaryBtn');
    const searchSummaryBtn = document.getElementById('searchSummaryBtn');

    // 绑定事件
    if (addLabBtn) {
        addLabBtn.addEventListener('click', () => {
            showAdminAuth(() => {
                document.getElementById('modalTitle').textContent = '添加实训室';
                document.querySelector('.reservation-management').style.display = 'none';
                labModal.style.display = 'block';
                labForm.reset();
            });
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('isLoggedIn');
            window.location.href = 'index.html';
        });
    }

    if (summaryBtn) {
        summaryBtn.addEventListener('click', () => {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            
            document.getElementById('summaryStartDate').value = firstDay;
            document.getElementById('summaryEndDate').value = lastDay;
            
            showSummary();
            summaryModal.style.display = 'block';
        });
    }

    if (closeSummaryBtn) {
        closeSummaryBtn.addEventListener('click', () => {
            summaryModal.style.display = 'none';
        });
    }

    if (searchSummaryBtn) {
        searchSummaryBtn.addEventListener('click', showSummary);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            labModal.style.display = 'none';
            labForm.reset();
            delete labForm.dataset.editIndex;
        });
    }

    if (labForm) {
        labForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const editIndex = labForm.dataset.editIndex;
            const labInfo = {
                name: document.getElementById('labName').value,
                status: document.getElementById('labStatus').value,
                equipment: document.getElementById('labEquipment').value
                    .split('\n')
                    .filter(item => item.trim() !== ''),
                reservations: editIndex !== undefined ? labData[editIndex].reservations || [] : []
            };

            if (editIndex !== undefined) {
                labData[editIndex] = {
                    ...labData[editIndex],
                    ...labInfo
                };
                delete labForm.dataset.editIndex;
            } else {
                labData.push(labInfo);
            }

            if (editIndex !== undefined) {
                updateLabStatus(editIndex);
            }

            renderLabs();
            labModal.style.display = 'none';
            labForm.reset();
        });
    }

    // 初始化数据
    loadLabData();

    // 定时更新
    setInterval(() => {
        loadLabData();
    }, 60000);
}); 

// 模拟用户数据
const validUser = {
    username: '罗志涛',
    password: '123456'
};

// 登录表单处理
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === validUser.username && password === validUser.password) {
            localStorage.setItem('isLoggedIn', 'true');
            window.location.href = 'dashboard.html';
        } else {
            alert('账号或密码错误！');
        }
    });
}

// 检查登录状态
function checkLogin() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const isDashboard = window.location.pathname.includes('dashboard.html');
    
    if (!isLoggedIn && isDashboard) {
        window.location.href = 'index.html';
    }
}

// 获取课节��
function getClassTimeText(classTime) {
    const times = {
        '1-2': '第一二节（8:30-10:00）',
        '3-4': '第三四节（10:15-11:45）',
        '5-6': '第五六节（14:30-16:00）',
        '7-8': '第七八节（16:10-17:40）'
    };
    return times[classTime] || classTime;
}

// 获取状态文本
function getStatusText(status, lab) {
    const statusMap = {
        free: '空闲',
        reserved: '已预约',
        occupied: '使用中'
    };

    if (status === 'occupied' && lab.reservations) {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentClassTime = getCurrentClassTime();
        
        const currentReservation = lab.reservations.find(reservation => 
            reservation.date === today && reservation.classTime === currentClassTime
        );

        if (currentReservation) {
            return `${currentReservation.person}使用中`;
        }
    }
    
    return statusMap[status];
}

// 渲染实训室列表
function renderLabs() {
    const labGrid = document.getElementById('labGrid');
    if (!labGrid) return;

    labGrid.innerHTML = '';
    labData.forEach((lab, index) => {
        const labCard = document.createElement('div');
        labCard.className = `lab-card status-${lab.status}`;
        labCard.innerHTML = `
            <h3>${lab.name}</h3>
            <p>状态: <span class="status-text">${getStatusText(lab.status, lab)}</span></p>
            <div class="equipment-list">
                <h4>设备列表：</h4>
                <ul>
                    ${lab.equipment.map((item, i) => `<li>${i + 1}. ${item}</li>`).join('')}
                </ul>
            </div>
            <div class="reservation-info">
                <h4>预约信息：</h4>
                ${renderReservations(lab.reservations || [])}
            </div>
            <button class="reserve-btn" onclick="openReservation(${index})">预约使用</button>
            <div class="button-group">
                <button class="btn btn-primary" onclick="editLab(${index})">编辑</button>
                <button class="btn btn-danger" onclick="deleteLab(${index})">删除</button>
            </div>
        `;

        labCard.addEventListener('click', (e) => {
            if (!e.target.closest('.button-group') && !e.target.closest('.reserve-btn')) {
                if (!labCard.classList.contains('show-equipment')) {
                    labCard.classList.add('show-equipment');
                } else {
                    labCard.classList.remove('show-equipment');
                }
            }
        });

        labGrid.appendChild(labCard);
    });
    
    localStorage.setItem('labData', JSON.stringify(labData));
}

// 渲染预约信息
function renderReservations(reservations) {
    if (!reservations || reservations.length === 0) {
        return '<div class="reservation-item">暂无预约</div>';
    }
    return reservations
        .sort((a, b) => new Date(a.date + ' ' + CLASS_TIMES[a.classTime].start) - new Date(b.date + ' ' + CLASS_TIMES[b.classTime].start))
        .map(reservation => `
            <div class="reservation-item">
                <div class="reservation-date">${formatDate(reservation.date)}</div>
                <div class="reservation-time">${getClassTimeText(reservation.classTime)}</div>
                <div class="reservation-person">预约人：${reservation.person}</div>
                ${reservation.purpose ? `<div class="reservation-purpose">用途：${reservation.purpose}</div>` : ''}
            </div>
        `).join('');
}

// 编辑实训室
window.editLab = function(index) {
    showAdminAuth(() => {
        const lab = labData[index];
        document.getElementById('modalTitle').textContent = '编辑实训室';
        document.getElementById('labName').value = lab.name;
        document.getElementById('labStatus').value = lab.status;
        document.getElementById('labEquipment').value = lab.equipment.join('\n');
        labForm.dataset.editIndex = index;

        const reservationManagement = document.querySelector('.reservation-management');
        reservationManagement.style.display = 'block';

        renderEditReservations(lab.reservations || [], index);

        labModal.style.display = 'block';
    });
};

// 删除实训室
window.deleteLab = function(index) {
    showAdminAuth(async () => {
        if (confirm('确定要删除这个实训室吗？')) {
            const lab = labData[index];
            if (lab.id) {
                try {
                    const labObj = AV.Object.createWithoutData('Lab', lab.id);
                    await labObj.destroy();
                } catch (error) {
                    console.error('删除失败:', error);
                }
            }
            labData.splice(index, 1);
            renderLabs();
        }
    });
};

// 打开预约模态框
window.openReservation = function(index) {
    const reservationModal = document.getElementById('reservationModal');
    const reservationForm = document.getElementById('reservationForm');
    const cancelReservationBtn = document.getElementById('cancelReservationBtn');

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reservationDate').min = today;

    reservationForm.dataset.labIndex = index;
    reservationModal.style.display = 'block';

    cancelReservationBtn.onclick = () => {
        reservationModal.style.display = 'none';
        reservationForm.reset();
    };

    reservationForm.onsubmit = handleReservationSubmit;
};

// 处理预约提交
function handleReservationSubmit(e) {
    e.preventDefault();
    const labIndex = e.target.dataset.labIndex;
    const reservation = {
        date: document.getElementById('reservationDate').value,
        classTime: document.getElementById('classTime').value,
        person: document.getElementById('reservationPerson').value,
        purpose: document.getElementById('reservationPurpose').value
    };

    if (!labData[labIndex].reservations) {
        labData[labIndex].reservations = [];
    }

    const hasConflict = checkTimeConflict(labData[labIndex].reservations, reservation);
    if (hasConflict) {
        alert('该时间段已被预约，请选择其他时间！');
        return;
    }

    labData[labIndex].reservations.push(reservation);
    updateLabStatus(labIndex);
    renderLabs();
    document.getElementById('reservationModal').style.display = 'none';
    e.target.reset();
}

// 检查时间冲突
function checkTimeConflict(existingReservations, newReservation) {
    return existingReservations.some(existing => 
        existing.date === newReservation.date && 
        existing.classTime === newReservation.classTime
    );
}

// 获取当前课节
function getCurrentClassTime() {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                      now.getMinutes().toString().padStart(2, '0');

    for (const [classTime, times] of Object.entries(CLASS_TIMES)) {
        if (currentTime >= times.start && currentTime < times.end) {
            return classTime;
        }
    }
    return null;
}

// 更新实训室状态
function updateLabStatus(index) {
    const lab = labData[index];
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentClassTime = getCurrentClassTime();

    if (!lab.reservations || lab.reservations.length === 0) {
        lab.status = 'free';
        return;
    }

    lab.reservations = lab.reservations.filter(reservation => {
        const reservationDate = new Date(reservation.date);
        const reservationEndTime = CLASS_TIMES[reservation.classTime].end;
        const reservationDateTime = new Date(
            reservation.date + 'T' + reservationEndTime
        );
        return reservationDateTime > now;
    });

    if (lab.reservations.length === 0) {
        lab.status = 'free';
        return;
    }

    const currentReservation = lab.reservations.find(reservation => 
        reservation.date === today && reservation.classTime === currentClassTime
    );

    const futureReservation = lab.reservations.find(reservation => {
        const reservationDate = reservation.date;
        if (reservationDate > today) return true;
        if (reservationDate === today) {
            const reservationStartTime = CLASS_TIMES[reservation.classTime].start;
            const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                             now.getMinutes().toString().padStart(2, '0');
            return reservationStartTime > currentTime;
        }
        return false;
    });

    if (currentReservation) {
        lab.status = 'occupied';
    } else if (futureReservation) {
        lab.status = 'reserved';
    } else {
        lab.status = 'free';
    }

    localStorage.setItem('labData', JSON.stringify(labData));
}

// 显示汇总信息
function showSummary() {
    const startDate = document.getElementById('summaryStartDate').value;
    const endDate = document.getElementById('summaryEndDate').value;
    const summaryContent = document.getElementById('summaryContent');

    const allReservations = [];
    labData.forEach(lab => {
        if (lab.reservations) {
            lab.reservations.forEach(reservation => {
                if (reservation.date >= startDate && reservation.date <= endDate) {
                    allReservations.push({
                        person: reservation.person,
                        date: reservation.date,
                        classTime: reservation.classTime,
                        labName: lab.name
                    });
                }
            });
        }
    });

    const groupedReservations = {};
    allReservations.forEach(reservation => {
        if (!groupedReservations[reservation.person]) {
            groupedReservations[reservation.person] = [];
        }
        groupedReservations[reservation.person].push(reservation);
    });

    if (Object.keys(groupedReservations).length === 0) {
        summaryContent.innerHTML = '<div class="summary-group"><p>所选日期范围内没有预约记录</p></div>';
        return;
    }

    const html = Object.entries(groupedReservations)
        .sort(([personA], [personB]) => personA.localeCompare(personB))
        .map(([person, reservations]) => `
            <div class="summary-group">
                <h3>${person}</h3>
                ${reservations
                    .sort((a, b) => a.date.localeCompare(b.date) || a.classTime.localeCompare(b.classTime))
                    .map(r => `
                        <div class="summary-item">
                            <span class="summary-date">${formatDate(r.date)}</span>
                            <span class="summary-lab">${r.labName}</span>
                            <span class="summary-time">${getClassTimeText(r.classTime)}</span>
                        </div>
                    `).join('')}
            </div>
        `).join('');

    summaryContent.innerHTML = html;
}

// 加载实训室数据
async function loadLabData() {
    try {
        // 先从本地加载数据
        const localData = localStorage.getItem('labData');
        if (localData) {
            labData = JSON.parse(localData);
            renderLabs();
        }

        // 尝试从云端加载数据
        const query = new AV.Query('Lab');
        const results = await query.find();
        
        if (results && results.length > 0) {
            // 如果云端有数据，使用云端数据
            labData = results.map(lab => ({
                id: lab.id,
                name: lab.get('name'),
                status: lab.get('status'),
                equipment: lab.get('equipment') || [],
                reservations: lab.get('reservations') || []
            }));
            renderLabs();
        } else if (labData.length > 0) {
            // 如果云端没有数据但本地有，则上传本地数据
            await syncLocalDataToCloud();
        }
    } catch (error) {
        console.error('数据加载失败:', error);
    }
}

// 添加数据同步函数
async function syncLocalDataToCloud() {
    try {
        for (const lab of labData) {
            const labObj = new Lab();
            labObj.set('name', lab.name);
            labObj.set('status', lab.status);
            labObj.set('equipment', lab.equipment);
            labObj.set('reservations', lab.reservations);
            await labObj.save();
        }
        console.log('本地数据已同步到云端');
    } catch (error) {
        console.error('数据同步失败:', error);
    }
}

// 修改保存函数
async function saveLabs() {
    try {
        // 保存到本地
        localStorage.setItem('labData', JSON.stringify(labData));

        // 保存到云端
        for (const lab of labData) {
            if (lab.id) {
                // 更新已有数据
                const labObj = AV.Object.createWithoutData('Lab', lab.id);
                labObj.set('name', lab.name);
                labObj.set('status', lab.status);
                labObj.set('equipment', lab.equipment);
                labObj.set('reservations', lab.reservations);
                await labObj.save();
            } else {
                // 创建新数据
                const labObj = new Lab();
                labObj.set('name', lab.name);
                labObj.set('status', lab.status);
                labObj.set('equipment', lab.equipment);
                labObj.set('reservations', lab.reservations);
                const savedLab = await labObj.save();
                lab.id = savedLab.id;
            }
        }
    } catch (error) {
        console.error('保存失败:', error);
    }
}

// 渲染编辑模式下的预约列表
function renderEditReservations(reservations, labIndex) {
    const editReservationList = document.getElementById('editReservationList');
    if (!reservations || reservations.length === 0) {
        editReservationList.innerHTML = '<div class="no-reservations">无预约记录</div>';
        return;
    }

    const sortedReservations = [...reservations].sort((a, b) => 
        new Date(a.date + ' ' + CLASS_TIMES[a.classTime].start) - 
        new Date(b.date + ' ' + CLASS_TIMES[b.classTime].start)
    );

    editReservationList.innerHTML = sortedReservations.map((reservation, index) => `
        <div class="edit-reservation-item">
            <div class="reservation-info-group">
                <div class="reservation-date">${formatDate(reservation.date)}</div>
                <div class="reservation-time">${getClassTimeText(reservation.classTime)}</div>
                <div class="reservation-person">预约人：${reservation.person}</div>
                ${reservation.purpose ? `<div class="reservation-purpose">用途：${reservation.purpose}</div>` : ''}
            </div>
            <div class="reservation-actions">
                <button class="btn-delete-reservation" onclick="deleteReservation(${labIndex}, ${index})">删除</button>
            </div>
        </div>
    `).join('');
}

// 删除预约
window.deleteReservation = function(labIndex, reservationIndex) {
    if (confirm('确认要删除这条预约记录吗？')) {
        labData[labIndex].reservations.splice(reservationIndex, 1);
        updateLabStatus(labIndex);
        renderEditReservations(labData[labIndex].reservations, labIndex);
        renderLabs();
    }
}; 

// 初始化 LeanCloud
AV.init({
    appId: "你的AppID",
    appKey: "你的AppKey",
    serverURL: "https://你的服务器域名"  // 这个需要根据你创建的应用来填写
});

// 定义 Lab 类
const Lab = AV.Object.extend('Lab'); 