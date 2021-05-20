const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const session = require('koa-session');
const passport = require('koa-passport');
const LocalStrategy = require('passport-local').Strategy;
const { User } = require('./js/models/User');
const Pug = require('koa-pug');
const app = new Koa();
const pug = new Pug({
  viewPath: './js/views',
  basedir: './js/views',
  app: app
});
const router = new Router();
const PORT = process.env.PORT || 4321;
const { log, error } = console;

passport.use(new LocalStrategy({
  usernameField: 'login',
  passwordField: 'password',
},
  async (login, password, done) => {
    let user;
    try {
      user = await User.findOne({ login });
    } catch (e) {
      return done('!! ' + e);
    }

    if (!user || user.password !== password) {
      return done(null, false);
    }

    return done(null, user);
  }
));

passport.serializeUser((user, done) => { done(null, user.id); });
passport.deserializeUser((_id, done) => User.findById(_id, (err, user) => done(err, user)));

app.keys = ['secret'];
app.use(session(app));

app.use(bodyParser());

app.use(passport.initialize());
app.use(passport.session());

app.use(router.routes());

app.use(async (ctx, next) => {
  if (ctx.isAuthenticated()) {
    await next();
  } else {
    ctx.redirect('/login');
  }
});

app.use(async (ctx, next) => {
  ctx.set('Content-Type', 'text/html; charset=utf-8');
  try {
    await next();
    if (ctx.status === 404) ctx.body = 'Пока нет!';
  } catch (e) {
    if (e.status) {
      ctx.body = `Ошибка пользователя: ${e.message}`;
      ctx.status = e.status;
    } else {
      ctx.body = `Ошибка приложения: ${e}`;
      ctx.status = 500;
      error(e.message, e.stack);
    }
  }
});


app.listen(process.env.PORT || PORT, () => log(process.pid));

router
  .get('/', async (ctx, next) => {
    ctx.redirect('/profile');
  })
  .get('/login', async (ctx, next) => {
    if (ctx.isUnauthenticated()) {
      ctx.type = 'text/plain';
      await ctx.render('login');
    } else {
      ctx.redirect('/profile');
    }
  })
  .post('/login', passport.authenticate('local', { successRedirect: '/profile', failureRedirect: '/login' }))
  .get('/profile', async (ctx, next) => {
      ctx.type = 'text/plain';
      await ctx.render('profile', { login: ctx.state.user.login });
  })
  .get('/users', async (ctx, next) => {
      ctx.type = 'text/plain';
      const users = await User.find();
      await ctx.render('users', { login: ctx.state.user.login, users });
  })
  .get('/logout', async (ctx, next) => {
      ctx.logout();
      ctx.redirect('/login');
  });