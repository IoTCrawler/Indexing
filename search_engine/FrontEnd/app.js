/** Place all required modules here * */
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

/** Place all required routers here * */
const parkingRouter = require('./routes/parkingData');
const airPollutionBanegardsgadeRouter = require('./routes/getAirqualityBanegardsgade');
const airPollutionBotanicalGardenRouter = require('./routes/getAirqualityBotanicalGarden');
const AarhusCityLabsRouter = require('./routes/getAarhusCityLabs');
const dock1LibrariesRouter = require('./routes/getDock1DeliveryLibraries');
const realTimeTrafficRouter = require('./routes/getRealTimeTraffic');
const realTimeTrafficRouterRoute = require('./routes/getRealTimeTrafficRoute');
const homeRouter = require('./routes/home');
const search = require('./routes/search');
const submitDataSource = require('./routes/submitDataSource');
const signIn = require('./routes/signIn');
const signUP = require('./routes/signUp');
const liveEnvironmentalCVSSP = require('./routes/liveEnvironmentalCVSSP');
const city = require('./routes/visualization/cityOfAarhusDark');

const app = express();

// view engine setup
app.set('base', '/search-engine')
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/search-engine/', search);
app.use('/search-engine/home/', homeRouter);
app.use('/search-engine/parking/', parkingRouter);
app.use('/search-engine/airPollutionBanegardsgade/', airPollutionBanegardsgadeRouter);
app.use('/search-engine/airPollutionBotanicalGarden/', airPollutionBotanicalGardenRouter);
app.use('/search-engine/aarhusCityLabs/', AarhusCityLabsRouter);
app.use('/search-engine/dock1Libraries/', dock1LibrariesRouter); // get
app.use('/search-engine/realTimeTraffic/', realTimeTrafficRouter); // get real time data
app.use('/search-engine/realTimeTrafficRoute/', realTimeTrafficRouterRoute); // get real time data route
app.use('/search-engine/submitDataSource/', submitDataSource); // get real time data route
app.use('/search-engine/signIn/', signIn); // get real time data route
app.use('/search-engine/signUP/', signUP); // get real time data route
app.use('/search-engine/liveEnvironmentalCVSSP/', liveEnvironmentalCVSSP); // get real time data route
app.use('/search-engine/city', city); // new look

// catch 404 and forward to error handler
app.use((req, res, next) => {
    next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


module.exports = app;
