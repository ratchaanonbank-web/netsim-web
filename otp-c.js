    (function() {
                const userId = localStorage.getItem("temp_user_id");
                const user = localStorage.getItem("user");

                // 1. ถ้า Login สำเร็จแล้ว (มีข้อมูล user) ห้ามกลับมาหน้า OTP ให้ไปหน้า Home ทันที
                if (user) {
                    window.location.replace("home.html");
                    return;
                }

                // 2. ถ้าไม่มี temp_user_id (แปลว่าไม่ได้กดมาจากหน้า Login) ให้ดีดกลับไปหน้า Login
                if (!userId) {
                    window.location.replace("login.html");
                }
                
            })();
            
