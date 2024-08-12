const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken')
const db = require("../models/db");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.register = async (req, res, next) => {
  const { username, password, confirmPassword, email,phoneNumber,imgprofile } = req.body;
  try {
    // validation
    if (!(username && password && confirmPassword)) {
      return next(new Error("Fulfill all inputs"));
    }
    if (confirmPassword !== password) {
      throw new Error("confirm password not match");
    }

    const hashedPassword = await bcrypt.hash(password, 8);
    console.log(hashedPassword);
    const data = {
      username,
      password : hashedPassword,
      email,
      phoneNumber,
      imgprofile
    };

    const rs = await db.user.create({ data  })
    console.log(rs)

    res.json({ msg: 'Register successful' })
  } catch (err) {
    next(err);
  }
};



exports.login = async (req, res, next) => {
  const {username, password} = req.body
  try {
    // validation
    if( !(username.trim() && password.trim()) ) {
      throw new Error('username or password must not blank')
    }
    // find username in db.user
    const user = await db.user.findFirstOrThrow({ where : { username }})
    // check password
    const pwOk = await bcrypt.compare(password, user.password)
    if(!pwOk) {
      throw new Error('invalid login')
    }
    // issue jwt token 
    const payload = { id: user.id }
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '30d'
    })
    console.log(token)
    res.json({token : token})
  }catch(err) {
    next(err)
  }
};



exports.getme = (req,res,next) => {
  res.json(req.user)
}



exports.getUser = async (req, res, next) => {
  try {
    const User = await db.User.findMany();
    res.json(User);
  } catch (error) {
    next(error);
  }
};

// แก้ไขฟังก์ชัน getUser ใน backend
exports.getUser01 = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId, 10); // แปลง userId เป็นตัวเลข
    const user = await db.User.findUnique({
      where: {
        id: userId // ส่งค่า userId ที่แท้จริงเข้าไป
      }
    });
    if (user) {
      res.json(user); // ส่งข้อมูลผู้ใช้กลับไป
    } else {
      res.status(404).json({ message: 'User not found' }); // ส่งข้อผิดพลาด 404 หากไม่พบผู้ใช้
    }
  } catch (error) {
    next(error); // ส่งข้อผิดพลาดไปยัง middleware สำหรับการจัดการข้อผิดพลาด
  }
};



exports.updateProfile = async (req, res, next) => {
  const { username, phoneNumber, imgprofile } = req.body;
  const userId = req.user.id; // Ensure authentication middleware is in place

  try {
    // Validate input
    if (!username && !phoneNumber && !imgprofile) {
      return next(new Error("No data to update"));
    }

    const updateData = {};

    // Update fields if provided
    if (username) updateData.username = username;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (imgprofile) updateData.imgprofile = imgprofile;

    // Update the user in the database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    res.json({ msg: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    next(err);
  }
};


exports.updateUser = async (req, res, next) => {
  const { username, email, phoneNumber, imgprofile, password, role } = req.body;
  const userId = parseInt(req.params.userId, 10); // ดึง userId จาก URL

  try {
    // ตรวจสอบข้อมูลที่ต้องการอัปเดต
    if (!username && !email && !phoneNumber && !imgprofile && !password && !role) {
      return res.status(400).json({ error: "No data to update" });
    }

    const updateData = {};

    // อัปเดตฟิลด์ถ้ามีการระบุ
    if (username) {
      // ตรวจสอบชื่อผู้ใช้ที่มีอยู่แล้ว
      const existingUsername = await prisma.user.findUnique({
        where: { username }
      });

      if (existingUsername && existingUsername.id !== userId) {
        return res.status(400).json({ error: "Username already in use" });
      }

      updateData.username = username;
    }
    if (email) updateData.email = email;
    if (phoneNumber !== undefined) {
      updateData.phoneNumber = String(phoneNumber);
    }
    if (imgprofile) updateData.imgprofile = imgprofile;
    if (role) {
      // ตรวจสอบว่าบทบาทเป็นค่าที่ถูกต้อง
      const validRoles = ['USER', 'ADMIN'];
      if (validRoles.includes(role)) {
        updateData.role = role;
      } else {
        return res.status(400).json({ error: "Invalid role value" });
      }
    }

    // ถ้ามีการระบุรหัสผ่าน ให้ทำการแฮชก่อนที่จะบันทึก
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 8);
      updateData.password = hashedPassword;
    }

    // อัปเดตข้อมูลผู้ใช้ในฐานข้อมูล
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    res.json({ msg: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    console.error(err);
    next(err);
  }
};
