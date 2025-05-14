const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

// Lưu trữ browser instance
let currentBrowser = null;
let currentPage = null;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Route chính
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint để kiểm tra đăng nhập
app.post('/check-login', async (req, res) => {
    const { cookies } = req.body;
    
    try {
        // Nếu đã có browser đang mở, đóng nó
        if (currentBrowser) {
            await currentBrowser.close();
            currentBrowser = null;
            currentPage = null;
        }

        currentBrowser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
        });

        currentPage = await currentBrowser.newPage();
        
        // Set cookies
        await currentPage.setCookie(...cookies);
        
        // Truy cập Facebook
        await currentPage.goto('https://www.facebook.com', { waitUntil: 'networkidle0' });
        
        // Kiểm tra xem đã đăng nhập thành công chưa
        const isLoggedIn = await currentPage.evaluate(() => {
            return !document.querySelector('input[name="email"]');
        });

        if (isLoggedIn) {
            // Lấy thông tin user bằng cách vào fb.com/profile
            await currentPage.goto('https://www.facebook.com/profile', { waitUntil: 'networkidle0' });
            const userInfo = await currentPage.evaluate(() => {
                // Lấy id từ cookie c_user
                let userId = null;
                const cUserCookie = document.cookie.split(';').find(c => c.trim().startsWith('c_user='));
                if (cUserCookie) {
                    userId = cUserCookie.split('=')[1];
                }
                // Lấy tên từ thẻ h1
                let userName = null;
                const h1 = document.querySelector('h1');
                if (h1) userName = h1.childNodes[0]?.textContent.trim();
                return { userId, userName };
            });
            res.json({ 
                success: true, 
                userId: userInfo.userId,
                userName: userInfo.userName
            });
        } else {
            res.json({ 
                success: false, 
                error: 'Cookie không hợp lệ hoặc đã hết hạn' 
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// API endpoint để đóng browser
app.post('/close-browser', async (req, res) => {
    try {
        if (currentBrowser) {
            await currentBrowser.close();
            currentBrowser = null;
            currentPage = null;
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API endpoint để xử lý report
app.post('/report', async (req, res) => {
    const { cookies, links } = req.body;
    
    try {
        if (!currentBrowser || !currentPage) {
            throw new Error('Browser chưa được khởi tạo. Vui lòng kiểm tra đăng nhập trước.');
        }

        // Set cookies lại để đảm bảo phiên đăng nhập còn hiệu lực
        await currentPage.setCookie(...cookies);
        
        // Xử lý từng link
        const results = [];
        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            try {
                // Random delay giữa các trang
                const delay = Math.floor(Math.random() * (4000 - 2000 + 1)) + 2000;
                await currentPage.goto(link, { waitUntil: 'networkidle0' });
                await new Promise(resolve => setTimeout(resolve, delay));

                // Thêm thời gian đợi load bài viết (3-5 giây)
                const waitPost = Math.floor(Math.random() * (5000 - 3000 + 1)) + 3000;
                await new Promise(resolve => setTimeout(resolve, waitPost));

                // Thao tác report với log debug
                const reportResult = await currentPage.evaluate(async () => {
                    function randomSleep(min, max) {
                        return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));
                    }

                    async function clickPopupPostMenuButton() {
                        const popupLayer = document.querySelector('div[role="dialog"]');
                        if (!popupLayer) {
                            console.log('❌ Không tìm thấy popup bài viết');
                            return false;
                        }
                        let menuButton = popupLayer.querySelector('div[role="button"][aria-haspopup="menu"][aria-label="Hành động với bài viết này"]');
                        if (!menuButton) menuButton = popupLayer.querySelector('div[role="button"][aria-haspopup="menu"]');
                        if (!menuButton) menuButton = Array.from(popupLayer.querySelectorAll('div[role="button"]')).find(btn => btn.textContent.includes('...') || btn.getAttribute('aria-label')?.includes('Hành động'));
                        if (!menuButton) {
                            console.log('❌ Không tìm thấy nút ba chấm trong popup');
                            return false;
                        }
                        menuButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        await randomSleep(800, 2000);
                        menuButton.click();
                        console.log('✅ Đã click nút ba chấm trong popup bài viết');
                        return true;
                    }

                    // Click nút ba chấm trước
                    const menuClicked = await clickPopupPostMenuButton();
                    if (!menuClicked) {
                        console.log('❌ Bước menuClicked thất bại');
                        return { success: false, step: 'menu' };
                    }
                    await randomSleep(800, 2000);

                    // Click "Báo cáo bài viết"
                    const reportButtons = Array.from(document.querySelectorAll('span[dir="auto"]')).filter(span => span.textContent.includes('Báo cáo bài viết'));
                    if (reportButtons.length > 0) {
                        const reportMenuItem = reportButtons[0].closest('div[role="menuitem"]') || reportButtons[0].parentElement;
                        reportMenuItem.click();
                        console.log('✅ Đã click Báo cáo bài viết');
                    } else {
                        console.log('❌ Không tìm thấy nút Báo cáo bài viết');
                        return { success: false, step: 'report' };
                    }
                    await randomSleep(800, 2000);

                    // Click "Thông tin sai sự thật, lừa đảo hoặc gian lận"
                    const falseInfoButtons = Array.from(document.querySelectorAll('span[dir="auto"]')).filter(span => span.textContent.includes('Thông tin sai sự thật, lừa đảo hoặc gian lận'));
                    if (falseInfoButtons.length > 0) {
                        const falseInfoMenuItem = falseInfoButtons[0].closest('div[role="menuitem"]') || falseInfoButtons[0].parentElement;
                        falseInfoMenuItem.click();
                        console.log('✅ Đã click Thông tin sai sự thật, lừa đảo hoặc gian lận');
                    } else {
                        console.log('❌ Không tìm thấy nút Thông tin sai sự thật, lừa đảo hoặc gian lận');
                        return { success: false, step: 'falseinfo' };
                    }
                    await randomSleep(800, 2000);

                    // Click "Gian lận hoặc lừa đảo"
                    const fraudButtons = Array.from(document.querySelectorAll('span[dir="auto"]')).filter(span => span.textContent.includes('Gian lận hoặc lừa đảo'));
                    if (fraudButtons.length > 0) {
                        const fraudMenuItem = fraudButtons[0].closest('div[role="menuitem"]') || fraudButtons[0].parentElement;
                        fraudMenuItem.click();
                        console.log('✅ Đã click Gian lận hoặc lừa đảo');
                    } else {
                        console.log('❌ Không tìm thấy nút Gian lận hoặc lừa đảo');
                        return { success: false, step: 'fraud' };
                    }
                    await randomSleep(800, 2000);

                    // Click nút "Gửi"
                    const submitButtons = Array.from(document.querySelectorAll('div[role="button"]')).filter(button => button.textContent.includes('Gửi'));
                    if (submitButtons.length > 0) {
                        submitButtons[0].click();
                        console.log('✅ Đã gửi báo cáo thành công');
                        return { success: true };
                    } else {
                        console.log('❌ Không tìm thấy nút Gửi');
                        return { success: false, step: 'submit' };
                    }
                });
                // Log kết quả từng bước ra server
                console.log(`[REPORT DEBUG] Link: ${link} - Kết quả:`, reportResult);
                if (!reportResult.success) {
                    throw new Error(`Lỗi ở bước: ${reportResult.step}`);
                }
                results.push({ link, status: 'success' });

                // Nếu không phải link cuối cùng thì chờ random 2-4s trước khi chuyển sang link tiếp theo
                if (i < links.length - 1) {
                    const nextDelay = Math.floor(Math.random() * (4000 - 2000 + 1)) + 2000;
                    console.log(`[REPORT DEBUG] Đợi ${nextDelay}ms trước khi chuyển sang link tiếp theo...`);
                    await new Promise(resolve => setTimeout(resolve, nextDelay));
                }
            } catch (error) {
                results.push({ link, status: 'error', message: error.message });
            }
        }

        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 
