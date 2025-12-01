const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const SibApiV3Sdk = require('@getbrevo/brevo')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 5000;

//middleware
app.use(
  cors({
    origin: [
        "https://abelthomas-portfolio.vercel.app", 
        "https://abelthomas.site",                 // The root domain
        "https://www.abelthomas.site",             // <--- ADD THE WWW VERSION
        "http://localhost:5173"                    
    ],
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

// Initialize Brevo API
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()
apiInstance.setApiKey(
  SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
)

console.log('✅ Brevo API initialized')

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

    // Prepare email
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()
    
    sendSmtpEmail.sender = { 
        email: 'abelthomas.pro@gmail.com', 
        name: 'Portfolio Contact Form' 
    }
    sendSmtpEmail.to = [{ 
        email: 'abelthomas.pro@gmail.com', 
        name: 'Abel Thomas' 
    }]
    sendSmtpEmail.replyTo = { 
        email: email, 
        name: name 
    }
    sendSmtpEmail.subject = `Portfolio Contact: Message from ${name}`
    sendSmtpEmail.htmlContent = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
      <hr>
      <p><small>Sent from portfolio contact form</small></p>
    `

    try {
        await apiInstance.sendTransacEmail(sendSmtpEmail)
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