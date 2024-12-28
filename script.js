// 定义 LeanCloud 类
const Lab = AV.Object.extend('Lab');

// 加载实训室数据
async function loadLabData() {
    const query = new AV.Query('Lab');
    try {
        const results = await query.find();
        labData = results.map(lab => ({
            id: lab.id,
            name: lab.get('name'),
            status: lab.get('status'),
            equipment: lab.get('equipment'),
            reservations: lab.get('reservations') || []
        }));
        renderLabs();
    } catch (error) {
        console.error('加载数据失败:', error);
        alert('加载数据失败，请刷新页面重试');
    }
}

// 保存实训室数据
async function saveLabs() {
    try {
        for (const lab of labData) {
            if (lab.id) {
                // 更新现有实训室
                const labObj = AV.Object.createWithoutData('Lab', lab.id);
                labObj.set('name', lab.name);
                labObj.set('status', lab.status);
                labObj.set('equipment', lab.equipment);
                labObj.set('reservations', lab.reservations);
                await labObj.save();
            } else {
                // 创建新实训室
                const labObj = new Lab();
                labObj.set('name', lab.name);
                labObj.set('status', lab.status);
                labObj.set('equipment', lab.equipment);
                labObj.set('reservations', lab.reservations || []);
                const savedLab = await labObj.save();
                lab.id = savedLab.id;
            }
        }
    } catch (error) {
        console.error('保存数据失败:', error);
        alert('保存数据失败，请重试');
    }
}

// 删除实训室
async function deleteLab(index) {
    try {
        const lab = labData[index];
        if (lab.id) {
            const labObj = AV.Object.createWithoutData('Lab', lab.id);
            await labObj.destroy();
        }
        labData.splice(index, 1);
        renderLabs();
    } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败，请重试');
    }
}

// 修改初始化代码
if (dashboard) {
    // 初始加载数据
    loadLabData();

    // 设置定时刷新
    setInterval(() => {
        loadLabData();
    }, 60000); // 每分钟刷新一次
}

// 模拟用户数据
const validUser = {
    username: '罗志涛',
    password: '123456'
};

// 存储实训室数据
let labData = JSON.parse(localStorage.getItem('labData')) || [];

// 登录表单处理
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === validUser.username && password === validUser.password) {
            window.location.href = 'dashboard.html';
        } else {
            alert('账号或密码错误！');
        }
    });
}

// 管理界面功能
const dashboard = document.querySelector('.dashboard');
if (dashboard) {
    const labGrid = document.getElementById('labGrid');
    const labModal = document.getElementById('labModal');
    const labForm = document.getElementById('labForm');
    const addLabBtn = document.getElementById('addLabBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    // 课节时间映射
    const CLASS_TIMES = {
        '1-2': { start: '08:30', end: '10:00' },
        '3-4': { start: '10:15', end: '11:45' },
        '5-6': { start: '14:30', end: '16:00' },
        '7-8': { start: '16:10', end: '17:40' }
    };

    // 获取课节文本
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

        // 如果是使用中状态，显示当前使用人
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

            // 添加点击事件处理
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
        saveLabs();
    }

    // 添加实训室
    window.addLab = function() {
        showAdminAuth(() => {
            document.getElementById('modalTitle').textContent = '添加实训室';
            document.querySelector('.reservation-management').style.display = 'none';
            labModal.style.display = 'block';
            labForm.reset();
        });
    };

    // 编辑实训室
    window.editLab = function(index) {
        showAdminAuth(() => {
            const lab = labData[index];
            document.getElementById('modalTitle').textContent = '编辑实训室';
            document.getElementById('labName').value = lab.name;
            document.getElementById('labStatus').value = lab.status;
            document.getElementById('labEquipment').value = lab.equipment.join('\n');
            labForm.dataset.editIndex = index;

            // 显示预约管理区域
            const reservationManagement = document.querySelector('.reservation-management');
            reservationManagement.style.display = 'block';

            // 渲染预约列表
            renderEditReservations(lab.reservations || [], index);

            labModal.style.display = 'block';
        });
    };

    // 渲染编辑模式下的预约列表
    function renderEditReservations(reservations, labIndex) {
        const editReservationList = document.getElementById('editReservationList');
        if (!reservations || reservations.length === 0) {
            editReservationList.innerHTML = '<div class="no-reservations">暂无预约记录</div>';
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
        if (confirm('确定要删除这条预约记录吗？')) {
            labData[labIndex].reservations.splice(reservationIndex, 1);
            updateLabStatus(labIndex);
            renderEditReservations(labData[labIndex].reservations, labIndex);
            renderLabs(); // 更新主界面显示
        }
    };

    // 表单提交处理
    labForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const editIndex = labForm.dataset.editIndex;
        const labInfo = {
            name: document.getElementById('labName').value,
            status: document.getElementById('labStatus').value,
            equipment: document.getElementById('labEquipment').value
                .split('\n')
                .filter(item => item.trim() !== ''),
            // 保留原有的预约信息
            reservations: editIndex !== undefined ? labData[editIndex].reservations || [] : []
        };

        if (editIndex !== undefined) {
            // 编辑模式：保留原有的预约信息
            labData[editIndex] = {
                ...labData[editIndex],
                ...labInfo
            };
            delete labForm.dataset.editIndex;
        } else {
            // 添加模式：新建实训室
            labData.push(labInfo);
        }

        // 更新状态
        if (editIndex !== undefined) {
            updateLabStatus(editIndex);
        }

        renderLabs();
        labModal.style.display = 'none';
        labForm.reset();
    });

    // 取消按钮
    cancelBtn.addEventListener('click', () => {
        labModal.style.display = 'none';
        labForm.reset();
        delete labForm.dataset.editIndex;
    });

    // 添加实训室按钮
    addLabBtn.addEventListener('click', addLab);

    // 退出登录
    logoutBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    // 初始化渲染
    renderLabs();

    // 关闭窗口前保存数据
    window.addEventListener('beforeunload', () => {
        saveLabs();
    });

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

    // 检查时间冲突
    function checkTimeConflict(existingReservations, newReservation) {
        const newDate = newReservation.date;
        const newClassTime = newReservation.classTime;

        return existingReservations.some(existing => {
            return existing.date === newDate && existing.classTime === newClassTime;
        });
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

        // 如果没有预约记录，直接设置为空闲
        if (!lab.reservations || lab.reservations.length === 0) {
            lab.status = 'free';
            return;
        }

        // 清理过期的预约记录
        lab.reservations = lab.reservations.filter(reservation => {
            const reservationDate = new Date(reservation.date);
            const reservationEndTime = CLASS_TIMES[reservation.classTime].end;
            const reservationDateTime = new Date(
                reservation.date + 'T' + reservationEndTime
            );
            return reservationDateTime > now;
        });

        // 再次检查过滤后是否还有预约记录
        if (lab.reservations.length === 0) {
            lab.status = 'free';
            return;
        }

        // 检查当前是否在使用中
        const currentReservation = lab.reservations.find(reservation => 
            reservation.date === today && reservation.classTime === currentClassTime
        );

        // 检查是否有未来预约
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

        // 保存更新后的数据
        saveLabs();
    }

    // 提交预约表单处理
    function handleReservationSubmit(e) {
        e.preventDefault();
        const labIndex = e.target.dataset.labIndex;
        const reservation = {
            date: document.getElementById('reservationDate').value,
            classTime: document.getElementById('classTime').value,
            person: document.getElementById('reservationPerson').value,
            purpose: document.getElementById('reservationPurpose').value
        };

        // 初始化预约数组（如果不存在）
        if (!labData[labIndex].reservations) {
            labData[labIndex].reservations = [];
        }

        // 检查时间冲突
        const hasConflict = checkTimeConflict(labData[labIndex].reservations, reservation);
        if (hasConflict) {
            alert('该时间段已被预约，请选择其他时间！');
            return;
        }

        // 添加预约
        labData[labIndex].reservations.push(reservation);
        
        // 更新实训室状态
        updateLabStatus(labIndex);

        // 重新渲染并关闭模态框
        renderLabs();
        document.getElementById('reservationModal').style.display = 'none';
        e.target.reset();
    }

    // 打开预约模态框
    window.openReservation = function(index) {
        const reservationModal = document.getElementById('reservationModal');
        const reservationForm = document.getElementById('reservationForm');
        const cancelReservationBtn = document.getElementById('cancelReservationBtn');

        // 设置最小日期为今天
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('reservationDate').min = today;

        reservationForm.dataset.labIndex = index;
        reservationModal.style.display = 'block';

        // 取消预约
        cancelReservationBtn.onclick = () => {
            reservationModal.style.display = 'none';
            reservationForm.reset();
        };

        // 提交预约
        reservationForm.onsubmit = handleReservationSubmit;
    };

    // 定时更新状态
    setInterval(() => {
        labData.forEach((_, index) => {
            updateLabStatus(index);
        });
        renderLabs();
    }, 60000); // 每分钟更新一次

    // 添加汇总按钮事件监听
    const summaryBtn = document.getElementById('summaryBtn');
    const summaryModal = document.getElementById('summaryModal');
    const closeSummaryBtn = document.getElementById('closeSummaryBtn');
    const searchSummaryBtn = document.getElementById('searchSummaryBtn');

    // 打开汇总模态框
    summaryBtn.addEventListener('click', () => {
        // 设置默认日期范围（当前月份）
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        
        document.getElementById('summaryStartDate').value = firstDay;
        document.getElementById('summaryEndDate').value = lastDay;
        
        // 显示汇总数据
        showSummary();
        summaryModal.style.display = 'block';
    });

    // 关闭汇总模态框
    closeSummaryBtn.addEventListener('click', () => {
        summaryModal.style.display = 'none';
    });

    // 查询按钮点击事件
    searchSummaryBtn.addEventListener('click', showSummary);

    // 显示汇总信息
    function showSummary() {
        const startDate = document.getElementById('summaryStartDate').value;
        const endDate = document.getElementById('summaryEndDate').value;
        const summaryContent = document.getElementById('summaryContent');

        // 收集所有预约信息
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

        // 按预约人分组
        const groupedReservations = {};
        allReservations.forEach(reservation => {
            if (!groupedReservations[reservation.person]) {
                groupedReservations[reservation.person] = [];
            }
            groupedReservations[reservation.person].push(reservation);
        });

        // 生成HTML
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

    // 格式化日期
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const weekDay = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()];
        return `${month}月${day}日 ${weekDay}`;
    }

    const ADMIN_PASSWORD = 'admin';
    let pendingAction = null;

    // 验证管理员密码
    function verifyAdminPassword(password) {
        return password === ADMIN_PASSWORD;
    }

    // 显示管理员验证模态框
    function showAdminAuth(action) {
        const adminAuthModal = document.getElementById('adminAuthModal');
        const adminAuthForm = document.getElementById('adminAuthForm');
        const cancelAuthBtn = document.getElementById('cancelAuthBtn');

        pendingAction = action;
        adminAuthModal.style.display = 'block';

        // 取消验证
        cancelAuthBtn.onclick = () => {
            adminAuthModal.style.display = 'none';
            adminAuthForm.reset();
            pendingAction = null;
        };

        // 提交验证
        adminAuthForm.onsubmit = (e) => {
            e.preventDefault();
            const password = document.getElementById('adminPassword').value;

            if (verifyAdminPassword(password)) {
                adminAuthModal.style.display = 'none';
                adminAuthForm.reset();
                // 执行待处理的操作
                if (pendingAction) {
                    pendingAction();
                }
            } else {
                alert('管理员密码错误！');
            }
        };
    }
} 