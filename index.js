const Koa = require('koa');
const Router = require('koa-router');
const app = new Koa();
const router = new Router();
const PORT = 4321;
const { log, error } = console;
app
  .use(async (ctx, next) => {
    log(ctx.url);
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
  })
  .use(router.routes())
  .listen(process.env.PORT || PORT, () => log(process.pid));
router
  .get('/', async (ctx, next) => {
    ctx.body = 'Привет мир!';
  })
  .get('/author', async (ctx, next) => {
    ctx.throw(403, 'У вас пока нет доступа!');
  });