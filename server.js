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
    origin: ["https://abelthomas-portfolio.vercel.app", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true
  })
);
app.use(express.json())

// mongodb connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(()=> console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err))

// Email transporter - BREVO SMTP
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS
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
        from: process.env.BREVO_USER, // Must use your Brevo sender email
        to: 'abelthomas.pro@gmail.com', // Your Gmail receives the message
        subject: `Portfolio Contact: Message from ${name}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
          <hr>
          <p><small>Sent from portfolio contact form</small></p>
        `,
        replyTo: email, 
    };

    try {
        await transporter.sendMail(mailOptions)
        console.log(`✅ Email sent successfully from ${email}`)
        res.status(200).json({
            success: true,
            message: 'Message sent successfully'
        })
    } catch(error){
        console.error('❌ Error sending email:', error)
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
    console.log(`🚀 Server running on port ${PORT}`)
})