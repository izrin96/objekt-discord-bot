import { Hono } from 'hono';
import { serve } from 'bun';
import { registerRoute } from '../route';
import { serveStatic } from 'hono/bun';

const app = new Hono()

app.use('*', serveStatic({ root: './public' }))
app.get('/proof', (c) => {
    return c.html(Bun.file('./public/proof.html').text())
})

registerRoute(app)

export const server = serve(app)
