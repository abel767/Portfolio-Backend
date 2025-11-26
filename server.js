const express = require('express')
const cors = require('cors')
const nodemailer = require('nodemailer')
const mongoose = require('mongoose')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 5000;

//middleware
app.use(
  cors({
    origin: "https://abelthomas-portfolio.vercel.app",
    methods: ["GET", "POST"],
  })
);
app.use(express.json())

// mongodb connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(()=> console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err))

// Email transporter configuration - UPDATED FOR RENDER
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
})

// Verify email configuration on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email configuration error:', error);
    } else {
        console.log('✅ Email server is ready to send messages');
    }
});

// contact endpoint
app.post('/api/contact', async(req,res) =>{
    const {name,email,message} = req.body

    //validation
    if(!name || !email || !message){
        return res.status(400).json({
            success: false,
            message: 'All fields are required'
        })
    }

    // Email options
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: `Portfolio Contact: Message from ${name}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `,
        replyTo: email, 
    };

    try {
        await transporter.sendMail(mailOptions)
        res.status(200).json({
            success: true,
            message: 'Message sent successfully'
        })
    } catch(error){
        console.error('Error sending email:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to send message. Please try again'
        })
    }
})

// health check 
app.get('/api/health', (req,res) =>{
    res.json({status: 'Server is running'})
})

app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`)
})