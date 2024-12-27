
const express = require("express");
const bodyparser = require("body-parser");
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require("path");
const mysql = require("mysql");
const nodemailer = require("nodemailer");


 // Log to check if the key is loaded

// Correct import for node-fetch in CommonJS
const transporter=nodemailer.createTransport(
    {
        secure:true,
        host:'smtp.gmail.com',
        port:465,
        auth:{
            user:'vyaswanthraju18@gmail.com',
            pass:'grbtsqjwafwsqtxj'
        }
    }
)

const app = express();
app.use(express.static(__dirname));
app.use(bodyparser.json());
const port = 6060;
// Create the database connection
const db = mysql.createConnection({
    host: 'baofnqhdacxwufloge9q-mysql.services.clever-cloud.com',
    user: "uxf1dwkow7ootjs3",
    password: "iNkQjTP5ObFSXA6Xw5D3",
    database: "baofnqhdacxwufloge9q",
    port: 3306,
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
        return;
    }
    console.log("Connected to MySQL database");
});

// Route handlers
app.get('/users', (req, res) => {
    res.sendFile(path.join(__dirname, "views", "signup.html"));
});
app.get('/testing', (req, res) => {
    res.sendFile(path.join(__dirname, "views", "testing.html"));
});

app.get('/room-gallery', (req, res) => {
    res.sendFile(path.join(__dirname, "views", "roompics.html"));
});
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, "views", "login.html"));
});
app.get('/payment', (req, res) => {
    res.sendFile(path.join(__dirname, "views", "payment.html"));
});
app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, "views", "profile.html"));
});
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});
app.get('/maintenance', (req, res) => {
    res.sendFile(path.join(__dirname, "views", "maintenance.html"));
});
app.get('/feedback', (req, res) => {
    res.sendFile(path.join(__dirname, "views", "rating.html"));
});
app.get('/forgot-password', (req, res) => {
    res.sendFile(path.join(__dirname, "views", "resetpass.html"));
});
app.get('/sendmail', (req, res) => {
    res.sendFile(path.join(__dirname, "views", "a.html"));
});
app.get('/admin-panel', (req, res) => {
    res.sendFile(path.join(__dirname, "views", "panel.html"));
});
app.get('/adminpanel/rooms', (req, res) => {
    db.query('SELECT * FROM Rooms', (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Error retrieving rooms", error: err });
        }
        res.status(200).json(results);
    });
});
app.get("/description/:id", (req, res) => {
    const roomId = req.params.id;
    const query = 'SELECT description FROM Rooms WHERE room_id = ?';
    db.query(query, [roomId], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (results.length > 0) {
            // Return the description if found
            res.json({ id: roomId, description: results[0].description});
        } else {
            // No matching room found
            res.status(404).json({ error: 'Room description not found' });
        }
    });
});
app.post("/roomBooking", (req, res) => {
    const { userId, roomType, checkInDate, checkOutDate, numberOfGuests } = req.body;
    console.log(req.body);

    if (!userId || !roomType || !checkInDate || !checkOutDate || !numberOfGuests) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    const checkRoomAvailabilityQuery = `
        SELECT room_id,price,room_type 
        FROM Rooms 
        WHERE room_type = ? 
        AND availability = 1 
        LIMIT 1;
    `;

    db.query(checkRoomAvailabilityQuery, [roomType], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error checking room availability' });
        }

        if (results.length === 0) {
            return res.status(400).json({ message: 'Sorry, no rooms available for this type.' });
        }

        const availableRoom = results[0];
        console.log(availableRoom)
        const price=availableRoom.price;
        console.log(price);
        const room_type=availableRoom.room_type
        const insertBookingQuery = `
            INSERT INTO Bookings (user_id,room_id,check_in, check_out, num_guests, total_price,room_type)
            VALUES (?, ?, ?, ?, ?,?,?);
        `;

        db.query(insertBookingQuery,[userId,availableRoom.room_id, checkInDate, checkOutDate, numberOfGuests, price,availableRoom.room_type], (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error processing the booking' });
            }

            const updateAvailabilityQuery = `
                UPDATE Rooms 
                SET availability = 0 
                WHERE room_id = ?;
            `;
            db.query(updateAvailabilityQuery, [availableRoom.room_id], (err) => {
                if (err) {
                    return res.status(500).json({ message: 'Failed to update room availability' });
                }
                return res.status(200).json({
                    message: 'Room booking successful!',
                    bookingDetails: { checkInDate, checkOutDate, roomType, numberOfGuests, userId,price,room_type},
                });
            });
        });
    });
});
app.get("/user/booking/payment/:id", (req, res) => {
    const userId = req.params.id; 
    const sql = "SELECT * FROM Bookings WHERE user_id = ?"; 


    db.query(sql, [userId], (err, result) => {
        if (err) {
            
            console.error("Error retrieving booking:", err);
            return res.status(500).json({ message: "Error retrieving booking details." });
        }

        if (result.length === 0) {
            
            return res.status(404).json({ message: "No booking found for this user." });
        }

     
        res.status(200).json({
            message: "Booking details retrieved successfully.",
            booking: result
        });
    });
});

app.post("/newuser/booking", (req, res) => {
    const { name, email, password_hash, phone } = req.body;
    const checkSql = "SELECT * FROM Users WHERE email = ? OR phone = ?";
    db.query(checkSql, [email, phone], (checkErr, results) => {
        if (checkErr) {
            res.status(500).json({ message: checkErr.message });
        } else if (results.length > 0) {
            res.status(409).json({ message: "Account already exists, please go to the login section." });
        } else {
            // Query to insert new user
            const sql = "INSERT INTO Users (name, email, password_hash, phone) VALUES (?, ?, ?, ?)";
            db.query(sql, [name, email, password_hash, phone], (insertErr) => {
                if (insertErr) {
                    res.status(500).json({ message: insertErr.message });
                } else {
                    const mailOptions = {
                        from: 'vyaswanthraju18@gmail.com',
                        to: email,
                        subject: 'Welcome to Ajay Residency!',
                        text: `Hi ${name},\n\nThank you for signing up at Ajay Residency! We're excited to have you. Stay tuned for hotel booking updates and special offers.\n\nBest regards,\nAjay Residency Team`,
                        html: `
                            <h2>Welcome to Ajay Residency, ${name}!</h2>
                            <p>Thank you for signing up! We're excited to have you on board.</p>
                            <p>We’ll keep you updated on our hotel booking offers and special promotions.</p>
                            <p>Best regards,<br>Ajay Residency Team</p>
                            <footer>
                                <p>&copy; 2024 Ajay Residency. All rights reserved.</p>
                            </footer>
                        `,
                    };
                    transporter.sendMail(mailOptions, (emailErr, info) => {
                        if (emailErr) {
                            console.log('Error sending email:', emailErr);
                            res.status(200).json({ message: "User signed up successfully, but email delivery failed." });
                        } else {
                            console.log('Email sent:', info.response);
                            res.status(200).json({ message: "Successfully! Check your email for confirmation." });
                        }
                    });
                }
            });
        }
    });
});
app.post("/login", (req, res) => {
    const { email, pwd } = req.body;

    const sql = "SELECT * FROM Users WHERE email = ?";
    db.query(sql, [email], (err, result) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }

        if (result.length === 0 || result[0].password_hash !== pwd) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const user = result[0];
        res.status(200).json({
            message: "Login successful!",
            user: { id: user.user_id, name: user.name, email: user.email ,phone :user.phone},
        });
    });
});
app.post('/payment/:id', (req, res) => {
    const userId = req.params.id; // Extract user ID from the request params
    const sql = "UPDATE Bookings SET payment = 'Payment done' WHERE user_id = ?"; // Correct the SQL query syntax

    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.error('Error updating payment status:', err);
            return res.status(500).send({ message: 'Failed to update payment status' });
        }
        if (result.affectedRows > 0) {
            res.status(200).send({ message:`🚧 Payment Gateway Coming Soon 🚧
The "Payment Done" status is currently a placeholder, as we haven't added the payment gateway yet. Don't worry, we're working on it, and this feature will be available soon. Stay tuned! 😉
If you'd like to be notified when it's ready or (leave your reviews section 🥺) come on ....
` });
        } else {
            res.status(404).send({ message: 'No booking found for the given user ID' });
        }
    });
});
app.delete('/booking/delete', (req, res) => {
    const { user_id, room_id } = req.body; 

    if (!user_id || !room_id) {
        return res.status(400).json({ message: "Missing user_id or room_id." });
    }

    const deleteBookingQuery = 'DELETE FROM Bookings WHERE user_id = ? AND room_id = ?';

    // Delete the booking
    db.query(deleteBookingQuery, [user_id, room_id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to delete booking." });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "No booking found for the given user_id and room_id." });
        }
        const updateAvailabilityQuery = `
            UPDATE Rooms 
            SET availability = 1 
            WHERE room_id = ?;
        `;

        db.query(updateAvailabilityQuery, [room_id], (updateErr) => {
            if (updateErr) {
                console.error(updateErr);
                return res.status(500).json({ message: "Failed to update room availability." });
            }

            res.status(200).json({ message: "Booking successfully canceled, and room is now available." });
        });
    });
});

app.get('/booking/history/:id', (req, res) => {

    const userId = req.params.id;
    const sql = 'SELECT room_type,created_at,payment FROM Bookings WHERE user_id = ?';
  
    // Execute the query
    db.query(sql, [userId], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
      }
      console.log(results)
      res.json(results);
    });
  });
app.post("/api/feedback", (req, res) => {  // Corrected route path
    const { user_id, comment, rating,user_name } = req.body;

    // Validate the received data (basic validation)
    if (!user_id || !comment || !rating) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    const sql = "INSERT INTO Reviews (user_id, comment, rating,user_name) VALUES (?, ?, ?,?)";
    
    db.query(sql, [user_id, comment, rating,user_name], (err, result) => {
        if (err) {
            res.status(500).json({ message: err.message });
        } else {
            res.status(200).json({ message: "Thanks for your feedback" });
        }
    });
});
app.get('/api/feedbacks', (req, res) => {
    const sql = 'SELECT * FROM Reviews'; // Adjust the table name as needed

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching feedbacks:', err);
            return res.status(500).json({ message: 'Server error, could not fetch feedbacks' });
        }

        // Send the result to the client
        res.status(200).json(results);
    });
});
app.get("/username/:id",(req,res)=>{
    const userId=req.params.id;
    const sql="select name from Users where user_id = ?";
    db.query(sql,[userId],(err,result)=>{
        res.result
    })
})
app.post("/forgotpass", (req, res) => {
    const { email, newpass } = req.body;

    // Check if the user exists
    const checkSql = "SELECT * FROM Users WHERE email = ?";
    db.query(checkSql, [email], (checkErr, results) => {
        if (checkErr) {
            res.status(500).json({ message: checkErr.message });
        } else if (results.length === 0) {
            res.status(404).json({ message: "No account found with this email address." });
        } else {
            // User exists, update the password
            const updateSql = "UPDATE Users SET password_hash = ? WHERE email = ?";
            db.query(updateSql, [newpass, email], (updateErr) => {
                if (updateErr) {
                    res.status(500).json({ message: updateErr.message });
                } else {
                    res.status(200).json({ message: "Password updated successfully!" });
                }
            });
        }
    });
});
app.get('/manage/rooms', (req, res) => {
    const sql = `
        UPDATE Rooms 
        SET availability = 1 
        WHERE room_id IN (
            SELECT DISTINCT room_id 
            FROM Bookings 
            WHERE check_out < CURRENT_DATE
        ) AND availability != 1;
    `;

    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error updating room availability:', err);
            return res.status(500).json({ message: 'Internal Server Error', error: err });
        }

        console.log('Rooms updated:', result.affectedRows);
        res.status(200).json({ message: `Successfully updated ${result.affectedRows} rooms!` });
    });
});



app.post("/sendmail", (req, res) => {
    const { name, email } = req.body;
    const mailOptions = {
        from: 'vyaswanthraju18@gmail.com',
        to: email,               
        subject: 'Welcome to Ajay Residency!',
        text: `Hi ${name},\n\nThank you for signing up at Ajay Residency! We're excited to have you. Stay tuned for hotel booking updates and special offers.\n\nBest regards,\nAjay Residency Team`,
        html: `
            <h2>Welcome to Ajay Residency, ${name}!</h2>
            <p>Thank you for signing up! We're excited to have you on board.</p>
            <p>We’ll keep you updated on our hotel booking offers and special promotions.</p>
            <p>Best regards,<br>Ajay Residency Team</p>
            <footer>
                <p>&copy; 2024 Ajay Residency. All rights reserved.</p>
            </footer>
        `,
    };

    // Send the email
    transporter.sendMail(mailOptions, (emailErr, info) => {
        if (emailErr) {
            console.log('Error sending email:', emailErr);
            return res.status(500).json({ message: "Error sending email." });
        } else {
            console.log('Email sent:', info.response);
            return res.status(200).json({ message: "Successfully sent email, check inbox!" });
        }
    });
});

const genAI = new GoogleGenerativeAI('AIzaSyAHREMRCMhVdkitX_UvWfszdyNAr5iy1W4');
//--------------------testing-----
app.get('/ai/greeting/:username', async (req, res) => {
    try {
      const username = req.params.username || 'Guest';
      const timeOfDay = getTimeOfDay();
      
      // Get the generative model
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const prompt = `Craft a friendly, warm, and this is most imporatant thing (unique) greeting for a hotel guest named ${username}. Include a cheerful message like “Good luck on your adventure today!” or suggest something relaxing like “Why not unwind with a cup of tea by the window? or joke or according to day like night means cool wether you want say book now if after noon out side very hot relax your hotel ”. Mention the time of day—${timeOfDay}—and make sure the message feels fresh and inviting. Keep it under 20 to 25 words.`;



      
      const result = await model.generateContent([prompt]);
      const response = await result.response;
      const greeting = response.text();
      res.json({
        success: true,
        greeting: greeting,
        username: username
      });
  
    } catch (error) {
      console.error('Error generating AI greeting:', error);
      // Fallback greeting in case of error
      const fallbackGreeting = `Welcome back, ${req.params.username}! We're glad to see you.`;
      res.json({
        success: false,
        greeting: fallbackGreeting,
        username: req.params.username
      });
    }
  });
  function getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }
  
  


////=----------------
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
