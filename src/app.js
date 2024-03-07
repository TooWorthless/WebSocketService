import express from 'express';
import hbs from 'hbs';
import expressHbs from 'express-handlebars';

import { createServer } from 'http';

import { logErrors, errorHandler } from './utils.js';
import { createWSS } from './wss.js';

import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT;




const app = express();

const server = createServer(app);

const wss = createWSS(server);





app.engine('hbs', expressHbs.engine(
    {
        layoutsDir: './src/web/views/layouts', 
        defaultLayout: 'layout',
        extname: 'hbs'
    }
));
app.set('view engine', 'hbs');
app.set('views', './src/web/views');
hbs.registerPartials('./src/web/views/partials');



app.use(express.static('./src/web/static'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());




app.get('/', async (req, res, next) => {
    try {
        res.render('home');
    } catch (error) {
        next(error)
    }
});



app.use((req, res, next) => {
    res.status(404).send('Not Found');
});



app.use(logErrors);
app.use(errorHandler);



server.listen(PORT, () => {
    console.log(`WS Service is running on port ${PORT}`);
});


