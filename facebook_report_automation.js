async function clickPopupPostMenuButton() {
    function randomSleep(min, max) {
        return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));
    }

    // 1. Xác định pop-up (layer đang mở)
    const popupLayer = document.querySelector('div[role="dialog"]');
    if (!popupLayer) {
        console.log('❌ Không tìm thấy popup bài viết');
        return false;
    }

    // 2. Trong pop-up, tìm nút ba chấm với nhiều selector khác nhau
    let menuButton = popupLayer.querySelector('div[role="button"][aria-haspopup="menu"][aria-label="Hành động với bài viết này"]');
    if (!menuButton) {
        // Thử selector rộng hơn
        menuButton = popupLayer.querySelector('div[role="button"][aria-haspopup="menu"]');
    }
    if (!menuButton) {
        // Thử tìm theo textContent nếu vẫn không thấy
        menuButton = Array.from(popupLayer.querySelectorAll('div[role="button"]')).find(btn => btn.textContent.includes('...') || btn.getAttribute('aria-label')?.includes('Hành động'));
    }
    if (!menuButton) {
        // Log ra các button để debug
        console.log('Các button trong popup:', [...popupLayer.querySelectorAll('div[role="button"]')]);
        console.log('❌ Không tìm thấy nút ba chấm trong popup');
        return false;
    }

    // 3. Scroll và click
    menuButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await randomSleep(800, 2000);
    menuButton.click();
    // console.log('✅ Đã click nút ba chấm trong popup bài viết');
    return true;
}

async function reportPost() {
    function randomSleep(min, max) {
        return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));
    }

    // Click nút ba chấm trước
    const menuClicked = await clickPopupPostMenuButton();
    if (!menuClicked) return;

    await randomSleep(800, 2000);

    // Click "Báo cáo bài viết"
    const reportButtons = Array.from(document.querySelectorAll('span[dir="auto"]'))
        .filter(span => span.textContent.includes('Báo cáo bài viết'));
    
    if (reportButtons.length > 0) {
        const reportMenuItem = reportButtons[0].closest('div[role="menuitem"]') || reportButtons[0].parentElement;
        reportMenuItem.click();
        console.log('✅ Đã click Báo cáo bài viết');
    } else {
        console.log('❌ Không tìm thấy nút Báo cáo bài viết');
        return;
    }

    await randomSleep(800, 2000);

    // Click "Thông tin sai sự thật, lừa đảo hoặc gian lận"
    const falseInfoButtons = Array.from(document.querySelectorAll('span[dir="auto"]'))
        .filter(span => span.textContent.includes('Thông tin sai sự thật, lừa đảo hoặc gian lận'));
    
    if (falseInfoButtons.length > 0) {
        const falseInfoMenuItem = falseInfoButtons[0].closest('div[role="menuitem"]') || falseInfoButtons[0].parentElement;
        falseInfoMenuItem.click();
        console.log('✅ Đã click Thông tin sai sự thật');
    } else {
        console.log('❌ Không tìm thấy nút Thông tin sai sự thật');
        return;
    }

    await randomSleep(800, 2000);

    // Click "Gian lận hoặc lừa đảo"
    const fraudButtons = Array.from(document.querySelectorAll('span[dir="auto"]'))
        .filter(span => span.textContent.includes('Gian lận hoặc lừa đảo'));
    
    if (fraudButtons.length > 0) {
        const fraudMenuItem = fraudButtons[0].closest('div[role="menuitem"]') || fraudButtons[0].parentElement;
        fraudMenuItem.click();
        console.log('✅ Đã click Gian lận hoặc lừa đảo');
    } else {
        console.log('❌ Không tìm thấy nút Gian lận hoặc lừa đảo');
        return;
    }

    await randomSleep(800, 2000);

    // Click nút "Gửi" cuối cùng
    const submitButtons = Array.from(document.querySelectorAll('div[role="button"]'))
        .filter(button => button.textContent.includes('Gửi'));
    
    if (submitButtons.length > 0) {
        submitButtons[0].click();
        console.log('✅ Đã gửi báo cáo thành công');
    } else {
        console.log('❌ Không tìm thấy nút Gửi');
    }
}

// Gọi hàm để thực thi
reportPost(); 