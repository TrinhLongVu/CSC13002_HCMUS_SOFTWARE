const express = require('express');
const app = express();
const cors = require('cors');
const morgan = require('morgan');
const articleRouter = require('./routes/articleRouters.js')
const userRouter = require('./routes/userRouters.js')
const articleAIRouter = require('./routes/articleAIRouter.js')
const passport = require('passport')
const session = require('express-session');
const cookieParser = require('cookie-parser')
const p = require('./modules/passpost.js')

app.use(cookieParser())
app.use(session({
    secret: "myscret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false
    },
}))

// config middleware using req.body
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    allowedHeaders: ['Content-Type'],
}))
app.use(express.json())
app.use(morgan('dev'))
app.use(passport.initialize());
app.use(passport.session());

// handle
p(passport)

app.use('/api/v1/article', articleRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/articleAI', articleAIRouter);

module.exports = app;