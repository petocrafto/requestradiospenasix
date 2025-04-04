document.addEventListener('DOMContentLoaded', function() {
    // Inisialisasi data dari localStorage
    let songRequests = JSON.parse(localStorage.getItem('songRequests')) || [];
    let schedule = JSON.parse(localStorage.getItem('songSchedule')) || { today: [], tomorrow: [] };
    let adminCredentials = {
        username: 'user1',
        password: '#111'
    };
    
    // Cek status login admin
    let isAdminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    
    // Set tanggal
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    document.getElementById('today-date').textContent = formatDate(today);
    document.getElementById('tomorrow-date').textContent = formatDate(tomorrow);
    
    // Inisialisasi UI berdasarkan status login
    updateAdminUI();
    
    // Tab functionality
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and content
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
    
    // YouTube search functionality
    document.getElementById('searchYoutube').addEventListener('click', searchYouTube);
    
    // Form submission
    document.getElementById('songRequestForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const senderName = document.getElementById('senderName').value;
        const recipient = document.getElementById('recipient').value;
        const songTitle = document.getElementById('songTitle').value;
        const youtubeLink = document.getElementById('youtubeLink').value;
        const message = document.getElementById('message').value;
        
        const newRequest = {
            id: Date.now(),
            senderName,
            recipient,
            songTitle,
            youtubeLink,
            message,
            timestamp: new Date().toISOString()
        };
        
        // Add to requests
        songRequests.push(newRequest);
        localStorage.setItem('songRequests', JSON.stringify(songRequests));
        
        // Add to schedule queue
        addToSchedule(newRequest);
        
        // Reset form
        this.reset();
        document.getElementById('selectedLinkInfo').style.display = 'none';
        
        // Show success message
        alert('Request lagu berhasil dikirim!');
        
        // Update schedule display
        updateScheduleDisplay();
        updateAdminStats();
    });
    
    // Admin login button
    document.getElementById('adminLoginBtn').addEventListener('click', function() {
        document.getElementById('loginModal').classList.add('active');
    });
    
    // Login modal buttons
    document.querySelectorAll('#loginModal .close-modal, #cancelLoginBtn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('loginModal').classList.remove('active');
        });
    });
    
    // Confirm login
    document.getElementById('confirmLoginBtn').addEventListener('click', function() {
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;
        
        if (username === adminCredentials.username && password === adminCredentials.password) {
            isAdminLoggedIn = true;
            localStorage.setItem('adminLoggedIn', 'true');
            updateAdminUI();
            document.getElementById('loginModal').classList.remove('active');
            document.getElementById('loginForm').reset();
            alert('Login berhasil!');
        } else {
            alert('Username atau password salah!');
        }
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', function() {
        isAdminLoggedIn = false;
        localStorage.setItem('adminLoggedIn', 'false');
        updateAdminUI();
        alert('Anda telah logout');
    });
    
    // Reset data button
    document.getElementById('resetDataBtn').addEventListener('click', function() {
        document.getElementById('resetModal').classList.add('active');
    });
    
    // Reset modal buttons
    document.querySelectorAll('#resetModal .close-modal, #cancelResetBtn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('resetModal').classList.remove('active');
        });
    });
    
    // Confirm reset
    document.getElementById('confirmResetBtn').addEventListener('click', function() {
        songRequests = [];
        schedule = { today: [], tomorrow: [] };
        localStorage.setItem('songRequests', JSON.stringify(songRequests));
        localStorage.setItem('songSchedule', JSON.stringify(schedule));
        updateScheduleDisplay();
        updateAdminStats();
        document.getElementById('resetModal').classList.remove('active');
        alert('Semua data telah direset!');
    });
    
    // Export data button
    document.getElementById('exportDataBtn').addEventListener('click', exportData);
    
    // Initial display update
    updateScheduleDisplay();
    updateAdminStats();
    
    // Fungsi untuk menambahkan lagu ke jadwal
    function addToSchedule(request) {
        // Cek apakah hari ini masih ada slot (maksimal 6 lagu)
        if (schedule.today.length < 6) {
            schedule.today.push(request);
        } else {
            // Jika hari ini penuh, tambahkan ke besok
            schedule.tomorrow.push(request);
        }
        
        localStorage.setItem('songSchedule', JSON.stringify(schedule));
    }
    
    // Fungsi untuk memperbarui tampilan jadwal
    function updateScheduleDisplay() {
        // Periksa apakah data schedule ada di localStorage
        const storedSchedule = JSON.parse(localStorage.getItem('songSchedule')) || { today: [], tomorrow: [] };
        schedule = storedSchedule;
        
        // Update today's songs
        const todaySongsList = document.getElementById('today-songs');
        todaySongsList.innerHTML = '';
        
        if (schedule.today.length > 0) {
            schedule.today.forEach(song => {
                todaySongsList.appendChild(createSongElement(song));
            });
        } else {
            todaySongsList.innerHTML = '<li class="empty-schedule">Belum ada lagu yang dijadwalkan untuk hari ini</li>';
        }
        
        // Update tomorrow's songs
        const tomorrowSongsList = document.getElementById('tomorrow-songs');
        tomorrowSongsList.innerHTML = '';
        
        if (schedule.tomorrow.length > 0) {
            schedule.tomorrow.forEach(song => {
                tomorrowSongsList.appendChild(createSongElement(song));
            });
        } else {
            tomorrowSongsList.innerHTML = '<li class="empty-schedule">Belum ada lagu yang dijadwalkan untuk besok</li>';
        }
        
        // Update queue songs (all requests not in today or tomorrow)
        const queueSongsList = document.getElementById('queue-songs');
        queueSongsList.innerHTML = '';
        
        const allRequests = JSON.parse(localStorage.getItem('songRequests')) || [];
        const scheduledIds = [...schedule.today, ...schedule.tomorrow].map(song => song.id);
        const queueSongs = allRequests.filter(song => !scheduledIds.includes(song.id));
        
        if (queueSongs.length > 0) {
            queueSongs.forEach(song => {
                queueSongsList.appendChild(createSongElement(song));
            });
        } else {
            queueSongsList.innerHTML = '<li class="empty-schedule">Tidak ada lagu dalam antrian</li>';
        }
        
        // Update history songs (all requests)
        const historySongsList = document.getElementById('history-songs');
        historySongsList.innerHTML = '';
        
        if (allRequests.length > 0) {
            // Urutkan dari yang terbaru
            allRequests.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            allRequests.forEach(song => {
                const li = document.createElement('li');
                li.className = 'song-item';
                li.innerHTML = `
                    <div class="song-title">${song.songTitle}</div>
                    <div class="song-details">
                        <span>Dari: ${song.senderName}</span> | 
                        <span>Untuk: ${song.recipient}</span> |
                        <span>${formatDate(new Date(song.timestamp))}</span>
                    </div>
                    <div class="song-link">
                        <a href="${song.youtubeLink}" target="_blank">${song.youtubeLink}</a>
                    </div>
                    ${song.message ? `<div class="song-message">"${song.message}"</div>` : ''}
                `;
                historySongsList.appendChild(li);
            });
        } else {
            historySongsList.innerHTML = '<li class="empty-schedule">Belum ada history request</li>';
        }
    }
    
    // Fungsi untuk membuat elemen lagu
    function createSongElement(song) {
        const li = document.createElement('li');
        li.className = 'song-item';
        li.innerHTML = `
            <div class="song-title">${song.songTitle}</div>
            <div class="song-details">
                <span>Dari: ${song.senderName}</span> | 
                <span>Untuk: ${song.recipient}</span>
            </div>
            <div class="song-link">
                <a href="${song.youtubeLink}" target="_blank">${song.youtubeLink}</a>
            </div>
            ${song.message ? `<div class="song-message">"${song.message}"</div>` : ''}
        `;
        return li;
    }
    
    // Fungsi untuk mencari di YouTube
    function searchYouTube() {
        const query = document.getElementById('songTitle').value;
        if (!query) {
            alert('Masukkan judul lagu terlebih dahulu');
            return;
        }
        
        const resultsContainer = document.getElementById('youtubeResults');
        resultsContainer.innerHTML = '<div class="search-result">Mencari...</div>';
        resultsContainer.style.display = 'block';
        
        // Hapus info link yang dipilih sebelumnya
        document.getElementById('selectedLinkInfo').style.display = 'none';
        
        // Contoh implementasi (dalam produksi nyata gunakan backend)
        const API_KEY = 'YOUR_YOUTUBE_API_KEY';
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(query)}&key=${API_KEY}`;
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.items && data.items.length > 0) {
                    resultsContainer.innerHTML = '';
                    data.items.forEach(item => {
                        const result = document.createElement('div');
                        result.className = 'search-result';
                        result.innerHTML = `
                            <div>${item.snippet.title}</div>
                            <small>Channel: ${item.snippet.channelTitle}</small>
                        `;
                        result.addEventListener('click', () => {
                            const youtubeLink = `https://www.youtube.com/watch?v=${item.id.videoId}`;
                            document.getElementById('youtubeLink').value = youtubeLink;
                            
                            // Tampilkan info link yang dipilih
                            const selectedLinkInfo = document.getElementById('selectedLinkInfo');
                            document.getElementById('selectedLinkText').textContent = youtubeLink;
                            selectedLinkInfo.style.display = 'block';
                            
                            resultsContainer.style.display = 'none';
                        });
                        resultsContainer.appendChild(result);
                    });
                } else {
                    resultsContainer.innerHTML = '<div class="search-result">Tidak ditemukan hasil</div>';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                resultsContainer.innerHTML = '<div class="search-result">Gagal melakukan pencarian</div>';
            });
    }
    
    // Fungsi untuk memformat tanggal
    function formatDate(date) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString('id-ID', options);
    }
    
    // Fungsi untuk update UI admin
    function updateAdminUI() {
        const adminPanel = document.getElementById('adminPanel');
        if (isAdminLoggedIn) {
            adminPanel.classList.add('active');
            document.getElementById('adminLoginBtn').style.display = 'none';
        } else {
            adminPanel.classList.remove('active');
            document.getElementById('adminLoginBtn').style.display = 'block';
        }
    }
    
    // Fungsi untuk update statistik admin
    function updateAdminStats() {
        const allRequests = JSON.parse(localStorage.getItem('songRequests')) || [];
        const schedule = JSON.parse(localStorage.getItem('songSchedule')) || { today: [], tomorrow: [] };
        const scheduledIds = [...schedule.today, ...schedule.tomorrow].map(song => song.id);
        const queueSongs = allRequests.filter(song => !scheduledIds.includes(song.id));
        
        document.getElementById('totalRequests').textContent = allRequests.length;
        document.getElementById('todaySongsCount').textContent = `${schedule.today.length}/6`;
        document.getElementById('tomorrowSongsCount').textContent = schedule.tomorrow.length;
        document.getElementById('queueSongsCount').textContent = queueSongs.length;
    }
    
    // Fungsi untuk export data
    function exportData() {
        const allRequests = JSON.parse(localStorage.getItem('songRequests')) || [];
        const schedule = JSON.parse(localStorage.getItem('songSchedule')) || { today: [], tomorrow: [] };
        
        const data = {
            allRequests,
            schedule,
            exportedAt: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `song-requests-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('Data berhasil diexport!');
    }
    
    // Sembunyikan hasil pencarian saat klik di luar
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) {
            document.getElementById('youtubeResults').style.display = 'none';
        }
    });
});