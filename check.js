(function() {
        // 1. ดึงข้อมูล User
        const userStored = localStorage.getItem("user");
        
        // 2. ถ้าไม่มี User (ไม่ได้ Login) ให้ดีดไปหน้า Login
        if (!userStored) {
            window.location.replace("login.html");
        } else {
            // 3. แปลงข้อมูลเป็น Object
            const user = JSON.parse(userStored);
            
            // 4. ตรวจสอบ Role: ต้องเป็น admin หรือ HAD เท่านั้น
            if (user.role !== 'admin' && user.role !== 'HAD') {
                alert("Access Denied"); // แจ้งเตือนแบบในรูปที่คุณส่งมา
                window.location.replace("home.html"); // ดีดกลับหน้า Home
            }
        }
    })();