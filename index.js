const koa = require('koa');
const Pug = require('koa-pug');
const http = require('http');
const mount = require('koa-mount');
const fileServer = require('koa-static');
const router = require('koa-router')();
const body = require('koa-bodyparser');

const tours = require('./tours.json');
const vehicules = require('./vehicules.json');
const csrf = require('koa-csrf');


const app = koa();
const fs = fileServer('./public/src');

const pug = new Pug({
  app,
  viewPath: './views'
});


router.get('/', function * () {
  this.render('index', {tours, vehicules});
});

router.get('/tours/:tour', function () {
  const {tour} = this.params;
  this.render('tour');
});

router.post('/messages', body(), function * () {
  try {
    const {email, content} = this.request.body;
    console.log(this.request.body);
    this.status = 201;
  } catch (e) {
    if (e.status === 422) {

    } else {
      throw e;
    }
  }
});

app.use(mount('/assets', fs));
app.use(router.routes());
app.use(router.allowedMethods());


const server = http.createServer(app.callback());

server.listen(3000);
