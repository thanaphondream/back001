const db = require("../models/db");

exports.createTableReservation = async (req, res, next) => {
  try {
    const { tableNumber, status, date } = req.body;
    let userId, username;

    // ตรวจสอบว่ามีข้อมูลผู้ใช้อยู่ใน req.user หรือไม่
    if (req.user) {
      userId = req.user.id;
      username = req.user.username;
    } else {
      // ถ้าไม่มีข้อมูลผู้ใช้ใน req.user ให้ตรวจสอบว่ามี userId ส่งมากับ req.body หรือไม่
      if (!req.body.userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      userId = req.body.userId;

      // หาข้อมูลผู้ใช้จาก userId ที่ส่งมา
      const user = await db.user.findUnique({
        where: {
          id: userId
        }
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      username = user.username;
    }

    // แปลงรูปแบบวันที่ที่รับมาให้มีเวลาเป็น 00:00:00 เพื่อไม่รวมเวลา
    const formattedDate = new Date(date + "T00:00:00Z");

    // ตรวจสอบว่ามีการจองโต๊ะซ้ำในวันที่และหมายเลขโต๊ะเดียวกันหรือไม่
    const existingReservation = await db.TableReservation.findFirst({
      where: {
        tableNumber: parseFloat(tableNumber),
        date: formattedDate,
        userId: { not: userId } // ตรวจสอบการจองโต๊ะที่มีหมายเลขเดียวกันโดยไม่สนใจ userId เดิม
      }
    });

    if (existingReservation) {
      return res.status(400).json({ message: "Table already reserved by another user on the same date." });
    }

    // สร้างการจองใหม่
    const tableReservation = await db.TableReservation.create({
      data: {
        user: { connect: { id: userId } }, // เชื่อมต่อผู้ใช้โดยใช้ userId
        tableNumber: parseFloat(tableNumber),
        status,
        date: formattedDate, // ใช้รูปแบบวันที่ที่ผ่านการแปลงแล้ว
        username // เพิ่ม username ในข้อมูลการจองโต๊ะ
      },
    });

    res.status(201).json({ message: "Table reservation created successfully", tableReservation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
exports.getTableReservation = async (req, res, next) => {
  try {
    let tableReservation;
    
    if (req.user.role === "ADMIN") {
      // ถ้าเป็นผู้ดูแลระบบ (ADMIN) ให้แสดงการจองทั้งหมด
      tableReservation = await db.TableReservation.findMany();
    } else {
      // ถ้าเป็นผู้ใช้ทั่วไป ให้แสดงการจองเฉพาะของตัวเอง แต่จะแสดงเฉพาะหมายเลขโต๊ะของการจองทั้งหมด
      const allReservations = await db.TableReservation.findMany({
        select: {
          tableNumber: true
        }
      });
      
      const userReservations = await db.TableReservation.findMany({
        where: {
          userId: req.user.id
        }
      });

      tableReservation = [...allReservations, ...userReservations];
    }

    res.json(tableReservation);
  } catch (error) {
    next(error);
  }
};


