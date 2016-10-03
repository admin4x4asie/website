const koa = require('koa');
const Pug = require('koa-pug');
const http = require('http');
const mount = require('koa-mount');
const fileServer = require('koa-static');
const router = require('koa-router')();
const body = require('koa-bodyparser');
const sessions = require('koa-generic-session');
const csrf = require('koa-csrf');
const compress = require('koa-gzip');
const schema = require('koa-json-schema');
const nodemailer = require('nodemailer');
const htmlToText = require('nodemailer-html-to-text').htmlToText;
const favicon = require('koa-favicon');
const redis = require('koa-redis');

const admin = encodeURIComponent(process.env.ADMIN_EMAIL);
const pass = process.env.ADMIN_PASS;

const transporter = nodemailer.createTransport(`smtps://${admin}:${pass}@smtp.zoho.com`);
transporter.use('compile', htmlToText());

const tours = require('./tours.json');
const vehicules = require('./vehicules.json');

const app = koa()
  .use(compress())
  .use(favicon(__dirname + '/public/dist/img/logo.jpg'));

const fs = fileServer('./public/dist');

const pug = new Pug({
  app,
  viewPath: './views'
});

router.get('/', parseAlert(), function * () {
  const {alert = null} =this.state;
  this.render('index', {tours, vehicules, csrf: this.csrf, alert});
});

router.get('/tours/:tour', parseAlert(), function * () {
  const {alert = null} =this.state;
  const {tour} = this.params;
  const [t] = tours.filter(to=>to.slug === tour);
  if (!t) {
    this.throw(404);
  }
  this.render('tour', {tour: t, csrf: this.csrf, title: `Safari Raid Aventure - ${t.title}`, alert});
});


router.post('/', alert(), schema({
  type: 'object',
  properties: {
    email: {type: 'string', format: 'email'},
    content: {type: 'string', maxLength: 3000}
  },
  required: ['email', 'content']
}), function * () {
  const {email, content} = this.request.body;
  const html = `<h2> Salut trou de balle</h2>
    <p>Tu as recu un nouveau message de <strong>${email}</strong></p>
  <blockquote>${content}</blockquote>`;

  transporter.sendMail(emailFactory({subject: 'Un nouveau message', html}), function (error, info) {
    if (error) {
      console.log(error);
    }
    console.log(info);
  });
});

router.post('/tours/:tour', alert(), schema({
  type: 'object',
  properties: {
    name: {type: 'string'},
    email: {typs: 'string', format: 'email'},
    date: {type: 'string'},
    participants: {type: ['integer', 'string']},
    phone: {type: 'string'},
    content: {type: 'string'},
  },
  required: ['name', 'email', 'date', 'participants', 'phone', 'content']
}), function * () {
  const {tour, name, email, date, participants, phone = 'pas communique', content = 'pas de message particulier'} =this.request.body;
  const html = `<h2> Salut trou de balle</h2>
  <p>Tu as recu une nouvell demande de devis de <strong>${name}</strong>(<span>${email}</span>-<span>${phone}</span>) pour le tour <strong>${tour}</strong></strong></p>
  <p>ca serait pour <strong>${participants}</strong> participants en <strong>${date}</strong></p>
  <p>Ce monsieur (parce que disons le franchement, les femmes ne font pas de 4x4) voudrait rajouter</p>
<blockquote>${content}</blockquote>`;

  transporter.sendMail(emailFactory({subject: 'Money ! une demande de devis, une', html}), function (error, info) {
    if (error) {
      console.log(error);
    }
    console.log(info);
  });
});

app.use(mount('/assets', fs))
  .use(sessions({
    store: redis({
      host: process.env.REDIS_HOST || 'sessions',
      port: process.env.REDIS_PORT || 6379
    })
  }))
  .use(body())
  .use(csrf())
  .use(router.routes())
  .use(router.allowedMethods());

app.keys = ['foo', 'bar'];


const server = http.createServer(app.callback());

server.listen(3000);


function parseAlert () {
  return function * (next) {
    const {query}=this.request;
    if (query.message) {
      this.state.alert = {
        message: decodeURIComponent(query.message),
        level: query.level || 'success'
      }
    }
    yield *next;
  }
}

function alert () {
  return function * (next) {
    let message = 'Votre demande a bien été prise en compte';
    let level = 'success';
    const path = this.path;
    try {
      yield *next;
    } catch (e) {
      message = 'Il y a eu un problème veuillez contacter Thierry directement par email';
      level = 'error';
    } finally {
      const m = encodeURIComponent(message);
      this.redirect(`${path}?message=${m}&level=${level}`);
    }
  }
}

function emailFactory (data = {}) {
  return {
    from: 'admin@4x4asie.com',
    to: ['admin@4x4asie.com', 'thierry@4x4asie.com'],
    subject: data.subject,
    html: data.html
  }
}

//end
